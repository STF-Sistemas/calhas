import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import { prisma } from '#config/prisma';
import { EStatusPedido, EAprovacaoPedido, EStatusGeral } from '#shared/enums';
import { enviarPushParaUsuarios } from '#config/web-push';

const router = Router();

const decisaoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Muitas tentativas. Tente novamente em alguns minutos.' },
});

interface IErroToken {
  erro: { status: number; code: string; message: string };
  pedido?: undefined;
}
interface IPedidoValido {
  erro?: undefined;
  pedido: Awaited<ReturnType<typeof prisma.pedido.findFirstOrThrow>>;
}

async function buscarPedidoValidoPorToken(token: string): Promise<IErroToken | IPedidoValido> {
  const pedido = await prisma.pedido.findFirst({ where: { token_acesso: token, excluido: false } });
  if (!pedido) return { erro: { status: StatusCodes.NOT_FOUND, code: 'NOT_FOUND', message: 'Link inválido ou não encontrado.' } };
  if (pedido.status === EStatusPedido.Cancelado) return { erro: { status: StatusCodes.GONE, code: 'CANCELLED', message: 'Este orçamento foi cancelado.' } };
  if (!pedido.token_expiracao || new Date() > new Date(pedido.token_expiracao)) return { erro: { status: StatusCodes.GONE, code: 'EXPIRED', message: 'Link de acesso expirado.' } };
  return { pedido };
}

async function notificarDecisao(pedido: { id: number; cod_empresa: number }, tipo: 'pedido_autorizado' | 'pedido_recusado', titulo: string, mensagem: string) {
  try {
    await prisma.notificacao.create({
      data: { cod_empresa: pedido.cod_empresa, cod_pedido: pedido.id, tipo, titulo, mensagem },
    });
    const usuarios = await prisma.usuario.findMany({
      where: { cod_empresa: pedido.cod_empresa, status: EStatusGeral.Ativo, excluido: false },
      select: { id: true },
    });
    await enviarPushParaUsuarios(usuarios.map(u => u.id), { title: titulo, body: mensagem, url: '/pedidos' });
  } catch (err) {
    console.error('[PEDIDOS_PUBLICO_NOTIFICAR]', err);
  }
}

router.get('/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const pedido: any = await (prisma.pedido as any).findFirst({
      where: { token_acesso: token, excluido: false },
      include: {
        empresa: { include: { cidade: true } },
        cliente: true,
        meio_pagamento: true,
        itens: {
          include: {
            produto: true,
            corte: { include: { chapa: true } },
            servico: true,
          },
        },
      },
    });

    if (!pedido) {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, code: 'NOT_FOUND', message: 'Link inválido ou não encontrado.' });
      return;
    }

    if (pedido.status === EStatusPedido.Cancelado) {
      res.status(StatusCodes.GONE).json({ success: false, code: 'CANCELLED', message: 'Este orçamento foi cancelado.' });
      return;
    }

    if (!pedido.token_expiracao || new Date() > new Date(pedido.token_expiracao)) {
      res.status(StatusCodes.GONE).json({ success: false, code: 'EXPIRED', message: 'Link de acesso expirado.' });
      return;
    }

    const itensFormatados = pedido.itens.map((item: any) => {
      let descricao = '';
      if (item.produto) descricao = item.produto.descricao;
      else if (item.servico) descricao = item.servico.descricao;
      else if (item.corte) descricao = `${item.corte.chapa?.descricao ?? ''} — ${item.corte.descricao}`;
      return {
        id: item.id,
        tipo: item.tipo,
        descricao,
        quantidade: Number(item.quantidade),
        valor_unitario: Number(item.valor_unitario),
        valor_total: Number(item.valor_total),
      };
    });

    let statusLabel = 'Aberto';
    if (pedido.status === EStatusPedido.EmProducao) statusLabel = 'Em Produção';
    else if (pedido.status === EStatusPedido.Concluido) statusLabel = 'Finalizado';

    res.json({
      success: true,
      data: {
        id: pedido.id,
        data_pedido: pedido.data_pedido,
        status: pedido.status,
        status_label: statusLabel,
        observacoes: pedido.observacoes,
        valor_material: Number(pedido.valor_material),
        valor_servico: Number(pedido.valor_servico),
        valor_total: Number(pedido.valor_total),
        desconto_tipo: pedido.desconto_tipo,
        desconto_valor: Number(pedido.desconto_valor),
        valor_desconto: Number(pedido.valor_desconto),
        valor_liquido: Number(pedido.valor_liquido),
        meio_pagamento: pedido.meio_pagamento?.descricao ?? null,
        token_expiracao: pedido.token_expiracao,
        aprovacao_status: pedido.aprovacao_status,
        aprovacao_data: pedido.aprovacao_data,
        recusa_motivo: pedido.recusa_motivo,
        empresa: {
          razao_social: pedido.empresa.razao_social,
          nome_fantasia: pedido.empresa.nome_fantasia,
          cnpj: pedido.empresa.cnpj,
          telefone: pedido.empresa.telefone,
          email: pedido.empresa.email,
          logo_url: pedido.empresa.logo_url,
          marca_dagua: pedido.empresa.marca_dagua,
        },
        cliente: {
          razao_social: pedido.cliente.razao_social,
          telefone: pedido.cliente.telefone,
          email: pedido.cliente.email,
        },
        itens: itensFormatados,
      },
    });
  } catch (err) {
    console.error('[PEDIDOS_PUBLICO]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao buscar pedido.' });
  }
});

const autorizarSchema = z.object({
  assinatura: z.string()
    .min(100)
    .max(700_000)
    .startsWith('data:image/png;base64,', { message: 'Assinatura em formato inválido.' }),
});

const recusarSchema = z.object({
  motivo: z.string().max(1000).trim().optional(),
});

router.post('/:token/autorizar', decisaoLimiter, async (req: Request, res: Response) => {
  try {
    const token = String(req.params['token'] ?? '');
    const resultado = await buscarPedidoValidoPorToken(token);
    if (resultado.erro) {
      res.status(resultado.erro.status).json({ success: false, code: resultado.erro.code, message: resultado.erro.message });
      return;
    }
    const { pedido } = resultado;

    if (pedido.aprovacao_status !== EAprovacaoPedido.Pendente) {
      res.status(StatusCodes.CONFLICT).json({ success: false, code: 'JA_DECIDIDO', message: 'Este orçamento já foi respondido.' });
      return;
    }

    const parse = autorizarSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: parse.error.issues[0].message });
      return;
    }

    const agora = new Date();
    await prisma.pedido.update({
      where: { id: pedido.id },
      data: {
        aprovacao_status: EAprovacaoPedido.Autorizado,
        aprovacao_data: agora,
        aprovacao_assinatura: parse.data.assinatura,
        aprovacao_ip: req.ip ?? null,
      },
    });

    await notificarDecisao(
      pedido,
      'pedido_autorizado',
      'Orçamento autorizado',
      `O pedido Nº ${pedido.id} foi autorizado pelo cliente.`,
    );

    res.json({ success: true, data: { aprovacao_status: EAprovacaoPedido.Autorizado, aprovacao_data: agora } });
  } catch (err) {
    console.error('[PEDIDOS_PUBLICO_AUTORIZAR]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao autorizar orçamento.' });
  }
});

router.post('/:token/recusar', decisaoLimiter, async (req: Request, res: Response) => {
  try {
    const token = String(req.params['token'] ?? '');
    const resultado = await buscarPedidoValidoPorToken(token);
    if (resultado.erro) {
      res.status(resultado.erro.status).json({ success: false, code: resultado.erro.code, message: resultado.erro.message });
      return;
    }
    const { pedido } = resultado;

    if (pedido.aprovacao_status !== EAprovacaoPedido.Pendente) {
      res.status(StatusCodes.CONFLICT).json({ success: false, code: 'JA_DECIDIDO', message: 'Este orçamento já foi respondido.' });
      return;
    }

    const parse = recusarSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: parse.error.issues[0].message });
      return;
    }
    const motivo = parse.data.motivo || null;

    const agora = new Date();
    await prisma.pedido.update({
      where: { id: pedido.id },
      data: {
        aprovacao_status: EAprovacaoPedido.Recusado,
        aprovacao_data: agora,
        recusa_motivo: motivo,
        aprovacao_ip: req.ip ?? null,
      },
    });

    await notificarDecisao(
      pedido,
      'pedido_recusado',
      'Orçamento recusado',
      motivo
        ? `O pedido Nº ${pedido.id} foi recusado pelo cliente. Motivo: ${motivo}`
        : `O pedido Nº ${pedido.id} foi recusado pelo cliente.`,
    );

    res.json({ success: true, data: { aprovacao_status: EAprovacaoPedido.Recusado, aprovacao_data: agora } });
  } catch (err) {
    console.error('[PEDIDOS_PUBLICO_RECUSAR]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao recusar orçamento.' });
  }
});

export default router;
