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
exports.UsuariosController = void 0;
const common_1 = require("@nestjs/common");
const decorators_1 = require("../common/decorators");
const validadores_1 = require("../common/validadores");
const atualizar_usuario_dto_1 = require("./dto/atualizar-usuario.dto");
const criar_usuario_dto_1 = require("./dto/criar-usuario.dto");
const usuarios_service_1 = require("./usuarios.service");
let UsuariosController = class UsuariosController {
    usuarios;
    constructor(usuarios) {
        this.usuarios = usuarios;
    }
    listar(usuario) {
        return this.usuarios.listar(usuario);
    }
    buscar(id, usuario) {
        return this.usuarios.buscar(id, usuario);
    }
    criar(dto, usuario) {
        return this.usuarios.criar(dto, usuario);
    }
    atualizar(id, dto, usuario) {
        return this.usuarios.atualizar(id, dto, usuario);
    }
    excluir(id, usuario) {
        return this.usuarios.excluir(id, usuario);
    }
};
exports.UsuariosController = UsuariosController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, decorators_1.UsuarioAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsuariosController.prototype, "listar", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, decorators_1.UsuarioAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], UsuariosController.prototype, "buscar", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.UsuarioAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [criar_usuario_dto_1.CriarUsuarioDto, Object]),
    __metadata("design:returntype", void 0)
], UsuariosController.prototype, "criar", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.UsuarioAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, atualizar_usuario_dto_1.AtualizarUsuarioDto, Object]),
    __metadata("design:returntype", void 0)
], UsuariosController.prototype, "atualizar", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', validadores_1.IdPipe)),
    __param(1, (0, decorators_1.UsuarioAtual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], UsuariosController.prototype, "excluir", null);
exports.UsuariosController = UsuariosController = __decorate([
    (0, decorators_1.ApenasAdmin)(),
    (0, common_1.Controller)('usuarios'),
    __metadata("design:paramtypes", [usuarios_service_1.UsuariosService])
], UsuariosController);
//# sourceMappingURL=usuarios.controller.js.map