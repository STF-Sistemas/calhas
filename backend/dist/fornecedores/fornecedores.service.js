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
exports.FornecedoresService = void 0;
const common_1 = require("@nestjs/common");
const falha_1 = require("../common/falha");
const client_1 = require("../generated/prisma/client");
const busca_sem_acento_1 = require("../prisma/busca-sem-acento");
const prisma_service_1 = require("../prisma/prisma.service");
let FornecedoresService = class FornecedoresService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async obter(id, codEmpresa) {
        const fornecedor = await this.prisma.fornecedor.findFirst({
            where: { id, cod_empresa: codEmpresa, excluido: false },
            include: { cidade: true },
        });
        if (!fornecedor)
            throw (0, falha_1.falha)(common_1.HttpStatus.NOT_FOUND, 'Fornecedor não encontrado.');
        return fornecedor;
    }
    async exigirCnpjLivre(cnpj, codEmpresa, ignorarId) {
        const dup = await this.prisma.fornecedor.findFirst({
            where: { cnpj, cod_empresa: codEmpresa, excluido: false, ...(ignorarId ? { NOT: { id: ignorarId } } : {}) },
            select: { id: true },
        });
        if (dup) {
            throw (0, falha_1.falha)(common_1.HttpStatus.CONFLICT, ignorarId ? 'Já existe outro fornecedor com este CNPJ.' : 'Já existe um fornecedor com este CNPJ.');
        }
    }
    async listar(codEmpresa, q) {
        const razao = (0, busca_sem_acento_1.termoBusca)(q['razaoSocial']);
        const fantasia = (0, busca_sem_acento_1.termoBusca)(q['nomeFantasia']);
        const cnpj = (0, busca_sem_acento_1.termoBusca)(q['cnpj'], 20).replace(/\D/g, '');
        const telefone = (0, busca_sem_acento_1.termoBusca)(q['telefone'], 20).replace(/\D/g, '');
        const where = { cod_empresa: codEmpresa, excluido: false };
        const condicoes = [];
        const textos = [];
        if (razao)
            textos.push((0, busca_sem_acento_1.contemSemAcento)(client_1.Prisma.sql `razao_social`, razao));
        if (fantasia)
            textos.push((0, busca_sem_acento_1.contemSemAcento)(client_1.Prisma.sql `nome_fantasia`, fantasia));
        if (telefone)
            textos.push(client_1.Prisma.sql `regexp_replace(coalesce(fone, ''), '[^0-9]', '', 'g') LIKE ${`%${telefone}%`}`);
        if (textos.length) {
            const linhas = await this.prisma.$queryRaw `
        SELECT id FROM calhas.fornecedores
        WHERE cod_empresa = ${codEmpresa} AND excluido = false AND ${client_1.Prisma.join(textos, ' AND ')}
        ORDER BY razao_social LIMIT 1000`;
            condicoes.push({ id: { in: linhas.map((l) => l.id) } });
        }
        if (cnpj)
            condicoes.push({ cnpj: { contains: cnpj } });
        if (q['status'])
            condicoes.push({ status: Number(q['status']) || 0 });
        if (condicoes.length)
            where.AND = condicoes;
        const pagina = Math.max(1, parseInt(q['pagina'] ?? '1', 10) || 1);
        const limite = Math.min(100, Math.max(1, parseInt(q['limite'] ?? '10', 10) || 10));
        const [total, data] = await Promise.all([
            this.prisma.fornecedor.count({ where }),
            this.prisma.fornecedor.findMany({
                where,
                include: { cidade: true },
                orderBy: { razao_social: 'asc' },
                skip: (pagina - 1) * limite,
                take: limite,
            }),
        ]);
        return { success: true, data, total, pagina, totalPaginas: Math.ceil(total / limite) };
    }
    async porCnpj(bruto, codEmpresa) {
        const cnpj = String(bruto).replace(/\D/g, '');
        if (cnpj.length !== 14)
            throw (0, falha_1.falha)(common_1.HttpStatus.BAD_REQUEST, 'CNPJ inválido.');
        const data = await this.prisma.fornecedor.findFirst({
            where: { cnpj, cod_empresa: codEmpresa, excluido: false },
            include: { cidade: true },
        });
        if (!data)
            throw (0, falha_1.falha)(common_1.HttpStatus.NOT_FOUND, 'Fornecedor não encontrado.');
        return { success: true, data };
    }
    async buscar(id, codEmpresa) {
        return { success: true, data: await this.obter(id, codEmpresa) };
    }
    async criar(dto, codEmpresa) {
        await this.exigirCnpjLivre(dto.cnpj, codEmpresa);
        const data = await this.prisma.fornecedor.create({
            data: { ...dto, email: dto.email || null, cod_empresa: codEmpresa },
            include: { cidade: true },
        });
        return { success: true, data };
    }
    async atualizar(id, dto, codEmpresa) {
        await this.obter(id, codEmpresa);
        await this.exigirCnpjLivre(dto.cnpj, codEmpresa, id);
        const data = await this.prisma.fornecedor.update({
            where: { id },
            data: { ...dto, email: dto.email || null },
            include: { cidade: true },
        });
        return { success: true, data };
    }
    async alterarStatus(id, status, codEmpresa) {
        await this.obter(id, codEmpresa);
        return { success: true, data: await this.prisma.fornecedor.update({ where: { id }, data: { status } }) };
    }
    async excluir(id, codEmpresa) {
        await this.obter(id, codEmpresa);
        await this.prisma.fornecedor.update({ where: { id }, data: { excluido: true } });
        return { success: true, message: 'Fornecedor excluído.' };
    }
};
exports.FornecedoresService = FornecedoresService;
exports.FornecedoresService = FornecedoresService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FornecedoresService);
//# sourceMappingURL=fornecedores.service.js.map