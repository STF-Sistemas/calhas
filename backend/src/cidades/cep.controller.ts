import { Controller, Get, HttpStatus, Param } from '@nestjs/common';
import { falha } from '../common/falha';
import { PrismaService } from '../prisma/prisma.service';

interface IViaCep {
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade: string;
  uf: string;
  ibge: string;
  erro?: boolean | string;
}

@Controller('cep')
export class CepController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':cep')
  async consultar(@Param('cep') cepBruto: string) {
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

    const cidade =
      (await this.prisma.cidade.findFirst({ where: { codigo_ibge: dados.ibge } })) ??
      (await this.prisma.cidade.create({
        data: { descricao: dados.localidade, uf: dados.uf, codigo_ibge: dados.ibge },
      }));

    return {
      success: true,
      data: {
        cep,
        logradouro: dados.logradouro || '',
        complemento: dados.complemento || '',
        bairro: dados.bairro || '',
        localidade: dados.localidade,
        uf: dados.uf,
        cidade,
      },
    };
  }
}
