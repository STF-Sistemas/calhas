import { Router, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '#config/prisma';
import { EStatusPedido, ETipoItemPedido } from '#shared/enums';

const router = Router();

// GET /:token — dados públicos da Ordem de Corte (enviada a um fornecedor via WhatsApp)
router.get('/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const pedido: any = await (prisma.pedido as any).findFirst({
      where: { token_acesso_corte: token, excluido: false },
      include: {
        empresa: { include: { cidade: true } },
        cliente: true,
        itens: {
          include: {
            corte: { include: { chapa: true } },
            desenho: true,
          },
        },
      },
    });

    if (!pedido) {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, code: 'NOT_FOUND', message: 'Link inválido ou não encontrado.' });
      return;
    }

    if (pedido.status === EStatusPedido.Cancelado) {
      res.status(StatusCodes.GONE).json({ success: false, code: 'CANCELLED', message: 'Este pedido foi cancelado.' });
      return;
    }

    if (!pedido.token_expiracao_corte || new Date() > new Date(pedido.token_expiracao_corte)) {
      res.status(StatusCodes.GONE).json({ success: false, code: 'EXPIRED', message: 'Link de acesso expirado.' });
      return;
    }

    const itensCorte = pedido.itens
      .filter((item: any) => item.tipo === ETipoItemPedido.Corte && item.cod_desenho)
      .map((item: any) => ({
        id: item.id,
        quantidade: Number(item.quantidade),
        observacoes: item.observacoes,
        medidas: item.medidas ?? [],
        corte: item.corte ? {
          descricao: item.corte.descricao,
          corte: Number(item.corte.corte),
          chapa: item.corte.chapa ? { descricao: item.corte.chapa.descricao } : null,
        } : null,
        desenho: item.desenho ? {
          descricao: item.desenho.descricao,
          pontos: item.desenho.pontos,
          diagonais: item.desenho.diagonais,
        } : null,
      }));

    if (itensCorte.length === 0) {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, code: 'NOT_FOUND', message: 'Este pedido não possui itens de corte com desenho.' });
      return;
    }

    res.json({
      success: true,
      data: {
        id: pedido.id,
        data_pedido: pedido.data_pedido,
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
        },
        itens: itensCorte,
      },
    });
  } catch (err) {
    console.error('[ORDEM_CORTE_PUBLICO]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao buscar ordem de corte.' });
  }
});

export default router;
