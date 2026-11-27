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
exports.CepController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const cidades_service_1 = require("./cidades.service");
let CepController = class CepController {
    cidades;
    constructor(cidades) {
        this.cidades = cidades;
    }
    consultar(cep) {
        return this.cidades.consultarCep(cep);
    }
};
exports.CepController = CepController;
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 60, ttl: 15 * 60 * 1000 } }),
    (0, common_1.Get)(':cep'),
    __param(0, (0, common_1.Param)('cep')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CepController.prototype, "consultar", null);
exports.CepController = CepController = __decorate([
    (0, common_1.Controller)('cep'),
    __metadata("design:paramtypes", [cidades_service_1.CidadesService])
], CepController);
//# sourceMappingURL=cep.controller.js.map