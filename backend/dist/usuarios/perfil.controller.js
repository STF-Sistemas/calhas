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
exports.PerfilController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const decorators_1 = require("../common/decorators");
const alterar_senha_dto_1 = require("./dto/alterar-senha.dto");
const perfil_dto_1 = require("./dto/perfil.dto");
const perfil_service_1 = require("./perfil.service");
let PerfilController = class PerfilController {
    perfil;
    constructor(perfil) {
        this.perfil = perfil;
    }
    buscar(usuario) {
        return this.perfil.buscar(usuario.id);
    }
    atualizar(dto, usuario) {
        return this.perfil.atualizar(dto, usuario.id);
    }
    alterarSenha(dto, usuario) {
        return this.perfil.alterarSenha(dto, usuario.id);
    }
};
exports.PerfilController = PerfilController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, decorators_1.UsuarioAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PerfilController.prototype, "buscar", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 15 * 60 * 1000 } }),
    (0, common_1.Put)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.UsuarioAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [perfil_dto_1.PerfilDto, Object]),
    __metadata("design:returntype", void 0)
], PerfilController.prototype, "atualizar", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 15 * 60 * 1000 } }),
    (0, common_1.Put)('senha'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.UsuarioAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [alterar_senha_dto_1.AlterarSenhaDto, Object]),
    __metadata("design:returntype", void 0)
], PerfilController.prototype, "alterarSenha", null);
exports.PerfilController = PerfilController = __decorate([
    (0, common_1.Controller)('perfil'),
    __metadata("design:paramtypes", [perfil_service_1.PerfilService])
], PerfilController);
//# sourceMappingURL=perfil.controller.js.map