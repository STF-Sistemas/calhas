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
exports.StatusCompraDto = exports.CompraDto = exports.CompraItemDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const validadores_1 = require("../../common/validadores");
const valorOpcional = (mensagem = 'Valor inválido.') => (0, validadores_1.Numero)({ opcional: true, min: 0, mensagem });
class CompraItemDto {
    cod_produto;
    descricao_xml;
    descricao;
    ncm;
    cfop;
    unidade;
    quantidade;
    valor_unitario;
    valor_total;
    desconto;
    base_icms;
    aliq_icms;
    valor_icms;
    base_icms_st;
    valor_icms_st;
    valor_ipi;
    aliq_pis;
    valor_pis;
    aliq_cofins;
    valor_cofins;
}
exports.CompraItemDto = CompraItemDto;
__decorate([
    (0, validadores_1.Id)(false, 'Produto é obrigatório em todos os itens.'),
    __metadata("design:type", Number)
], CompraItemDto.prototype, "cod_produto", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(200),
    __metadata("design:type", Object)
], CompraItemDto.prototype, "descricao_xml", void 0);
__decorate([
    (0, validadores_1.Texto)(200, 'Descrição do item é obrigatória.'),
    __metadata("design:type", String)
], CompraItemDto.prototype, "descricao", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(10),
    __metadata("design:type", Object)
], CompraItemDto.prototype, "ncm", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(5),
    __metadata("design:type", Object)
], CompraItemDto.prototype, "cfop", void 0);
__decorate([
    (0, validadores_1.Texto)(10, 'Unidade é obrigatória.'),
    __metadata("design:type", String)
], CompraItemDto.prototype, "unidade", void 0);
__decorate([
    (0, validadores_1.Numero)({ min: 0.0001, mensagem: 'Quantidade inválida.' }),
    __metadata("design:type", Number)
], CompraItemDto.prototype, "quantidade", void 0);
__decorate([
    (0, validadores_1.Numero)({ min: 0, mensagem: 'Valor unitário inválido.' }),
    __metadata("design:type", Number)
], CompraItemDto.prototype, "valor_unitario", void 0);
__decorate([
    (0, validadores_1.Numero)({ min: 0, mensagem: 'Valor total inválido.' }),
    __metadata("design:type", Number)
], CompraItemDto.prototype, "valor_total", void 0);
__decorate([
    valorOpcional(),
    __metadata("design:type", Object)
], CompraItemDto.prototype, "desconto", void 0);
__decorate([
    valorOpcional(),
    __metadata("design:type", Object)
], CompraItemDto.prototype, "base_icms", void 0);
__decorate([
    valorOpcional(),
    __metadata("design:type", Object)
], CompraItemDto.prototype, "aliq_icms", void 0);
__decorate([
    valorOpcional(),
    __metadata("design:type", Object)
], CompraItemDto.prototype, "valor_icms", void 0);
__decorate([
    valorOpcional(),
    __metadata("design:type", Object)
], CompraItemDto.prototype, "base_icms_st", void 0);
__decorate([
    valorOpcional(),
    __metadata("design:type", Object)
], CompraItemDto.prototype, "valor_icms_st", void 0);
__decorate([
    valorOpcional(),
    __metadata("design:type", Object)
], CompraItemDto.prototype, "valor_ipi", void 0);
__decorate([
    valorOpcional(),
    __metadata("design:type", Object)
], CompraItemDto.prototype, "aliq_pis", void 0);
__decorate([
    valorOpcional(),
    __metadata("design:type", Object)
], CompraItemDto.prototype, "valor_pis", void 0);
__decorate([
    valorOpcional(),
    __metadata("design:type", Object)
], CompraItemDto.prototype, "aliq_cofins", void 0);
__decorate([
    valorOpcional(),
    __metadata("design:type", Object)
], CompraItemDto.prototype, "valor_cofins", void 0);
class CompraDto {
    cod_fornecedor;
    numero_nfe;
    serie;
    chave_acesso;
    data_emissao;
    data_entrada;
    valor_frete;
    valor_seguro;
    valor_desconto;
    valor_outros;
    observacao;
    xml_content;
    itens;
}
exports.CompraDto = CompraDto;
__decorate([
    (0, validadores_1.Id)(false, 'Fornecedor é obrigatório.'),
    __metadata("design:type", Number)
], CompraDto.prototype, "cod_fornecedor", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(20),
    __metadata("design:type", Object)
], CompraDto.prototype, "numero_nfe", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(5),
    __metadata("design:type", Object)
], CompraDto.prototype, "serie", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(44),
    __metadata("design:type", Object)
], CompraDto.prototype, "chave_acesso", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(40),
    __metadata("design:type", Object)
], CompraDto.prototype, "data_emissao", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(40),
    __metadata("design:type", Object)
], CompraDto.prototype, "data_entrada", void 0);
__decorate([
    valorOpcional(),
    __metadata("design:type", Object)
], CompraDto.prototype, "valor_frete", void 0);
__decorate([
    valorOpcional(),
    __metadata("design:type", Object)
], CompraDto.prototype, "valor_seguro", void 0);
__decorate([
    valorOpcional(),
    __metadata("design:type", Object)
], CompraDto.prototype, "valor_desconto", void 0);
__decorate([
    valorOpcional(),
    __metadata("design:type", Object)
], CompraDto.prototype, "valor_outros", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(500),
    __metadata("design:type", Object)
], CompraDto.prototype, "observacao", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1_500_000, { message: 'XML muito grande.' }),
    __metadata("design:type", String)
], CompraDto.prototype, "xml_content", void 0);
__decorate([
    (0, class_validator_1.IsArray)({ message: 'Informe ao menos um item.' }),
    (0, class_validator_1.ArrayMinSize)(1, { message: 'Informe ao menos um item.' }),
    (0, class_validator_1.ArrayMaxSize)(500, { message: 'Itens demais na compra.' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CompraItemDto),
    __metadata("design:type", Array)
], CompraDto.prototype, "itens", void 0);
class StatusCompraDto {
    status;
    motivo_cancelamento;
}
exports.StatusCompraDto = StatusCompraDto;
__decorate([
    (0, validadores_1.UmDe)([1, 2, 3], 'Status inválido. Use 1=Rascunho, 2=Confirmada, 3=Cancelada.'),
    __metadata("design:type", Number)
], StatusCompraDto.prototype, "status", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(500),
    __metadata("design:type", Object)
], StatusCompraDto.prototype, "motivo_cancelamento", void 0);
//# sourceMappingURL=compra.dto.js.map