import { Router, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import { prisma } from '#config/prisma';
import { authMiddleware } from '#middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);

const servicoSchema = z.object({
  descricao: z.string().min(1).max(200),
  valor: z.preprocess(v => Number(v) || 0, z.number().min(0)),
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const servicos = await prisma.servico.findMany({
      where: { cod_empresa: req.user!.cod_empresa!, excluido: false },
      orderBy: { descricao: 'asc' },
    });
    res.json({ success: true, data: servicos });
  } catch (err) {
    console.error('[SERVICOS_GET]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao listar serviços.' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const servico = await prisma.servico.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!servico) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Serviço não encontrado.' }); return; }
    res.json({ success: true, data: servico });
  } catch (err) {
    console.error('[SERVICOS_GET_ID]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao buscar serviço.' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const parse = servicoSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: parse.error.issues[0].message }); return;
    }
    const servico = await prisma.servico.create({ data: { ...parse.data, cod_empresa: req.user!.cod_empresa! } });
    res.status(StatusCodes.CREATED).json({ success: true, data: servico });
  } catch (err) {
    console.error('[SERVICOS_POST]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao criar serviço.' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.servico.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!existing) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Serviço não encontrado.' }); return; }

    const parse = servicoSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: parse.error.issues[0].message }); return;
    }
    const servico = await prisma.servico.update({ where: { id: Number(req.params['id']) }, data: parse.data });
    res.json({ success: true, data: servico });
  } catch (err) {
    console.error('[SERVICOS_PUT]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao atualizar serviço.' });
  }
});

router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (status !== 1 && status !== 2) { res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Status inválido.' }); return; }
    const existing = await prisma.servico.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!existing) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Serviço não encontrado.' }); return; }
    const servico = await prisma.servico.update({ where: { id: Number(req.params['id']) }, data: { status } });
    res.json({ success: true, data: servico });
  } catch (err) {
    console.error('[SERVICOS_STATUS]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao alterar status do serviço.' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.servico.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!existing) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Serviço não encontrado.' }); return; }
    await prisma.servico.update({ where: { id: Number(req.params['id']) }, data: { excluido: true } });
    res.json({ success: true, message: 'Serviço excluído.' });
  } catch (err) {
    console.error('[SERVICOS_DELETE]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao excluir serviço.' });
  }
});

export default router;
