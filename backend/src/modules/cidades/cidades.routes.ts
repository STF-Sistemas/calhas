import { Router, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '#config/prisma';
import { authMiddleware } from '#middlewares/auth.middleware';

const router = Router();

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    const where = q ? { descricao: { contains: String(q), mode: 'insensitive' as const } } : {};
    const cidades = await prisma.cidade.findMany({ where, orderBy: { descricao: 'asc' } });
    res.json({ success: true, data: cidades });
  } catch {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao listar cidades.' });
  }
});

export default router;
