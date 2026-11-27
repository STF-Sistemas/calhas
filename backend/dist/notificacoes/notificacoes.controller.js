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
exports.NotificacoesController = void 0;
const common_1 = require("@nestjs/common");
const decorators_1 = require("../common/decorators");
const validadores_1 = require("../common/validadores");
const notificacoes_service_1 = require("./notificacoes.service");
let NotificacoesController = class NotificacoesController {
    notificacoes;
    constructor(notificacoes) {
        this.notificacoes = notificacoes;
    }
    listar(codEmpresa, apenasNaoLidas) {
        return this.notificacoes.listar(codEmpresa, apenasNaoLidas === 'true');
    }
    contagem(codEmpresa) {
        return this.notificacoes.contagem(codEmpresa);
    }
    marcarTodas(codEmpresa) {
        return this.notificacoes.marcarTodas(codEmpresa);
    }
    marcarLida(id, codEmpresa) {
        return this.notificacoes.marcarLida(id, codEmpresa);
    }
};
exports.NotificacoesController = NotificacoesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, decorators_1.EmpresaAtual)()),
    __param(1, (0, common_1.Query)('apenasNaoLidas')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", void 0)
], NotificacoesController.prototype, "listar", null);
__decorate([
    (0, common_1.Get)('nao-lidas/contagem'),
    __param(0, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], NotificacoesController.prototype, "contagem", null);
__decorate([
    (0, common_1.Patch)('marcar-todas-lidas'),
    __param(0, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], NotificacoesController.prototype, "marcarTodas", null);
__decorate([
    (0, common_1.Patch)(':id/lida'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], NotificacoesController.prototype, "marcarLida", null);
exports.NotificacoesController = NotificacoesController = __decorate([
    (0, common_1.Controller)('notificacoes'),
    __metadata("design:paramtypes", [notificacoes_service_1.NotificacoesService])
], NotificacoesController);
//# sourceMappingURL=notificacoes.controller.js.map