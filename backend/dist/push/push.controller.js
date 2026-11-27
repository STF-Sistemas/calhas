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
exports.PushController = void 0;
const common_1 = require("@nestjs/common");
const decorators_1 = require("../common/decorators");
const cancelar_push_dto_1 = require("./dto/cancelar-push.dto");
const inscrever_push_dto_1 = require("./dto/inscrever-push.dto");
const push_service_1 = require("./push.service");
let PushController = class PushController {
    push;
    constructor(push) {
        this.push = push;
    }
    inscrever(dto, usuario, agente) {
        return this.push.inscrever(usuario.id, dto.endpoint, dto.keys, agente);
    }
    cancelar(dto, usuario) {
        return this.push.cancelar(usuario.id, dto.endpoint);
    }
    chavePublica() {
        return this.push.chavePublica();
    }
    status(usuario) {
        return this.push.status(usuario.id);
    }
};
exports.PushController = PushController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.UsuarioAtual)()),
    __param(2, (0, common_1.Headers)('user-agent')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inscrever_push_dto_1.InscreverPushDto, Object, String]),
    __metadata("design:returntype", void 0)
], PushController.prototype, "inscrever", null);
__decorate([
    (0, common_1.Delete)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.UsuarioAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cancelar_push_dto_1.CancelarPushDto, Object]),
    __metadata("design:returntype", void 0)
], PushController.prototype, "cancelar", null);
__decorate([
    (0, common_1.Get)('vapid-public-key'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PushController.prototype, "chavePublica", null);
__decorate([
    (0, common_1.Get)('status'),
    __param(0, (0, decorators_1.UsuarioAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PushController.prototype, "status", null);
exports.PushController = PushController = __decorate([
    (0, common_1.Controller)('push-subscription'),
    __metadata("design:paramtypes", [push_service_1.PushService])
], PushController);
//# sourceMappingURL=push.controller.js.map