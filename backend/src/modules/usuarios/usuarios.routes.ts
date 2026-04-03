import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '#config/prisma';
import { authMiddleware, adminMiddleware } from '#middlewares/auth.middleware';
import { EStatusGeral } from '#shared/enums';

const router = Router();
router.use(authMiddleware, adminMiddleware);

const select = {
  id: true, nome: true, email: true, status: true,
  admin: true, super_admin: true, cod_empresa: true, data_criacao: true, excluido: true,
};

router.get('/', async (req: Request, res: Response) => {
  try {
    const baseWhere = req.user!.super_admin ? {} : { cod_empresa: req.user!.cod_empresa! };
    const where = { ...baseWhere, excluido: false };
    const usuarios = await prisma.usuario.findMany({ where, select, orderBy: { nome: 'asc' } });
    res.json({ success: true, data: usuarios });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao listar usuários.' }); }
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
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao buscar usuário.' }); }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { nome, email, senha, admin } = req.body;
    if (!nome || !email || !senha) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Nome, e-mail e senha são obrigatórios.' }); return;
    }
    const senhaHash = await bcrypt.hash(senha, 10);
    const cod_empresa = req.user!.super_admin ? req.body.cod_empresa ?? null : req.user!.cod_empresa;
    const usuario = await prisma.usuario.create({
      data: { nome, email, senha: senhaHash, admin: !!admin, super_admin: false, cod_empresa, status: EStatusGeral.Ativo },
      select,
    });
    res.status(StatusCodes.CREATED).json({ success: true, data: usuario });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao criar usuário.' }); }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.usuario.findFirst({ where: { id: Number(req.params['id']), excluido: false } });
    if (!existing || (!req.user!.super_admin && existing.cod_empresa !== req.user!.cod_empresa)) {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Usuário não encontrado.' }); return;
    }
    const { nome, email, senha, admin, status, cod_empresa } = req.body;
    const data: any = { nome, email, admin, status };
    if (senha) data.senha = await bcrypt.hash(senha, 10);
    if (req.user!.super_admin && cod_empresa) data.cod_empresa = cod_empresa;
    const usuario = await prisma.usuario.update({ where: { id: Number(req.params['id']) }, data, select });
    res.json({ success: true, data: usuario });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao atualizar usuário.' }); }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.usuario.findFirst({ where: { id: Number(req.params['id']), excluido: false } });
    if (!existing || (!req.user!.super_admin && existing.cod_empresa !== req.user!.cod_empresa)) {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Usuário não encontrado.' }); return;
    }
    await prisma.usuario.update({ where: { id: Number(req.params['id']) }, data: { excluido: true } });
    res.json({ success: true, message: 'Usuário excluído.' });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao excluir usuário.' }); }
});

export default router;
