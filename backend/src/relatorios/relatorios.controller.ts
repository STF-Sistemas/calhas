import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { EmpresaAtual } from '../common/decorators';
import { falha } from '../common/falha';
import { PrismaService } from '../prisma/prisma.service';

const DATA = /^\d{4}-\d{2}-\d{2}$/;
const idOpcional = (valor: unknown): number | null => {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : null;
};

@Controller('relatorios')
export class RelatoriosController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('pedidos-lucros')
  async pedidosLucros(@EmpresaAtual() codEmpresa: number, @Query() q: Record<string, string>) {
    const dataInicio = DATA.test(q['data_inicio'] ?? '') ? q['data_inicio'] : null;
    const dataFim = DATA.test(q['data_fim'] ?? '') ? q['data_fim'] : null;
    const codCliente = idOpcional(q['cod_cliente']);
    const codProduto = idOpcional(q['cod_produto']);

    const empresa = await this.prisma.empresa.findUnique({ where: { id: codEmpresa }, include: { cidade: true } });
    if (!empresa) throw falha(HttpStatus.NOT_FOUND, 'Empresa não encontrada.');

    const where: Prisma.PedidoWhereInput = { cod_empresa: codEmpresa, excluido: false };
    if (dataInicio || dataFim) {
      where.data_pedido = {
        ...(dataInicio && { gte: new Date(`${dataInicio}T00:00:00.000Z`) }),
        ...(dataFim && { lte: new Date(`${dataFim}T23:59:59.999Z`) }),
      };
    }
    if (codCliente) where.cod_cliente = codCliente;
    if (codProduto) where.itens = { some: { cod_produto: codProduto } };

    const pedidos = await this.prisma.pedido.findMany({
      where,
      omit: { aprovacao_assinatura: true },
      include: {
        cliente: true,
        itens: {
          where: codProduto ? { cod_produto: codProduto } : undefined,
          include: { produto: true, servico: true, corte: { include: { chapa: true } } },
        },
      },
      orderBy: { data_pedido: 'asc' },
    });

    let totalValor = 0;
    let totalCusto = 0;
    const formatados = pedidos.map((pedido) => {
      let custoPedido = 0;
      let valorPedido = 0;
      const itens = pedido.itens.map((item) => {
        const descricao = item.produto
          ? item.produto.descricao
          : item.servico
            ? item.servico.descricao
            : item.corte
              ? `${item.corte.chapa?.descricao ?? ''}: ${item.corte.descricao}`
              : '';
        const quantidade = Number(item.quantidade);
        const valorTotal = Number(item.valor_total);
        const custoUnitario = Number(item.custo_unitario);
        const custoTotal = quantidade * custoUnitario;
        custoPedido += custoTotal;
        valorPedido += valorTotal;
        return {
          id: item.id,
          tipo: item.tipo,
          descricao,
          quantidade,
          valor_unitario: Number(item.valor_unitario),
          valor_total: valorTotal,
          custo_unitario: custoUnitario,
          custo_total: custoTotal,
          lucro: valorTotal - custoTotal,
        };
      });
      totalValor += valorPedido;
      totalCusto += custoPedido;
      return {
        id: pedido.id,
        data_pedido: pedido.data_pedido.toISOString(),
        status: pedido.status,
        cliente: pedido.cliente,
        itens,
        valor_total: valorPedido,
        custo_total: custoPedido,
        lucro: valorPedido - custoPedido,
      };
    });

    const [cliente, produto] = await Promise.all([
      codCliente
        ? this.prisma.cliente.findFirst({ where: { id: codCliente, cod_empresa: codEmpresa }, select: { razao_social: true } })
        : null,
      codProduto
        ? this.prisma.produto.findFirst({ where: { id: codProduto, cod_empresa: codEmpresa }, select: { descricao: true } })
        : null,
    ]);

    return {
      success: true,
      data: {
        empresa,
        filtros: {
          data_inicio: dataInicio,
          data_fim: dataFim,
          cliente: cliente?.razao_social ?? null,
          produto: produto?.descricao ?? null,
        },
        pedidos: formatados,
        totais: {
          valor_total: totalValor,
          custo_total: totalCusto,
          lucro: totalValor - totalCusto,
          quantidade_pedidos: formatados.length,
        },
      },
    };
  }
}
