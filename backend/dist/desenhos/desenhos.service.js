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
exports.DesenhosService = void 0;
const common_1 = require("@nestjs/common");
const falha_1 = require("../common/falha");
const prisma_service_1 = require("../prisma/prisma.service");
const ponto = (p) => ({ x: p.x, y: p.y });
function dados(dto) {
    return {
        descricao: dto.descricao,
        status: dto.status,
        pontos: dto.pontos ? dto.pontos.map(ponto) : undefined,
        diagonais: dto.diagonais
            ? dto.diagonais.map((d) => ({ p1: ponto(d.p1), p2: ponto(d.p2) }))
            : undefined,
    };
}
let DesenhosService = class DesenhosService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async obter(id, codEmpresa) {
        const desenho = await this.prisma.desenho.findFirst({ where: { id, cod_empresa: codEmpresa, excluido: false } });
        if (!desenho)
            throw (0, falha_1.falha)(common_1.HttpStatus.NOT_FOUND, 'Desenho não encontrado.');
        return desenho;
    }
    async listar(codEmpresa) {
        const data = await this.prisma.desenho.findMany({
            where: { cod_empresa: codEmpresa, excluido: false },
            orderBy: { descricao: 'asc' },
            take: 2000,
        });
        return { success: true, data };
    }
    async buscar(id, codEmpresa) {
        return { success: true, data: await this.obter(id, codEmpresa) };
    }
    async criar(dto, codEmpresa) {
        const data = await this.prisma.desenho.create({ data: { ...dados(dto), cod_empresa: codEmpresa } });
        return { success: true, data };
    }
    async atualizar(id, dto, codEmpresa) {
        await this.obter(id, codEmpresa);
        const data = await this.prisma.desenho.update({ where: { id }, data: dados(dto) });
        return { success: true, data };
    }
    async excluir(id, codEmpresa) {
        await this.obter(id, codEmpresa);
        await this.prisma.desenho.update({ where: { id }, data: { excluido: true } });
        return { success: true, message: 'Desenho excluído.' };
    }
};
exports.DesenhosService = DesenhosService;
exports.DesenhosService = DesenhosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DesenhosService);
//# sourceMappingURL=desenhos.service.js.map