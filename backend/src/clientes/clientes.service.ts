import { HttpStatus, Injectable } from '@nestjs/common';
import { falha } from '../common/falha';
import { Prisma } from '../generated/prisma/client';
import { algumaContem, termoBusca } from '../prisma/busca-sem-acento';
import { PrismaService } from '../prisma/prisma.service';
import { ClienteDto } from './dto/cliente.dto';

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

const texto = (valor: unknown, max: number) => (typeof valor === 'string' ? valor.slice(0, max) : '');

@Injectable()
export class ClientesService {
  constructor(private readonly prisma: PrismaService) {}

  private async obter(id: number, codEmpresa: number) {
    const cliente = await this.prisma.cliente.findFirst({
      where: { id, cod_empresa: codEmpresa, excluido: false },
      include: { cidade: true },
    });
    if (!cliente) throw falha(HttpStatus.NOT_FOUND, 'Cliente não encontrado.');
    return cliente;
  }

  async listar(codEmpresa: number, q: Record<string, string>) {
    const nome = termoBusca(q['nome']);
    const endereco = termoBusca(q['endereco']);
    const cpfCnpj = termoBusca(q['cpfCnpj'], 20);
    const telefone = termoBusca(q['telefone'], 20).replace(/\D/g, '');
    const where: Prisma.ClienteWhereInput = { cod_empresa: codEmpresa, excluido: false };
    const condicoes: Prisma.ClienteWhereInput[] = [];

    const textos: Prisma.Sql[] = [];
    if (nome) textos.push(algumaContem([Prisma.sql`c.razao_social`, Prisma.sql`c.nome_fantasia`], nome));
    if (endereco) {
      textos.push(algumaContem([Prisma.sql`c.endereco`, Prisma.sql`c.bairro`, Prisma.sql`ci.descricao`], endereco));
    }
    if (telefone) textos.push(Prisma.sql`regexp_replace(coalesce(c.telefone, ''), '[^0-9]', '', 'g') LIKE ${`%${telefone}%`}`);
    if (textos.length) {
      const linhas = await this.prisma.$queryRaw<{ id: number }[]>`
        SELECT c.id FROM calhas.clientes c
        LEFT JOIN calhas.cidades ci ON ci.id = c.cod_cidade
        WHERE c.cod_empresa = ${codEmpresa} AND c.excluido = false AND ${Prisma.join(textos, ' AND ')}
        ORDER BY c.razao_social LIMIT 1000`;
      condicoes.push({ id: { in: linhas.map((l) => l.id) } });
    }
    if (cpfCnpj) condicoes.push({ cpf_cnpj: { contains: cpfCnpj, mode: 'insensitive' } });
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

  async consultarReceita(bruto: string) {
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
    const ibge = String(d.codigo_municipio_ibge ?? '');
    if (/^\d{7}$/.test(ibge)) {
      cidade = await this.prisma.cidade.findFirst({ where: { codigo_ibge: ibge } });
      const municipio = texto(d.municipio, 100).trim();
      const uf = texto(d.uf, 2).toUpperCase();
      if (!cidade && municipio && /^[A-Z]{2}$/.test(uf)) {
        cidade = await this.prisma.cidade.create({ data: { descricao: municipio, uf, codigo_ibge: ibge } });
      }
    }

    return {
      success: true,
      data: {
        razao_social: texto(d.razao_social, 200),
        nome_fantasia: texto(d.nome_fantasia, 200),
        email: texto(d.email, 200),
        telefone: texto(d.ddd_telefone_1, 30).replace(/\D/g, ''),
        cep: texto(d.cep, 20).replace(/\D/g, ''),
        endereco: texto(d.logradouro, 200),
        numero: texto(d.numero, 10),
        bairro: texto(d.bairro, 100),
        complemento: texto(d.complemento, 100),
        cod_cidade: cidade?.id ?? null,
        cidade_nome: cidade?.descricao ?? texto(d.municipio, 100),
        uf: texto(d.uf, 2),
      },
    };
  }

  async buscar(id: number, codEmpresa: number) {
    return { success: true, data: await this.obter(id, codEmpresa) };
  }

  async criar(dto: ClienteDto, codEmpresa: number) {
    const data = await this.prisma.cliente.create({ data: { ...dto, email: dto.email || null, cod_empresa: codEmpresa } });
    return { success: true, data };
  }

  async atualizar(id: number, dto: ClienteDto, codEmpresa: number) {
    await this.obter(id, codEmpresa);
    const data = await this.prisma.cliente.update({ where: { id }, data: { ...dto, email: dto.email || null } });
    return { success: true, data };
  }

  async excluir(id: number, codEmpresa: number) {
    await this.obter(id, codEmpresa);
    await this.prisma.cliente.update({ where: { id }, data: { excluido: true } });
    return { success: true, message: 'Cliente excluído.' };
  }
}
