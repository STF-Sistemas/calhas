import { Router, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '#config/prisma';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

const MP_ACCESS_TOKEN = process.env['MP_ACCESS_TOKEN'] || '';
const PIX_CHAVE_MANUAL = process.env['PIX_CHAVE_MANUAL'] || '';
const BACKEND_URL = process.env['BACKEND_URL'] || '';

// ── POST /pix/criar — Cria ou retorna cobrança Pix pendente ───────────────────
router.post('/pix/criar', authMiddleware, async (req: Request, res: Response) => {
  try {
    const cod_empresa = req.user!.cod_empresa;
    if (!cod_empresa) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Empresa não identificada.' });
      return;
    }

    const empresa = await prisma.empresa.findFirst({
      where: { id: cod_empresa, excluido: false },
      select: { id: true, razao_social: true, email: true, valor_mensalidade: true },
    });
    if (!empresa) {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Empresa não encontrada.' });
      return;
    }

    const valorMensalidade = Number(empresa.valor_mensalidade ?? 150);

    // Reutiliza pagamento pendente se existir (evita duplicatas)
    const pendente = await prisma.pagamentoPix.findFirst({
      where: { cod_empresa, status: 'pendente' },
      orderBy: { created_at: 'desc' },
    });
    if (pendente) {
      res.json({
        success: true,
        data: {
          pagamento: pendente,
          manual: !pendente.mp_payment_id,
          pix_chave: !pendente.mp_payment_id ? PIX_CHAVE_MANUAL : null,
          valor: valorMensalidade,
        },
      });
      return;
    }

    // ── Modo manual (MP não configurado) ──────────────────────────────────────
    if (!MP_ACCESS_TOKEN) {
      const pag = await prisma.pagamentoPix.create({
        data: { cod_empresa, valor: valorMensalidade, status: 'pendente', qr_code: PIX_CHAVE_MANUAL },
      });
      res.json({ success: true, data: { pagamento: pag, manual: true, pix_chave: PIX_CHAVE_MANUAL, valor: valorMensalidade } });
      return;
    }

    // ── Criar pagamento no Mercado Pago ───────────────────────────────────────
    const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'X-Idempotency-Key': `licenca_${cod_empresa}_${Date.now()}`,
      },
      body: JSON.stringify({
        transaction_amount: valorMensalidade,
        description: 'Licença Calhas Pro – 30 dias',
        payment_method_id: 'pix',
        payer: { email: empresa.email || 'pagamento@calhas.pro' },
        external_reference: `empresa_${cod_empresa}`,
        ...(BACKEND_URL && { notification_url: `${BACKEND_URL}/api/pagamentos/webhook` }),
      }),
    });

    if (!mpRes.ok) {
      const errBody = await mpRes.text();
      console.error('[PAGAMENTOS_MP]', mpRes.status, errBody);
      throw new Error(`Mercado Pago error: ${mpRes.status}`);
    }

    const mpData = await mpRes.json() as Record<string, unknown>;
    const txData = (mpData?.point_of_interaction as Record<string, unknown>)
      ?.transaction_data as Record<string, string> | undefined;

    const pag = await prisma.pagamentoPix.create({
      data: {
        cod_empresa,
        mp_payment_id: String(mpData['id']),
        valor: valorMensalidade,
        status: 'pendente',
        qr_code: txData?.['qr_code'] ?? null,
        qr_code_base64: txData?.['qr_code_base64'] ?? null,
      },
    });

    res.json({ success: true, data: { pagamento: pag, manual: false, pix_chave: null, valor: valorMensalidade } });
  } catch (err) {
    console.error('[PAGAMENTOS_PIX_CRIAR]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao criar cobrança Pix.' });
  }
});

// ── GET /pix/status/:id — Verifica status (com polling ao MP) ─────────────────
router.get('/pix/status/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const pag = await prisma.pagamentoPix.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa! },
    });
    if (!pag) {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Pagamento não encontrado.' });
      return;
    }

    // Se pendente com ID do MP: verifica status atual na API
    if (pag.status === 'pendente' && pag.mp_payment_id && MP_ACCESS_TOKEN) {
      try {
        const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${pag.mp_payment_id}`, {
          headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` },
        });
        if (mpRes.ok) {
          const mpData = await mpRes.json() as Record<string, unknown>;
          if (mpData['status'] === 'approved') {
            const novaExpiracao = await _confirmarPagamento(pag.id, pag.cod_empresa);
            const updated = await prisma.pagamentoPix.findFirst({ where: { id: pag.id } });
            res.json({ success: true, data: { pagamento: updated, nova_expiracao: novaExpiracao } });
            return;
          }
        }
      } catch {
        // Falha ao consultar MP — retorna status atual do banco
      }
    }

    // Pagamento já aprovado (ex: confirmação manual pelo super admin)
    if (pag.status === 'aprovado') {
      const empresa = await prisma.empresa.findFirst({
        where: { id: pag.cod_empresa },
        select: { data_expiracao: true },
      });
      res.json({ success: true, data: { pagamento: pag, nova_expiracao: empresa?.data_expiracao ?? undefined } });
      return;
    }

    res.json({ success: true, data: { pagamento: pag } });
  } catch (err) {
    console.error('[PAGAMENTOS_STATUS]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao verificar status.' });
  }
});

// ── POST /webhook — Webhook Mercado Pago (público, sem auth) ──────────────────
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const { type, data } = req.body as { type?: string; data?: { id?: unknown } };
    if (type === 'payment' && data?.id && MP_ACCESS_TOKEN) {
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
        headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` },
      });
      if (mpRes.ok) {
        const mpData = await mpRes.json() as Record<string, unknown>;
        if (mpData['status'] === 'approved') {
          const pag = await prisma.pagamentoPix.findFirst({
            where: { mp_payment_id: String(data.id), status: 'pendente' },
          });
          if (pag) await _confirmarPagamento(pag.id, pag.cod_empresa);
        }
      }
    }
    // Sempre 200 para o MP (retries agressivos se der 4xx/5xx)
    res.status(StatusCodes.OK).json({ success: true });
  } catch (err) {
    console.error('[PAGAMENTOS_WEBHOOK]', err);
    res.status(StatusCodes.OK).json({ success: true });
  }
});

// ── PUT /confirmar/:id — Super admin confirma pagamento manual ────────────────
router.put('/confirmar/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user?.super_admin) {
      res.status(StatusCodes.FORBIDDEN).json({ success: false, message: 'Acesso negado.' });
      return;
    }
    const pag = await prisma.pagamentoPix.findFirst({ where: { id: Number(req.params['id']) } });
    if (!pag) {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Pagamento não encontrado.' });
      return;
    }
    const novaExpiracao = await _confirmarPagamento(pag.id, pag.cod_empresa);
    res.json({ success: true, message: 'Pagamento confirmado.', nova_expiracao: novaExpiracao });
  } catch (err) {
    console.error('[PAGAMENTOS_CONFIRMAR]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao confirmar pagamento.' });
  }
});

// ── GET /pendentes — Lista pagamentos pendentes (super admin) ─────────────────
router.get('/pendentes', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user?.super_admin) {
      res.status(StatusCodes.FORBIDDEN).json({ success: false, message: 'Acesso negado.' });
      return;
    }
    const pendentes = await prisma.pagamentoPix.findMany({
      where: { status: 'pendente' },
      include: { empresa: { select: { razao_social: true, cnpj: true } } },
      orderBy: { created_at: 'desc' },
    });
    res.json({ success: true, data: pendentes });
  } catch (err) {
    console.error('[PAGAMENTOS_PENDENTES]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao listar pendentes.' });
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────
async function _confirmarPagamento(pagId: number, codEmpresa: number): Promise<Date> {
  const empresa = await prisma.empresa.findFirst({ where: { id: codEmpresa } });

  // Prorroga 30 dias a partir da validade atual (se vigente) ou de hoje
  const base =
    empresa?.data_expiracao && new Date(empresa.data_expiracao) > new Date()
      ? new Date(empresa.data_expiracao)
      : new Date();
  const novaExpiracao = new Date(base);
  novaExpiracao.setDate(novaExpiracao.getDate() + 30);

  await prisma.$transaction([
    prisma.pagamentoPix.update({
      where: { id: pagId },
      data: { status: 'aprovado', pago_em: new Date() },
    }),
    prisma.empresa.update({
      where: { id: codEmpresa },
      data: { data_expiracao: novaExpiracao, updated_at: new Date() },
    }),
  ]);

  return novaExpiracao;
}

export default router;
