import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import { prisma } from '#config/prisma';
import { authMiddleware } from '#middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);

const BCRYPT_ROUNDS = parseInt(process.env['BCRYPT_ROUNDS'] || '12', 10);

const select = {
  id: true, nome: true, email: true, admin: true,
  super_admin: true, cod_empresa: true, status: true,
};

const perfilSchema = z.object({
  nome:  z.string().min(1).max(150),
  email: z.string().email().max(200),
});

const senhaSchema = z.object({
  senha_atual: z.string().min(1, 'Senha atual é obrigatória.'),
  nova_senha:  z.string().min(8, 'A nova senha deve ter pelo menos 8 caracteres.').max(255),
});

// GET /api/perfil — retorna dados do usuário logado
router.get('/', async (req: Request, res: Response) => {
  try {
    const usuario = await prisma.usuario.findFirst({
      where: { id: req.user!.id, excluido: false },
      select,
    });
    if (!usuario) {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Usuário não encontrado.' }); return;
    }
    res.json({ success: true, data: usuario });
  } catch (err) {
    console.error('[PERFIL_GET]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao buscar perfil.' });
  }
});

// PUT /api/perfil — atualiza nome e email do usuário logado
router.put('/', async (req: Request, res: Response) => {
  try {
    const parse = perfilSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: parse.error.issues[0].message }); return;
    }

    const { nome, email: rawEmail } = parse.data;
    const email = rawEmail.toLowerCase().trim();

    // Verifica se o email já está em uso por outro usuário
    const emailExistente = await prisma.usuario.findFirst({
      where: { email, excluido: false, NOT: { id: req.user!.id } },
    });
    if (emailExistente) {
      res.status(StatusCodes.CONFLICT).json({ success: false, message: 'Este e-mail já está em uso.' }); return;
    }

    const usuario = await prisma.usuario.update({
      where: { id: req.user!.id },
      data: { nome, email },
      select,
    });
    res.json({ success: true, data: usuario });
  } catch (err) {
    console.error('[PERFIL_PUT]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao atualizar perfil.' });
  }
});

// PUT /api/perfil/senha — altera a senha do usuário logado
router.put('/senha', async (req: Request, res: Response) => {
  try {
    const parse = senhaSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: parse.error.issues[0].message }); return;
    }

    const { senha_atual, nova_senha } = parse.data;

    const usuario = await prisma.usuario.findFirst({
      where: { id: req.user!.id, excluido: false },
      select: { id: true, senha: true },
    });
    if (!usuario) {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Usuário não encontrado.' }); return;
    }

    const senhaValida = await bcrypt.compare(senha_atual, usuario.senha);
    if (!senhaValida) {
      res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: 'Senha atual incorreta.' }); return;
    }

    const senhaHash = await bcrypt.hash(nova_senha, BCRYPT_ROUNDS);
    await prisma.usuario.update({ where: { id: req.user!.id }, data: { senha: senhaHash } });

    res.json({ success: true, message: 'Senha alterada com sucesso.' });
  } catch (err) {
    console.error('[PERFIL_SENHA]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao alterar senha.' });
  }
});

export default router;
