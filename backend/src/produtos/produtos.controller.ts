import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { EmpresaAtual } from '../common/decorators';
import { falha } from '../common/falha';
import { Id, IdPipe, Inteiro, Numero, Texto, TextoOpcional } from '../common/validadores';
import { StatusDto } from '../meios-pagamento/meio-pagamento.dto';
import { PrismaService } from '../prisma/prisma.service';

class ProdutoDto {
  @Texto(200, 'Descrição é obrigatória.')
  descricao: string;

  @Texto(10, 'Unidade de medida é obrigatória.')
  unidade_medida: string;

  @Numero({ min: 0, mensagem: 'Valor unitário inválido.' })
  valor_unitario: number;

  @Numero({ opcional: true, min: 0, mensagem: 'Custo inválido.' })
  custo?: number | null;

  @Numero({ opcional: true, min: 0, mensagem: 'Markup inválido.' })
  markup?: number | null;

  @Numero({ opcional: true, min: 0, mensagem: 'Estoque inválido.' })
  estoque_atual?: number | null;

  @TextoOpcional(10) ncm?: string | null;
  @TextoOpcional(7) cest?: string | null;
  @TextoOpcional(14) gtin?: string | null;
  @TextoOpcional(5) cfop_padrao?: string | null;

  @Inteiro({ opcional: true, min: 0, max: 8, mensagem: 'Origem inválida.' })
  origem?: number | null;
}

class CodigoFornecedorDto {
  @Id(false, 'cod_fornecedor e codigo são obrigatórios.')
  cod_fornecedor: number;

  @Texto(60, 'cod_fornecedor e codigo são obrigatórios.')
  codigo: string;
}

const dadosProduto = (dto: ProdutoDto) => ({
  ...dto,
  custo: dto.custo ?? 0,
  markup: dto.markup ?? 0,
  origem: dto.origem ?? 0,
});

@Controller('produtos')
export class ProdutosController {
  constructor(private readonly prisma: PrismaService) {}

  private async obter(id: number, codEmpresa: number) {
    const produto = await this.prisma.produto.findFirst({ where: { id, cod_empresa: codEmpresa, excluido: false } });
    if (!produto) throw falha(HttpStatus.NOT_FOUND, 'Produto não encontrado.');
    return produto;
  }

  @Get()
  async listar(@EmpresaAtual() codEmpresa: number) {
    const data = await this.prisma.produto.findMany({
      where: { cod_empresa: codEmpresa, excluido: false },
      orderBy: { descricao: 'asc' },
    });
    return { success: true, data };
  }

  @Get('por-codigo-fornecedor')
  async porCodigoFornecedor(
    @EmpresaAtual() codEmpresa: number,
    @Query('cod_fornecedor') codFornecedorBruto?: string,
    @Query('codigo') codigoBruto?: string,
  ) {
    const codFornecedor = Number(codFornecedorBruto);
    const codigo = String(codigoBruto ?? '').trim().slice(0, 60);
    if (!Number.isInteger(codFornecedor) || codFornecedor <= 0 || !codigo) {
      throw falha(HttpStatus.BAD_REQUEST, 'Parâmetros cod_fornecedor e codigo são obrigatórios.');
    }
    const vinculo = await this.prisma.produtoFornecedor.findFirst({
      where: { cod_fornecedor: codFornecedor, codigo_produto_fornecedor: codigo },
      include: { produto: true },
    });
    if (!vinculo || vinculo.produto.excluido || vinculo.produto.cod_empresa !== codEmpresa) {
      throw falha(HttpStatus.NOT_FOUND, 'Produto não encontrado pelo código do fornecedor.');
    }
    return { success: true, data: vinculo.produto };
  }

  @Get('por-gtin/:gtin')
  async porGtin(@Param('gtin') bruto: string, @EmpresaAtual() codEmpresa: number) {
    const gtin = String(bruto).trim().slice(0, 14);
    if (!gtin) throw falha(HttpStatus.BAD_REQUEST, 'GTIN inválido.');
    const data = await this.prisma.produto.findFirst({ where: { gtin, cod_empresa: codEmpresa, excluido: false } });
    if (!data) throw falha(HttpStatus.NOT_FOUND, 'Produto não encontrado pelo GTIN.');
    return { success: true, data };
  }

  @Get(':id')
  async buscar(@Param('id', IdPipe) id: number, @EmpresaAtual() codEmpresa: number) {
    return { success: true, data: await this.obter(id, codEmpresa) };
  }

  @Post()
  async criar(@Body() dto: ProdutoDto, @EmpresaAtual() codEmpresa: number) {
    const data = await this.prisma.produto.create({
      data: { ...dadosProduto(dto), estoque_atual: dto.estoque_atual ?? 0, cod_empresa: codEmpresa },
    });
    return { success: true, data };
  }

  @Put(':id')
  async atualizar(@Param('id', IdPipe) id: number, @Body() dto: ProdutoDto, @EmpresaAtual() codEmpresa: number) {
    await this.obter(id, codEmpresa);
    const { estoque_atual: _estoque, ...dados } = dadosProduto(dto);
    return { success: true, data: await this.prisma.produto.update({ where: { id }, data: dados }) };
  }

  @Patch(':id/status')
  async alterarStatus(@Param('id', IdPipe) id: number, @Body() dto: StatusDto, @EmpresaAtual() codEmpresa: number) {
    await this.obter(id, codEmpresa);
    return { success: true, data: await this.prisma.produto.update({ where: { id }, data: { status: dto.status } }) };
  }

  @Delete(':id')
  async excluir(@Param('id', IdPipe) id: number, @EmpresaAtual() codEmpresa: number) {
    await this.obter(id, codEmpresa);
    await this.prisma.produto.update({ where: { id }, data: { excluido: true } });
    return { success: true, message: 'Produto excluído.' };
  }

  @Post(':id/codigo-fornecedor')
  async vincularCodigoFornecedor(
    @Param('id', IdPipe) id: number,
    @Body() dto: CodigoFornecedorDto,
    @EmpresaAtual() codEmpresa: number,
  ) {
    await this.obter(id, codEmpresa);
    const fornecedor = await this.prisma.fornecedor.findFirst({
      where: { id: dto.cod_fornecedor, cod_empresa: codEmpresa, excluido: false },
      select: { id: true },
    });
    if (!fornecedor) throw falha(HttpStatus.NOT_FOUND, 'Fornecedor não encontrado.');

    const data = await this.prisma.produtoFornecedor.upsert({
      where: {
        cod_fornecedor_codigo_produto_fornecedor: { cod_fornecedor: dto.cod_fornecedor, codigo_produto_fornecedor: dto.codigo },
      },
      create: { cod_produto: id, cod_fornecedor: dto.cod_fornecedor, codigo_produto_fornecedor: dto.codigo },
      update: { cod_produto: id },
    });
    return { success: true, data };
  }

  @Get(':id/historico-compras')
  async historicoCompras(@Param('id', IdPipe) id: number, @EmpresaAtual() codEmpresa: number) {
    await this.obter(id, codEmpresa);
    const itens = await this.prisma.compraItem.findMany({
      where: { cod_produto: id, excluido: false, compra: { cod_empresa: codEmpresa, excluido: false } },
      include: {
        compra: {
          select: {
            id: true,
            numero_nfe: true,
            serie: true,
            data_emissao: true,
            fornecedor: { select: { id: true, razao_social: true } },
          },
        },
      },
      orderBy: { compra: { data_emissao: 'desc' } },
      take: 20,
    });
    const data = itens.map((item) => ({
      cod_compra: item.cod_compra,
      numero_nfe: item.compra.numero_nfe ?? '',
      serie: item.compra.serie ?? '',
      data_emissao: item.compra.data_emissao,
      fornecedor: item.compra.fornecedor?.razao_social ?? '',
      quantidade: Number(item.quantidade),
      valor_unitario: Number(item.valor_unitario),
      valor_total: Number(item.valor_total),
      custo_unitario: Number(item.custo_unitario),
    }));
    return { success: true, data };
  }
}
