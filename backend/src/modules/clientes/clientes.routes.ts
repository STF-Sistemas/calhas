import { Router, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '#config/prisma';
import { authMiddleware } from '#middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);

const include = { cidade: true };

router.get('/', async (req: Request, res: Response) => {
  try {
    const clientes = await prisma.cliente.findMany({
      where: { cod_empresa: req.user!.cod_empresa!, excluido: false },
      include,
      orderBy: { razao_social: 'asc' },
    });
    res.json({ success: true, data: clientes });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao listar clientes.' }); }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const cliente = await prisma.cliente.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
      include,
    });
    if (!cliente) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Cliente não encontrado.' }); return; }
    res.json({ success: true, data: cliente });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao buscar cliente.' }); }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { cidade, cidade_nome, excluido, ...body } = req.body;
    const cliente = await prisma.cliente.create({ data: { ...body, cod_empresa: req.user!.cod_empresa! } });
    res.status(StatusCodes.CREATED).json({ success: true, data: cliente });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao criar cliente.' }); }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.cliente.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!existing) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Cliente não encontrado.' }); return; }
    const { cidade, cidade_nome, excluido, ...body } = req.body;
    const cliente = await prisma.cliente.update({
      where: { id: Number(req.params['id']) },
      data: { ...body, updated_at: new Date() },
    });
    res.json({ success: true, data: cliente });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao atualizar cliente.' }); }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.cliente.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!existing) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Cliente não encontrado.' }); return; }
    await prisma.cliente.update({ where: { id: Number(req.params['id']) }, data: { excluido: true } });
    res.json({ success: true, message: 'Cliente excluído.' });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao excluir cliente.' }); }
});

export default router;
