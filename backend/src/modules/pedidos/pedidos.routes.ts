import { Router, Request, Response } from 'express';
import { Decimal } from '@prisma/client/runtime/library';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '#config/prisma';
import { authMiddleware } from '#middlewares/auth.middleware';
import { EStatusPedido } from '#shared/enums';

const router = Router();
router.use(authMiddleware);

const include = {
  empresa: true,
  cliente: { include: { cidade: true } },
  meio_pagamento: true,
  itens: { include: { produto: true, corte: { include: { chapa: true } }, servico: true, desenho: true } },
};

async function recalcularPedido(pedidoId: number) {
  const itens = await prisma.pedidoItem.findMany({ where: { cod_pedido: pedidoId } });

  let valorMaterial = new Decimal(0);
  let valorServico = new Decimal(0);

  for (const item of itens) {
    if (item.cod_produto !== null || item.cod_corte !== null) {
      valorMaterial = valorMaterial.add(item.valor_total);
    } else if (item.cod_servico !== null) {
      valorServico = valorServico.add(item.valor_total);
    }
  }

  const servicoCalculado = valorMaterial;
  const valorTotal = valorMaterial.add(servicoCalculado).add(valorServico);

  await prisma.pedido.update({
    where: { id: pedidoId },
    data: { valor_material: valorMaterial, valor_servico: servicoCalculado, valor_total: valorTotal },
  });
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const where: any = { cod_empresa: req.user!.cod_empresa!, excluido: false };
    if (status) where.status = Number(status);
    const pedidos = await prisma.pedido.findMany({ where, include, orderBy: { data_pedido: 'desc' } });
    res.json({ success: true, data: pedidos });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao listar pedidos.' }); }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const pedido = await prisma.pedido.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
      include,
    });
    if (!pedido) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Pedido não encontrado.' }); return; }
    res.json({ success: true, data: pedido });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao buscar pedido.' }); }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { itens, status, excluido, ...pedidoDados } = req.body;

    const pedido = await prisma.pedido.create({
      data: {
        ...pedidoDados,
        cod_empresa: req.user!.cod_empresa!,
        data_pedido: new Date(pedidoDados.data_pedido),
        status: EStatusPedido.Aberto,
        itens: {
          create: (itens || []).map((item: any) => ({
            cod_produto: item.cod_produto ?? null,
            cod_servico: item.cod_servico ?? null,
            cod_corte: item.cod_corte ?? null,
            cod_desenho: item.cod_desenho ?? null,
            medidas: item.medidas ?? null,
            tipo: item.tipo,
            quantidade: item.quantidade,
            valor_unitario: item.valor_unitario,
            valor_total: new Decimal(item.quantidade).mul(new Decimal(item.valor_unitario)),
            observacoes: item.observacoes ?? null,
          })),
        },
      },
    });

    await recalcularPedido(pedido.id);
    const pedidoAtualizado = await prisma.pedido.findFirst({ where: { id: pedido.id }, include });
    res.status(StatusCodes.CREATED).json({ success: true, data: pedidoAtualizado });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao criar pedido.' }); }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const pedidoId = Number(req.params['id']);
    const existing = await prisma.pedido.findFirst({
      where: { id: pedidoId, cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!existing) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Pedido não encontrado.' }); return; }

    const { itens, excluido, status, ...pedidoDados } = req.body;

    await prisma.pedido.update({
      where: { id: pedidoId },
      data: { ...pedidoDados, status: Number(status), updated_at: new Date() },
    });

    if (Array.isArray(itens)) {
      for (const item of itens) {
        const valorTotal = new Decimal(item.quantidade).mul(new Decimal(item.valor_unitario));
        const itemData = {
          cod_produto: item.cod_produto ?? null,
          cod_servico: item.cod_servico ?? null,
          cod_corte: item.cod_corte ?? null,
          cod_desenho: item.cod_desenho ?? null,
          medidas: item.medidas ?? null,
          tipo: item.tipo,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
          valor_total: valorTotal,
          observacoes: item.observacoes ?? null,
        };

        if (item.id) {
          await prisma.pedidoItem.update({ where: { id: item.id }, data: itemData });
        } else {
          await prisma.pedidoItem.create({ data: { cod_pedido: pedidoId, ...itemData } });
        }
      }
    }

    await recalcularPedido(pedidoId);
    const pedidoAtualizado = await prisma.pedido.findFirst({ where: { id: pedidoId }, include });
    res.json({ success: true, data: pedidoAtualizado });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao atualizar pedido.' }); }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.pedido.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!existing) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Pedido não encontrado.' }); return; }
    await prisma.pedido.update({ where: { id: Number(req.params['id']) }, data: { excluido: true } });
    res.json({ success: true, message: 'Pedido excluído.' });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao excluir pedido.' }); }
});

// ─── ITENS ───────────────────────────────────────────────────────────────────

router.post('/:id/itens', async (req: Request, res: Response) => {
  try {
    const pedido = await prisma.pedido.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!pedido) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Pedido não encontrado.' }); return; }
    const item = req.body;
    await prisma.pedidoItem.create({
      data: {
        cod_pedido: pedido.id,
        cod_produto: item.cod_produto ?? null,
        cod_servico: item.cod_servico ?? null,
        cod_corte: item.cod_corte ?? null,
        cod_desenho: item.cod_desenho ?? null,
        medidas: item.medidas ?? null,
        tipo: item.tipo,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        valor_total: new Decimal(item.quantidade).mul(new Decimal(item.valor_unitario)),
        observacoes: item.observacoes ?? null,
      },
    });
    await recalcularPedido(pedido.id);
    const pedidoAtualizado = await prisma.pedido.findFirst({ where: { id: pedido.id }, include });
    res.status(StatusCodes.CREATED).json({ success: true, data: pedidoAtualizado });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao adicionar item.' }); }
});

router.put('/:id/itens/:itemId', async (req: Request, res: Response) => {
  try {
    const pedido = await prisma.pedido.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!pedido) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Pedido não encontrado.' }); return; }
    const { tipo, quantidade, valor_unitario, ...rest } = req.body;
    await prisma.pedidoItem.update({
      where: { id: Number(req.params['itemId']) },
      data: { ...rest, tipo, quantidade, valor_unitario, valor_total: new Decimal(quantidade).mul(new Decimal(valor_unitario)) },
    });
    await recalcularPedido(pedido.id);
    const pedidoAtualizado = await prisma.pedido.findFirst({ where: { id: pedido.id }, include });
    res.json({ success: true, data: pedidoAtualizado });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao atualizar item.' }); }
});

router.delete('/:id/itens/:itemId', async (req: Request, res: Response) => {
  try {
    const pedido = await prisma.pedido.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!pedido) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Pedido não encontrado.' }); return; }
    await prisma.pedidoItem.delete({ where: { id: Number(req.params['itemId']) } });
    await recalcularPedido(pedido.id);
    const pedidoAtualizado = await prisma.pedido.findFirst({ where: { id: pedido.id }, include });
    res.json({ success: true, data: pedidoAtualizado });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao remover item.' }); }
});

export default router;
