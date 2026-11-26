import { Body, Controller, Get, HttpStatus, Put } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { UsuarioAtual } from '../common/decorators';
import { falha } from '../common/falha';
import { JwtPayload } from '../common/jwt-payload';
import { Texto } from '../common/validadores';
import { PrismaService } from '../prisma/prisma.service';

const BCRYPT_ROUNDS = parseInt(process.env['BCRYPT_ROUNDS'] || '12', 10);
const campos = { id: true, nome: true, email: true, admin: true, super_admin: true, cod_empresa: true, status: true };

class PerfilDto {
  @Texto(150, 'Nome é obrigatório.')
  nome: string;

  @IsEmail({}, { message: 'E-mail inválido.' })
  @MaxLength(200)
  email: string;
}

class SenhaDto {
  @IsString({ message: 'Senha atual é obrigatória.' })
  @IsNotEmpty({ message: 'Senha atual é obrigatória.' })
  @MaxLength(255)
  senha_atual: string;

  @IsString()
  @MinLength(8, { message: 'A nova senha deve ter pelo menos 8 caracteres.' })
  @MaxLength(255)
  nova_senha: string;
}

@Controller('perfil')
export class PerfilController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async buscar(@UsuarioAtual() usuario: JwtPayload) {
    const data = await this.prisma.usuario.findFirst({ where: { id: usuario.id, excluido: false }, select: campos });
    if (!data) throw falha(HttpStatus.NOT_FOUND, 'Usuário não encontrado.');
    return { success: true, data };
  }

  @Put()
  async atualizar(@Body() dto: PerfilDto, @UsuarioAtual() usuario: JwtPayload) {
    const email = dto.email.toLowerCase().trim();
    const emUso = await this.prisma.usuario.findFirst({ where: { email, excluido: false, NOT: { id: usuario.id } } });
    if (emUso) throw falha(HttpStatus.CONFLICT, 'Este e-mail já está em uso.');
    const data = await this.prisma.usuario.update({ where: { id: usuario.id }, data: { nome: dto.nome, email }, select: campos });
    return { success: true, data };
  }

  @Put('senha')
  async alterarSenha(@Body() dto: SenhaDto, @UsuarioAtual() usuario: JwtPayload) {
    const atual = await this.prisma.usuario.findFirst({
      where: { id: usuario.id, excluido: false },
      select: { senha: true },
    });
    if (!atual) throw falha(HttpStatus.NOT_FOUND, 'Usuário não encontrado.');
    if (!(await bcrypt.compare(dto.senha_atual, atual.senha))) {
      throw falha(HttpStatus.UNAUTHORIZED, 'Senha atual incorreta.');
    }
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { senha: await bcrypt.hash(dto.nova_senha, BCRYPT_ROUNDS) },
    });
    return { success: true, message: 'Senha alterada com sucesso.' };
  }
}
