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
exports.ValidadeDto = exports.EmpresaDto = exports.MinhaEmpresaDto = void 0;
const class_validator_1 = require("class-validator");
const logo_functions_1 = require("../../shared/functions/logo.functions");
const validadores_1 = require("../../common/validadores");
const LogoValido = () => (0, class_validator_1.ValidateBy)({
    name: 'logoValido',
    validator: {
        validate: (valor) => valor === null || (typeof valor === 'string' && (0, logo_functions_1.isLogoDataUriValido)(valor)),
        defaultMessage: () => 'Logo inválido. Envie um arquivo PNG ou JPG de até 1MB.',
    },
});
class MinhaEmpresaDto {
    razao_social;
    nome_fantasia;
    cnpj;
    email;
    telefone;
    cep;
    endereco;
    numero;
    bairro;
    complemento;
    cod_cidade;
    marca_dagua;
    logo_url;
    validar_estoque;
    quantidade_desenho_por_folha;
    whatsapp_mensagem_padrao;
    link_validade_dias;
}
exports.MinhaEmpresaDto = MinhaEmpresaDto;
__decorate([
    (0, validadores_1.Texto)(200, 'Razão social é obrigatória.'),
    __metadata("design:type", String)
], MinhaEmpresaDto.prototype, "razao_social", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(200),
    __metadata("design:type", Object)
], MinhaEmpresaDto.prototype, "nome_fantasia", void 0);
__decorate([
    (0, validadores_1.Texto)(20, 'CNPJ é obrigatório.'),
    __metadata("design:type", String)
], MinhaEmpresaDto.prototype, "cnpj", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_o, v) => v !== ''),
    (0, class_validator_1.IsEmail)({}, { message: 'E-mail inválido.' }),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", Object)
], MinhaEmpresaDto.prototype, "email", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(20),
    __metadata("design:type", Object)
], MinhaEmpresaDto.prototype, "telefone", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(10),
    __metadata("design:type", Object)
], MinhaEmpresaDto.prototype, "cep", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(200),
    __metadata("design:type", Object)
], MinhaEmpresaDto.prototype, "endereco", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(10),
    __metadata("design:type", Object)
], MinhaEmpresaDto.prototype, "numero", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(100),
    __metadata("design:type", Object)
], MinhaEmpresaDto.prototype, "bairro", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(100),
    __metadata("design:type", Object)
], MinhaEmpresaDto.prototype, "complemento", void 0);
__decorate([
    (0, validadores_1.Id)(true, 'Cidade inválida.'),
    __metadata("design:type", Object)
], MinhaEmpresaDto.prototype, "cod_cidade", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(250),
    __metadata("design:type", Object)
], MinhaEmpresaDto.prototype, "marca_dagua", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    LogoValido(),
    __metadata("design:type", Object)
], MinhaEmpresaDto.prototype, "logo_url", void 0);
__decorate([
    (0, validadores_1.Booleano)(),
    __metadata("design:type", Boolean)
], MinhaEmpresaDto.prototype, "validar_estoque", void 0);
__decorate([
    (0, validadores_1.Inteiro)({ opcional: true, min: 1, max: 20, mensagem: 'Quantidade de desenhos por folha inválida.' }),
    __metadata("design:type", Number)
], MinhaEmpresaDto.prototype, "quantidade_desenho_por_folha", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(4000),
    __metadata("design:type", Object)
], MinhaEmpresaDto.prototype, "whatsapp_mensagem_padrao", void 0);
__decorate([
    (0, validadores_1.Inteiro)({ opcional: true, min: 1, max: 365, mensagem: 'Validade do link inválida.' }),
    __metadata("design:type", Number)
], MinhaEmpresaDto.prototype, "link_validade_dias", void 0);
class EmpresaDto extends MinhaEmpresaDto {
    data_expiracao;
    valor_mensalidade;
    ativo;
}
exports.EmpresaDto = EmpresaDto;
__decorate([
    (0, validadores_1.Data)(),
    __metadata("design:type", Object)
], EmpresaDto.prototype, "data_expiracao", void 0);
__decorate([
    (0, validadores_1.Numero)({ opcional: true, min: 0, mensagem: 'Valor da mensalidade inválido.' }),
    __metadata("design:type", Number)
], EmpresaDto.prototype, "valor_mensalidade", void 0);
__decorate([
    (0, validadores_1.Inteiro)({ opcional: true, min: 1, max: 2, mensagem: 'Status inválido.' }),
    __metadata("design:type", Number)
], EmpresaDto.prototype, "ativo", void 0);
class ValidadeDto {
    data_expiracao;
    valor_mensalidade;
}
exports.ValidadeDto = ValidadeDto;
__decorate([
    (0, validadores_1.Data)(),
    __metadata("design:type", Object)
], ValidadeDto.prototype, "data_expiracao", void 0);
__decorate([
    (0, validadores_1.Numero)({ opcional: true, min: 0, mensagem: 'Valor da mensalidade inválido.' }),
    __metadata("design:type", Number)
], ValidadeDto.prototype, "valor_mensalidade", void 0);
//# sourceMappingURL=empresa.dto.js.map