import { Router, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '#config/prisma';
import { authMiddleware } from '#middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
  try {
    const meios = await prisma.meioPagamento.findMany({
      where: { cod_empresa: req.user!.cod_empresa!, excluido: false },
      orderBy: { descricao: 'asc' },
    });
    res.json({ success: true, data: meios });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao listar meios de pagamento.' }); }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const meio = await prisma.meioPagamento.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!meio) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Meio de pagamento não encontrado.' }); return; }
    res.json({ success: true, data: meio });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao buscar meio de pagamento.' }); }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { excluido, ...body } = req.body;
    const meio = await prisma.meioPagamento.create({ data: { ...body, cod_empresa: req.user!.cod_empresa! } });
    res.status(StatusCodes.CREATED).json({ success: true, data: meio });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao criar meio de pagamento.' }); }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.meioPagamento.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!existing) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Meio de pagamento não encontrado.' }); return; }
    const { excluido, ...body } = req.body;
    const meio = await prisma.meioPagamento.update({ where: { id: Number(req.params['id']) }, data: body });
    res.json({ success: true, data: meio });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao atualizar meio de pagamento.' }); }
});

router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (status !== 1 && status !== 2) { res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Status inválido.' }); return; }
    const existing = await prisma.meioPagamento.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!existing) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Meio de pagamento não encontrado.' }); return; }
    const meio = await prisma.meioPagamento.update({ where: { id: Number(req.params['id']) }, data: { ativo: status } });
    res.json({ success: true, data: meio });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao alterar status do meio de pagamento.' }); }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.meioPagamento.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!existing) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Meio de pagamento não encontrado.' }); return; }
    await prisma.meioPagamento.update({ where: { id: Number(req.params['id']) }, data: { excluido: true } });
    res.json({ success: true, message: 'Meio de pagamento excluído.' });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao excluir meio de pagamento.' }); }
});

export default router;
