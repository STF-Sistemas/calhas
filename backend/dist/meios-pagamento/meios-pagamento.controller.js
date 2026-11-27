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
exports.MeiosPagamentoController = void 0;
const common_1 = require("@nestjs/common");
const decorators_1 = require("../common/decorators");
const validadores_1 = require("../common/validadores");
const meio_pagamento_dto_1 = require("./dto/meio-pagamento.dto");
const status_meio_pagamento_dto_1 = require("./dto/status-meio-pagamento.dto");
const meios_pagamento_service_1 = require("./meios-pagamento.service");
let MeiosPagamentoController = class MeiosPagamentoController {
    meios;
    constructor(meios) {
        this.meios = meios;
    }
    listar(codEmpresa) {
        return this.meios.listar(codEmpresa);
    }
    buscar(id, codEmpresa) {
        return this.meios.buscar(id, codEmpresa);
    }
    criar(dto, codEmpresa) {
        return this.meios.criar(dto, codEmpresa);
    }
    atualizar(id, dto, codEmpresa) {
        return this.meios.atualizar(id, dto, codEmpresa);
    }
    alterarStatus(id, dto, codEmpresa) {
        return this.meios.alterarStatus(id, dto.status, codEmpresa);
    }
    excluir(id, codEmpresa) {
        return this.meios.excluir(id, codEmpresa);
    }
};
exports.MeiosPagamentoController = MeiosPagamentoController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], MeiosPagamentoController.prototype, "listar", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], MeiosPagamentoController.prototype, "buscar", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [meio_pagamento_dto_1.MeioPagamentoDto, Number]),
    __metadata("design:returntype", void 0)
], MeiosPagamentoController.prototype, "criar", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, meio_pagamento_dto_1.MeioPagamentoDto, Number]),
    __metadata("design:returntype", void 0)
], MeiosPagamentoController.prototype, "atualizar", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, status_meio_pagamento_dto_1.StatusMeioPagamentoDto, Number]),
    __metadata("design:returntype", void 0)
], MeiosPagamentoController.prototype, "alterarStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], MeiosPagamentoController.prototype, "excluir", null);
exports.MeiosPagamentoController = MeiosPagamentoController = __decorate([
    (0, common_1.Controller)('meios-pagamento'),
    __metadata("design:paramtypes", [meios_pagamento_service_1.MeiosPagamentoService])
], MeiosPagamentoController);
//# sourceMappingURL=meios-pagamento.controller.js.map