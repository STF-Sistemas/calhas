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
exports.NotificacoesService = void 0;
const common_1 = require("@nestjs/common");
const falha_1 = require("../common/falha");
const prisma_service_1 = require("../prisma/prisma.service");
let NotificacoesService = class NotificacoesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listar(codEmpresa, apenasNaoLidas) {
        if (!codEmpresa)
            return { success: true, data: [] };
        const data = await this.prisma.notificacao.findMany({
            where: { cod_empresa: codEmpresa, ...(apenasNaoLidas ? { lida: false } : {}) },
            orderBy: { created_at: 'desc' },
            take: 50,
        });
        return { success: true, data };
    }
    async contagem(codEmpresa) {
        const count = codEmpresa ? await this.prisma.notificacao.count({ where: { cod_empresa: codEmpresa, lida: false } }) : 0;
        return { success: true, data: { count } };
    }
    async marcarTodas(codEmpresa) {
        if (codEmpresa) {
            await this.prisma.notificacao.updateMany({
                where: { cod_empresa: codEmpresa, lida: false },
                data: { lida: true, lida_em: new Date() },
            });
        }
        return { success: true };
    }
    async marcarLida(id, codEmpresa) {
        const marcada = await this.prisma.notificacao.updateMany({
            where: { id, cod_empresa: codEmpresa ?? -1 },
            data: { lida: true, lida_em: new Date() },
        });
        if (marcada.count === 0)
            throw (0, falha_1.falha)(common_1.HttpStatus.NOT_FOUND, 'Notificação não encontrada.');
        return { success: true };
    }
};
exports.NotificacoesService = NotificacoesService;
exports.NotificacoesService = NotificacoesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificacoesService);
//# sourceMappingURL=notificacoes.service.js.map