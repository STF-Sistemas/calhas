import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { IsEmail, IsOptional, Length, Matches, MaxLength, ValidateIf } from 'class-validator';
import { Prisma } from '../generated/prisma/client';
import { EmpresaAtual } from '../common/decorators';
import { falha } from '../common/falha';
import { Id, IdPipe, Inteiro, Texto, TextoOpcional } from '../common/validadores';
import { StatusDto } from '../meios-pagamento/meio-pagamento.dto';
import { contemSemAcento, termoBusca } from '../prisma/busca-sem-acento';
import { PrismaService } from '../prisma/prisma.service';

class FornecedorDto {
  @Texto(200, 'Razão social é obrigatória.')
  razao_social: string;

  @TextoOpcional(200) nome_fantasia?: string | null;

  @Length(14, 14, { message: 'CNPJ deve ter 14 dígitos numéricos' })
  @Matches(/^\d{14}$/, { message: 'CNPJ deve ter 14 dígitos numéricos' })
  cnpj: string;

  @TextoOpcional(20) ie?: string | null;
  @TextoOpcional(20) iest?: string | null;
  @TextoOpcional(20) im?: string | null;

  @Inteiro({ opcional: true, min: 1, max: 3, mensagem: 'CRT inválido.' })
  crt?: number;

  @IsOptional()
  @ValidateIf((_o, v) => v !== '')
  @IsEmail({}, { message: 'E-mail inválido.' })
  @MaxLength(200)
  email?: string | null;

  @TextoOpcional(20) fone?: string | null;
  @TextoOpcional(200) nome_vendedor?: string | null;
  @TextoOpcional(20) fone_vendedor?: string | null;
  @TextoOpcional(8) cep?: string | null;
  @TextoOpcional(200) logradouro?: string | null;
  @TextoOpcional(20) numero?: string | null;
  @TextoOpcional(100) complemento?: string | null;
  @TextoOpcional(100) bairro?: string | null;

  @Id(true, 'Cidade inválida.')
  cod_cidade?: number | null;
}

@Controller('fornecedores')
export class FornecedoresController {
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
    });
    if (dup) {
      throw falha(
        HttpStatus.CONFLICT,
        ignorarId ? 'Já existe outro fornecedor com este CNPJ.' : 'Já existe um fornecedor com este CNPJ.',
      );
    }
  }

  @Get()
  async listar(@EmpresaAtual() codEmpresa: number, @Query() q: Record<string, string>) {
    const razao = termoBusca(q['razaoSocial']);
    const fantasia = termoBusca(q['nomeFantasia']);
    const cnpj = termoBusca(q['cnpj'], 20).replace(/\D/g, '');
    const telefone = termoBusca(q['telefone'], 20);
    const where: Prisma.FornecedorWhereInput = { cod_empresa: codEmpresa, excluido: false };
    const condicoes: Prisma.FornecedorWhereInput[] = [];

    const textos: Prisma.Sql[] = [];
    if (razao) textos.push(contemSemAcento(Prisma.sql`razao_social`, razao));
    if (fantasia) textos.push(contemSemAcento(Prisma.sql`nome_fantasia`, fantasia));
    if (textos.length) {
      const linhas = await this.prisma.$queryRaw<{ id: number }[]>`
        SELECT id FROM calhas.fornecedores
        WHERE cod_empresa = ${codEmpresa} AND excluido = false AND ${Prisma.join(textos, ' AND ')}`;
      condicoes.push({ id: { in: linhas.map((l) => l.id) } });
    }
    if (cnpj) condicoes.push({ cnpj: { contains: cnpj } });
    if (telefone) condicoes.push({ fone: { contains: telefone } });
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

  @Get('por-cnpj/:cnpj')
  async porCnpj(@Param('cnpj') bruto: string, @EmpresaAtual() codEmpresa: number) {
    const cnpj = String(bruto).replace(/\D/g, '');
    if (cnpj.length !== 14) throw falha(HttpStatus.BAD_REQUEST, 'CNPJ inválido.');
    const data = await this.prisma.fornecedor.findFirst({
      where: { cnpj, cod_empresa: codEmpresa, excluido: false },
      include: { cidade: true },
    });
    if (!data) throw falha(HttpStatus.NOT_FOUND, 'Fornecedor não encontrado.');
    return { success: true, data };
  }

  @Get(':id')
  async buscar(@Param('id', IdPipe) id: number, @EmpresaAtual() codEmpresa: number) {
    return { success: true, data: await this.obter(id, codEmpresa) };
  }

  @Post()
  async criar(@Body() dto: FornecedorDto, @EmpresaAtual() codEmpresa: number) {
    await this.exigirCnpjLivre(dto.cnpj, codEmpresa);
    const data = await this.prisma.fornecedor.create({
      data: { ...dto, email: dto.email || null, cod_empresa: codEmpresa },
      include: { cidade: true },
    });
    return { success: true, data };
  }

  @Put(':id')
  async atualizar(@Param('id', IdPipe) id: number, @Body() dto: FornecedorDto, @EmpresaAtual() codEmpresa: number) {
    await this.obter(id, codEmpresa);
    await this.exigirCnpjLivre(dto.cnpj, codEmpresa, id);
    const data = await this.prisma.fornecedor.update({
      where: { id },
      data: { ...dto, email: dto.email || null },
      include: { cidade: true },
    });
    return { success: true, data };
  }

  @Patch(':id/status')
  async alterarStatus(@Param('id', IdPipe) id: number, @Body() dto: StatusDto, @EmpresaAtual() codEmpresa: number) {
    await this.obter(id, codEmpresa);
    return { success: true, data: await this.prisma.fornecedor.update({ where: { id }, data: { status: dto.status } }) };
  }

  @Delete(':id')
  async excluir(@Param('id', IdPipe) id: number, @EmpresaAtual() codEmpresa: number) {
    await this.obter(id, codEmpresa);
    await this.prisma.fornecedor.update({ where: { id }, data: { excluido: true } });
    return { success: true, message: 'Fornecedor excluído.' };
  }
}
