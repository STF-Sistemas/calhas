import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post, Put } from '@nestjs/common';
import { EmpresaAtual } from '../common/decorators';
import { falha } from '../common/falha';
import { IdPipe } from '../common/validadores';
import { PrismaService } from '../prisma/prisma.service';
import { MeioPagamentoDto, StatusDto } from './meio-pagamento.dto';

@Controller('meios-pagamento')
export class MeiosPagamentoController {
  constructor(private readonly prisma: PrismaService) {}

  private async obter(id: number, codEmpresa: number) {
    const meio = await this.prisma.meioPagamento.findFirst({ where: { id, cod_empresa: codEmpresa, excluido: false } });
    if (!meio) throw falha(HttpStatus.NOT_FOUND, 'Meio de pagamento não encontrado.');
    return meio;
  }

  @Get()
  async listar(@EmpresaAtual() codEmpresa: number) {
    const data = await this.prisma.meioPagamento.findMany({
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
  async criar(@Body() dto: MeioPagamentoDto, @EmpresaAtual() codEmpresa: number) {
    const data = await this.prisma.meioPagamento.create({ data: { ...dto, cod_empresa: codEmpresa } });
    return { success: true, data };
  }

  @Put(':id')
  async atualizar(@Param('id', IdPipe) id: number, @Body() dto: MeioPagamentoDto, @EmpresaAtual() codEmpresa: number) {
    await this.obter(id, codEmpresa);
    const data = await this.prisma.meioPagamento.update({ where: { id }, data: dto });
    return { success: true, data };
  }

  @Patch(':id/status')
  async alterarStatus(@Param('id', IdPipe) id: number, @Body() dto: StatusDto, @EmpresaAtual() codEmpresa: number) {
    await this.obter(id, codEmpresa);
    const data = await this.prisma.meioPagamento.update({ where: { id }, data: { ativo: dto.status } });
    return { success: true, data };
  }

  @Delete(':id')
  async excluir(@Param('id', IdPipe) id: number, @EmpresaAtual() codEmpresa: number) {
    await this.obter(id, codEmpresa);
    await this.prisma.meioPagamento.update({ where: { id }, data: { excluido: true } });
    return { success: true, message: 'Meio de pagamento excluído.' };
  }
}
