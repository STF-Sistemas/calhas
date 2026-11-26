import { HttpStatus, Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { EStatusGeral } from '#shared/enums';
import { falha } from '../common/falha';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { EsqueciSenhaDto } from './dto/esqueci-senha.dto';
import { LoginDto } from './dto/login.dto';
import { RedefinirSenhaDto } from './dto/redefinir-senha.dto';

const BCRYPT_ROUNDS = parseInt(process.env['BCRYPT_ROUNDS'] || '12', 10);

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();
    const usuario = await this.prisma.usuario.findFirst({ where: { email, excluido: false } });
    if (!usuario || usuario.status !== EStatusGeral.Ativo || !(await bcrypt.compare(dto.senha, usuario.senha))) {
      throw falha(HttpStatus.UNAUTHORIZED, 'Credenciais inválidas.');
    }

    const token = jwt.sign(
      { id: usuario.id, cod_empresa: usuario.cod_empresa, admin: usuario.admin, super_admin: usuario.super_admin },
      process.env['JWT_SECRET'] as string,
      { expiresIn: (process.env['JWT_EXPIRES_IN'] || '8h') as jwt.SignOptions['expiresIn'] },
    );

    const { senha: _senha, reset_token: _token, reset_token_expiracao: _exp, ...usuarioPublico } = usuario;

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
        data: { reset_token: token, reset_token_expiracao: new Date(Date.now() + 60 * 60 * 1000) },
      });

      const link = `${process.env['FRONTEND_URL'] || 'http://localhost:4204'}/redefinir-senha?token=${token}`;
      await this.mail.enviar(email, 'Recuperação de Senha: Calhas Pro', this.htmlRecuperacao(usuario.nome, link));
    }

    return { success: true, message: 'Se o e-mail estiver cadastrado, você receberá as instruções em breve.' };
  }

  async redefinirSenha(dto: RedefinirSenhaDto) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { reset_token: dto.token, reset_token_expiracao: { gt: new Date() }, excluido: false },
    });
    if (!usuario) throw falha(HttpStatus.BAD_REQUEST, 'Token inválido ou expirado.');

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { senha: await bcrypt.hash(dto.nova_senha, BCRYPT_ROUNDS), reset_token: null, reset_token_expiracao: null },
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
