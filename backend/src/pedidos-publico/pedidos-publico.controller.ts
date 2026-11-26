import { Body, Controller, Get, HttpCode, HttpStatus, Ip, Logger, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { EAprovacaoPedido, EStatusGeral, EStatusPedido } from '#shared/enums';
import { Publico } from '../common/decorators';
import { falha } from '../common/falha';
import { TextoOpcional } from '../common/validadores';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';

class AutorizarDto {
  @IsString({ message: 'Assinatura em formato inválido.' })
  @MinLength(100, { message: 'Assinatura em formato inválido.' })
  @MaxLength(700_000, { message: 'Assinatura muito grande.' })
  @Matches(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/, { message: 'Assinatura em formato inválido.' })
  assinatura: string;
}

class RecusarDto {
  @TextoOpcional(1000)
  motivo?: string;
}

const QUINZE_MIN = 15 * 60 * 1000;

/** Orçamento aberto pelo cliente por link (sem login): visualizar, autorizar ou recusar. */
@Publico()
@Controller('pedidos-publico')
export class PedidosPublicoController {
  private readonly logger = new Logger(PedidosPublicoController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  private async pedidoValido(token: string) {
    const pedido =
      typeof token === 'string' && token.length <= 100
        ? await this.prisma.pedido.findFirst({ where: { token_acesso: token, excluido: false } })
        : null;
    if (!pedido) throw falha(HttpStatus.NOT_FOUND, 'Link inválido ou não encontrado.', { code: 'NOT_FOUND' });
    if (pedido.status === EStatusPedido.Cancelado) {
      throw falha(HttpStatus.GONE, 'Este orçamento foi cancelado.', { code: 'CANCELLED' });
    }
    if (!pedido.token_expiracao || new Date() > new Date(pedido.token_expiracao)) {
      throw falha(HttpStatus.GONE, 'Link de acesso expirado.', { code: 'EXPIRED' });
    }
    return pedido;
  }

  /** Grava a decisão só se ainda estiver pendente (evita corrida entre duas respostas). */
  private async decidir(id: number, dados: Record<string, unknown>): Promise<void> {
    const r = await this.prisma.pedido.updateMany({
      where: { id, aprovacao_status: EAprovacaoPedido.Pendente },
      data: dados,
    });
    if (r.count === 0) throw falha(HttpStatus.CONFLICT, 'Este orçamento já foi respondido.', { code: 'JA_DECIDIDO' });
  }

  private async notificar(pedido: { id: number; cod_empresa: number }, tipo: string, titulo: string, mensagem: string) {
    try {
      await this.prisma.notificacao.create({
        data: { cod_empresa: pedido.cod_empresa, cod_pedido: pedido.id, tipo, titulo, mensagem },
      });
      const usuarios = await this.prisma.usuario.findMany({
        where: { cod_empresa: pedido.cod_empresa, status: EStatusGeral.Ativo, excluido: false },
        select: { id: true },
      });
      await this.push.enviarParaUsuarios(
        usuarios.map((u) => u.id),
        { title: titulo, body: mensagem, url: '/pedidos' },
      );
    } catch (erro) {
      this.logger.error(`Falha ao notificar: ${(erro as Error).message}`);
    }
  }

  @Get(':token')
  async buscar(@Param('token') token: string) {
    const base = await this.pedidoValido(token);
    const pedido = await this.prisma.pedido.findUniqueOrThrow({
      where: { id: base.id },
      include: {
        empresa: true,
        cliente: true,
        meio_pagamento: true,
        itens: { include: { produto: true, corte: { include: { chapa: true } }, servico: true } },
      },
    });

    const itens = pedido.itens.map((item) => ({
      id: item.id,
      tipo: item.tipo,
      descricao: item.produto
        ? item.produto.descricao
        : item.servico
          ? item.servico.descricao
          : item.corte
            ? `${item.corte.chapa?.descricao ?? ''}: ${item.corte.descricao}`
            : '',
      quantidade: Number(item.quantidade),
      valor_unitario: Number(item.valor_unitario),
      valor_total: Number(item.valor_total),
    }));

    const status_label =
      pedido.status === EStatusPedido.EmProducao
        ? 'Em Produção'
        : pedido.status === EStatusPedido.Concluido
          ? 'Finalizado'
          : 'Aberto';

    return {
      success: true,
      data: {
        id: pedido.id,
        data_pedido: pedido.data_pedido,
        status: pedido.status,
        status_label,
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
        itens,
      },
    };
  }

  @Throttle({ default: { limit: 20, ttl: QUINZE_MIN } })
  @Post(':token/autorizar')
  @HttpCode(200)
  async autorizar(@Param('token') token: string, @Body() dto: AutorizarDto, @Ip() ip: string) {
    const pedido = await this.pedidoValido(token);
    const agora = new Date();
    await this.decidir(pedido.id, {
      aprovacao_status: EAprovacaoPedido.Autorizado,
      aprovacao_data: agora,
      aprovacao_assinatura: dto.assinatura,
      aprovacao_ip: ip?.slice(0, 45) ?? null,
    });
    await this.notificar(pedido, 'pedido_autorizado', 'Orçamento autorizado', `O pedido Nº ${pedido.id} foi autorizado pelo cliente.`);
    return { success: true, data: { aprovacao_status: EAprovacaoPedido.Autorizado, aprovacao_data: agora } };
  }

  @Throttle({ default: { limit: 20, ttl: QUINZE_MIN } })
  @Post(':token/recusar')
  @HttpCode(200)
  async recusar(@Param('token') token: string, @Body() dto: RecusarDto, @Ip() ip: string) {
    const pedido = await this.pedidoValido(token);
    const motivo = dto.motivo || null;
    const agora = new Date();
    await this.decidir(pedido.id, {
      aprovacao_status: EAprovacaoPedido.Recusado,
      aprovacao_data: agora,
      recusa_motivo: motivo,
      aprovacao_ip: ip?.slice(0, 45) ?? null,
    });
    await this.notificar(
      pedido,
      'pedido_recusado',
      'Orçamento recusado',
      motivo
        ? `O pedido Nº ${pedido.id} foi recusado pelo cliente. Motivo: ${motivo}`
        : `O pedido Nº ${pedido.id} foi recusado pelo cliente.`,
    );
    return { success: true, data: { aprovacao_status: EAprovacaoPedido.Recusado, aprovacao_data: agora } };
  }
}
