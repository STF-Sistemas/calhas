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
exports.OrdemCortePublicoService = void 0;
const common_1 = require("@nestjs/common");
const enums_1 = require("../shared/enums");
const falha_1 = require("../common/falha");
const prisma_service_1 = require("../prisma/prisma.service");
const TOKEN_VALIDO = /^[A-Za-z0-9-]{16,100}$/;
let OrdemCortePublicoService = class OrdemCortePublicoService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async buscar(token) {
        const pedido = typeof token === 'string' && TOKEN_VALIDO.test(token)
            ? await this.prisma.pedido.findFirst({
                where: { token_acesso_corte: token, excluido: false },
                include: {
                    empresa: true,
                    cliente: true,
                    itens: { include: { produto: true, corte: { include: { chapa: true } }, desenho: true } },
                },
            })
            : null;
        if (!pedido)
            throw (0, falha_1.falha)(common_1.HttpStatus.NOT_FOUND, 'Link inválido ou não encontrado.', { code: 'NOT_FOUND' });
        if (pedido.status === enums_1.EStatusPedido.Cancelado) {
            throw (0, falha_1.falha)(common_1.HttpStatus.GONE, 'Este pedido foi cancelado.', { code: 'CANCELLED' });
        }
        if (!pedido.token_expiracao_corte || new Date() > new Date(pedido.token_expiracao_corte)) {
            throw (0, falha_1.falha)(common_1.HttpStatus.GONE, 'Link de acesso expirado.', { code: 'EXPIRED' });
        }
        const selecionados = Array.isArray(pedido.itens_corte_selecionados)
            ? pedido.itens_corte_selecionados
            : null;
        const itens = pedido.itens
            .filter((item) => item.tipo === enums_1.ETipoItemPedido.Corte || item.tipo === enums_1.ETipoItemPedido.Produto)
            .filter((item) => !selecionados || selecionados.includes(item.id))
            .sort((a, b) => a.tipo - b.tipo)
            .map((item) => ({
            id: item.id,
            tipo: item.tipo,
            quantidade: Number(item.quantidade),
            observacoes: item.observacoes,
            medidas: item.medidas ?? [],
            produto: item.produto
                ? { descricao: item.produto.descricao, unidade_medida: item.produto.unidade_medida }
                : null,
            corte: item.corte
                ? {
                    descricao: item.corte.descricao,
                    corte: Number(item.corte.corte),
                    chapa: item.corte.chapa ? { descricao: item.corte.chapa.descricao } : null,
                }
                : null,
            desenho: item.desenho
                ? { descricao: item.desenho.descricao, pontos: item.desenho.pontos, diagonais: item.desenho.diagonais }
                : Array.isArray(item.desenho_pontos) && item.desenho_pontos.length >= 2
                    ? {
                        descricao: 'Desenho livre',
                        pontos: item.desenho_pontos,
                        diagonais: Array.isArray(item.desenho_diagonais) ? item.desenho_diagonais : [],
                    }
                    : null,
        }));
        if (itens.length === 0) {
            throw (0, falha_1.falha)(common_1.HttpStatus.NOT_FOUND, 'Este pedido não possui itens disponíveis para envio.', { code: 'NOT_FOUND' });
        }
        const { empresa } = pedido;
        return {
            success: true,
            data: {
                id: pedido.id,
                data_pedido: pedido.data_pedido,
                empresa: {
                    razao_social: empresa.razao_social,
                    nome_fantasia: empresa.nome_fantasia,
                    cnpj: empresa.cnpj,
                    telefone: empresa.telefone,
                    email: empresa.email,
                    logo_url: empresa.logo_url,
                    marca_dagua: empresa.marca_dagua,
                },
                cliente: { razao_social: pedido.cliente.razao_social },
                itens,
            },
        };
    }
};
exports.OrdemCortePublicoService = OrdemCortePublicoService;
exports.OrdemCortePublicoService = OrdemCortePublicoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrdemCortePublicoService);
//# sourceMappingURL=ordem-corte-publico.service.js.map