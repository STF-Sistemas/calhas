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
exports.PedidosController = void 0;
const common_1 = require("@nestjs/common");
const decorators_1 = require("../common/decorators");
const validadores_1 = require("../common/validadores");
const pedido_dto_1 = require("./dto/pedido.dto");
const pedidos_service_1 = require("./pedidos.service");
let PedidosController = class PedidosController {
    pedidos;
    constructor(pedidos) {
        this.pedidos = pedidos;
    }
    listar(codEmpresa, q) {
        return this.pedidos.listar(codEmpresa, q);
    }
    buscar(id, codEmpresa) {
        return this.pedidos.buscar(id, codEmpresa);
    }
    criar(dto, codEmpresa) {
        return this.pedidos.criar(dto, codEmpresa);
    }
    atualizar(id, dto, codEmpresa) {
        return this.pedidos.atualizar(id, dto, codEmpresa);
    }
    excluir(id, codEmpresa) {
        return this.pedidos.excluir(id, codEmpresa);
    }
    alterarStatus(id, dto, codEmpresa) {
        return this.pedidos.alterarStatus(id, dto.status, codEmpresa);
    }
    adicionarItem(id, dto, codEmpresa) {
        return this.pedidos.adicionarItem(id, dto, codEmpresa);
    }
    atualizarItem(id, itemId, dto, codEmpresa) {
        return this.pedidos.atualizarItem(id, itemId, dto, codEmpresa);
    }
    removerItem(id, itemId, codEmpresa) {
        return this.pedidos.removerItem(id, itemId, codEmpresa);
    }
    gerarLink(id, codEmpresa) {
        return this.pedidos.gerarLink(id, codEmpresa);
    }
    gerarLinkCorte(id, dto, codEmpresa) {
        return this.pedidos.gerarLinkCorte(id, dto.itens, codEmpresa);
    }
};
exports.PedidosController = PedidosController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, decorators_1.EmpresaAtual)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "listar", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "buscar", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pedido_dto_1.PedidoDto, Number]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "criar", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, pedido_dto_1.PedidoUpdateDto, Number]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "atualizar", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "excluir", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, pedido_dto_1.StatusPedidoDto, Number]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "alterarStatus", null);
__decorate([
    (0, common_1.Post)(':id/itens'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, pedido_dto_1.PedidoItemDto, Number]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "adicionarItem", null);
__decorate([
    (0, common_1.Put)(':id/itens/:itemId'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, common_1.Param)('itemId', validadores_1.IdPipe)),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, pedido_dto_1.PedidoItemDto, Number]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "atualizarItem", null);
__decorate([
    (0, common_1.Delete)(':id/itens/:itemId'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, common_1.Param)('itemId', validadores_1.IdPipe)),
    __param(2, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "removerItem", null);
__decorate([
    (0, common_1.Post)(':id/gerar-link'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "gerarLink", null);
__decorate([
    (0, common_1.Post)(':id/gerar-link-corte'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, pedido_dto_1.GerarLinkCorteDto, Number]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "gerarLinkCorte", null);
exports.PedidosController = PedidosController = __decorate([
    (0, common_1.Controller)('pedidos'),
    __metadata("design:paramtypes", [pedidos_service_1.PedidosService])
], PedidosController);
//# sourceMappingURL=pedidos.controller.js.map