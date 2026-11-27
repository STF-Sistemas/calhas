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
exports.EmpresasService = void 0;
const common_1 = require("@nestjs/common");
const falha_1 = require("../common/falha");
const prisma_service_1 = require("../prisma/prisma.service");
function dadosEmpresa(dto, superAdmin) {
    const { data_expiracao, valor_mensalidade, ativo, ...resto } = dto;
    const base = { ...resto, email: resto.email || null };
    if (!superAdmin)
        return base;
    return {
        ...base,
        ...(data_expiracao !== undefined && { data_expiracao: data_expiracao ? new Date(data_expiracao) : null }),
        ...(valor_mensalidade !== undefined && { valor_mensalidade }),
        ...(ativo !== undefined && { ativo }),
    };
}
let EmpresasService = class EmpresasService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async obter(id) {
        const empresa = await this.prisma.empresa.findFirst({ where: { id, excluido: false }, include: { cidade: true } });
        if (!empresa)
            throw (0, falha_1.falha)(common_1.HttpStatus.NOT_FOUND, 'Empresa não encontrada.');
        return empresa;
    }
    exigirPropria(id, usuario) {
        if (!usuario.super_admin && usuario.cod_empresa !== id)
            throw (0, falha_1.falha)(common_1.HttpStatus.FORBIDDEN, 'Acesso negado.');
    }
    async listar() {
        const data = await this.prisma.empresa.findMany({
            where: { excluido: false },
            include: { cidade: true },
            orderBy: { razao_social: 'asc' },
            take: 2000,
        });
        return { success: true, data };
    }
    async buscar(id, usuario) {
        this.exigirPropria(id, usuario);
        return { success: true, data: await this.obter(id) };
    }
    async criar(dto) {
        return { success: true, data: await this.prisma.empresa.create({ data: dadosEmpresa(dto, true) }) };
    }
    async atualizar(id, dto, usuario) {
        this.exigirPropria(id, usuario);
        await this.obter(id);
        const data = await this.prisma.empresa.update({ where: { id }, data: dadosEmpresa(dto, usuario.super_admin) });
        return { success: true, data };
    }
    async atualizarValidade(id, dto) {
        await this.obter(id);
        const data = await this.prisma.empresa.update({
            where: { id },
            data: {
                data_expiracao: dto.data_expiracao ? new Date(dto.data_expiracao) : null,
                ...(dto.valor_mensalidade !== undefined && { valor_mensalidade: dto.valor_mensalidade }),
            },
        });
        return { success: true, data };
    }
    async excluir(id) {
        await this.obter(id);
        await this.prisma.empresa.update({ where: { id }, data: { excluido: true } });
        return { success: true, message: 'Empresa excluída.' };
    }
    async obterMinha(codEmpresa) {
        if (!codEmpresa)
            throw (0, falha_1.falha)(common_1.HttpStatus.BAD_REQUEST, 'Usuário não está vinculado a uma empresa.');
        return this.obter(codEmpresa);
    }
    async buscarMinha(codEmpresa) {
        return { success: true, data: await this.obterMinha(codEmpresa) };
    }
    async atualizarMinha(dto, codEmpresa) {
        const empresa = await this.obterMinha(codEmpresa);
        const data = await this.prisma.empresa.update({
            where: { id: empresa.id },
            data: { ...dto, email: dto.email || null },
            include: { cidade: true },
        });
        return { success: true, data };
    }
};
exports.EmpresasService = EmpresasService;
exports.EmpresasService = EmpresasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EmpresasService);
//# sourceMappingURL=empresas.service.js.map