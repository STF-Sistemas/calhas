import { Injectable } from '@nestjs/common';
import { EStatusPedido } from '#shared/enums';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async resumo(codEmpresa: number | null) {
    const empresa = codEmpresa ?? -1;
    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59);
    const base = { cod_empresa: empresa, excluido: false };
    const doMes = { ...base, data_pedido: { gte: inicioMes, lte: fimMes } };

    const [pedidosMes, receita, clientesAtivos, abertos, emProducao, concluidos, cancelados, recentes] =
      await Promise.all([
        this.prisma.pedido.count({ where: doMes }),
        this.prisma.pedido.aggregate({ _sum: { valor_total: true }, where: doMes }),
        this.prisma.cliente.count({ where: { cod_empresa: empresa, excluido: false, ativo: 1 } }),
        this.prisma.pedido.count({ where: { ...base, status: EStatusPedido.Aberto } }),
        this.prisma.pedido.count({ where: { ...base, status: EStatusPedido.EmProducao } }),
        this.prisma.pedido.count({ where: { ...base, status: EStatusPedido.Concluido } }),
        this.prisma.pedido.count({ where: { ...base, status: EStatusPedido.Cancelado } }),
        this.prisma.pedido.findMany({
          where: base,
          omit: { aprovacao_assinatura: true },
          include: { cliente: true },
          orderBy: { id: 'desc' },
          take: 8,
        }),
      ]);

    return {
      success: true,
      data: {
        pedidosMes,
        receitaMes: Number(receita._sum.valor_total ?? 0),
        clientesAtivos,
        pedidosAbertos: abertos,
        pedidosEmProducao: emProducao,
        pedidosConcluidos: concluidos,
        pedidosCancelados: cancelados,
        pedidosRecentes: recentes,
      },
    };
  }
}
