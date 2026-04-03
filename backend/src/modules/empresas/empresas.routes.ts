import { Router, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '../../config/prisma';
import { authMiddleware, superAdminMiddleware } from '../../middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware, superAdminMiddleware);

router.get('/', async (_req: Request, res: Response) => {
  try {
    const empresas = await prisma.empresa.findMany({
      where: { excluido: false },
      include: { cidade: true },
      orderBy: { razao_social: 'asc' },
    });
    res.json({ success: true, data: empresas });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao listar empresas.' }); }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const empresa = await prisma.empresa.findFirst({
      where: { id: Number(req.params['id']), excluido: false },
      include: { cidade: true },
    });
    if (!empresa) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Empresa não encontrada.' }); return; }
    res.json({ success: true, data: empresa });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao buscar empresa.' }); }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { cidade_nome, cidade, usuarios, clientes, produtos, chapas, servicos, pedidos, excluido, ...data } = req.body;
    const empresa = await prisma.empresa.create({ data });
    res.status(StatusCodes.CREATED).json({ success: true, data: empresa });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao criar empresa.' }); }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.empresa.findFirst({ where: { id: Number(req.params['id']), excluido: false } });
    if (!existing) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Empresa não encontrada.' }); return; }
    const { cidade_nome, cidade, usuarios, clientes, produtos, chapas, servicos, pedidos, excluido, ...data } = req.body;
    const empresa = await prisma.empresa.update({ where: { id: Number(req.params['id']) }, data: { ...data, updated_at: new Date() } });
    res.json({ success: true, data: empresa });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao atualizar empresa.' }); }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.empresa.findFirst({ where: { id: Number(req.params['id']), excluido: false } });
    if (!existing) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Empresa não encontrada.' }); return; }
    await prisma.empresa.update({ where: { id: Number(req.params['id']) }, data: { excluido: true } });
    res.json({ success: true, message: 'Empresa excluída.' });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao excluir empresa.' }); }
});

export default router;
