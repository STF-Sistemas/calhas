import { Router, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '#config/prisma';
import { authMiddleware } from '#middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
  try {
    const chapas = await prisma.chapa.findMany({
      where: { cod_empresa: req.user!.cod_empresa!, excluido: false },
      include: { cortes: { where: { excluido: false } } },
      orderBy: { descricao: 'asc' },
    });
    res.json({ success: true, data: chapas });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao listar chapas.' }); }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const chapa = await prisma.chapa.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
      include: { cortes: { where: { excluido: false } } },
    });
    if (!chapa) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Chapa não encontrada.' }); return; }
    res.json({ success: true, data: chapa });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao buscar chapa.' }); }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { excluido, ...body } = req.body;
    const chapa = await prisma.chapa.create({ data: { ...body, cod_empresa: req.user!.cod_empresa! } });
    res.status(StatusCodes.CREATED).json({ success: true, data: chapa });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao criar chapa.' }); }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.chapa.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!existing) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Chapa não encontrada.' }); return; }
    const { excluido, ...body } = req.body;
    const chapa = await prisma.chapa.update({ where: { id: Number(req.params['id']) }, data: body });
    res.json({ success: true, data: chapa });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao atualizar chapa.' }); }
});

router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (status !== 1 && status !== 2) { res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Status inválido.' }); return; }
    const existing = await prisma.chapa.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!existing) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Chapa não encontrada.' }); return; }
    const chapa = await prisma.chapa.update({ where: { id: Number(req.params['id']) }, data: { status } });
    res.json({ success: true, data: chapa });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao alterar status da chapa.' }); }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.chapa.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!existing) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Chapa não encontrada.' }); return; }
    await prisma.chapa.update({ where: { id: Number(req.params['id']) }, data: { excluido: true } });
    res.json({ success: true, message: 'Chapa excluída.' });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao excluir chapa.' }); }
});

// ─── CORTES ─────────────────────────────────────────────────────────────────

router.get('/:id/cortes', async (req: Request, res: Response) => {
  try {
    const chapa = await prisma.chapa.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!chapa) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Chapa não encontrada.' }); return; }
    const cortes = await prisma.corte.findMany({
      where: { cod_chapa: chapa.id, excluido: false },
      orderBy: { descricao: 'asc' },
    });
    res.json({ success: true, data: cortes });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao listar cortes.' }); }
});

router.post('/:id/cortes', async (req: Request, res: Response) => {
  try {
    const chapa = await prisma.chapa.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!chapa) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Chapa não encontrada.' }); return; }
    const { excluido, ...body } = req.body;
    const corte = await prisma.corte.create({ data: { ...body, cod_chapa: chapa.id } });
    res.status(StatusCodes.CREATED).json({ success: true, data: corte });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao criar corte.' }); }
});

router.put('/:id/cortes/:corteId', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.corte.findFirst({
      where: { id: Number(req.params['corteId']), excluido: false },
    });
    if (!existing) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Corte não encontrado.' }); return; }
    const { excluido, ...body } = req.body;
    const corte = await prisma.corte.update({ where: { id: Number(req.params['corteId']) }, data: body });
    res.json({ success: true, data: corte });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao atualizar corte.' }); }
});

router.delete('/:id/cortes/:corteId', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.corte.findFirst({
      where: { id: Number(req.params['corteId']), excluido: false },
    });
    if (!existing) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Corte não encontrado.' }); return; }
    await prisma.corte.update({ where: { id: Number(req.params['corteId']) }, data: { excluido: true } });
    res.json({ success: true, message: 'Corte excluído.' });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao excluir corte.' }); }
});

export default router;
