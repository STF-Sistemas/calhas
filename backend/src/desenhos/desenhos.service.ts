import { HttpStatus, Injectable } from '@nestjs/common';
import { falha } from '../common/falha';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DesenhoDto } from './dto/desenho.dto';

const ponto = (p: { x: number; y: number }) => ({ x: p.x, y: p.y });

function dados(dto: DesenhoDto) {
  return {
    descricao: dto.descricao,
    status: dto.status,
    pontos: dto.pontos ? (dto.pontos.map(ponto) as Prisma.InputJsonValue) : undefined,
    diagonais: dto.diagonais
      ? (dto.diagonais.map((d) => ({ p1: ponto(d.p1), p2: ponto(d.p2) })) as Prisma.InputJsonValue)
      : undefined,
  };
}

@Injectable()
export class DesenhosService {
  constructor(private readonly prisma: PrismaService) {}

  private async obter(id: number, codEmpresa: number) {
    const desenho = await this.prisma.desenho.findFirst({ where: { id, cod_empresa: codEmpresa, excluido: false } });
    if (!desenho) throw falha(HttpStatus.NOT_FOUND, 'Desenho não encontrado.');
    return desenho;
  }

  async listar(codEmpresa: number) {
    const data = await this.prisma.desenho.findMany({
      where: { cod_empresa: codEmpresa, excluido: false },
      orderBy: { descricao: 'asc' },
      take: 2000,
    });
    return { success: true, data };
  }

  async buscar(id: number, codEmpresa: number) {
    return { success: true, data: await this.obter(id, codEmpresa) };
  }

  async criar(dto: DesenhoDto, codEmpresa: number) {
    const data = await this.prisma.desenho.create({ data: { ...dados(dto), cod_empresa: codEmpresa } });
    return { success: true, data };
  }

  async atualizar(id: number, dto: DesenhoDto, codEmpresa: number) {
    await this.obter(id, codEmpresa);
    const data = await this.prisma.desenho.update({ where: { id }, data: dados(dto) });
    return { success: true, data };
  }

  async excluir(id: number, codEmpresa: number) {
    await this.obter(id, codEmpresa);
    await this.prisma.desenho.update({ where: { id }, data: { excluido: true } });
    return { success: true, message: 'Desenho excluído.' };
  }
}
