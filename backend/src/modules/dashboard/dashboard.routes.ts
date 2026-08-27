import { Router, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '#config/prisma';
import { authMiddleware } from '#middlewares/auth.middleware';
import { EStatusPedido } from '#shared/enums';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
  const codEmpresa = req.user!.cod_empresa;

  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59);

  const filtroBase = { cod_empresa: codEmpresa ?? undefined, excluido: false };

  const [
    pedidosMesCount,
    receitaMesAgg,
    clientesAtivos,
    pedidosAbertos,
    pedidosEmProducao,
    pedidosConcluidos,
    pedidosCancelados,
    pedidosRecentes,
  ] = await Promise.all([
    prisma.pedido.count({
      where: { ...filtroBase, data_pedido: { gte: inicioMes, lte: fimMes } },
    }),
    prisma.pedido.aggregate({
      _sum: { valor_total: true },
      where: { ...filtroBase, data_pedido: { gte: inicioMes, lte: fimMes } },
    }),
    prisma.cliente.count({
      where: { cod_empresa: codEmpresa ?? undefined, excluido: false, ativo: 1 },
    }),
    prisma.pedido.count({ where: { ...filtroBase, status: EStatusPedido.Aberto } }),
    prisma.pedido.count({ where: { ...filtroBase, status: EStatusPedido.EmProducao } }),
    prisma.pedido.count({ where: { ...filtroBase, status: EStatusPedido.Concluido } }),
    prisma.pedido.count({ where: { ...filtroBase, status: EStatusPedido.Cancelado } }),
    prisma.pedido.findMany({
      where: filtroBase,
      include: { cliente: true },
      orderBy: { id: 'desc' },
      take: 8,
    }),
  ]);

  // Remove a assinatura (base64, pesada) da listagem — só é necessária na busca por ID.
  const pedidosRecentesSemAssinatura = pedidosRecentes.map(({ aprovacao_assinatura, ...resto }) => resto);

  res.status(StatusCodes.OK).json({
    success: true,
    data: {
      pedidosMes: pedidosMesCount,
      receitaMes: Number(receitaMesAgg._sum.valor_total ?? 0),
      clientesAtivos,
      pedidosAbertos,
      pedidosEmProducao,
      pedidosConcluidos,
      pedidosCancelados,
      pedidosRecentes: pedidosRecentesSemAssinatura,
    },
  });
});

export default router;
