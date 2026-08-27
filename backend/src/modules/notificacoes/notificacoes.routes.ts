import { Router, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '#config/prisma';
import { authMiddleware } from '#middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
  try {
    const codEmpresa = req.user!.cod_empresa;
    if (!codEmpresa) {
      res.json({ success: true, data: [] });
      return;
    }
    const apenasNaoLidas = req.query['apenasNaoLidas'] === 'true';
    const where: any = { cod_empresa: codEmpresa };
    if (apenasNaoLidas) where.lida = false;

    const notificacoes = await prisma.notificacao.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: notificacoes });
  } catch (err) {
    console.error('[NOTIFICACOES_GET]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao listar notificações.' });
  }
});

router.get('/nao-lidas/contagem', async (req: Request, res: Response) => {
  try {
    const codEmpresa = req.user!.cod_empresa;
    if (!codEmpresa) {
      res.json({ success: true, data: { count: 0 } });
      return;
    }
    const count = await prisma.notificacao.count({ where: { cod_empresa: codEmpresa, lida: false } });
    res.json({ success: true, data: { count } });
  } catch (err) {
    console.error('[NOTIFICACOES_CONTAGEM]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao contar notificações.' });
  }
});

router.patch('/:id/lida', async (req: Request, res: Response) => {
  try {
    const codEmpresa = req.user!.cod_empresa;
    const notificacao = await prisma.notificacao.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: codEmpresa ?? -1 },
    });
    if (!notificacao) {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Notificação não encontrada.' });
      return;
    }
    await prisma.notificacao.update({
      where: { id: notificacao.id },
      data: { lida: true, lida_em: new Date() },
    });
    res.json({ success: true });
  } catch (err) {
    console.error('[NOTIFICACOES_PATCH_LIDA]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao marcar notificação como lida.' });
  }
});

router.patch('/marcar-todas-lidas', async (req: Request, res: Response) => {
  try {
    const codEmpresa = req.user!.cod_empresa;
    if (!codEmpresa) {
      res.json({ success: true });
      return;
    }
    await prisma.notificacao.updateMany({
      where: { cod_empresa: codEmpresa, lida: false },
      data: { lida: true, lida_em: new Date() },
    });
    res.json({ success: true });
  } catch (err) {
    console.error('[NOTIFICACOES_MARCAR_TODAS]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao marcar notificações como lidas.' });
  }
});

export default router;
