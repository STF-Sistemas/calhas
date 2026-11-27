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
exports.ServicosController = void 0;
const common_1 = require("@nestjs/common");
const decorators_1 = require("../common/decorators");
const validadores_1 = require("../common/validadores");
const servico_dto_1 = require("./dto/servico.dto");
const status_servico_dto_1 = require("./dto/status-servico.dto");
const servicos_service_1 = require("./servicos.service");
let ServicosController = class ServicosController {
    servicos;
    constructor(servicos) {
        this.servicos = servicos;
    }
    listar(codEmpresa) {
        return this.servicos.listar(codEmpresa);
    }
    buscar(id, codEmpresa) {
        return this.servicos.buscar(id, codEmpresa);
    }
    criar(dto, codEmpresa) {
        return this.servicos.criar(dto, codEmpresa);
    }
    atualizar(id, dto, codEmpresa) {
        return this.servicos.atualizar(id, dto, codEmpresa);
    }
    alterarStatus(id, dto, codEmpresa) {
        return this.servicos.alterarStatus(id, dto.status, codEmpresa);
    }
    excluir(id, codEmpresa) {
        return this.servicos.excluir(id, codEmpresa);
    }
};
exports.ServicosController = ServicosController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ServicosController.prototype, "listar", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], ServicosController.prototype, "buscar", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [servico_dto_1.ServicoDto, Number]),
    __metadata("design:returntype", void 0)
], ServicosController.prototype, "criar", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, servico_dto_1.ServicoDto, Number]),
    __metadata("design:returntype", void 0)
], ServicosController.prototype, "atualizar", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, status_servico_dto_1.StatusServicoDto, Number]),
    __metadata("design:returntype", void 0)
], ServicosController.prototype, "alterarStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], ServicosController.prototype, "excluir", null);
exports.ServicosController = ServicosController = __decorate([
    (0, common_1.Controller)('servicos'),
    __metadata("design:paramtypes", [servicos_service_1.ServicosService])
], ServicosController);
//# sourceMappingURL=servicos.controller.js.map