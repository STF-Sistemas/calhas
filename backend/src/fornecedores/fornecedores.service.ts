import { HttpStatus, Injectable } from '@nestjs/common';
import { falha } from '../common/falha';
import { Prisma } from '../generated/prisma/client';
import { contemSemAcento, termoBusca } from '../prisma/busca-sem-acento';
import { PrismaService } from '../prisma/prisma.service';
import { FornecedorDto } from './dto/fornecedor.dto';

@Injectable()
export class FornecedoresService {
  constructor(private readonly prisma: PrismaService) {}

  private async obter(id: number, codEmpresa: number) {
    const fornecedor = await this.prisma.fornecedor.findFirst({
      where: { id, cod_empresa: codEmpresa, excluido: false },
      include: { cidade: true },
    });
    if (!fornecedor) throw falha(HttpStatus.NOT_FOUND, 'Fornecedor não encontrado.');
    return fornecedor;
  }

  private async exigirCnpjLivre(cnpj: string, codEmpresa: number, ignorarId?: number): Promise<void> {
    const dup = await this.prisma.fornecedor.findFirst({
      where: { cnpj, cod_empresa: codEmpresa, excluido: false, ...(ignorarId ? { NOT: { id: ignorarId } } : {}) },
      select: { id: true },
    });
    if (dup) {
      throw falha(
        HttpStatus.CONFLICT,
        ignorarId ? 'Já existe outro fornecedor com este CNPJ.' : 'Já existe um fornecedor com este CNPJ.',
      );
    }
  }

  async listar(codEmpresa: number, q: Record<string, string>) {
    const razao = termoBusca(q['razaoSocial']);
    const fantasia = termoBusca(q['nomeFantasia']);
    const cnpj = termoBusca(q['cnpj'], 20).replace(/\D/g, '');
    const telefone = termoBusca(q['telefone'], 20).replace(/\D/g, '');
    const where: Prisma.FornecedorWhereInput = { cod_empresa: codEmpresa, excluido: false };
    const condicoes: Prisma.FornecedorWhereInput[] = [];

    const textos: Prisma.Sql[] = [];
    if (razao) textos.push(contemSemAcento(Prisma.sql`razao_social`, razao));
    if (fantasia) textos.push(contemSemAcento(Prisma.sql`nome_fantasia`, fantasia));
    if (telefone) textos.push(Prisma.sql`regexp_replace(coalesce(fone, ''), '[^0-9]', '', 'g') LIKE ${`%${telefone}%`}`);
    if (textos.length) {
      const linhas = await this.prisma.$queryRaw<{ id: number }[]>`
        SELECT id FROM calhas.fornecedores
        WHERE cod_empresa = ${codEmpresa} AND excluido = false AND ${Prisma.join(textos, ' AND ')}
        ORDER BY razao_social LIMIT 1000`;
      condicoes.push({ id: { in: linhas.map((l) => l.id) } });
    }
    if (cnpj) condicoes.push({ cnpj: { contains: cnpj } });
    if (q['status']) condicoes.push({ status: Number(q['status']) || 0 });
    if (condicoes.length) where.AND = condicoes;

    const pagina = Math.max(1, parseInt(q['pagina'] ?? '1', 10) || 1);
    const limite = Math.min(100, Math.max(1, parseInt(q['limite'] ?? '10', 10) || 10));
    const [total, data] = await Promise.all([
      this.prisma.fornecedor.count({ where }),
      this.prisma.fornecedor.findMany({
        where,
        include: { cidade: true },
        orderBy: { razao_social: 'asc' },
        skip: (pagina - 1) * limite,
        take: limite,
      }),
    ]);
    return { success: true, data, total, pagina, totalPaginas: Math.ceil(total / limite) };
  }

  async porCnpj(bruto: string, codEmpresa: number) {
    const cnpj = String(bruto).replace(/\D/g, '');
    if (cnpj.length !== 14) throw falha(HttpStatus.BAD_REQUEST, 'CNPJ inválido.');
    const data = await this.prisma.fornecedor.findFirst({
      where: { cnpj, cod_empresa: codEmpresa, excluido: false },
      include: { cidade: true },
    });
    if (!data) throw falha(HttpStatus.NOT_FOUND, 'Fornecedor não encontrado.');
    return { success: true, data };
  }

  async buscar(id: number, codEmpresa: number) {
    return { success: true, data: await this.obter(id, codEmpresa) };
  }

  async criar(dto: FornecedorDto, codEmpresa: number) {
    await this.exigirCnpjLivre(dto.cnpj, codEmpresa);
    const data = await this.prisma.fornecedor.create({
      data: { ...dto, email: dto.email || null, cod_empresa: codEmpresa },
      include: { cidade: true },
    });
    return { success: true, data };
  }

  async atualizar(id: number, dto: FornecedorDto, codEmpresa: number) {
    await this.obter(id, codEmpresa);
    await this.exigirCnpjLivre(dto.cnpj, codEmpresa, id);
    const data = await this.prisma.fornecedor.update({
      where: { id },
      data: { ...dto, email: dto.email || null },
      include: { cidade: true },
    });
    return { success: true, data };
  }

  async alterarStatus(id: number, status: number, codEmpresa: number) {
    await this.obter(id, codEmpresa);
    return { success: true, data: await this.prisma.fornecedor.update({ where: { id }, data: { status } }) };
  }

  async excluir(id: number, codEmpresa: number) {
    await this.obter(id, codEmpresa);
    await this.prisma.fornecedor.update({ where: { id }, data: { excluido: true } });
    return { success: true, message: 'Fornecedor excluído.' };
  }
}
