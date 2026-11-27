"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const enums_1 = require("../shared/enums");
const prisma_service_1 = require("../prisma/prisma.service");
let DashboardService = class DashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async resumo(codEmpresa) {
        const empresa = codEmpresa ?? -1;
        const agora = new Date();
        const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
        const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59);
        const base = { cod_empresa: empresa, excluido: false };
        const doMes = { ...base, data_pedido: { gte: inicioMes, lte: fimMes } };
        const [pedidosMes, receita, clientesAtivos, abertos, emProducao, concluidos, cancelados, recentes] = await Promise.all([
            this.prisma.pedido.count({ where: doMes }),
            this.prisma.pedido.aggregate({ _sum: { valor_total: true }, where: doMes }),
            this.prisma.cliente.count({ where: { cod_empresa: empresa, excluido: false, ativo: 1 } }),
            this.prisma.pedido.count({ where: { ...base, status: enums_1.EStatusPedido.Aberto } }),
            this.prisma.pedido.count({ where: { ...base, status: enums_1.EStatusPedido.EmProducao } }),
            this.prisma.pedido.count({ where: { ...base, status: enums_1.EStatusPedido.Concluido } }),
            this.prisma.pedido.count({ where: { ...base, status: enums_1.EStatusPedido.Cancelado } }),
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
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map