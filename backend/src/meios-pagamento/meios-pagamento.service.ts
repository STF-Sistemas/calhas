import { HttpStatus, Injectable } from '@nestjs/common';
import { falha } from '../common/falha';
import { PrismaService } from '../prisma/prisma.service';
import { MeioPagamentoDto } from './dto/meio-pagamento.dto';

@Injectable()
export class MeiosPagamentoService {
  constructor(private readonly prisma: PrismaService) {}

  private async obter(id: number, codEmpresa: number) {
    const meio = await this.prisma.meioPagamento.findFirst({ where: { id, cod_empresa: codEmpresa, excluido: false } });
    if (!meio) throw falha(HttpStatus.NOT_FOUND, 'Meio de pagamento não encontrado.');
    return meio;
  }

  async listar(codEmpresa: number) {
    const data = await this.prisma.meioPagamento.findMany({
      where: { cod_empresa: codEmpresa, excluido: false },
      orderBy: { descricao: 'asc' },
      take: 500,
    });
    return { success: true, data };
  }

  async buscar(id: number, codEmpresa: number) {
    return { success: true, data: await this.obter(id, codEmpresa) };
  }

  async criar(dto: MeioPagamentoDto, codEmpresa: number) {
    const data = await this.prisma.meioPagamento.create({ data: { ...dto, cod_empresa: codEmpresa } });
    return { success: true, data };
  }

  async atualizar(id: number, dto: MeioPagamentoDto, codEmpresa: number) {
    await this.obter(id, codEmpresa);
    const data = await this.prisma.meioPagamento.update({ where: { id }, data: dto });
    return { success: true, data };
  }

  async alterarStatus(id: number, status: number, codEmpresa: number) {
    await this.obter(id, codEmpresa);
    const data = await this.prisma.meioPagamento.update({ where: { id }, data: { ativo: status } });
    return { success: true, data };
  }

  async excluir(id: number, codEmpresa: number) {
    await this.obter(id, codEmpresa);
    await this.prisma.meioPagamento.update({ where: { id }, data: { excluido: true } });
    return { success: true, message: 'Meio de pagamento excluído.' };
  }
}
