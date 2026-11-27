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
exports.ChapasController = void 0;
const common_1 = require("@nestjs/common");
const decorators_1 = require("../common/decorators");
const validadores_1 = require("../common/validadores");
const chapas_service_1 = require("./chapas.service");
const chapa_dto_1 = require("./dto/chapa.dto");
const corte_dto_1 = require("./dto/corte.dto");
const status_chapa_dto_1 = require("./dto/status-chapa.dto");
let ChapasController = class ChapasController {
    chapas;
    constructor(chapas) {
        this.chapas = chapas;
    }
    listar(codEmpresa) {
        return this.chapas.listar(codEmpresa);
    }
    buscar(id, codEmpresa) {
        return this.chapas.buscar(id, codEmpresa);
    }
    criar(dto, codEmpresa) {
        return this.chapas.criar(dto, codEmpresa);
    }
    atualizar(id, dto, codEmpresa) {
        return this.chapas.atualizar(id, dto, codEmpresa);
    }
    alterarStatus(id, dto, codEmpresa) {
        return this.chapas.alterarStatus(id, dto.status, codEmpresa);
    }
    excluir(id, codEmpresa) {
        return this.chapas.excluir(id, codEmpresa);
    }
    listarCortes(id, codEmpresa) {
        return this.chapas.listarCortes(id, codEmpresa);
    }
    criarCorte(id, dto, codEmpresa) {
        return this.chapas.criarCorte(id, dto, codEmpresa);
    }
    atualizarCorte(id, corteId, dto, codEmpresa) {
        return this.chapas.atualizarCorte(id, corteId, dto, codEmpresa);
    }
    excluirCorte(id, corteId, codEmpresa) {
        return this.chapas.excluirCorte(id, corteId, codEmpresa);
    }
};
exports.ChapasController = ChapasController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ChapasController.prototype, "listar", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], ChapasController.prototype, "buscar", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [chapa_dto_1.ChapaDto, Number]),
    __metadata("design:returntype", void 0)
], ChapasController.prototype, "criar", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, chapa_dto_1.ChapaDto, Number]),
    __metadata("design:returntype", void 0)
], ChapasController.prototype, "atualizar", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, status_chapa_dto_1.StatusChapaDto, Number]),
    __metadata("design:returntype", void 0)
], ChapasController.prototype, "alterarStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], ChapasController.prototype, "excluir", null);
__decorate([
    (0, common_1.Get)(':id/cortes'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], ChapasController.prototype, "listarCortes", null);
__decorate([
    (0, common_1.Post)(':id/cortes'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, corte_dto_1.CorteDto, Number]),
    __metadata("design:returntype", void 0)
], ChapasController.prototype, "criarCorte", null);
__decorate([
    (0, common_1.Put)(':id/cortes/:corteId'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, common_1.Param)('corteId', validadores_1.IdPipe)),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, corte_dto_1.CorteDto, Number]),
    __metadata("design:returntype", void 0)
], ChapasController.prototype, "atualizarCorte", null);
__decorate([
    (0, common_1.Delete)(':id/cortes/:corteId'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, common_1.Param)('corteId', validadores_1.IdPipe)),
    __param(2, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", void 0)
], ChapasController.prototype, "excluirCorte", null);
exports.ChapasController = ChapasController = __decorate([
    (0, common_1.Controller)('chapas'),
    __metadata("design:paramtypes", [chapas_service_1.ChapasService])
], ChapasController);
//# sourceMappingURL=chapas.controller.js.map