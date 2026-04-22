import { Router, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import { prisma } from '#config/prisma';
import { authMiddleware } from '#middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);

const chapaSchema = z.object({
  descricao: z.string().min(1).max(200),
});

const corteSchema = z.object({
  descricao: z.string().min(1).max(200),
  corte: z.preprocess(v => Number(v) || 0, z.number().min(0)),
  valor: z.preprocess(v => Number(v) || 0, z.number().min(0)),
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const chapas = await prisma.chapa.findMany({
      where: { cod_empresa: req.user!.cod_empresa!, excluido: false },
      include: { cortes: { where: { excluido: false } } },
      orderBy: { descricao: 'asc' },
    });
    res.json({ success: true, data: chapas });
  } catch (err) {
    console.error('[CHAPAS_GET]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao listar chapas.' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const chapa = await prisma.chapa.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
      include: { cortes: { where: { excluido: false } } },
    });
    if (!chapa) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Chapa não encontrada.' }); return; }
    res.json({ success: true, data: chapa });
  } catch (err) {
    console.error('[CHAPAS_GET_ID]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao buscar chapa.' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const parse = chapaSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: parse.error.issues[0].message }); return;
    }
    const chapa = await prisma.chapa.create({ data: { ...parse.data, cod_empresa: req.user!.cod_empresa! } });
    res.status(StatusCodes.CREATED).json({ success: true, data: chapa });
  } catch (err) {
    console.error('[CHAPAS_POST]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao criar chapa.' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.chapa.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!existing) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Chapa não encontrada.' }); return; }

    const parse = chapaSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: parse.error.issues[0].message }); return;
    }
    const chapa = await prisma.chapa.update({ where: { id: Number(req.params['id']) }, data: parse.data });
    res.json({ success: true, data: chapa });
  } catch (err) {
    console.error('[CHAPAS_PUT]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao atualizar chapa.' });
  }
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
  } catch (err) {
    console.error('[CHAPAS_STATUS]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao alterar status da chapa.' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.chapa.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!existing) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Chapa não encontrada.' }); return; }
    await prisma.chapa.update({ where: { id: Number(req.params['id']) }, data: { excluido: true } });
    res.json({ success: true, message: 'Chapa excluída.' });
  } catch (err) {
    console.error('[CHAPAS_DELETE]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao excluir chapa.' });
  }
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
  } catch (err) {
    console.error('[CORTES_GET]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao listar cortes.' });
  }
});

router.post('/:id/cortes', async (req: Request, res: Response) => {
  try {
    const chapa = await prisma.chapa.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!chapa) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Chapa não encontrada.' }); return; }

    const parse = corteSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: parse.error.issues[0].message }); return;
    }
    const corte = await prisma.corte.create({ data: { ...parse.data, cod_chapa: chapa.id } });
    res.status(StatusCodes.CREATED).json({ success: true, data: corte });
  } catch (err) {
    console.error('[CORTES_POST]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao criar corte.' });
  }
});

router.put('/:id/cortes/:corteId', async (req: Request, res: Response) => {
  try {
    // Valida que a chapa pertence à empresa do usuário e que o corte pertence a essa chapa
    const chapa = await prisma.chapa.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!chapa) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Chapa não encontrada.' }); return; }

    const existing = await prisma.corte.findFirst({
      where: { id: Number(req.params['corteId']), cod_chapa: chapa.id, excluido: false },
    });
    if (!existing) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Corte não encontrado.' }); return; }

    const parse = corteSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: parse.error.issues[0].message }); return;
    }

    const corte = await prisma.corte.update({ where: { id: Number(req.params['corteId']) }, data: parse.data });
    res.json({ success: true, data: corte });
  } catch (err) {
    console.error('[CORTES_PUT]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao atualizar corte.' });
  }
});

router.delete('/:id/cortes/:corteId', async (req: Request, res: Response) => {
  try {
    // Valida que a chapa pertence à empresa e que o corte pertence a essa chapa (prevenção de IDOR)
    const chapa = await prisma.chapa.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!chapa) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Chapa não encontrada.' }); return; }

    const existing = await prisma.corte.findFirst({
      where: { id: Number(req.params['corteId']), cod_chapa: chapa.id, excluido: false },
    });
    if (!existing) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Corte não encontrado.' }); return; }

    await prisma.corte.update({ where: { id: Number(req.params['corteId']) }, data: { excluido: true } });
    res.json({ success: true, message: 'Corte excluído.' });
  } catch (err) {
    console.error('[CORTES_DELETE]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao excluir corte.' });
  }
});

export default router;
