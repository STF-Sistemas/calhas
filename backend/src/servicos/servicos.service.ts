import { HttpStatus, Injectable } from '@nestjs/common';
import { falha } from '../common/falha';
import { PrismaService } from '../prisma/prisma.service';
import { ServicoDto } from './dto/servico.dto';

@Injectable()
export class ServicosService {
  constructor(private readonly prisma: PrismaService) {}

  private async obter(id: number, codEmpresa: number) {
    const servico = await this.prisma.servico.findFirst({ where: { id, cod_empresa: codEmpresa, excluido: false } });
    if (!servico) throw falha(HttpStatus.NOT_FOUND, 'Serviço não encontrado.');
    return servico;
  }

  async listar(codEmpresa: number) {
    const data = await this.prisma.servico.findMany({
      where: { cod_empresa: codEmpresa, excluido: false },
      orderBy: { descricao: 'asc' },
      take: 2000,
    });
    return { success: true, data };
  }

  async buscar(id: number, codEmpresa: number) {
    return { success: true, data: await this.obter(id, codEmpresa) };
  }

  async criar(dto: ServicoDto, codEmpresa: number) {
    const data = await this.prisma.servico.create({ data: { ...dto, cod_empresa: codEmpresa } });
    return { success: true, data };
  }

  async atualizar(id: number, dto: ServicoDto, codEmpresa: number) {
    await this.obter(id, codEmpresa);
    return { success: true, data: await this.prisma.servico.update({ where: { id }, data: dto }) };
  }

  async alterarStatus(id: number, status: number, codEmpresa: number) {
    await this.obter(id, codEmpresa);
    return { success: true, data: await this.prisma.servico.update({ where: { id }, data: { status } }) };
  }

  async excluir(id: number, codEmpresa: number) {
    await this.obter(id, codEmpresa);
    await this.prisma.servico.update({ where: { id }, data: { excluido: true } });
    return { success: true, message: 'Serviço excluído.' };
  }
}
