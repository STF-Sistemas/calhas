import { Router, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '#config/prisma';
import { authMiddleware } from '#middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);

// ─── GET /relatorios/pedidos-lucros ───────────────────────────────────────────
// Query params: data_inicio (YYYY-MM-DD), data_fim (YYYY-MM-DD),
//               cod_cliente (number), cod_produto (number)
router.get('/pedidos-lucros', async (req: Request, res: Response) => {
  try {
    const codEmpresa = req.user!.cod_empresa!;
    const { data_inicio, data_fim, cod_cliente, cod_produto } = req.query;

    // ── Empresa ────────────────────────────────────────────────────────────────
    const empresa = await prisma.empresa.findUnique({
      where: { id: codEmpresa },
      include: { cidade: true },
    });
    if (!empresa) {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Empresa não encontrada.' });
      return;
    }

    // ── Filtros ────────────────────────────────────────────────────────────────
    const where: any = { cod_empresa: codEmpresa, excluido: false };

    if (data_inicio || data_fim) {
      where.data_pedido = {};
      if (data_inicio) where.data_pedido.gte = new Date(String(data_inicio) + 'T00:00:00.000Z');
      if (data_fim)    where.data_pedido.lte = new Date(String(data_fim)    + 'T23:59:59.999Z');
    }

    if (cod_cliente) where.cod_cliente = Number(cod_cliente);

    // Filtro por produto: traz apenas pedidos que contenham o produto
    const itensWhere: any = { excluido: false };
    if (cod_produto) {
      where.itens = { some: { cod_produto: Number(cod_produto) } };
      itensWhere.cod_produto = Number(cod_produto);
    }

    // ── Pedidos ────────────────────────────────────────────────────────────────
    const pedidos = await prisma.pedido.findMany({
      where,
      include: {
        cliente: true,
        itens: {
          where: cod_produto ? { cod_produto: Number(cod_produto) } : undefined,
          include: {
            produto: true,
            servico: true,
            corte: { include: { chapa: true } },
          },
        },
      },
      orderBy: { data_pedido: 'asc' },
    });

    // ── Cálculo de lucro ───────────────────────────────────────────────────────
    let totalGlobalValor = 0;
    let totalGlobalCusto = 0;

    const pedidosFormatados = pedidos.map(pedido => {
      let custoTotalPedido = 0;
      let valorTotalPedido = 0;

      const itens = pedido.itens.map(item => {
        // Descrição do item conforme seu tipo
        let descricao = '';
        if (item.produto) {
          descricao = item.produto.descricao;
        } else if (item.servico) {
          descricao = item.servico.descricao;
        } else if (item.corte) {
          descricao = `${item.corte.chapa?.descricao ?? ''} — ${item.corte.descricao}`;
        }

        const quantidade    = Number(item.quantidade);
        const valorUnitario = Number(item.valor_unitario);
        const valorTotal    = Number(item.valor_total);
        const custoUnitario = Number(item.custo_unitario);
        const custoTotal    = quantidade * custoUnitario;
        const lucro         = valorTotal - custoTotal;

        custoTotalPedido += custoTotal;
        valorTotalPedido += valorTotal;

        return {
          id: item.id,
          tipo: item.tipo,
          descricao,
          quantidade,
          valor_unitario: valorUnitario,
          valor_total: valorTotal,
          custo_unitario: custoUnitario,
          custo_total: custoTotal,
          lucro,
        };
      });

      totalGlobalValor += valorTotalPedido;
      totalGlobalCusto += custoTotalPedido;

      return {
        id: pedido.id,
        data_pedido: pedido.data_pedido.toISOString(),
        status: pedido.status,
        cliente: pedido.cliente,
        itens,
        valor_total: valorTotalPedido,
        custo_total: custoTotalPedido,
        lucro: valorTotalPedido - custoTotalPedido,
      };
    });

    // ── Nomes para exibição dos filtros aplicados ──────────────────────────────
    let nomeCliente: string | null = null;
    if (cod_cliente) {
      const cli = await prisma.cliente.findUnique({
        where: { id: Number(cod_cliente) },
        select: { razao_social: true },
      });
      nomeCliente = cli?.razao_social ?? null;
    }

    let nomeProduto: string | null = null;
    if (cod_produto) {
      const prod = await prisma.produto.findUnique({
        where: { id: Number(cod_produto) },
        select: { descricao: true },
      });
      nomeProduto = prod?.descricao ?? null;
    }

    res.json({
      success: true,
      data: {
        empresa,
        filtros: {
          data_inicio: data_inicio ? String(data_inicio) : null,
          data_fim: data_fim ? String(data_fim) : null,
          cliente: nomeCliente,
          produto: nomeProduto,
        },
        pedidos: pedidosFormatados,
        totais: {
          valor_total: totalGlobalValor,
          custo_total: totalGlobalCusto,
          lucro: totalGlobalValor - totalGlobalCusto,
          quantidade_pedidos: pedidosFormatados.length,
        },
      },
    });
  } catch (err) {
    console.error('[RELATORIOS_PEDIDOS_LUCROS]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao gerar relatório.' });
  }
});

export default router;
