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
exports.ClienteDto = void 0;
const class_validator_1 = require("class-validator");
const validadores_1 = require("../../common/validadores");
class ClienteDto {
    razao_social;
    nome_fantasia;
    cpf_cnpj;
    email;
    telefone;
    ativo;
    cep;
    endereco;
    numero;
    bairro;
    complemento;
    cod_cidade;
    observacoes;
}
exports.ClienteDto = ClienteDto;
__decorate([
    (0, validadores_1.Texto)(200, 'Razão social é obrigatória.'),
    __metadata("design:type", String)
], ClienteDto.prototype, "razao_social", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(200),
    __metadata("design:type", Object)
], ClienteDto.prototype, "nome_fantasia", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(20),
    __metadata("design:type", Object)
], ClienteDto.prototype, "cpf_cnpj", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_o, v) => v !== ''),
    (0, class_validator_1.IsEmail)({}, { message: 'E-mail inválido.' }),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", Object)
], ClienteDto.prototype, "email", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(20),
    __metadata("design:type", Object)
], ClienteDto.prototype, "telefone", void 0);
__decorate([
    (0, validadores_1.Inteiro)({ opcional: true, min: 1, max: 2, mensagem: 'Status inválido.' }),
    __metadata("design:type", Number)
], ClienteDto.prototype, "ativo", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(10),
    __metadata("design:type", Object)
], ClienteDto.prototype, "cep", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(200),
    __metadata("design:type", Object)
], ClienteDto.prototype, "endereco", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(10),
    __metadata("design:type", Object)
], ClienteDto.prototype, "numero", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(100),
    __metadata("design:type", Object)
], ClienteDto.prototype, "bairro", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(100),
    __metadata("design:type", Object)
], ClienteDto.prototype, "complemento", void 0);
__decorate([
    (0, validadores_1.Id)(true, 'Cidade inválida.'),
    __metadata("design:type", Object)
], ClienteDto.prototype, "cod_cidade", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(5000),
    __metadata("design:type", Object)
], ClienteDto.prototype, "observacoes", void 0);
//# sourceMappingURL=cliente.dto.js.map