import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '#config/prisma';
import { EStatusGeral } from '#shared/enums';
import { ILoginDto } from '#shared/interfaces';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, senha }: ILoginDto = req.body;

    if (!email || !senha) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'E-mail e senha são obrigatórios.' });
      return;
    }

    const usuario = await prisma.usuario.findFirst({ where: { email, excluido: false } });

    if (!usuario || usuario.status !== EStatusGeral.Ativo) {
      res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: 'Credenciais inválidas.' });
      return;
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: 'Credenciais inválidas.' });
      return;
    }

    const secret = process.env['JWT_SECRET'] as string;
    const expiresIn = (process.env['JWT_EXPIRES_IN'] || '8h') as string;

    const token = jwt.sign(
      {
        id: usuario.id,
        cod_empresa: usuario.cod_empresa,
        admin: usuario.admin,
        super_admin: usuario.super_admin,
      },
      secret,
      { expiresIn } as jwt.SignOptions
    );

    const { senha: _, ...usuarioSemSenha } = usuario;

    res.json({
      success: true,
      data: { token, usuario: usuarioSemSenha },
    });
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro interno.' });
  }
});

export default router;
