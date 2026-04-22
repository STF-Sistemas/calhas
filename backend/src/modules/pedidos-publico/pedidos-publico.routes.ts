import { Router, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '#config/prisma';
import { EStatusPedido } from '#shared/enums';

const router = Router();

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
        meio_pagamento: pedido.meio_pagamento?.descricao ?? null,
        token_expiracao: pedido.token_expiracao,
        empresa: {
          razao_social: pedido.empresa.razao_social,
          nome_fantasia: pedido.empresa.nome_fantasia,
          cnpj: pedido.empresa.cnpj,
          telefone: pedido.empresa.telefone,
          email: pedido.empresa.email,
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

export default router;
