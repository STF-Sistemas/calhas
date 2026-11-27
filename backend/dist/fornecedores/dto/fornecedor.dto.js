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
exports.FornecedorDto = void 0;
const class_validator_1 = require("class-validator");
const validadores_1 = require("../../common/validadores");
class FornecedorDto {
    razao_social;
    nome_fantasia;
    cnpj;
    ie;
    iest;
    im;
    crt;
    email;
    fone;
    nome_vendedor;
    fone_vendedor;
    cep;
    logradouro;
    numero;
    complemento;
    bairro;
    cod_cidade;
}
exports.FornecedorDto = FornecedorDto;
__decorate([
    (0, validadores_1.Texto)(200, 'Razão social é obrigatória.'),
    __metadata("design:type", String)
], FornecedorDto.prototype, "razao_social", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(200),
    __metadata("design:type", Object)
], FornecedorDto.prototype, "nome_fantasia", void 0);
__decorate([
    (0, class_validator_1.Length)(14, 14, { message: 'CNPJ deve ter 14 dígitos numéricos' }),
    (0, class_validator_1.Matches)(/^\d{14}$/, { message: 'CNPJ deve ter 14 dígitos numéricos' }),
    __metadata("design:type", String)
], FornecedorDto.prototype, "cnpj", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(20),
    __metadata("design:type", Object)
], FornecedorDto.prototype, "ie", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(20),
    __metadata("design:type", Object)
], FornecedorDto.prototype, "iest", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(20),
    __metadata("design:type", Object)
], FornecedorDto.prototype, "im", void 0);
__decorate([
    (0, validadores_1.Inteiro)({ opcional: true, min: 1, max: 3, mensagem: 'CRT inválido.' }),
    __metadata("design:type", Number)
], FornecedorDto.prototype, "crt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_o, v) => v !== ''),
    (0, class_validator_1.IsEmail)({}, { message: 'E-mail inválido.' }),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", Object)
], FornecedorDto.prototype, "email", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(20),
    __metadata("design:type", Object)
], FornecedorDto.prototype, "fone", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(200),
    __metadata("design:type", Object)
], FornecedorDto.prototype, "nome_vendedor", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(20),
    __metadata("design:type", Object)
], FornecedorDto.prototype, "fone_vendedor", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(8),
    __metadata("design:type", Object)
], FornecedorDto.prototype, "cep", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(200),
    __metadata("design:type", Object)
], FornecedorDto.prototype, "logradouro", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(20),
    __metadata("design:type", Object)
], FornecedorDto.prototype, "numero", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(100),
    __metadata("design:type", Object)
], FornecedorDto.prototype, "complemento", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(100),
    __metadata("design:type", Object)
], FornecedorDto.prototype, "bairro", void 0);
__decorate([
    (0, validadores_1.Id)(true, 'Cidade inválida.'),
    __metadata("design:type", Object)
], FornecedorDto.prototype, "cod_cidade", void 0);
//# sourceMappingURL=fornecedor.dto.js.map