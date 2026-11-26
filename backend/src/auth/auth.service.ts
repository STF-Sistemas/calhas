import { HttpStatus, Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { EStatusGeral } from '#shared/enums';
import { falha } from '../common/falha';
import { siteUrl } from '../common/site-url.util';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { EsqueciSenhaDto } from './dto/esqueci-senha.dto';
import { LoginDto } from './dto/login.dto';
import { RedefinirSenhaDto } from './dto/redefinir-senha.dto';

export const BCRYPT_ROUNDS = parseInt(process.env['BCRYPT_ROUNDS'] || '12', 10);
const HASH_FALSO = bcrypt.hashSync('senha-inexistente', 10);
const hashDoToken = (token: string) => createHash('sha256').update(token).digest('hex');

interface IUsuarioToken {
  id: number;
  cod_empresa: number | null;
  admin: boolean;
  super_admin: boolean;
  token_versao: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  gerarToken(usuario: IUsuarioToken): string {
    return jwt.sign(
      {
        id: usuario.id,
        cod_empresa: usuario.cod_empresa,
        admin: usuario.admin,
        super_admin: usuario.super_admin,
        tv: usuario.token_versao,
      },
      process.env['JWT_SECRET'] as string,
      { algorithm: 'HS256', expiresIn: (process.env['JWT_EXPIRES_IN'] || '8h') as jwt.SignOptions['expiresIn'] },
    );
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();
    const usuario = await this.prisma.usuario.findFirst({ where: { email, excluido: false } });
    const senhaConfere = await bcrypt.compare(dto.senha, usuario?.senha ?? HASH_FALSO);
    if (!usuario || usuario.status !== EStatusGeral.Ativo || !senhaConfere) {
      throw falha(HttpStatus.UNAUTHORIZED, 'Credenciais inválidas.');
    }

    const token = this.gerarToken(usuario);

    const {
      senha: _senha,
      reset_token: _token,
      reset_token_expiracao: _exp,
      token_versao: _versao,
      ...usuarioPublico
    } = usuario;

    let empresa_expiracao: string | null = null;
    if (usuario.cod_empresa) {
      const empresa = await this.prisma.empresa.findFirst({
        where: { id: usuario.cod_empresa },
        select: { data_expiracao: true },
      });
      empresa_expiracao = empresa?.data_expiracao?.toISOString() ?? null;
    }

    return { success: true, data: { token, usuario: usuarioPublico, empresa_expiracao } };
  }

  async esqueciSenha(dto: EsqueciSenhaDto) {
    const email = dto.email.toLowerCase().trim();
    const usuario = await this.prisma.usuario.findFirst({ where: { email, excluido: false, status: EStatusGeral.Ativo } });

    if (usuario) {
      const token = randomBytes(32).toString('hex');
      await this.prisma.usuario.update({
        where: { id: usuario.id },
        data: { reset_token: hashDoToken(token), reset_token_expiracao: new Date(Date.now() + 60 * 60 * 1000) },
      });

      const base = process.env['FRONTEND_URL']?.trim().replace(/\/+$/, '') || siteUrl();
      const link = `${base}/redefinir-senha?token=${token}`;
      await this.mail.enviar(email, 'Recuperação de Senha: Calhas Pro', this.htmlRecuperacao(usuario.nome, link));
    }

    return { success: true, message: 'Se o e-mail estiver cadastrado, você receberá as instruções em breve.' };
  }

  async redefinirSenha(dto: RedefinirSenhaDto) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { reset_token: hashDoToken(dto.token), reset_token_expiracao: { gt: new Date() }, excluido: false },
    });
    if (!usuario) throw falha(HttpStatus.BAD_REQUEST, 'Token inválido ou expirado.');

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        senha: await bcrypt.hash(dto.nova_senha, BCRYPT_ROUNDS),
        reset_token: null,
        reset_token_expiracao: null,
        token_versao: { increment: 1 },
      },
    });
    return { success: true, message: 'Senha redefinida com sucesso. Você já pode fazer login.' };
  }

  private htmlRecuperacao(nome: string, link: string): string {
    const nomeSeguro = nome.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);
    return `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #f97316;">Recuperação de Senha</h2>
        <p>Olá, <strong>${nomeSeguro}</strong>!</p>
        <p>Você solicitou a redefinição de senha no <strong>Calhas Pro</strong>.</p>
        <p>Clique no botão abaixo para criar uma nova senha. Este link é válido por <strong>1 hora</strong>.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${link}" style="background-color: #f97316; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            Redefinir Senha
          </a>
        </div>
        <p style="color: #666; font-size: 13px;">Se você não solicitou isso, ignore este e-mail. Sua senha permanece a mesma.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">Calhas Pro, Sistema de Gestão</p>
      </div>`;
  }
}
