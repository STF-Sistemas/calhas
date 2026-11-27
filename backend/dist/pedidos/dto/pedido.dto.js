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
exports.GerarLinkCorteDto = exports.StatusPedidoDto = exports.PedidoUpdateDto = exports.PedidoDto = exports.PedidoItemDto = exports.DiagonalDto = exports.PontoDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const validadores_1 = require("../../common/validadores");
class PontoDto {
    x;
    y;
}
exports.PontoDto = PontoDto;
__decorate([
    (0, class_validator_1.IsNumber)({ allowNaN: false, allowInfinity: false }, { message: 'Ponto do desenho inválido.' }),
    (0, class_validator_1.Min)(-10_000),
    (0, class_validator_1.Max)(10_000),
    __metadata("design:type", Number)
], PontoDto.prototype, "x", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({ allowNaN: false, allowInfinity: false }, { message: 'Ponto do desenho inválido.' }),
    (0, class_validator_1.Min)(-10_000),
    (0, class_validator_1.Max)(10_000),
    __metadata("design:type", Number)
], PontoDto.prototype, "y", void 0);
class DiagonalDto {
    p1;
    p2;
}
exports.DiagonalDto = DiagonalDto;
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => PontoDto),
    __metadata("design:type", PontoDto)
], DiagonalDto.prototype, "p1", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => PontoDto),
    __metadata("design:type", PontoDto)
], DiagonalDto.prototype, "p2", void 0);
class PedidoItemDto {
    id;
    tipo;
    cod_produto;
    cod_servico;
    cod_corte;
    cod_desenho;
    medidas;
    desenho_pontos;
    desenho_diagonais;
    quantidade;
    valor_unitario;
    observacoes;
}
exports.PedidoItemDto = PedidoItemDto;
__decorate([
    (0, validadores_1.Id)(true),
    __metadata("design:type", Object)
], PedidoItemDto.prototype, "id", void 0);
__decorate([
    (0, validadores_1.Inteiro)({ min: 10, max: 12, mensagem: 'Tipo de item inválido.' }),
    __metadata("design:type", Number)
], PedidoItemDto.prototype, "tipo", void 0);
__decorate([
    (0, validadores_1.Id)(true, 'Produto inválido.'),
    __metadata("design:type", Object)
], PedidoItemDto.prototype, "cod_produto", void 0);
__decorate([
    (0, validadores_1.Id)(true, 'Serviço inválido.'),
    __metadata("design:type", Object)
], PedidoItemDto.prototype, "cod_servico", void 0);
__decorate([
    (0, validadores_1.Id)(true, 'Corte inválido.'),
    __metadata("design:type", Object)
], PedidoItemDto.prototype, "cod_corte", void 0);
__decorate([
    (0, validadores_1.Id)(true, 'Desenho inválido.'),
    __metadata("design:type", Object)
], PedidoItemDto.prototype, "cod_desenho", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'Medidas inválidas.' }),
    (0, class_validator_1.ArrayMaxSize)(500, { message: 'Medidas demais.' }),
    (0, class_validator_1.IsNumber)({ allowNaN: false, allowInfinity: false }, { each: true, message: 'Medida inválida.' }),
    (0, class_validator_1.Min)(0, { each: true, message: 'Medida não pode ser negativa.' }),
    (0, class_validator_1.Max)(1_000_000, { each: true, message: 'Medida inválida.' }),
    __metadata("design:type", Object)
], PedidoItemDto.prototype, "medidas", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'Desenho inválido.' }),
    (0, class_validator_1.ArrayMaxSize)(200, { message: 'Desenho com pontos demais.' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PontoDto),
    __metadata("design:type", Object)
], PedidoItemDto.prototype, "desenho_pontos", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'Desenho inválido.' }),
    (0, class_validator_1.ArrayMaxSize)(50, { message: 'Desenho com transversais demais.' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => DiagonalDto),
    __metadata("design:type", Object)
], PedidoItemDto.prototype, "desenho_diagonais", void 0);
__decorate([
    (0, validadores_1.Numero)({ min: 0.0001, mensagem: 'Quantidade inválida.' }),
    __metadata("design:type", Number)
], PedidoItemDto.prototype, "quantidade", void 0);
__decorate([
    (0, validadores_1.Numero)({ min: 0, mensagem: 'Valor unitário inválido.' }),
    __metadata("design:type", Number)
], PedidoItemDto.prototype, "valor_unitario", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(1000),
    __metadata("design:type", Object)
], PedidoItemDto.prototype, "observacoes", void 0);
class PedidoDto {
    cod_cliente;
    cod_meio_pagamento;
    data_pedido;
    observacoes;
    observacoes_cliente;
    desconto_tipo;
    desconto_valor;
    itens;
}
exports.PedidoDto = PedidoDto;
__decorate([
    (0, validadores_1.Id)(false, 'Cliente é obrigatório.'),
    __metadata("design:type", Number)
], PedidoDto.prototype, "cod_cliente", void 0);
__decorate([
    (0, validadores_1.Id)(true, 'Meio de pagamento inválido.'),
    __metadata("design:type", Object)
], PedidoDto.prototype, "cod_meio_pagamento", void 0);
__decorate([
    (0, validadores_1.Texto)(40, 'Data do pedido é obrigatória.'),
    __metadata("design:type", String)
], PedidoDto.prototype, "data_pedido", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(2000),
    __metadata("design:type", Object)
], PedidoDto.prototype, "observacoes", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(2000),
    __metadata("design:type", Object)
], PedidoDto.prototype, "observacoes_cliente", void 0);
__decorate([
    (0, validadores_1.Inteiro)({ opcional: true, min: 1, max: 2, mensagem: 'Tipo de desconto inválido.' }),
    __metadata("design:type", Number)
], PedidoDto.prototype, "desconto_tipo", void 0);
__decorate([
    (0, validadores_1.Numero)({ opcional: true, min: 0, mensagem: 'Desconto não pode ser negativo.' }),
    __metadata("design:type", Number)
], PedidoDto.prototype, "desconto_valor", void 0);
__decorate([
    (0, class_validator_1.IsArray)({ message: 'Informe ao menos um item.' }),
    (0, class_validator_1.ArrayMinSize)(1, { message: 'Informe ao menos um item.' }),
    (0, class_validator_1.ArrayMaxSize)(300, { message: 'Itens demais no pedido.' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PedidoItemDto),
    __metadata("design:type", Array)
], PedidoDto.prototype, "itens", void 0);
class PedidoUpdateDto extends PedidoDto {
    status;
}
exports.PedidoUpdateDto = PedidoUpdateDto;
__decorate([
    (0, class_validator_1.IsInt)({ message: 'Status inválido.' }),
    (0, class_validator_1.Min)(1, { message: 'Status inválido.' }),
    __metadata("design:type", Number)
], PedidoUpdateDto.prototype, "status", void 0);
class StatusPedidoDto {
    status;
}
exports.StatusPedidoDto = StatusPedidoDto;
__decorate([
    (0, validadores_1.Inteiro)({ mensagem: 'Status inválido.' }),
    __metadata("design:type", Number)
], StatusPedidoDto.prototype, "status", void 0);
class GerarLinkCorteDto {
    itens;
}
exports.GerarLinkCorteDto = GerarLinkCorteDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(300),
    (0, class_validator_1.IsInt)({ each: true, message: 'Item inválido.' }),
    (0, class_validator_1.Min)(1, { each: true, message: 'Item inválido.' }),
    __metadata("design:type", Object)
], GerarLinkCorteDto.prototype, "itens", void 0);
//# sourceMappingURL=pedido.dto.js.map