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
            produto: true,
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

    const idsSelecionados: number[] | null = Array.isArray(pedido.itens_corte_selecionados)
      ? pedido.itens_corte_selecionados
      : null;

    const itensEnvio = pedido.itens
      .filter((item: any) => item.tipo === ETipoItemPedido.Corte || item.tipo === ETipoItemPedido.Produto)
      .filter((item: any) => !idsSelecionados || idsSelecionados.includes(item.id))
      // Produtos primeiro, depois cortes (Produto=10 < Corte=11)
      .sort((a: any, b: any) => a.tipo - b.tipo)
      .map((item: any) => ({
        id: item.id,
        tipo: item.tipo,
        quantidade: Number(item.quantidade),
        observacoes: item.observacoes,
        medidas: item.medidas ?? [],
        produto: item.produto ? {
          descricao: item.produto.descricao,
          unidade_medida: item.produto.unidade_medida,
        } : null,
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

    if (itensEnvio.length === 0) {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, code: 'NOT_FOUND', message: 'Este pedido não possui itens disponíveis para envio.' });
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
        itens: itensEnvio,
      },
    });
  } catch (err) {
    console.error('[ORDEM_CORTE_PUBLICO]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao buscar ordem de corte.' });
  }
});

export default router;
