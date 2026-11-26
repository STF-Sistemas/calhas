import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Put } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { EStatusGeral } from '#shared/enums';
import { Prisma } from '../generated/prisma/client';
import { ApenasAdmin, UsuarioAtual } from '../common/decorators';
import { falha } from '../common/falha';
import { JwtPayload } from '../common/jwt-payload';
import { Booleano, Id, IdPipe, Inteiro, Texto, TextoOpcional } from '../common/validadores';
import { PrismaService } from '../prisma/prisma.service';

const BCRYPT_ROUNDS = parseInt(process.env['BCRYPT_ROUNDS'] || '12', 10);
const campos = {
  id: true, nome: true, email: true, status: true, admin: true,
  super_admin: true, cod_empresa: true, data_criacao: true, excluido: true,
};

class CriarUsuarioDto {
  @Texto(150, 'Nome é obrigatório.')
  nome: string;

  @IsEmail({}, { message: 'E-mail inválido.' })
  @MaxLength(200)
  email: string;

  @IsString()
  @MinLength(8, { message: 'A senha deve ter pelo menos 8 caracteres.' })
  @MaxLength(255)
  senha: string;

  @Booleano()
  admin?: boolean | null;

  @Id(true, 'Empresa inválida.')
  cod_empresa?: number | null;
}

class AtualizarUsuarioDto {
  @TextoOpcional(150)
  nome?: string | null;

  @IsOptional()
  @IsEmail({}, { message: 'E-mail inválido.' })
  @MaxLength(200)
  email?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'A senha deve ter pelo menos 8 caracteres.' })
  @MaxLength(255)
  senha?: string | null;

  @Booleano()
  admin?: boolean | null;

  @Inteiro({ opcional: true, min: 1, max: 2, mensagem: 'Status inválido.' })
  status?: number | null;

  @Id(true, 'Empresa inválida.')
  cod_empresa?: number | null;
}

@ApenasAdmin()
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly prisma: PrismaService) {}

  private async obter(id: number, usuario: JwtPayload) {
    const existente = await this.prisma.usuario.findFirst({ where: { id, excluido: false }, select: campos });
    if (!existente || (!usuario.super_admin && existente.cod_empresa !== usuario.cod_empresa)) {
      throw falha(HttpStatus.NOT_FOUND, 'Usuário não encontrado.');
    }
    return existente;
  }

  private async exigirEmailLivre(email: string, ignorarId?: number): Promise<void> {
    const emUso = await this.prisma.usuario.findFirst({
      where: { email, ...(ignorarId ? { NOT: { id: ignorarId } } : {}) },
      select: { id: true },
    });
    if (emUso) throw falha(HttpStatus.CONFLICT, 'Este e-mail já está em uso.');
  }

  @Get()
  async listar(@UsuarioAtual() usuario: JwtPayload) {
    const data = await this.prisma.usuario.findMany({
      where: { ...(usuario.super_admin ? {} : { cod_empresa: usuario.cod_empresa }), excluido: false },
      select: campos,
      orderBy: { nome: 'asc' },
    });
    return { success: true, data };
  }

  @Get(':id')
  async buscar(@Param('id', IdPipe) id: number, @UsuarioAtual() usuario: JwtPayload) {
    return { success: true, data: await this.obter(id, usuario) };
  }

  @Post()
  async criar(@Body() dto: CriarUsuarioDto, @UsuarioAtual() usuario: JwtPayload) {
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

  @Put(':id')
  async atualizar(@Param('id', IdPipe) id: number, @Body() dto: AtualizarUsuarioDto, @UsuarioAtual() usuario: JwtPayload) {
    await this.obter(id, usuario);
    const data: Prisma.UsuarioUncheckedUpdateInput = {};
    if (dto.nome) data.nome = dto.nome;
    if (dto.email) {
      data.email = dto.email.toLowerCase().trim();
      await this.exigirEmailLivre(data.email, id);
    }
    if (dto.admin != null) data.admin = dto.admin;
    if (dto.status != null) data.status = dto.status;
    if (dto.senha) data.senha = await bcrypt.hash(dto.senha, BCRYPT_ROUNDS);
    if (usuario.super_admin && dto.cod_empresa !== undefined) data.cod_empresa = dto.cod_empresa;

    return { success: true, data: await this.prisma.usuario.update({ where: { id }, data, select: campos }) };
  }

  @Delete(':id')
  async excluir(@Param('id', IdPipe) id: number, @UsuarioAtual() usuario: JwtPayload) {
    await this.obter(id, usuario);
    await this.prisma.usuario.update({ where: { id }, data: { excluido: true } });
    return { success: true, message: 'Usuário excluído.' };
  }
}
