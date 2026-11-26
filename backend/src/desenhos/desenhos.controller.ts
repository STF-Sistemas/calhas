import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { EmpresaAtual } from '../common/decorators';
import { falha } from '../common/falha';
import { IdPipe } from '../common/validadores';
import { PrismaService } from '../prisma/prisma.service';
import { DesenhoDto } from './desenho.dto';

@Controller('desenhos')
export class DesenhosController {
  constructor(private readonly prisma: PrismaService) {}

  private async obter(id: number, codEmpresa: number) {
    const desenho = await this.prisma.desenho.findFirst({ where: { id, cod_empresa: codEmpresa, excluido: false } });
    if (!desenho) throw falha(HttpStatus.NOT_FOUND, 'Desenho não encontrado.');
    return desenho;
  }

  private dados(dto: DesenhoDto) {
    return {
      descricao: dto.descricao,
      status: dto.status,
      pontos: dto.pontos as Prisma.InputJsonValue | undefined,
      diagonais: dto.diagonais as Prisma.InputJsonValue | undefined,
    };
  }

  @Get()
  async listar(@EmpresaAtual() codEmpresa: number) {
    const data = await this.prisma.desenho.findMany({
      where: { cod_empresa: codEmpresa, excluido: false },
      orderBy: { descricao: 'asc' },
    });
    return { success: true, data };
  }

  @Get(':id')
  async buscar(@Param('id', IdPipe) id: number, @EmpresaAtual() codEmpresa: number) {
    return { success: true, data: await this.obter(id, codEmpresa) };
  }

  @Post()
  async criar(@Body() dto: DesenhoDto, @EmpresaAtual() codEmpresa: number) {
    const data = await this.prisma.desenho.create({ data: { ...this.dados(dto), cod_empresa: codEmpresa } });
    return { success: true, data };
  }

  @Put(':id')
  async atualizar(@Param('id', IdPipe) id: number, @Body() dto: DesenhoDto, @EmpresaAtual() codEmpresa: number) {
    await this.obter(id, codEmpresa);
    const data = await this.prisma.desenho.update({ where: { id }, data: this.dados(dto) });
    return { success: true, data };
  }

  @Delete(':id')
  async excluir(@Param('id', IdPipe) id: number, @EmpresaAtual() codEmpresa: number) {
    await this.obter(id, codEmpresa);
    await this.prisma.desenho.update({ where: { id }, data: { excluido: true } });
    return { success: true, message: 'Desenho excluído.' };
  }
}
