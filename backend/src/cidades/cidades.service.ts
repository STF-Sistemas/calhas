import { HttpStatus, Injectable } from '@nestjs/common';
import { falha } from '../common/falha';
import { Prisma } from '../generated/prisma/client';
import { contemSemAcento, termoBusca } from '../prisma/busca-sem-acento';
import { PrismaService } from '../prisma/prisma.service';

interface IViaCep {
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  ibge?: string;
  erro?: boolean | string;
}

const texto = (valor: unknown, max: number) => (typeof valor === 'string' ? valor.slice(0, max) : '');

@Injectable()
export class CidadesService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(q?: string) {
    const termo = termoBusca(q);
    if (!termo) {
      const data = await this.prisma.cidade.findMany({ orderBy: { descricao: 'asc' }, take: 200 });
      return { success: true, data };
    }
    const linhas = await this.prisma.$queryRaw<{ id: number }[]>`
      SELECT id FROM calhas.cidades
      WHERE ${contemSemAcento(Prisma.sql`descricao`, termo)}
      ORDER BY descricao LIMIT 200`;
    const data = await this.prisma.cidade.findMany({
      where: { id: { in: linhas.map((l) => l.id) } },
      orderBy: { descricao: 'asc' },
    });
    return { success: true, data };
  }

  async consultarCep(cepBruto: string) {
    const cep = String(cepBruto).replace(/\D/g, '');
    if (cep.length !== 8) throw falha(HttpStatus.BAD_REQUEST, 'CEP inválido.');

    let dados: IViaCep;
    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: AbortSignal.timeout(8000) });
      dados = (await resposta.json()) as IViaCep;
    } catch {
      throw falha(HttpStatus.INTERNAL_SERVER_ERROR, 'Erro ao consultar CEP.');
    }
    if (dados.erro) throw falha(HttpStatus.NOT_FOUND, 'CEP não encontrado.');

    const ibge = texto(dados.ibge, 7);
    const localidade = texto(dados.localidade, 100).trim();
    const uf = texto(dados.uf, 2).toUpperCase();
    if (!/^\d{7}$/.test(ibge) || !localidade || !/^[A-Z]{2}$/.test(uf)) {
      throw falha(HttpStatus.BAD_GATEWAY, 'Resposta inválida do serviço de CEP.');
    }

    const cidade =
      (await this.prisma.cidade.findFirst({ where: { codigo_ibge: ibge } })) ??
      (await this.prisma.cidade.create({ data: { descricao: localidade, uf, codigo_ibge: ibge } }));

    return {
      success: true,
      data: {
        cep,
        logradouro: texto(dados.logradouro, 200),
        complemento: texto(dados.complemento, 100),
        bairro: texto(dados.bairro, 100),
        localidade,
        uf,
        cidade,
      },
    };
  }
}
