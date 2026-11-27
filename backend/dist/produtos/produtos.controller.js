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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProdutosController = void 0;
const common_1 = require("@nestjs/common");
const decorators_1 = require("../common/decorators");
const validadores_1 = require("../common/validadores");
const codigo_fornecedor_dto_1 = require("./dto/codigo-fornecedor.dto");
const produto_dto_1 = require("./dto/produto.dto");
const status_produto_dto_1 = require("./dto/status-produto.dto");
const produtos_service_1 = require("./produtos.service");
let ProdutosController = class ProdutosController {
    produtos;
    constructor(produtos) {
        this.produtos = produtos;
    }
    listar(codEmpresa) {
        return this.produtos.listar(codEmpresa);
    }
    porCodigoFornecedor(codEmpresa, codFornecedor, codigo) {
        return this.produtos.porCodigoFornecedor(codEmpresa, codFornecedor, codigo);
    }
    porGtin(gtin, codEmpresa) {
        return this.produtos.porGtin(gtin, codEmpresa);
    }
    buscar(id, codEmpresa) {
        return this.produtos.buscar(id, codEmpresa);
    }
    criar(dto, codEmpresa) {
        return this.produtos.criar(dto, codEmpresa);
    }
    atualizar(id, dto, codEmpresa) {
        return this.produtos.atualizar(id, dto, codEmpresa);
    }
    alterarStatus(id, dto, codEmpresa) {
        return this.produtos.alterarStatus(id, dto.status, codEmpresa);
    }
    excluir(id, codEmpresa) {
        return this.produtos.excluir(id, codEmpresa);
    }
    vincularCodigoFornecedor(id, dto, codEmpresa) {
        return this.produtos.vincularCodigoFornecedor(id, dto, codEmpresa);
    }
    historicoCompras(id, codEmpresa) {
        return this.produtos.historicoCompras(id, codEmpresa);
    }
};
exports.ProdutosController = ProdutosController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ProdutosController.prototype, "listar", null);
__decorate([
    (0, common_1.Get)('por-codigo-fornecedor'),
    __param(0, (0, decorators_1.EmpresaAtual)()),
    __param(1, (0, common_1.Query)('cod_fornecedor')),
    __param(2, (0, common_1.Query)('codigo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String]),
    __metadata("design:returntype", void 0)
], ProdutosController.prototype, "porCodigoFornecedor", null);
__decorate([
    (0, common_1.Get)('por-gtin/:gtin'),
    __param(0, (0, common_1.Param)('gtin')),
    __param(1, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], ProdutosController.prototype, "porGtin", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], ProdutosController.prototype, "buscar", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [produto_dto_1.ProdutoDto, Number]),
    __metadata("design:returntype", void 0)
], ProdutosController.prototype, "criar", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, produto_dto_1.ProdutoDto, Number]),
    __metadata("design:returntype", void 0)
], ProdutosController.prototype, "atualizar", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, status_produto_dto_1.StatusProdutoDto, Number]),
    __metadata("design:returntype", void 0)
], ProdutosController.prototype, "alterarStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], ProdutosController.prototype, "excluir", null);
__decorate([
    (0, common_1.Post)(':id/codigo-fornecedor'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, codigo_fornecedor_dto_1.CodigoFornecedorDto, Number]),
    __metadata("design:returntype", void 0)
], ProdutosController.prototype, "vincularCodigoFornecedor", null);
__decorate([
    (0, common_1.Get)(':id/historico-compras'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], ProdutosController.prototype, "historicoCompras", null);
exports.ProdutosController = ProdutosController = __decorate([
    (0, common_1.Controller)('produtos'),
    __metadata("design:paramtypes", [produtos_service_1.ProdutosService])
], ProdutosController);
//# sourceMappingURL=produtos.controller.js.map