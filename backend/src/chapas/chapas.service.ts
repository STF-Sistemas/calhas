import { HttpStatus, Injectable } from '@nestjs/common';
import { falha } from '../common/falha';
import { PrismaService } from '../prisma/prisma.service';
import { ChapaDto } from './dto/chapa.dto';
import { CorteDto } from './dto/corte.dto';

const comCortes = { cortes: { where: { excluido: false } } };

@Injectable()
export class ChapasService {
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

  async listar(codEmpresa: number) {
    const data = await this.prisma.chapa.findMany({
      where: { cod_empresa: codEmpresa, excluido: false },
      include: comCortes,
      orderBy: { descricao: 'asc' },
      take: 2000,
    });
    return { success: true, data };
  }

  async buscar(id: number, codEmpresa: number) {
    return { success: true, data: await this.obter(id, codEmpresa) };
  }

  async criar(dto: ChapaDto, codEmpresa: number) {
    return { success: true, data: await this.prisma.chapa.create({ data: { ...dto, cod_empresa: codEmpresa } }) };
  }

  async atualizar(id: number, dto: ChapaDto, codEmpresa: number) {
    await this.obter(id, codEmpresa);
    return { success: true, data: await this.prisma.chapa.update({ where: { id }, data: dto }) };
  }

  async alterarStatus(id: number, status: number, codEmpresa: number) {
    await this.obter(id, codEmpresa);
    return { success: true, data: await this.prisma.chapa.update({ where: { id }, data: { status } }) };
  }

  async excluir(id: number, codEmpresa: number) {
    await this.obter(id, codEmpresa);
    await this.prisma.chapa.update({ where: { id }, data: { excluido: true } });
    return { success: true, message: 'Chapa excluída.' };
  }

  async listarCortes(id: number, codEmpresa: number) {
    const chapa = await this.obter(id, codEmpresa);
    const data = await this.prisma.corte.findMany({
      where: { cod_chapa: chapa.id, excluido: false },
      orderBy: { descricao: 'asc' },
      take: 2000,
    });
    return { success: true, data };
  }

  async criarCorte(id: number, dto: CorteDto, codEmpresa: number) {
    const chapa = await this.obter(id, codEmpresa);
    return { success: true, data: await this.prisma.corte.create({ data: { ...dto, cod_chapa: chapa.id } }) };
  }

  async atualizarCorte(id: number, corteId: number, dto: CorteDto, codEmpresa: number) {
    await this.obterCorte(id, corteId, codEmpresa);
    return { success: true, data: await this.prisma.corte.update({ where: { id: corteId }, data: dto }) };
  }

  async excluirCorte(id: number, corteId: number, codEmpresa: number) {
    await this.obterCorte(id, corteId, codEmpresa);
    await this.prisma.corte.update({ where: { id: corteId }, data: { excluido: true } });
    return { success: true, message: 'Corte excluído.' };
  }
}
