import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post, Put } from '@nestjs/common';
import { EmpresaAtual } from '../common/decorators';
import { falha } from '../common/falha';
import { IdPipe, Numero, Texto } from '../common/validadores';
import { StatusDto } from '../meios-pagamento/meio-pagamento.dto';
import { PrismaService } from '../prisma/prisma.service';

class ServicoDto {
  @Texto(200, 'Descrição é obrigatória.')
  descricao: string;

  @Numero({ min: 0, mensagem: 'Valor inválido.' })
  valor: number;
}

@Controller('servicos')
export class ServicosController {
  constructor(private readonly prisma: PrismaService) {}

  private async obter(id: number, codEmpresa: number) {
    const servico = await this.prisma.servico.findFirst({ where: { id, cod_empresa: codEmpresa, excluido: false } });
    if (!servico) throw falha(HttpStatus.NOT_FOUND, 'Serviço não encontrado.');
    return servico;
  }

  @Get()
  async listar(@EmpresaAtual() codEmpresa: number) {
    const data = await this.prisma.servico.findMany({
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
  async criar(@Body() dto: ServicoDto, @EmpresaAtual() codEmpresa: number) {
    const data = await this.prisma.servico.create({ data: { ...dto, cod_empresa: codEmpresa } });
    return { success: true, data };
  }

  @Put(':id')
  async atualizar(@Param('id', IdPipe) id: number, @Body() dto: ServicoDto, @EmpresaAtual() codEmpresa: number) {
    await this.obter(id, codEmpresa);
    return { success: true, data: await this.prisma.servico.update({ where: { id }, data: dto }) };
  }

  @Patch(':id/status')
  async alterarStatus(@Param('id', IdPipe) id: number, @Body() dto: StatusDto, @EmpresaAtual() codEmpresa: number) {
    await this.obter(id, codEmpresa);
    return { success: true, data: await this.prisma.servico.update({ where: { id }, data: { status: dto.status } }) };
  }

  @Delete(':id')
  async excluir(@Param('id', IdPipe) id: number, @EmpresaAtual() codEmpresa: number) {
    await this.obter(id, codEmpresa);
    await this.prisma.servico.update({ where: { id }, data: { excluido: true } });
    return { success: true, message: 'Serviço excluído.' };
  }
}
