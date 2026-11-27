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
exports.EmpresasController = void 0;
const common_1 = require("@nestjs/common");
const decorators_1 = require("../common/decorators");
const validadores_1 = require("../common/validadores");
const empresa_dto_1 = require("./dto/empresa.dto");
const empresas_service_1 = require("./empresas.service");
let EmpresasController = class EmpresasController {
    empresas;
    constructor(empresas) {
        this.empresas = empresas;
    }
    listar() {
        return this.empresas.listar();
    }
    buscar(id, usuario) {
        return this.empresas.buscar(id, usuario);
    }
    criar(dto) {
        return this.empresas.criar(dto);
    }
    atualizar(id, dto, usuario) {
        return this.empresas.atualizar(id, dto, usuario);
    }
    atualizarValidade(id, dto) {
        return this.empresas.atualizarValidade(id, dto);
    }
    excluir(id) {
        return this.empresas.excluir(id);
    }
};
exports.EmpresasController = EmpresasController;
__decorate([
    (0, decorators_1.ApenasSuperAdmin)(),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EmpresasController.prototype, "listar", null);
__decorate([
    (0, decorators_1.ApenasAdmin)(),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, decorators_1.UsuarioAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], EmpresasController.prototype, "buscar", null);
__decorate([
    (0, decorators_1.ApenasSuperAdmin)(),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [empresa_dto_1.EmpresaDto]),
    __metadata("design:returntype", void 0)
], EmpresasController.prototype, "criar", null);
__decorate([
    (0, decorators_1.ApenasAdmin)(),
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.UsuarioAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, empresa_dto_1.EmpresaDto, Object]),
    __metadata("design:returntype", void 0)
], EmpresasController.prototype, "atualizar", null);
__decorate([
    (0, decorators_1.ApenasSuperAdmin)(),
    (0, common_1.Put)(':id/validade'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, empresa_dto_1.ValidadeDto]),
    __metadata("design:returntype", void 0)
], EmpresasController.prototype, "atualizarValidade", null);
__decorate([
    (0, decorators_1.ApenasSuperAdmin)(),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], EmpresasController.prototype, "excluir", null);
exports.EmpresasController = EmpresasController = __decorate([
    (0, common_1.Controller)('empresas'),
    __metadata("design:paramtypes", [empresas_service_1.EmpresasService])
], EmpresasController);
//# sourceMappingURL=empresas.controller.js.map