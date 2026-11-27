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
exports.ChapasService = void 0;
const common_1 = require("@nestjs/common");
const falha_1 = require("../common/falha");
const prisma_service_1 = require("../prisma/prisma.service");
const comCortes = { cortes: { where: { excluido: false } } };
let ChapasService = class ChapasService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async obter(id, codEmpresa) {
        const chapa = await this.prisma.chapa.findFirst({
            where: { id, cod_empresa: codEmpresa, excluido: false },
            include: comCortes,
        });
        if (!chapa)
            throw (0, falha_1.falha)(common_1.HttpStatus.NOT_FOUND, 'Chapa não encontrada.');
        return chapa;
    }
    async obterCorte(id, corteId, codEmpresa) {
        const chapa = await this.obter(id, codEmpresa);
        const corte = await this.prisma.corte.findFirst({ where: { id: corteId, cod_chapa: chapa.id, excluido: false } });
        if (!corte)
            throw (0, falha_1.falha)(common_1.HttpStatus.NOT_FOUND, 'Corte não encontrado.');
        return corte;
    }
    async listar(codEmpresa) {
        const data = await this.prisma.chapa.findMany({
            where: { cod_empresa: codEmpresa, excluido: false },
            include: comCortes,
            orderBy: { descricao: 'asc' },
            take: 2000,
        });
        return { success: true, data };
    }
    async buscar(id, codEmpresa) {
        return { success: true, data: await this.obter(id, codEmpresa) };
    }
    async criar(dto, codEmpresa) {
        return { success: true, data: await this.prisma.chapa.create({ data: { ...dto, cod_empresa: codEmpresa } }) };
    }
    async atualizar(id, dto, codEmpresa) {
        await this.obter(id, codEmpresa);
        return { success: true, data: await this.prisma.chapa.update({ where: { id }, data: dto }) };
    }
    async alterarStatus(id, status, codEmpresa) {
        await this.obter(id, codEmpresa);
        return { success: true, data: await this.prisma.chapa.update({ where: { id }, data: { status } }) };
    }
    async excluir(id, codEmpresa) {
        await this.obter(id, codEmpresa);
        await this.prisma.chapa.update({ where: { id }, data: { excluido: true } });
        return { success: true, message: 'Chapa excluída.' };
    }
    async listarCortes(id, codEmpresa) {
        const chapa = await this.obter(id, codEmpresa);
        const data = await this.prisma.corte.findMany({
            where: { cod_chapa: chapa.id, excluido: false },
            orderBy: { descricao: 'asc' },
            take: 2000,
        });
        return { success: true, data };
    }
    async criarCorte(id, dto, codEmpresa) {
        const chapa = await this.obter(id, codEmpresa);
        return { success: true, data: await this.prisma.corte.create({ data: { ...dto, cod_chapa: chapa.id } }) };
    }
    async atualizarCorte(id, corteId, dto, codEmpresa) {
        await this.obterCorte(id, corteId, codEmpresa);
        return { success: true, data: await this.prisma.corte.update({ where: { id: corteId }, data: dto }) };
    }
    async excluirCorte(id, corteId, codEmpresa) {
        await this.obterCorte(id, corteId, codEmpresa);
        await this.prisma.corte.update({ where: { id: corteId }, data: { excluido: true } });
        return { success: true, message: 'Corte excluído.' };
    }
};
exports.ChapasService = ChapasService;
exports.ChapasService = ChapasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChapasService);
//# sourceMappingURL=chapas.service.js.map