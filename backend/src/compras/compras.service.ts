import { HttpStatus, Injectable } from '@nestjs/common';
import { falha } from '../common/falha';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CompraDto, CompraItemDto } from './compra.dto';
import { buildDanfeFromDb, lerNfeParaImportacao, parseDanfeXml } from './nfe-xml';

const RASCUNHO = 1;
const CONFIRMADA = 2;
const CANCELADA = 3;
const FORNECEDOR_RESUMO = { select: { id: true, razao_social: true, cnpj: true } };

const n = (v: number | null | undefined) => v ?? 0;

function custoUnitario(
  item: { quantidade: number; valor_total: number; desconto: number; valor_ipi: number; valor_icms_st: number },
  rateio: { frete: number; seguro: number; outros: number; desconto: number },
): number {
  if (item.quantidade <= 0) return 0;
  return (
    (item.valor_total - item.desconto + item.valor_ipi + item.valor_icms_st + rateio.frete + rateio.seguro + rateio.outros - rateio.desconto) /
    item.quantidade
  );
}

function ratear(valorTotalItem: number, somaItens: number, cab: { frete: number; seguro: number; outros: number; desconto: number }) {
  const p = somaItens > 0 ? valorTotalItem / somaItens : 0;
  return { frete: cab.frete * p, seguro: cab.seguro * p, outros: cab.outros * p, desconto: cab.desconto * p };
}

@Injectable()
export class ComprasService {
  constructor(private readonly prisma: PrismaService) {}

  async obter(id: number, codEmpresa: number) {
    const compra = await this.prisma.compra.findFirst({ where: { id, cod_empresa: codEmpresa, excluido: false } });
    if (!compra) throw falha(HttpStatus.NOT_FOUND, 'Compra não encontrada.');
    return compra;
  }

  async listar(codEmpresa: number, q: Record<string, string>) {
    const where: Prisma.CompraWhereInput = { cod_empresa: codEmpresa, excluido: false };
    const codFornecedor = Number(q['codFornecedor']);
    if (Number.isInteger(codFornecedor) && codFornecedor > 0) where.cod_fornecedor = codFornecedor;
    const dia = /^\d{4}-\d{2}-\d{2}/;
    const inicio = dia.test(q['dataInicio'] ?? '') ? new Date(q['dataInicio']) : null;
    const fim = dia.test(q['dataFim'] ?? '') ? new Date(q['dataFim']) : null;
    if (inicio || fim) where.data_emissao = { ...(inicio && { gte: inicio }), ...(fim && { lte: fim }) };

    const consulta = { where, include: { fornecedor: FORNECEDOR_RESUMO }, orderBy: { id: 'desc' as const } };
    if (!q['pagina'] && !q['limite']) {
      return { success: true, data: await this.prisma.compra.findMany(consulta) };
    }
    const pagina = Math.max(1, parseInt(q['pagina'] ?? '1', 10) || 1);
    const limite = Math.min(100, Math.max(1, parseInt(q['limite'] ?? '10', 10) || 10));
    const [data, total] = await Promise.all([
      this.prisma.compra.findMany({ ...consulta, skip: (pagina - 1) * limite, take: limite }),
      this.prisma.compra.count({ where }),
    ]);
    return { success: true, data, total, pagina, totalPaginas: Math.ceil(total / limite) };
  }

  async buscar(id: number, codEmpresa: number) {
    const data = await this.prisma.compra.findFirst({
      where: { id, cod_empresa: codEmpresa, excluido: false },
      include: { fornecedor: true, itens: { where: { excluido: false } } },
    });
    if (!data) throw falha(HttpStatus.NOT_FOUND, 'Compra não encontrada.');
    return { success: true, data };
  }

  async danfe(id: number, codEmpresa: number) {
    const compra = await this.prisma.compra.findFirst({
      where: { id, cod_empresa: codEmpresa, excluido: false },
      include: { fornecedor: { include: { cidade: true } }, itens: { where: { excluido: false } }, xml: true },
    });
    if (!compra) throw falha(HttpStatus.NOT_FOUND, 'Compra não encontrada.');
    const empresa = await this.prisma.empresa.findFirst({ where: { id: codEmpresa }, include: { cidade: true } });
    const data = compra.xml?.xml_content ? await parseDanfeXml(compra.xml.xml_content) : buildDanfeFromDb(compra, empresa);
    return { success: true, data };
  }

  async criar(dto: CompraDto, codEmpresa: number) {
    await this.validar(dto, codEmpresa);
    const compra = await this.prisma.compra.create({
      data: { ...this.cabecalho(dto), cod_empresa: codEmpresa, itens: { create: this.itensCalculados(dto) } },
      include: { fornecedor: true, itens: true },
    });
    await this.salvarXml(compra.id, dto.xml_content);
    return { success: true, data: compra };
  }

  async atualizar(id: number, dto: CompraDto, codEmpresa: number) {
    const existente = await this.obter(id, codEmpresa);
    if (existente.status !== RASCUNHO) throw falha(HttpStatus.BAD_REQUEST, 'Apenas compras em Rascunho podem ser editadas.');
    await this.validar(dto, codEmpresa, id);

    const compra = await this.prisma.$transaction(async (tx) => {
      await tx.compraItem.updateMany({ where: { cod_compra: id }, data: { excluido: true } });
      return tx.compra.update({
        where: { id },
        data: { ...this.cabecalho(dto), itens: { create: this.itensCalculados(dto) } },
        include: { fornecedor: true, itens: { where: { excluido: false } } },
      });
    });
    await this.salvarXml(id, dto.xml_content);
    return { success: true, data: compra };
  }

  async alterarStatus(id: number, status: number, motivo: string | null | undefined, codEmpresa: number) {
    if (status === CANCELADA && !motivo?.trim()) throw falha(HttpStatus.BAD_REQUEST, 'Informe o motivo do cancelamento.');
    const existente = await this.obter(id, codEmpresa);
    if (existente.status === CONFIRMADA && status !== CANCELADA) {
      throw falha(HttpStatus.BAD_REQUEST, 'Compra confirmada só pode ser cancelada.');
    }
    const data = await this.prisma.compra.update({
      where: { id },
      data: { status, ...(status === CANCELADA ? { motivo_cancelamento: motivo?.trim() } : {}) },
    });
    if (status === CONFIRMADA) await this.atualizarCustoProdutos(id, codEmpresa);
    return { success: true, data };
  }

  async atualizarCusto(id: number, codEmpresa: number) {
    await this.obter(id, codEmpresa);
    await this.atualizarCustoProdutos(id, codEmpresa);
    return { success: true, message: 'Custo dos produtos atualizado com sucesso.' };
  }

  async excluir(id: number, codEmpresa: number) {
    await this.obter(id, codEmpresa);
    await this.prisma.compra.update({ where: { id }, data: { excluido: true } });
    return { success: true, message: 'Compra excluída.' };
  }

  async importarXml(conteudo: string, codEmpresa: number) {
    let dados: Awaited<ReturnType<typeof lerNfeParaImportacao>>;
    try {
      dados = await lerNfeParaImportacao(conteudo);
    } catch {
      throw falha(HttpStatus.BAD_REQUEST, 'XML inválido: não foi possível ler o arquivo.');
    }
    if ('erro' in dados) throw falha(HttpStatus.BAD_REQUEST, dados.erro ?? 'XML inválido.');

    if (dados.chave_acesso.length === 44) {
      const dup = await this.prisma.compra.findFirst({
        where: { chave_acesso: dados.chave_acesso, cod_empresa: codEmpresa, excluido: false },
        select: { id: true },
      });
      if (dup) throw falha(HttpStatus.CONFLICT, 'Esta NF-e já foi importada (chave de acesso duplicada).', { data: null });
    }
    const fornecedor = dados.emitente.cnpj
      ? await this.prisma.fornecedor.findFirst({
          where: { cnpj: dados.emitente.cnpj, cod_empresa: codEmpresa, excluido: false },
          include: { cidade: true },
        })
      : null;
    const { itens, ...resto } = dados;
    return { success: true, data: { ...resto, fornecedor, itens } };
  }

  private async validar(dto: CompraDto, codEmpresa: number, ignorarId?: number): Promise<void> {
    if (dto.chave_acesso && dto.chave_acesso.length === 44) {
      const dup = await this.prisma.compra.findFirst({
        where: {
          chave_acesso: dto.chave_acesso,
          cod_empresa: codEmpresa,
          excluido: false,
          ...(ignorarId ? { NOT: { id: ignorarId } } : {}),
        },
        select: { id: true },
      });
      if (dup) throw falha(HttpStatus.CONFLICT, 'Esta NF-e já foi importada (chave de acesso duplicada).');
    }
    const fornecedor = await this.prisma.fornecedor.findFirst({
      where: { id: dto.cod_fornecedor, cod_empresa: codEmpresa, excluido: false },
      select: { id: true },
    });
    if (!fornecedor) throw falha(HttpStatus.NOT_FOUND, 'Fornecedor não encontrado.');

    const produtos = [...new Set(dto.itens.map((i) => i.cod_produto))];
    const encontrados = await this.prisma.produto.count({ where: { id: { in: produtos }, cod_empresa: codEmpresa } });
    if (encontrados !== produtos.length) throw falha(HttpStatus.BAD_REQUEST, 'Item da compra com produto inválido.');
  }

  private data(valor: string | null | undefined): Date | null {
    if (!valor) return null;
    const d = new Date(valor);
    if (Number.isNaN(d.getTime())) throw falha(HttpStatus.BAD_REQUEST, 'Data inválida.');
    return d;
  }

  private cabecalho(dto: CompraDto) {
    const valor_produtos = dto.itens.reduce((s, i) => s + i.valor_total, 0);
    const valor_ipi = dto.itens.reduce((s, i) => s + n(i.valor_ipi), 0);
    return {
      cod_fornecedor: dto.cod_fornecedor,
      numero_nfe: dto.numero_nfe || null,
      serie: dto.serie || null,
      chave_acesso: dto.chave_acesso || null,
      observacao: dto.observacao || null,
      valor_frete: n(dto.valor_frete),
      valor_seguro: n(dto.valor_seguro),
      valor_desconto: n(dto.valor_desconto),
      valor_outros: n(dto.valor_outros),
      valor_produtos,
      valor_ipi,
      valor_total: valor_produtos + n(dto.valor_frete) + n(dto.valor_seguro) + n(dto.valor_outros) + valor_ipi - n(dto.valor_desconto),
      data_emissao: this.data(dto.data_emissao),
      data_entrada: this.data(dto.data_entrada),
    };
  }

  private itensCalculados(dto: CompraDto) {
    const soma = dto.itens.reduce((s, i) => s + i.valor_total, 0);
    const cab = { frete: n(dto.valor_frete), seguro: n(dto.valor_seguro), outros: n(dto.valor_outros), desconto: n(dto.valor_desconto) };
    return dto.itens.map((item: CompraItemDto) => {
      const rateio = ratear(item.valor_total, soma, cab);
      const valores = {
        desconto: n(item.desconto),
        base_icms: n(item.base_icms),
        aliq_icms: n(item.aliq_icms),
        valor_icms: n(item.valor_icms),
        base_icms_st: n(item.base_icms_st),
        valor_icms_st: n(item.valor_icms_st),
        valor_ipi: n(item.valor_ipi),
        aliq_pis: n(item.aliq_pis),
        valor_pis: n(item.valor_pis),
        aliq_cofins: n(item.aliq_cofins),
        valor_cofins: n(item.valor_cofins),
      };
      return {
        cod_produto: item.cod_produto,
        descricao_xml: item.descricao_xml || null,
        descricao: item.descricao,
        ncm: item.ncm || null,
        cfop: item.cfop || null,
        unidade: item.unidade,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        valor_total: item.valor_total,
        ...valores,
        rateio_frete: rateio.frete,
        rateio_seguro: rateio.seguro,
        rateio_outros: rateio.outros,
        rateio_desconto: rateio.desconto,
        custo_unitario: custoUnitario({ ...item, ...valores }, rateio),
      };
    });
  }

  private async salvarXml(codCompra: number, xml: string | undefined): Promise<void> {
    if (!xml) return;
    await this.prisma.compraXml.upsert({
      where: { cod_compra: codCompra },
      update: { xml_content: xml },
      create: { cod_compra: codCompra, xml_content: xml },
    });
  }

  private async atualizarCustoProdutos(compraId: number, codEmpresa: number): Promise<void> {
    const compra = await this.prisma.compra.findFirst({
      where: { id: compraId, excluido: false },
      include: { itens: { where: { excluido: false } } },
    });
    if (!compra) return;
    const soma = compra.itens.reduce((s, i) => s + Number(i.valor_total), 0);
    const cab = {
      frete: Number(compra.valor_frete),
      seguro: Number(compra.valor_seguro),
      outros: Number(compra.valor_outros),
      desconto: Number(compra.valor_desconto),
    };

    for (const item of compra.itens) {
      const rateio = ratear(Number(item.valor_total), soma, cab);
      const custo = custoUnitario(
        {
          quantidade: Number(item.quantidade),
          valor_total: Number(item.valor_total),
          desconto: Number(item.desconto),
          valor_ipi: Number(item.valor_ipi),
          valor_icms_st: Number(item.valor_icms_st),
        },
        rateio,
      );
      await this.prisma.compraItem.update({
        where: { id: item.id },
        data: {
          rateio_frete: rateio.frete,
          rateio_seguro: rateio.seguro,
          rateio_outros: rateio.outros,
          rateio_desconto: rateio.desconto,
          custo_unitario: custo,
        },
      });
      const produto = await this.prisma.produto.findFirst({
        where: { id: item.cod_produto, cod_empresa: codEmpresa, excluido: false },
      });
      if (produto) {
        const markup = Number(produto.markup);
        await this.prisma.produto.update({
          where: { id: produto.id },
          data: { custo, valor_unitario: markup > 0 ? custo * (1 + markup / 100) : Number(produto.valor_unitario) },
        });
      }
    }
  }
}
