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
exports.ComprasController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const decorators_1 = require("../common/decorators");
const falha_1 = require("../common/falha");
const validadores_1 = require("../common/validadores");
const compra_dto_1 = require("./dto/compra.dto");
const compras_service_1 = require("./compras.service");
let ComprasController = class ComprasController {
    compras;
    constructor(compras) {
        this.compras = compras;
    }
    listar(codEmpresa, q) {
        return this.compras.listar(codEmpresa, q);
    }
    importarXml(arquivo, codEmpresa) {
        if (!arquivo?.buffer)
            throw (0, falha_1.falha)(common_1.HttpStatus.BAD_REQUEST, 'Arquivo XML não enviado.');
        return this.compras.importarXml(arquivo.buffer.toString('utf-8'), codEmpresa);
    }
    danfe(id, codEmpresa) {
        return this.compras.danfe(id, codEmpresa);
    }
    buscar(id, codEmpresa) {
        return this.compras.buscar(id, codEmpresa);
    }
    criar(dto, codEmpresa) {
        return this.compras.criar(dto, codEmpresa);
    }
    atualizar(id, dto, codEmpresa) {
        return this.compras.atualizar(id, dto, codEmpresa);
    }
    alterarStatus(id, dto, codEmpresa) {
        return this.compras.alterarStatus(id, dto.status, dto.motivo_cancelamento, codEmpresa);
    }
    atualizarCusto(id, codEmpresa) {
        return this.compras.atualizarCusto(id, codEmpresa);
    }
    excluir(id, codEmpresa) {
        return this.compras.excluir(id, codEmpresa);
    }
};
exports.ComprasController = ComprasController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, decorators_1.EmpresaAtual)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], ComprasController.prototype, "listar", null);
__decorate([
    (0, common_1.Post)('importar-xml'),
    (0, common_1.HttpCode)(200),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('arquivo', { limits: { fileSize: 5 * 1024 * 1024, files: 1 } })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], ComprasController.prototype, "importarXml", null);
__decorate([
    (0, common_1.Get)(':id/danfe-data'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], ComprasController.prototype, "danfe", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], ComprasController.prototype, "buscar", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [compra_dto_1.CompraDto, Number]),
    __metadata("design:returntype", void 0)
], ComprasController.prototype, "criar", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, compra_dto_1.CompraDto, Number]),
    __metadata("design:returntype", void 0)
], ComprasController.prototype, "atualizar", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, compra_dto_1.StatusCompraDto, Number]),
    __metadata("design:returntype", void 0)
], ComprasController.prototype, "alterarStatus", null);
__decorate([
    (0, common_1.Post)(':id/atualizar-custo'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], ComprasController.prototype, "atualizarCusto", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], ComprasController.prototype, "excluir", null);
exports.ComprasController = ComprasController = __decorate([
    (0, common_1.Controller)('compras'),
    __metadata("design:paramtypes", [compras_service_1.ComprasService])
], ComprasController);
//# sourceMappingURL=compras.controller.js.map