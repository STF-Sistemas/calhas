import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { falha } from '../common/falha';
import { PrismaService } from '../prisma/prisma.service';

const MP_API = 'https://api.mercadopago.com/v1/payments';

@Injectable()
export class PagamentosService {
  private readonly logger = new Logger(PagamentosService.name);
  private readonly mpToken = process.env['MP_ACCESS_TOKEN'] || '';
  private readonly pixChaveManual = process.env['PIX_CHAVE_MANUAL'] || '';
  private readonly backendUrl = process.env['BACKEND_URL'] || process.env['SITE_URL'] || '';

  constructor(private readonly prisma: PrismaService) {}

  async criarPix(codEmpresa: number | null) {
    if (!codEmpresa) throw falha(HttpStatus.BAD_REQUEST, 'Empresa não identificada.');
    const empresa = await this.prisma.empresa.findFirst({
      where: { id: codEmpresa, excluido: false },
      select: { id: true, email: true, valor_mensalidade: true },
    });
    if (!empresa) throw falha(HttpStatus.NOT_FOUND, 'Empresa não encontrada.');
    const valor = Number(empresa.valor_mensalidade ?? 150);

    const pendente = await this.prisma.pagamentoPix.findFirst({
      where: { cod_empresa: codEmpresa, status: 'pendente' },
      orderBy: { created_at: 'desc' },
    });
    if (pendente) {
      const manual = !pendente.mp_payment_id;
      return { success: true, data: { pagamento: pendente, manual, pix_chave: manual ? this.pixChaveManual : null, valor } };
    }

    if (!this.mpToken) {
      const pagamento = await this.prisma.pagamentoPix.create({
        data: { cod_empresa: codEmpresa, valor, status: 'pendente', qr_code: this.pixChaveManual },
      });
      return { success: true, data: { pagamento, manual: true, pix_chave: this.pixChaveManual, valor } };
    }

    const resposta = await fetch(MP_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.mpToken}`,
        'X-Idempotency-Key': `licenca_${codEmpresa}_${Date.now()}`,
      },
      body: JSON.stringify({
        transaction_amount: valor,
        description: 'Licença Calhas Pro, 30 dias',
        payment_method_id: 'pix',
        payer: { email: empresa.email || 'pagamento@calhas.pro' },
        external_reference: `empresa_${codEmpresa}`,
        ...(this.backendUrl && { notification_url: `${this.backendUrl}/api/pagamentos/webhook` }),
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!resposta.ok) {
      this.logger.error(`Mercado Pago ${resposta.status}: ${await resposta.text()}`);
      throw falha(HttpStatus.INTERNAL_SERVER_ERROR, 'Erro ao criar cobrança Pix.');
    }
    const mp = (await resposta.json()) as {
      id: number | string;
      point_of_interaction?: { transaction_data?: { qr_code?: string; qr_code_base64?: string } };
    };
    const tx = mp.point_of_interaction?.transaction_data;
    const pagamento = await this.prisma.pagamentoPix.create({
      data: {
        cod_empresa: codEmpresa,
        mp_payment_id: String(mp.id),
        valor,
        status: 'pendente',
        qr_code: tx?.qr_code ?? null,
        qr_code_base64: tx?.qr_code_base64 ?? null,
      },
    });
    return { success: true, data: { pagamento, manual: false, pix_chave: null, valor } };
  }

  async status(id: number, codEmpresa: number | null) {
    const pagamento = await this.prisma.pagamentoPix.findFirst({ where: { id, cod_empresa: codEmpresa ?? -1 } });
    if (!pagamento) throw falha(HttpStatus.NOT_FOUND, 'Pagamento não encontrado.');

    if (pagamento.status === 'pendente' && pagamento.mp_payment_id && (await this.aprovadoNoMp(pagamento.mp_payment_id))) {
      const nova_expiracao = await this.confirmar(pagamento.id, pagamento.cod_empresa);
      const atualizado = await this.prisma.pagamentoPix.findFirst({ where: { id } });
      return { success: true, data: { pagamento: atualizado, nova_expiracao } };
    }

    if (pagamento.status === 'aprovado') {
      const empresa = await this.prisma.empresa.findFirst({
        where: { id: pagamento.cod_empresa },
        select: { data_expiracao: true },
      });
      return { success: true, data: { pagamento, nova_expiracao: empresa?.data_expiracao ?? undefined } };
    }
    return { success: true, data: { pagamento } };
  }

  async webhook(corpo: { type?: string; data?: { id?: unknown } }): Promise<void> {
    const idMp = corpo?.data?.id;
    if (corpo?.type !== 'payment' || !idMp || !/^\d{1,30}$/.test(String(idMp))) return;
    if (!(await this.aprovadoNoMp(String(idMp)))) return;
    const pagamento = await this.prisma.pagamentoPix.findFirst({ where: { mp_payment_id: String(idMp), status: 'pendente' } });
    if (pagamento) await this.confirmar(pagamento.id, pagamento.cod_empresa);
  }

  async confirmarManual(id: number) {
    const pagamento = await this.prisma.pagamentoPix.findFirst({ where: { id } });
    if (!pagamento) throw falha(HttpStatus.NOT_FOUND, 'Pagamento não encontrado.');
    const nova_expiracao = await this.confirmar(pagamento.id, pagamento.cod_empresa);
    return { success: true, message: 'Pagamento confirmado.', nova_expiracao };
  }

  async pendentes() {
    const data = await this.prisma.pagamentoPix.findMany({
      where: { status: 'pendente' },
      include: { empresa: { select: { razao_social: true, cnpj: true } } },
      orderBy: { created_at: 'desc' },
    });
    return { success: true, data };
  }

  private async aprovadoNoMp(idMp: string): Promise<boolean> {
    if (!this.mpToken) return false;
    try {
      const resposta = await fetch(`${MP_API}/${encodeURIComponent(idMp)}`, {
        headers: { Authorization: `Bearer ${this.mpToken}` },
        signal: AbortSignal.timeout(10000),
      });
      if (!resposta.ok) return false;
      return ((await resposta.json()) as { status?: string }).status === 'approved';
    } catch {
      return false;
    }
  }

  private async confirmar(pagamentoId: number, codEmpresa: number): Promise<Date | null> {
    return this.prisma.$transaction(async (tx) => {
      const marcado = await tx.pagamentoPix.updateMany({
        where: { id: pagamentoId, status: { not: 'aprovado' } },
        data: { status: 'aprovado', pago_em: new Date() },
      });
      const empresa = await tx.empresa.findFirst({ where: { id: codEmpresa }, select: { data_expiracao: true } });
      if (marcado.count === 0) return empresa?.data_expiracao ?? null;

      const base =
        empresa?.data_expiracao && new Date(empresa.data_expiracao) > new Date() ? new Date(empresa.data_expiracao) : new Date();
      const novaExpiracao = new Date(base);
      novaExpiracao.setDate(novaExpiracao.getDate() + 30);
      await tx.empresa.update({ where: { id: codEmpresa }, data: { data_expiracao: novaExpiracao } });
      return novaExpiracao;
    });
  }
}
