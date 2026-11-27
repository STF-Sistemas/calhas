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
exports.ProdutosService = void 0;
const common_1 = require("@nestjs/common");
const falha_1 = require("../common/falha");
const prisma_service_1 = require("../prisma/prisma.service");
const dadosProduto = (dto) => ({
    ...dto,
    custo: dto.custo ?? 0,
    markup: dto.markup ?? 0,
    origem: dto.origem ?? 0,
});
let ProdutosService = class ProdutosService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async obter(id, codEmpresa) {
        const produto = await this.prisma.produto.findFirst({ where: { id, cod_empresa: codEmpresa, excluido: false } });
        if (!produto)
            throw (0, falha_1.falha)(common_1.HttpStatus.NOT_FOUND, 'Produto não encontrado.');
        return produto;
    }
    async listar(codEmpresa) {
        const data = await this.prisma.produto.findMany({
            where: { cod_empresa: codEmpresa, excluido: false },
            orderBy: { descricao: 'asc' },
            take: 5000,
        });
        return { success: true, data };
    }
    async porCodigoFornecedor(codEmpresa, codFornecedorBruto, codigoBruto) {
        const codFornecedor = Number(codFornecedorBruto);
        const codigo = String(codigoBruto ?? '').trim().slice(0, 60);
        if (!Number.isInteger(codFornecedor) || codFornecedor <= 0 || !codigo) {
            throw (0, falha_1.falha)(common_1.HttpStatus.BAD_REQUEST, 'Parâmetros cod_fornecedor e codigo são obrigatórios.');
        }
        const vinculo = await this.prisma.produtoFornecedor.findFirst({
            where: { cod_fornecedor: codFornecedor, codigo_produto_fornecedor: codigo },
            include: { produto: true },
        });
        if (!vinculo || vinculo.produto.excluido || vinculo.produto.cod_empresa !== codEmpresa) {
            throw (0, falha_1.falha)(common_1.HttpStatus.NOT_FOUND, 'Produto não encontrado pelo código do fornecedor.');
        }
        return { success: true, data: vinculo.produto };
    }
    async porGtin(bruto, codEmpresa) {
        const gtin = String(bruto).trim().slice(0, 14);
        if (!gtin)
            throw (0, falha_1.falha)(common_1.HttpStatus.BAD_REQUEST, 'GTIN inválido.');
        const data = await this.prisma.produto.findFirst({ where: { gtin, cod_empresa: codEmpresa, excluido: false } });
        if (!data)
            throw (0, falha_1.falha)(common_1.HttpStatus.NOT_FOUND, 'Produto não encontrado pelo GTIN.');
        return { success: true, data };
    }
    async buscar(id, codEmpresa) {
        return { success: true, data: await this.obter(id, codEmpresa) };
    }
    async criar(dto, codEmpresa) {
        const data = await this.prisma.produto.create({
            data: { ...dadosProduto(dto), estoque_atual: dto.estoque_atual ?? 0, cod_empresa: codEmpresa },
        });
        return { success: true, data };
    }
    async atualizar(id, dto, codEmpresa) {
        await this.obter(id, codEmpresa);
        const { estoque_atual: _estoque, ...dados } = dadosProduto(dto);
        return { success: true, data: await this.prisma.produto.update({ where: { id }, data: dados }) };
    }
    async alterarStatus(id, status, codEmpresa) {
        await this.obter(id, codEmpresa);
        return { success: true, data: await this.prisma.produto.update({ where: { id }, data: { status } }) };
    }
    async excluir(id, codEmpresa) {
        await this.obter(id, codEmpresa);
        await this.prisma.produto.update({ where: { id }, data: { excluido: true } });
        return { success: true, message: 'Produto excluído.' };
    }
    async vincularCodigoFornecedor(id, dto, codEmpresa) {
        await this.obter(id, codEmpresa);
        const fornecedor = await this.prisma.fornecedor.findFirst({
            where: { id: dto.cod_fornecedor, cod_empresa: codEmpresa, excluido: false },
            select: { id: true },
        });
        if (!fornecedor)
            throw (0, falha_1.falha)(common_1.HttpStatus.NOT_FOUND, 'Fornecedor não encontrado.');
        const data = await this.prisma.produtoFornecedor.upsert({
            where: {
                cod_fornecedor_codigo_produto_fornecedor: { cod_fornecedor: dto.cod_fornecedor, codigo_produto_fornecedor: dto.codigo },
            },
            create: { cod_produto: id, cod_fornecedor: dto.cod_fornecedor, codigo_produto_fornecedor: dto.codigo },
            update: { cod_produto: id },
        });
        return { success: true, data };
    }
    async historicoCompras(id, codEmpresa) {
        await this.obter(id, codEmpresa);
        const itens = await this.prisma.compraItem.findMany({
            where: { cod_produto: id, excluido: false, compra: { cod_empresa: codEmpresa, excluido: false } },
            include: {
                compra: {
                    select: {
                        id: true,
                        numero_nfe: true,
                        serie: true,
                        data_emissao: true,
                        fornecedor: { select: { id: true, razao_social: true } },
                    },
                },
            },
            orderBy: { compra: { data_emissao: 'desc' } },
            take: 20,
        });
        const data = itens.map((item) => ({
            cod_compra: item.cod_compra,
            numero_nfe: item.compra.numero_nfe ?? '',
            serie: item.compra.serie ?? '',
            data_emissao: item.compra.data_emissao,
            fornecedor: item.compra.fornecedor?.razao_social ?? '',
            quantidade: Number(item.quantidade),
            valor_unitario: Number(item.valor_unitario),
            valor_total: Number(item.valor_total),
            custo_unitario: Number(item.custo_unitario),
        }));
        return { success: true, data };
    }
};
exports.ProdutosService = ProdutosService;
exports.ProdutosService = ProdutosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProdutosService);
//# sourceMappingURL=produtos.service.js.map