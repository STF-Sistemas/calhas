import { Router, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '#config/prisma';
import { authMiddleware } from '#middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
  try {
    const desenhos = await prisma.desenho.findMany({
      where: { cod_empresa: req.user!.cod_empresa!, excluido: false },
      orderBy: { descricao: 'asc' },
    });
    res.json({ success: true, data: desenhos });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao listar desenhos.' }); }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const desenho = await prisma.desenho.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!desenho) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Desenho não encontrado.' }); return; }
    res.json({ success: true, data: desenho });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao buscar desenho.' }); }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { excluido, ...body } = req.body;
    const desenho = await prisma.desenho.create({ data: { ...body, cod_empresa: req.user!.cod_empresa! } });
    res.status(StatusCodes.CREATED).json({ success: true, data: desenho });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao criar desenho.' }); }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.desenho.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!existing) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Desenho não encontrado.' }); return; }
    const { excluido, ...body } = req.body;
    const desenho = await prisma.desenho.update({ where: { id: Number(req.params['id']) }, data: body });
    res.json({ success: true, data: desenho });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao atualizar desenho.' }); }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.desenho.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!existing) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Desenho não encontrado.' }); return; }
    await prisma.desenho.update({ where: { id: Number(req.params['id']) }, data: { excluido: true } });
    res.json({ success: true, message: 'Desenho excluído.' });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao excluir desenho.' }); }
});

export default router;
