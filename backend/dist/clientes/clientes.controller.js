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
exports.ClientesController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const decorators_1 = require("../common/decorators");
const validadores_1 = require("../common/validadores");
const clientes_service_1 = require("./clientes.service");
const cliente_dto_1 = require("./dto/cliente.dto");
let ClientesController = class ClientesController {
    clientes;
    constructor(clientes) {
        this.clientes = clientes;
    }
    listar(codEmpresa, q) {
        return this.clientes.listar(codEmpresa, q);
    }
    consultarReceita(cpfCnpj) {
        return this.clientes.consultarReceita(cpfCnpj);
    }
    buscar(id, codEmpresa) {
        return this.clientes.buscar(id, codEmpresa);
    }
    criar(dto, codEmpresa) {
        return this.clientes.criar(dto, codEmpresa);
    }
    atualizar(id, dto, codEmpresa) {
        return this.clientes.atualizar(id, dto, codEmpresa);
    }
    excluir(id, codEmpresa) {
        return this.clientes.excluir(id, codEmpresa);
    }
};
exports.ClientesController = ClientesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, decorators_1.EmpresaAtual)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], ClientesController.prototype, "listar", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 30, ttl: 15 * 60 * 1000 } }),
    (0, common_1.Get)('consultar-receita/:cpfcnpj'),
    __param(0, (0, common_1.Param)('cpfcnpj')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ClientesController.prototype, "consultarReceita", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], ClientesController.prototype, "buscar", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cliente_dto_1.ClienteDto, Number]),
    __metadata("design:returntype", void 0)
], ClientesController.prototype, "criar", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, cliente_dto_1.ClienteDto, Number]),
    __metadata("design:returntype", void 0)
], ClientesController.prototype, "atualizar", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, decorators_1.EmpresaAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], ClientesController.prototype, "excluir", null);
exports.ClientesController = ClientesController = __decorate([
    (0, common_1.Controller)('clientes'),
    __metadata("design:paramtypes", [clientes_service_1.ClientesService])
], ClientesController);
//# sourceMappingURL=clientes.controller.js.map