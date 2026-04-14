import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import rateLimit from 'express-rate-limit';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import { prisma } from '#config/prisma';
import { EStatusGeral } from '#shared/enums';

const router = Router();

// ── Rate limit agressivo no login (prevenção de força bruta) ──────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
});

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Muitas solicitações. Tente novamente em 15 minutos.' },
});

const BCRYPT_ROUNDS = parseInt(process.env['BCRYPT_ROUNDS'] || '12', 10);

const loginSchema = z.object({
  email: z.string().email('E-mail inválido.').max(200),
  senha: z.string().min(1, 'Senha é obrigatória.').max(255),
});

const esqueciSchema = z.object({
  email: z.string().email('E-mail inválido.').max(200),
});

const redefinirSchema = z.object({
  token:     z.string().min(1, 'Token inválido.'),
  nova_senha: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.').max(255),
});

// ── Cria transporter Nodemailer com base nas variáveis de ambiente ─────────────
function criarTransporter() {
  return nodemailer.createTransport({
    host:   process.env['SMTP_HOST'] || 'smtp.gmail.com',
    port:   parseInt(process.env['SMTP_PORT'] || '587', 10),
    secure: process.env['SMTP_SECURE'] === 'true',
    auth: {
      user: process.env['SMTP_USER'] || '',
      pass: process.env['SMTP_PASS'] || '',
    },
  });
}

router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  try {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: parse.error.issues[0].message });
      return;
    }

    const email = parse.data.email.toLowerCase().trim();
    const { senha } = parse.data;

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

    let empresa_expiracao: string | null = null;
    if (usuario.cod_empresa) {
      const empresa = await prisma.empresa.findFirst({
        where: { id: usuario.cod_empresa },
        select: { data_expiracao: true },
      });
      empresa_expiracao = empresa?.data_expiracao?.toISOString() ?? null;
    }

    res.json({
      success: true,
      data: { token, usuario: usuarioSemSenha, empresa_expiracao },
    });
  } catch (err) {
    console.error('[AUTH_LOGIN]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro interno.' });
  }
});

// ── POST /api/auth/esqueci-senha ───────────────────────────────────────────────
router.post('/esqueci-senha', resetLimiter, async (req: Request, res: Response) => {
  try {
    const parse = esqueciSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: parse.error.issues[0].message }); return;
    }

    const email = parse.data.email.toLowerCase().trim();

    // Resposta sempre genérica para não revelar se o email existe
    const usuario = await prisma.usuario.findFirst({ where: { email, excluido: false, status: EStatusGeral.Ativo } });

    if (usuario) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiracao = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { reset_token: token, reset_token_expiracao: expiracao },
      });

      const frontendUrl = process.env['FRONTEND_URL'] || 'http://localhost:4204';
      const link = `${frontendUrl}/redefinir-senha?token=${token}`;

      try {
        const transporter = criarTransporter();
        await transporter.sendMail({
          from: `"Calhas Pro" <${process.env['SMTP_USER'] || 'noreply@calhaspro.com.br'}>`,
          to: email,
          subject: 'Recuperação de Senha — Calhas Pro',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
              <h2 style="color: #f97316;">Recuperação de Senha</h2>
              <p>Olá, <strong>${usuario.nome}</strong>!</p>
              <p>Você solicitou a redefinição de senha no <strong>Calhas Pro</strong>.</p>
              <p>Clique no botão abaixo para criar uma nova senha. Este link é válido por <strong>1 hora</strong>.</p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${link}" style="background-color: #f97316; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  Redefinir Senha
                </a>
              </div>
              <p style="color: #666; font-size: 13px;">Se você não solicitou isso, ignore este e-mail. Sua senha permanece a mesma.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
              <p style="color: #999; font-size: 12px;">Calhas Pro — Sistema de Gestão</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error('[AUTH_ESQUECI_SENHA] Falha ao enviar e-mail:', emailErr);
        // Não expõe erro de email ao cliente
      }
    }

    res.json({ success: true, message: 'Se o e-mail estiver cadastrado, você receberá as instruções em breve.' });
  } catch (err) {
    console.error('[AUTH_ESQUECI_SENHA]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro interno.' });
  }
});

// ── POST /api/auth/redefinir-senha ────────────────────────────────────────────
router.post('/redefinir-senha', resetLimiter, async (req: Request, res: Response) => {
  try {
    const parse = redefinirSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: parse.error.issues[0].message }); return;
    }

    const { token, nova_senha } = parse.data;

    const usuario = await prisma.usuario.findFirst({
      where: {
        reset_token: token,
        reset_token_expiracao: { gt: new Date() },
        excluido: false,
      },
    });

    if (!usuario) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Token inválido ou expirado.' }); return;
    }

    const senhaHash = await bcrypt.hash(nova_senha, BCRYPT_ROUNDS);
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { senha: senhaHash, reset_token: null, reset_token_expiracao: null },
    });

    res.json({ success: true, message: 'Senha redefinida com sucesso. Você já pode fazer login.' });
  } catch (err) {
    console.error('[AUTH_REDEFINIR_SENHA]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro interno.' });
  }
});

export default router;
