import { Router, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '../../config/prisma';
import { authMiddleware, adminMiddleware, superAdminMiddleware } from '../../middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);

// ── GET / — lista todas as empresas (super_admin apenas) ─────────────────────
router.get('/', superAdminMiddleware, async (_req: Request, res: Response) => {
  try {
    const empresas = await prisma.empresa.findMany({
      where: { excluido: false },
      include: { cidade: true },
      orderBy: { razao_social: 'asc' },
    });
    res.json({ success: true, data: empresas });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao listar empresas.' }); }
});

// ── GET /:id — busca empresa por ID (admin vê apenas a própria) ──────────────
router.get('/:id', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params['id']);

    // Admin (não super_admin) só pode ver a própria empresa
    if (!req.user!.super_admin && req.user!.cod_empresa !== id) {
      res.status(StatusCodes.FORBIDDEN).json({ success: false, message: 'Acesso negado.' }); return;
    }

    const empresa = await prisma.empresa.findFirst({
      where: { id, excluido: false },
      include: { cidade: true },
    });
    if (!empresa) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Empresa não encontrada.' }); return; }
    res.json({ success: true, data: empresa });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao buscar empresa.' }); }
});

// ── POST / — cria nova empresa (super_admin apenas) ──────────────────────────
router.post('/', superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const { cidade_nome, cidade, usuarios, clientes, produtos, chapas, servicos, pedidos, excluido, ...data } = req.body;
    const empresa = await prisma.empresa.create({ data });
    res.status(StatusCodes.CREATED).json({ success: true, data: empresa });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao criar empresa.' }); }
});

// ── PUT /:id — edita empresa (admin edita apenas a própria; super_admin qualquer) ─
router.put('/:id', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params['id']);

    // Admin (não super_admin) só pode editar a própria empresa
    if (!req.user!.super_admin && req.user!.cod_empresa !== id) {
      res.status(StatusCodes.FORBIDDEN).json({ success: false, message: 'Acesso negado.' }); return;
    }

    const existing = await prisma.empresa.findFirst({ where: { id, excluido: false } });
    if (!existing) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Empresa não encontrada.' }); return; }

    const { cidade_nome, cidade, usuarios, clientes, produtos, chapas, servicos, pedidos, excluido, ...data } = req.body;

    // Admin não pode alterar campos sensíveis de licença
    if (!req.user!.super_admin) {
      delete data.data_expiracao;
      delete data.valor_mensalidade;
      delete data.ativo;
    }

    const empresa = await prisma.empresa.update({ where: { id }, data: { ...data, updated_at: new Date() } });
    res.json({ success: true, data: empresa });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao atualizar empresa.' }); }
});

// ── PUT /:id/validade — Atualiza licença (super admin apenas) ────────────────
router.put('/:id/validade', superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const existing = await prisma.empresa.findFirst({ where: { id: Number(req.params['id']), excluido: false } });
    if (!existing) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Empresa não encontrada.' }); return; }
    const { data_expiracao, valor_mensalidade } = req.body as { data_expiracao: string | null; valor_mensalidade?: number };
    const empresa = await prisma.empresa.update({
      where: { id: Number(req.params['id']) },
      data: {
        data_expiracao: data_expiracao ? new Date(data_expiracao) : null,
        ...(valor_mensalidade !== undefined && { valor_mensalidade }),
        updated_at: new Date(),
      },
    });
    res.json({ success: true, data: empresa });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao atualizar licença.' }); }
});

// ── DELETE /:id — exclui empresa (super_admin apenas) ────────────────────────
router.delete('/:id', superAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const existing = await prisma.empresa.findFirst({ where: { id: Number(req.params['id']), excluido: false } });
    if (!existing) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Empresa não encontrada.' }); return; }
    await prisma.empresa.update({ where: { id: Number(req.params['id']) }, data: { excluido: true } });
    res.json({ success: true, message: 'Empresa excluída.' });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao excluir empresa.' }); }
});

export default router;
