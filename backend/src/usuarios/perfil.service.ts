import { HttpStatus, Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { AuthService, BCRYPT_ROUNDS } from '../auth/auth.service';
import { falha } from '../common/falha';
import { PrismaService } from '../prisma/prisma.service';
import { AlterarSenhaDto } from './dto/alterar-senha.dto';
import { PerfilDto } from './dto/perfil.dto';

const campos = { id: true, nome: true, email: true, admin: true, super_admin: true, cod_empresa: true, status: true };

@Injectable()
export class PerfilService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  async buscar(idUsuario: number) {
    const data = await this.prisma.usuario.findFirst({ where: { id: idUsuario, excluido: false }, select: campos });
    if (!data) throw falha(HttpStatus.NOT_FOUND, 'Usuário não encontrado.');
    return { success: true, data };
  }

  async atualizar(dto: PerfilDto, idUsuario: number) {
    const email = dto.email.toLowerCase().trim();
    const emUso = await this.prisma.usuario.findFirst({ where: { email, NOT: { id: idUsuario } }, select: { id: true } });
    if (emUso) throw falha(HttpStatus.CONFLICT, 'Este e-mail já está em uso.');
    const data = await this.prisma.usuario.update({ where: { id: idUsuario }, data: { nome: dto.nome, email }, select: campos });
    return { success: true, data };
  }

  async alterarSenha(dto: AlterarSenhaDto, idUsuario: number) {
    const atual = await this.prisma.usuario.findFirst({
      where: { id: idUsuario, excluido: false },
      select: { senha: true },
    });
    if (!atual) throw falha(HttpStatus.NOT_FOUND, 'Usuário não encontrado.');
    if (!(await bcrypt.compare(dto.senha_atual, atual.senha))) {
      throw falha(HttpStatus.BAD_REQUEST, 'Senha atual incorreta.');
    }
    const usuario = await this.prisma.usuario.update({
      where: { id: idUsuario },
      data: { senha: await bcrypt.hash(dto.nova_senha, BCRYPT_ROUNDS), token_versao: { increment: 1 } },
      select: { id: true, cod_empresa: true, admin: true, super_admin: true, token_versao: true },
    });
    return { success: true, message: 'Senha alterada com sucesso.', data: { token: this.auth.gerarToken(usuario) } };
  }
}
