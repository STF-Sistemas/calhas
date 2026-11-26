import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { ApenasAdmin, ApenasSuperAdmin, UsuarioAtual } from '../common/decorators';
import { falha } from '../common/falha';
import { JwtPayload } from '../common/jwt-payload';
import { IdPipe } from '../common/validadores';
import { PrismaService } from '../prisma/prisma.service';
import { EmpresaDto, ValidadeDto } from './empresa.dto';

function dadosEmpresa(dto: EmpresaDto, superAdmin: boolean) {
  const { data_expiracao, valor_mensalidade, ativo, ...resto } = dto;
  if (!superAdmin) return resto;
  return {
    ...resto,
    ...(data_expiracao !== undefined && { data_expiracao: data_expiracao ? new Date(data_expiracao) : null }),
    ...(valor_mensalidade !== undefined && { valor_mensalidade }),
    ...(ativo !== undefined && { ativo }),
  };
}

@Controller('empresas')
export class EmpresasController {
  constructor(private readonly prisma: PrismaService) {}

  private async obter(id: number) {
    const empresa = await this.prisma.empresa.findFirst({ where: { id, excluido: false }, include: { cidade: true } });
    if (!empresa) throw falha(HttpStatus.NOT_FOUND, 'Empresa não encontrada.');
    return empresa;
  }

  private exigirPropria(id: number, usuario: JwtPayload): void {
    if (!usuario.super_admin && usuario.cod_empresa !== id) throw falha(HttpStatus.FORBIDDEN, 'Acesso negado.');
  }

  @ApenasSuperAdmin()
  @Get()
  async listar() {
    const data = await this.prisma.empresa.findMany({
      where: { excluido: false },
      include: { cidade: true },
      orderBy: { razao_social: 'asc' },
    });
    return { success: true, data };
  }

  @ApenasAdmin()
  @Get(':id')
  async buscar(@Param('id', IdPipe) id: number, @UsuarioAtual() usuario: JwtPayload) {
    this.exigirPropria(id, usuario);
    return { success: true, data: await this.obter(id) };
  }

  @ApenasSuperAdmin()
  @Post()
  async criar(@Body() dto: EmpresaDto) {
    return { success: true, data: await this.prisma.empresa.create({ data: dadosEmpresa(dto, true) }) };
  }

  @ApenasAdmin()
  @Put(':id')
  async atualizar(@Param('id', IdPipe) id: number, @Body() dto: EmpresaDto, @UsuarioAtual() usuario: JwtPayload) {
    this.exigirPropria(id, usuario);
    await this.obter(id);
    const data = await this.prisma.empresa.update({ where: { id }, data: dadosEmpresa(dto, usuario.super_admin) });
    return { success: true, data };
  }

  @ApenasSuperAdmin()
  @Put(':id/validade')
  async atualizarValidade(@Param('id', IdPipe) id: number, @Body() dto: ValidadeDto) {
    await this.obter(id);
    const data = await this.prisma.empresa.update({
      where: { id },
      data: {
        data_expiracao: dto.data_expiracao ? new Date(dto.data_expiracao) : null,
        ...(dto.valor_mensalidade !== undefined && { valor_mensalidade: dto.valor_mensalidade }),
      },
    });
    return { success: true, data };
  }

  @ApenasSuperAdmin()
  @Delete(':id')
  async excluir(@Param('id', IdPipe) id: number) {
    await this.obter(id);
    await this.prisma.empresa.update({ where: { id }, data: { excluido: true } });
    return { success: true, message: 'Empresa excluída.' };
  }
}
