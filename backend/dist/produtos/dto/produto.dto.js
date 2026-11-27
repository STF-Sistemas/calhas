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
exports.ProdutoDto = void 0;
const validadores_1 = require("../../common/validadores");
class ProdutoDto {
    descricao;
    unidade_medida;
    valor_unitario;
    custo;
    markup;
    estoque_atual;
    ncm;
    cest;
    gtin;
    cfop_padrao;
    origem;
}
exports.ProdutoDto = ProdutoDto;
__decorate([
    (0, validadores_1.Texto)(200, 'Descrição é obrigatória.'),
    __metadata("design:type", String)
], ProdutoDto.prototype, "descricao", void 0);
__decorate([
    (0, validadores_1.Texto)(10, 'Unidade de medida é obrigatória.'),
    __metadata("design:type", String)
], ProdutoDto.prototype, "unidade_medida", void 0);
__decorate([
    (0, validadores_1.Numero)({ min: 0, mensagem: 'Valor unitário inválido.' }),
    __metadata("design:type", Number)
], ProdutoDto.prototype, "valor_unitario", void 0);
__decorate([
    (0, validadores_1.Numero)({ opcional: true, min: 0, mensagem: 'Custo inválido.' }),
    __metadata("design:type", Object)
], ProdutoDto.prototype, "custo", void 0);
__decorate([
    (0, validadores_1.Numero)({ opcional: true, min: 0, mensagem: 'Markup inválido.' }),
    __metadata("design:type", Object)
], ProdutoDto.prototype, "markup", void 0);
__decorate([
    (0, validadores_1.Numero)({ opcional: true, min: 0, mensagem: 'Estoque inválido.' }),
    __metadata("design:type", Object)
], ProdutoDto.prototype, "estoque_atual", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(10),
    __metadata("design:type", Object)
], ProdutoDto.prototype, "ncm", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(7),
    __metadata("design:type", Object)
], ProdutoDto.prototype, "cest", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(14),
    __metadata("design:type", Object)
], ProdutoDto.prototype, "gtin", void 0);
__decorate([
    (0, validadores_1.TextoOpcional)(5),
    __metadata("design:type", Object)
], ProdutoDto.prototype, "cfop_padrao", void 0);
__decorate([
    (0, validadores_1.Inteiro)({ opcional: true, min: 0, max: 8, mensagem: 'Origem inválida.' }),
    __metadata("design:type", Object)
], ProdutoDto.prototype, "origem", void 0);
//# sourceMappingURL=produto.dto.js.map