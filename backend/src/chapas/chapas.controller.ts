import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post, Put } from '@nestjs/common';
import { EmpresaAtual } from '../common/decorators';
import { falha } from '../common/falha';
import { IdPipe, Numero, Texto } from '../common/validadores';
import { StatusDto } from '../meios-pagamento/meio-pagamento.dto';
import { PrismaService } from '../prisma/prisma.service';

class ChapaDto {
  @Texto(200, 'Descrição é obrigatória.')
  descricao: string;
}

class CorteDto {
  @Texto(200, 'Descrição é obrigatória.')
  descricao: string;

  @Numero({ min: 0, mensagem: 'Corte inválido.' })
  corte: number;

  @Numero({ min: 0, mensagem: 'Valor inválido.' })
  valor: number;
}

const comCortes = { cortes: { where: { excluido: false } } };

@Controller('chapas')
export class ChapasController {
  constructor(private readonly prisma: PrismaService) {}

  private async obter(id: number, codEmpresa: number) {
    const chapa = await this.prisma.chapa.findFirst({
      where: { id, cod_empresa: codEmpresa, excluido: false },
      include: comCortes,
    });
    if (!chapa) throw falha(HttpStatus.NOT_FOUND, 'Chapa não encontrada.');
    return chapa;
  }

  private async obterCorte(id: number, corteId: number, codEmpresa: number) {
    const chapa = await this.obter(id, codEmpresa);
    const corte = await this.prisma.corte.findFirst({ where: { id: corteId, cod_chapa: chapa.id, excluido: false } });
    if (!corte) throw falha(HttpStatus.NOT_FOUND, 'Corte não encontrado.');
    return corte;
  }

  @Get()
  async listar(@EmpresaAtual() codEmpresa: number) {
    const data = await this.prisma.chapa.findMany({
      where: { cod_empresa: codEmpresa, excluido: false },
      include: comCortes,
      orderBy: { descricao: 'asc' },
    });
    return { success: true, data };
  }

  @Get(':id')
  async buscar(@Param('id', IdPipe) id: number, @EmpresaAtual() codEmpresa: number) {
    return { success: true, data: await this.obter(id, codEmpresa) };
  }

  @Post()
  async criar(@Body() dto: ChapaDto, @EmpresaAtual() codEmpresa: number) {
    return { success: true, data: await this.prisma.chapa.create({ data: { ...dto, cod_empresa: codEmpresa } }) };
  }

  @Put(':id')
  async atualizar(@Param('id', IdPipe) id: number, @Body() dto: ChapaDto, @EmpresaAtual() codEmpresa: number) {
    await this.obter(id, codEmpresa);
    return { success: true, data: await this.prisma.chapa.update({ where: { id }, data: dto }) };
  }

  @Patch(':id/status')
  async alterarStatus(@Param('id', IdPipe) id: number, @Body() dto: StatusDto, @EmpresaAtual() codEmpresa: number) {
    await this.obter(id, codEmpresa);
    return { success: true, data: await this.prisma.chapa.update({ where: { id }, data: { status: dto.status } }) };
  }

  @Delete(':id')
  async excluir(@Param('id', IdPipe) id: number, @EmpresaAtual() codEmpresa: number) {
    await this.obter(id, codEmpresa);
    await this.prisma.chapa.update({ where: { id }, data: { excluido: true } });
    return { success: true, message: 'Chapa excluída.' };
  }

  @Get(':id/cortes')
  async listarCortes(@Param('id', IdPipe) id: number, @EmpresaAtual() codEmpresa: number) {
    const chapa = await this.obter(id, codEmpresa);
    const data = await this.prisma.corte.findMany({
      where: { cod_chapa: chapa.id, excluido: false },
      orderBy: { descricao: 'asc' },
    });
    return { success: true, data };
  }

  @Post(':id/cortes')
  async criarCorte(@Param('id', IdPipe) id: number, @Body() dto: CorteDto, @EmpresaAtual() codEmpresa: number) {
    const chapa = await this.obter(id, codEmpresa);
    return { success: true, data: await this.prisma.corte.create({ data: { ...dto, cod_chapa: chapa.id } }) };
  }

  @Put(':id/cortes/:corteId')
  async atualizarCorte(
    @Param('id', IdPipe) id: number,
    @Param('corteId', IdPipe) corteId: number,
    @Body() dto: CorteDto,
    @EmpresaAtual() codEmpresa: number,
  ) {
    await this.obterCorte(id, corteId, codEmpresa);
    return { success: true, data: await this.prisma.corte.update({ where: { id: corteId }, data: dto }) };
  }

  @Delete(':id/cortes/:corteId')
  async excluirCorte(
    @Param('id', IdPipe) id: number,
    @Param('corteId', IdPipe) corteId: number,
    @EmpresaAtual() codEmpresa: number,
  ) {
    await this.obterCorte(id, corteId, codEmpresa);
    await this.prisma.corte.update({ where: { id: corteId }, data: { excluido: true } });
    return { success: true, message: 'Corte excluído.' };
  }
}
