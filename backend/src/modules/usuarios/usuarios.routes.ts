import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import { prisma } from '#config/prisma';
import { authMiddleware, adminMiddleware } from '#middlewares/auth.middleware';
import { EStatusGeral } from '#shared/enums';

const router = Router();
router.use(authMiddleware, adminMiddleware);

const BCRYPT_ROUNDS = parseInt(process.env['BCRYPT_ROUNDS'] || '12', 10);

const select = {
  id: true, nome: true, email: true, status: true,
  admin: true, super_admin: true, cod_empresa: true, data_criacao: true, excluido: true,
};

const createSchema = z.object({
  nome: z.string().min(1).max(150),
  email: z.string().email().max(200),
  senha: z.string().min(8).max(255),
  admin: z.preprocess(v => v ?? false, z.boolean()),
  cod_empresa: z.number().int().positive().nullish(),
});

const updateSchema = z.object({
  nome: z.string().min(1).max(150).nullish(),
  email: z.string().email().max(200).nullish(),
  senha: z.string().min(8).max(255).nullish(),
  admin: z.boolean().nullish(),
  status: z.number().int().min(1).max(2).nullish(),
  cod_empresa: z.number().int().positive().nullish(),
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const baseWhere = req.user!.super_admin ? {} : { cod_empresa: req.user!.cod_empresa! };
    const where = { ...baseWhere, excluido: false };
    const usuarios = await prisma.usuario.findMany({ where, select, orderBy: { nome: 'asc' } });
    res.json({ success: true, data: usuarios });
  } catch (err) {
    console.error('[USUARIOS_GET]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao listar usuários.' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const usuario = await prisma.usuario.findFirst({
      where: { id: Number(req.params['id']), excluido: false },
      select,
    });
    if (!usuario || (!req.user!.super_admin && usuario.cod_empresa !== req.user!.cod_empresa)) {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Usuário não encontrado.' }); return;
    }
    res.json({ success: true, data: usuario });
  } catch (err) {
    console.error('[USUARIOS_GET_ID]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao buscar usuário.' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const parse = createSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: parse.error.issues[0].message }); return;
    }
    const { nome, email: rawEmail, senha, admin, cod_empresa: bodyEmpresa } = parse.data;
    const email = rawEmail.toLowerCase().trim();

    const cod_empresa = req.user!.super_admin ? (bodyEmpresa ?? null) : req.user!.cod_empresa;
    const senhaHash = await bcrypt.hash(senha, BCRYPT_ROUNDS);

    const usuario = await prisma.usuario.create({
      data: { nome, email, senha: senhaHash, admin: !!admin, super_admin: false, cod_empresa, status: EStatusGeral.Ativo },
      select,
    });
    res.status(StatusCodes.CREATED).json({ success: true, data: usuario });
  } catch (err) {
    console.error('[USUARIOS_POST]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao criar usuário.' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.usuario.findFirst({ where: { id: Number(req.params['id']), excluido: false } });
    if (!existing || (!req.user!.super_admin && existing.cod_empresa !== req.user!.cod_empresa)) {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Usuário não encontrado.' }); return;
    }

    const parse = updateSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: parse.error.issues[0].message }); return;
    }

    const { nome, email: rawEmail, senha, admin, status, cod_empresa } = parse.data;
    const data: any = {};
    if (nome !== undefined) data.nome = nome;
    if (rawEmail != null) data.email = rawEmail.toLowerCase().trim();
    if (admin !== undefined) data.admin = admin;
    if (status !== undefined) data.status = status;
    if (senha) data.senha = await bcrypt.hash(senha, BCRYPT_ROUNDS);
    if (req.user!.super_admin && cod_empresa !== undefined) data.cod_empresa = cod_empresa;

    const usuario = await prisma.usuario.update({ where: { id: Number(req.params['id']) }, data, select });
    res.json({ success: true, data: usuario });
  } catch (err) {
    console.error('[USUARIOS_PUT]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao atualizar usuário.' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.usuario.findFirst({ where: { id: Number(req.params['id']), excluido: false } });
    if (!existing || (!req.user!.super_admin && existing.cod_empresa !== req.user!.cod_empresa)) {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Usuário não encontrado.' }); return;
    }
    await prisma.usuario.update({ where: { id: Number(req.params['id']) }, data: { excluido: true } });
    res.json({ success: true, message: 'Usuário excluído.' });
  } catch (err) {
    console.error('[USUARIOS_DELETE]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao excluir usuário.' });
  }
});

export default router;
