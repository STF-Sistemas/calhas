import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { IsEmail, IsOptional, MaxLength, ValidateIf } from 'class-validator';
import { Prisma } from '../generated/prisma/client';
import { EmpresaAtual } from '../common/decorators';
import { falha } from '../common/falha';
import { Id, IdPipe, Inteiro, Texto, TextoOpcional } from '../common/validadores';
import { algumaContem, termoBusca } from '../prisma/busca-sem-acento';
import { PrismaService } from '../prisma/prisma.service';

class ClienteDto {
  @Texto(200, 'Razão social é obrigatória.')
  razao_social: string;

  @TextoOpcional(200) nome_fantasia?: string | null;
  @TextoOpcional(20) cpf_cnpj?: string | null;

  @IsOptional()
  @ValidateIf((_o, v) => v !== '')
  @IsEmail({}, { message: 'E-mail inválido.' })
  @MaxLength(200)
  email?: string | null;

  @TextoOpcional(20) telefone?: string | null;

  @Inteiro({ opcional: true, min: 1, max: 2, mensagem: 'Status inválido.' })
  ativo?: number;

  @TextoOpcional(10) cep?: string | null;
  @TextoOpcional(200) endereco?: string | null;
  @TextoOpcional(10) numero?: string | null;
  @TextoOpcional(100) bairro?: string | null;
  @TextoOpcional(100) complemento?: string | null;

  @Id(true, 'Cidade inválida.')
  cod_cidade?: number | null;

  @TextoOpcional(5000) observacoes?: string | null;
}

interface IBrasilApiCnpj {
  razao_social?: string;
  nome_fantasia?: string;
  email?: string;
  ddd_telefone_1?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  complemento?: string;
  codigo_municipio_ibge?: number | string;
  municipio?: string;
  uf?: string;
}

@Controller('clientes')
export class ClientesController {
  constructor(private readonly prisma: PrismaService) {}

  private async obter(id: number, codEmpresa: number) {
    const cliente = await this.prisma.cliente.findFirst({
      where: { id, cod_empresa: codEmpresa, excluido: false },
      include: { cidade: true },
    });
    if (!cliente) throw falha(HttpStatus.NOT_FOUND, 'Cliente não encontrado.');
    return cliente;
  }

  @Get()
  async listar(@EmpresaAtual() codEmpresa: number, @Query() q: Record<string, string>) {
    const nome = termoBusca(q['nome']);
    const endereco = termoBusca(q['endereco']);
    const cpfCnpj = termoBusca(q['cpfCnpj'], 20);
    const telefone = termoBusca(q['telefone'], 20);
    const where: Prisma.ClienteWhereInput = { cod_empresa: codEmpresa, excluido: false };
    const condicoes: Prisma.ClienteWhereInput[] = [];

    const textos: Prisma.Sql[] = [];
    if (nome) textos.push(algumaContem([Prisma.sql`c.razao_social`, Prisma.sql`c.nome_fantasia`], nome));
    if (endereco) {
      textos.push(algumaContem([Prisma.sql`c.endereco`, Prisma.sql`c.bairro`, Prisma.sql`ci.descricao`], endereco));
    }
    if (textos.length) {
      const linhas = await this.prisma.$queryRaw<{ id: number }[]>`
        SELECT c.id FROM calhas.clientes c
        LEFT JOIN calhas.cidades ci ON ci.id = c.cod_cidade
        WHERE c.cod_empresa = ${codEmpresa} AND c.excluido = false AND ${Prisma.join(textos, ' AND ')}`;
      condicoes.push({ id: { in: linhas.map((l) => l.id) } });
    }
    if (cpfCnpj) condicoes.push({ cpf_cnpj: { contains: cpfCnpj, mode: 'insensitive' } });
    if (telefone) condicoes.push({ telefone: { contains: telefone } });
    if (q['ativo']) condicoes.push({ ativo: Number(q['ativo']) || 0 });
    if (condicoes.length) where.AND = condicoes;

    const pagina = Math.max(1, parseInt(q['pagina'] ?? '1', 10) || 1);
    const limite = Math.min(100, Math.max(1, parseInt(q['limite'] ?? '10', 10) || 10));
    const [total, data] = await Promise.all([
      this.prisma.cliente.count({ where }),
      this.prisma.cliente.findMany({
        where,
        include: { cidade: true },
        orderBy: { razao_social: 'asc' },
        skip: (pagina - 1) * limite,
        take: limite,
      }),
    ]);
    return { success: true, data, total, pagina, totalPaginas: Math.ceil(total / limite) };
  }

  @Get('consultar-receita/:cpfcnpj')
  async consultarReceita(@Param('cpfcnpj') bruto: string) {
    const doc = String(bruto).replace(/\D/g, '');
    if (doc.length === 11) {
      throw falha(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'A consulta de CPF não está disponível em APIs públicas gratuitas. Preencha os dados manualmente.',
      );
    }
    if (doc.length !== 14) throw falha(HttpStatus.BAD_REQUEST, 'Informe um CNPJ completo (14 dígitos).');

    let d: IBrasilApiCnpj;
    try {
      const resposta = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${doc}`, { signal: AbortSignal.timeout(10000) });
      if (!resposta.ok) throw falha(HttpStatus.NOT_FOUND, 'CNPJ não encontrado na Receita Federal.');
      d = (await resposta.json()) as IBrasilApiCnpj;
    } catch (erro) {
      if (erro instanceof Error && 'getStatus' in erro) throw erro;
      throw falha(HttpStatus.INTERNAL_SERVER_ERROR, 'Erro ao consultar Receita Federal.');
    }

    let cidade = null;
    if (d.codigo_municipio_ibge) {
      const ibge = String(d.codigo_municipio_ibge);
      cidade = await this.prisma.cidade.findFirst({ where: { codigo_ibge: ibge } });
      if (!cidade && d.municipio && d.uf) {
        cidade = await this.prisma.cidade.create({ data: { descricao: d.municipio, uf: d.uf, codigo_ibge: ibge } });
      }
    }

    return {
      success: true,
      data: {
        razao_social: d.razao_social ?? '',
        nome_fantasia: d.nome_fantasia ?? '',
        email: d.email ?? '',
        telefone: (d.ddd_telefone_1 ?? '').replace(/\D/g, ''),
        cep: (d.cep ?? '').replace(/\D/g, ''),
        endereco: d.logradouro ?? '',
        numero: d.numero ?? '',
        bairro: d.bairro ?? '',
        complemento: d.complemento ?? '',
        cod_cidade: cidade?.id ?? null,
        cidade_nome: cidade?.descricao ?? d.municipio ?? '',
        uf: d.uf ?? '',
      },
    };
  }

  @Get(':id')
  async buscar(@Param('id', IdPipe) id: number, @EmpresaAtual() codEmpresa: number) {
    return { success: true, data: await this.obter(id, codEmpresa) };
  }

  @Post()
  async criar(@Body() dto: ClienteDto, @EmpresaAtual() codEmpresa: number) {
    const data = await this.prisma.cliente.create({ data: { ...dto, email: dto.email || null, cod_empresa: codEmpresa } });
    return { success: true, data };
  }

  @Put(':id')
  async atualizar(@Param('id', IdPipe) id: number, @Body() dto: ClienteDto, @EmpresaAtual() codEmpresa: number) {
    await this.obter(id, codEmpresa);
    const data = await this.prisma.cliente.update({ where: { id }, data: { ...dto, email: dto.email || null } });
    return { success: true, data };
  }

  @Delete(':id')
  async excluir(@Param('id', IdPipe) id: number, @EmpresaAtual() codEmpresa: number) {
    await this.obter(id, codEmpresa);
    await this.prisma.cliente.update({ where: { id }, data: { excluido: true } });
    return { success: true, message: 'Cliente excluído.' };
  }
}
