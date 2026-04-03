import { Router, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '#config/prisma';
import { authMiddleware } from '#middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
  try {
    const produtos = await prisma.produto.findMany({
      where: { cod_empresa: req.user!.cod_empresa!, excluido: false },
      orderBy: { descricao: 'asc' },
    });
    res.json({ success: true, data: produtos });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao listar produtos.' }); }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const produto = await prisma.produto.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!produto) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Produto não encontrado.' }); return; }
    res.json({ success: true, data: produto });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao buscar produto.' }); }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { excluido, ...body } = req.body;
    const produto = await prisma.produto.create({ data: { ...body, cod_empresa: req.user!.cod_empresa! } });
    res.status(StatusCodes.CREATED).json({ success: true, data: produto });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao criar produto.' }); }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.produto.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!existing) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Produto não encontrado.' }); return; }
    const { excluido, ...body } = req.body;
    const produto = await prisma.produto.update({ where: { id: Number(req.params['id']) }, data: body });
    res.json({ success: true, data: produto });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao atualizar produto.' }); }
});

router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (status !== 1 && status !== 2) { res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Status inválido.' }); return; }
    const existing = await prisma.produto.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!existing) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Produto não encontrado.' }); return; }
    const produto = await prisma.produto.update({ where: { id: Number(req.params['id']) }, data: { status } });
    res.json({ success: true, data: produto });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao alterar status do produto.' }); }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.produto.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!existing) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Produto não encontrado.' }); return; }
    await prisma.produto.update({ where: { id: Number(req.params['id']) }, data: { excluido: true } });
    res.json({ success: true, message: 'Produto excluído.' });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao excluir produto.' }); }
});

export default router;
