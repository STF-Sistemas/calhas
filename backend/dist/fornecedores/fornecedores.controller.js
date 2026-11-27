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
exports.FornecedoresController = void 0;
const common_1 = require("@nestjs/common");
const decorators_1 = require("../common/decorators");
const validadores_1 = require("../common/validadores");
const fornecedor_dto_1 = require("./dto/fornecedor.dto");
const status_fornecedor_dto_1 = require("./dto/status-fornecedor.dto");
const fornecedores_service_1 = require("./fornecedores.service");
let FornecedoresController = class FornecedoresController {
    fornecedores;
    constructor(fornecedores) {
        this.fornecedores = fornecedores;
    }
    listar(codEmpresa, q) {
        return this.fornecedores.listar(codEmpresa, q);
    }
    porCnpj(cnpj, codEmpresa) {
        return this.fornecedores.porCnpj(cnpj, codEmpresa);
    }
    buscar(id, codEmpresa) {
        return this.fornecedores.buscar(id, codEmpresa);
    }
    criar(dto, codEmpresa) {
        return this.fornecedores.criar(dto, codEmpresa);
    }
    atualizar(id, dto, codEmpresa) {
        return this.fornecedores.atualizar(id, dto, codEmpresa);
    }
    alterarStatus(id, dto, codEmpresa) {
        return this.fornecedores.alterarStatus(id, dto.status, codEmpresa);
    }
    excluir(id, codEmpresa) {
        return this.fornecedores.excluir(id, codEmpresa);
    }
};
exports.FornecedoresController = FornecedoresController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, decorators_1.EmpresaAtual)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], FornecedoresController.prototype, "listar", null);
__decorate([
    (0, common_1.Get)('por-cnpj/:cnpj'),
    __param(0, (0, common_1.Param)('cnpj')),
    __param(1, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], FornecedoresController.prototype, "porCnpj", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], FornecedoresController.prototype, "buscar", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fornecedor_dto_1.FornecedorDto, Number]),
    __metadata("design:returntype", void 0)
], FornecedoresController.prototype, "criar", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, fornecedor_dto_1.FornecedorDto, Number]),
    __metadata("design:returntype", void 0)
], FornecedoresController.prototype, "atualizar", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, status_fornecedor_dto_1.StatusFornecedorDto, Number]),
    __metadata("design:returntype", void 0)
], FornecedoresController.prototype, "alterarStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], FornecedoresController.prototype, "excluir", null);
exports.FornecedoresController = FornecedoresController = __decorate([
    (0, common_1.Controller)('fornecedores'),
    __metadata("design:paramtypes", [fornecedores_service_1.FornecedoresService])
], FornecedoresController);
//# sourceMappingURL=fornecedores.controller.js.map