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
exports.PedidosPublicoController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const decorators_1 = require("../common/decorators");
const autorizar_dto_1 = require("./dto/autorizar.dto");
const recusar_dto_1 = require("./dto/recusar.dto");
const pedidos_publico_service_1 = require("./pedidos-publico.service");
const QUINZE_MIN = 15 * 60 * 1000;
let PedidosPublicoController = class PedidosPublicoController {
    pedidos;
    constructor(pedidos) {
        this.pedidos = pedidos;
    }
    buscar(token) {
        return this.pedidos.buscar(token);
    }
    autorizar(token, dto, ip) {
        return this.pedidos.autorizar(token, dto.assinatura, ip);
    }
    recusar(token, dto, ip) {
        return this.pedidos.recusar(token, dto.motivo, ip);
    }
};
exports.PedidosPublicoController = PedidosPublicoController;
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 60, ttl: QUINZE_MIN } }),
    (0, common_1.Get)(':token'),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PedidosPublicoController.prototype, "buscar", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 20, ttl: QUINZE_MIN } }),
    (0, common_1.Post)(':token/autorizar'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, autorizar_dto_1.AutorizarDto, String]),
    __metadata("design:returntype", void 0)
], PedidosPublicoController.prototype, "autorizar", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 20, ttl: QUINZE_MIN } }),
    (0, common_1.Post)(':token/recusar'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, recusar_dto_1.RecusarDto, String]),
    __metadata("design:returntype", void 0)
], PedidosPublicoController.prototype, "recusar", null);
exports.PedidosPublicoController = PedidosPublicoController = __decorate([
    (0, decorators_1.Publico)(),
    (0, common_1.Controller)('pedidos-publico'),
    __metadata("design:paramtypes", [pedidos_publico_service_1.PedidosPublicoService])
], PedidosPublicoController);
//# sourceMappingURL=pedidos-publico.controller.js.map