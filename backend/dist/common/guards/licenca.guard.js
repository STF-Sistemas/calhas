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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicencaGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const decorators_1 = require("../decorators");
const falha_1 = require("../falha");
let LicencaGuard = class LicencaGuard {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(ctx) {
        const alvos = [ctx.getHandler(), ctx.getClass()];
        if (this.reflector.getAllAndOverride(decorators_1.ROTA_PUBLICA, alvos))
            return true;
        if (this.reflector.getAllAndOverride(decorators_1.SEM_LICENCA, alvos))
            return true;
        const req = ctx.switchToHttp().getRequest();
        const usuario = req.user;
        if (!usuario || usuario.super_admin || !usuario.cod_empresa)
            return true;
        const empresa = req.licenca;
        if (!empresa || empresa.excluido || empresa.ativo !== 1) {
            throw (0, falha_1.falha)(common_1.HttpStatus.FORBIDDEN, 'Empresa inativa.', { code: 'EMPRESA_INATIVA' });
        }
        if (empresa.data_expiracao && new Date() > new Date(empresa.data_expiracao)) {
            throw (0, falha_1.falha)(common_1.HttpStatus.PAYMENT_REQUIRED, 'Licença expirada. Efetue o pagamento para continuar.', {
                code: 'LICENCA_EXPIRADA',
            });
        }
        return true;
    }
};
exports.LicencaGuard = LicencaGuard;
exports.LicencaGuard = LicencaGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], LicencaGuard);
//# sourceMappingURL=licenca.guard.js.map