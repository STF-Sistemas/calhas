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
var PagamentosController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PagamentosController = void 0;
const common_1 = require("@nestjs/common");
const decorators_1 = require("../common/decorators");
const validadores_1 = require("../common/validadores");
const pagamentos_service_1 = require("./pagamentos.service");
let PagamentosController = PagamentosController_1 = class PagamentosController {
    pagamentos;
    logger = new common_1.Logger(PagamentosController_1.name);
    constructor(pagamentos) {
        this.pagamentos = pagamentos;
    }
    criarPix(usuario) {
        return this.pagamentos.criarPix(usuario.cod_empresa);
    }
    status(id, usuario) {
        return this.pagamentos.status(id, usuario.cod_empresa);
    }
    async webhook(corpo) {
        try {
            await this.pagamentos.webhook(corpo);
        }
        catch (erro) {
            this.logger.error(`Webhook: ${erro.message}`);
        }
        return { success: true };
    }
    confirmar(id) {
        return this.pagamentos.confirmarManual(id);
    }
    pendentes() {
        return this.pagamentos.pendentes();
    }
};
exports.PagamentosController = PagamentosController;
__decorate([
    (0, common_1.Post)('pix/criar'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, decorators_1.UsuarioAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PagamentosController.prototype, "criarPix", null);
__decorate([
    (0, common_1.Get)('pix/status/:id'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, decorators_1.UsuarioAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], PagamentosController.prototype, "status", null);
__decorate([
    (0, decorators_1.Publico)(),
    (0, common_1.Post)('webhook'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PagamentosController.prototype, "webhook", null);
__decorate([
    (0, decorators_1.ApenasSuperAdmin)(),
    (0, common_1.Put)('confirmar/:id'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PagamentosController.prototype, "confirmar", null);
__decorate([
    (0, decorators_1.ApenasSuperAdmin)(),
    (0, common_1.Get)('pendentes'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PagamentosController.prototype, "pendentes", null);
exports.PagamentosController = PagamentosController = PagamentosController_1 = __decorate([
    (0, decorators_1.SemLicenca)(),
    (0, common_1.Controller)('pagamentos'),
    __metadata("design:paramtypes", [pagamentos_service_1.PagamentosService])
], PagamentosController);
//# sourceMappingURL=pagamentos.controller.js.map