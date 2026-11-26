import { HttpStatus, Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { EStatusGeral } from '#shared/enums';
import { BCRYPT_ROUNDS } from '../auth/auth.service';
import { falha } from '../common/falha';
import { JwtPayload } from '../common/jwt-payload';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AtualizarUsuarioDto } from './dto/atualizar-usuario.dto';
import { CriarUsuarioDto } from './dto/criar-usuario.dto';

const campos = {
  id: true, nome: true, email: true, status: true, admin: true,
  super_admin: true, cod_empresa: true, data_criacao: true, excluido: true,
};

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  private async obter(id: number, usuario: JwtPayload) {
    const existente = await this.prisma.usuario.findFirst({ where: { id, excluido: false }, select: campos });
    const visivel =
      existente && (usuario.super_admin || (!existente.super_admin && existente.cod_empresa === usuario.cod_empresa));
    if (!existente || !visivel) throw falha(HttpStatus.NOT_FOUND, 'Usuário não encontrado.');
    return existente;
  }

  private async exigirEmailLivre(email: string, ignorarId?: number): Promise<void> {
    const emUso = await this.prisma.usuario.findFirst({
      where: { email, ...(ignorarId ? { NOT: { id: ignorarId } } : {}) },
      select: { id: true },
    });
    if (emUso) throw falha(HttpStatus.CONFLICT, 'Este e-mail já está em uso.');
  }

  async listar(usuario: JwtPayload) {
    const data = await this.prisma.usuario.findMany({
      where: usuario.super_admin
        ? { excluido: false }
        : { cod_empresa: usuario.cod_empresa, super_admin: false, excluido: false },
      select: campos,
      orderBy: { nome: 'asc' },
      take: 1000,
    });
    return { success: true, data };
  }

  async buscar(id: number, usuario: JwtPayload) {
    return { success: true, data: await this.obter(id, usuario) };
  }

  async criar(dto: CriarUsuarioDto, usuario: JwtPayload) {
    const email = dto.email.toLowerCase().trim();
    await this.exigirEmailLivre(email);
    const data = await this.prisma.usuario.create({
      data: {
        nome: dto.nome,
        email,
        senha: await bcrypt.hash(dto.senha, BCRYPT_ROUNDS),
        admin: !!dto.admin,
        super_admin: false,
        cod_empresa: usuario.super_admin ? (dto.cod_empresa ?? null) : usuario.cod_empresa,
        status: EStatusGeral.Ativo,
      },
      select: campos,
    });
    return { success: true, data };
  }

  async atualizar(id: number, dto: AtualizarUsuarioDto, usuario: JwtPayload) {
    const existente = await this.obter(id, usuario);
    const data: Prisma.UsuarioUncheckedUpdateInput = {};
    let encerrarSessoes = false;
    if (dto.nome) data.nome = dto.nome;
    if (dto.email) {
      data.email = dto.email.toLowerCase().trim();
      await this.exigirEmailLivre(data.email, id);
    }
    if (dto.admin != null && dto.admin !== existente.admin) {
      data.admin = dto.admin;
      encerrarSessoes = true;
    }
    if (dto.status != null && dto.status !== existente.status) {
      data.status = dto.status;
      encerrarSessoes = true;
    }
    if (dto.senha) {
      data.senha = await bcrypt.hash(dto.senha, BCRYPT_ROUNDS);
      encerrarSessoes = true;
    }
    if (usuario.super_admin && dto.cod_empresa !== undefined && dto.cod_empresa !== existente.cod_empresa) {
      data.cod_empresa = dto.cod_empresa;
      encerrarSessoes = true;
    }
    if (encerrarSessoes && id !== usuario.id) data.token_versao = { increment: 1 };

    return { success: true, data: await this.prisma.usuario.update({ where: { id }, data, select: campos }) };
  }

  async excluir(id: number, usuario: JwtPayload) {
    if (id === usuario.id) throw falha(HttpStatus.BAD_REQUEST, 'Você não pode excluir o próprio usuário.');
    await this.obter(id, usuario);
    await this.prisma.usuario.update({ where: { id }, data: { excluido: true, token_versao: { increment: 1 } } });
    return { success: true, message: 'Usuário excluído.' };
  }
}
