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
exports.CidadesService = void 0;
const common_1 = require("@nestjs/common");
const falha_1 = require("../common/falha");
const client_1 = require("../generated/prisma/client");
const busca_sem_acento_1 = require("../prisma/busca-sem-acento");
const prisma_service_1 = require("../prisma/prisma.service");
const texto = (valor, max) => (typeof valor === 'string' ? valor.slice(0, max) : '');
let CidadesService = class CidadesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listar(q) {
        const termo = (0, busca_sem_acento_1.termoBusca)(q);
        if (!termo) {
            const data = await this.prisma.cidade.findMany({ orderBy: { descricao: 'asc' }, take: 200 });
            return { success: true, data };
        }
        const linhas = await this.prisma.$queryRaw `
      SELECT id FROM calhas.cidades
      WHERE ${(0, busca_sem_acento_1.contemSemAcento)(client_1.Prisma.sql `descricao`, termo)}
      ORDER BY descricao LIMIT 200`;
        const data = await this.prisma.cidade.findMany({
            where: { id: { in: linhas.map((l) => l.id) } },
            orderBy: { descricao: 'asc' },
        });
        return { success: true, data };
    }
    async consultarCep(cepBruto) {
        const cep = String(cepBruto).replace(/\D/g, '');
        if (cep.length !== 8)
            throw (0, falha_1.falha)(common_1.HttpStatus.BAD_REQUEST, 'CEP inválido.');
        let dados;
        try {
            const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: AbortSignal.timeout(8000) });
            dados = (await resposta.json());
        }
        catch {
            throw (0, falha_1.falha)(common_1.HttpStatus.INTERNAL_SERVER_ERROR, 'Erro ao consultar CEP.');
        }
        if (dados.erro)
            throw (0, falha_1.falha)(common_1.HttpStatus.NOT_FOUND, 'CEP não encontrado.');
        const ibge = texto(dados.ibge, 7);
        const localidade = texto(dados.localidade, 100).trim();
        const uf = texto(dados.uf, 2).toUpperCase();
        if (!/^\d{7}$/.test(ibge) || !localidade || !/^[A-Z]{2}$/.test(uf)) {
            throw (0, falha_1.falha)(common_1.HttpStatus.BAD_GATEWAY, 'Resposta inválida do serviço de CEP.');
        }
        const cidade = (await this.prisma.cidade.findFirst({ where: { codigo_ibge: ibge } })) ??
            (await this.prisma.cidade.create({ data: { descricao: localidade, uf, codigo_ibge: ibge } }));
        return {
            success: true,
            data: {
                cep,
                logradouro: texto(dados.logradouro, 200),
                complemento: texto(dados.complemento, 100),
                bairro: texto(dados.bairro, 100),
                localidade,
                uf,
                cidade,
            },
        };
    }
};
exports.CidadesService = CidadesService;
exports.CidadesService = CidadesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CidadesService);
//# sourceMappingURL=cidades.service.js.map