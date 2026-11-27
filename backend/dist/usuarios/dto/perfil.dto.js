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
exports.PerfilDto = void 0;
const class_validator_1 = require("class-validator");
const validadores_1 = require("../../common/validadores");
class PerfilDto {
    nome;
    email;
    senha_atual;
}
exports.PerfilDto = PerfilDto;
__decorate([
    (0, validadores_1.Texto)(150, 'Nome é obrigatório.'),
    __metadata("design:type", String)
], PerfilDto.prototype, "nome", void 0);
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: 'E-mail inválido.' }),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], PerfilDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Senha atual inválida.' }),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], PerfilDto.prototype, "senha_atual", void 0);
//# sourceMappingURL=perfil.dto.js.map