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
exports.DesenhoDto = exports.DiagonalDesenhoDto = exports.PontoDesenhoDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const validadores_1 = require("../../common/validadores");
class PontoDesenhoDto {
    x;
    y;
}
exports.PontoDesenhoDto = PontoDesenhoDto;
__decorate([
    (0, class_validator_1.IsNumber)({ allowNaN: false, allowInfinity: false }, { message: 'Ponto do desenho inválido.' }),
    (0, class_validator_1.Min)(-10_000),
    (0, class_validator_1.Max)(10_000),
    __metadata("design:type", Number)
], PontoDesenhoDto.prototype, "x", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({ allowNaN: false, allowInfinity: false }, { message: 'Ponto do desenho inválido.' }),
    (0, class_validator_1.Min)(-10_000),
    (0, class_validator_1.Max)(10_000),
    __metadata("design:type", Number)
], PontoDesenhoDto.prototype, "y", void 0);
class DiagonalDesenhoDto {
    p1;
    p2;
}
exports.DiagonalDesenhoDto = DiagonalDesenhoDto;
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => PontoDesenhoDto),
    __metadata("design:type", PontoDesenhoDto)
], DiagonalDesenhoDto.prototype, "p1", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => PontoDesenhoDto),
    __metadata("design:type", PontoDesenhoDto)
], DiagonalDesenhoDto.prototype, "p2", void 0);
class DesenhoDto {
    descricao;
    pontos;
    diagonais;
    status;
}
exports.DesenhoDto = DesenhoDto;
__decorate([
    (0, validadores_1.Texto)(200, 'Descrição é obrigatória.'),
    __metadata("design:type", String)
], DesenhoDto.prototype, "descricao", void 0);
__decorate([
    (0, validadores_1.Lista)(200),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PontoDesenhoDto),
    __metadata("design:type", Array)
], DesenhoDto.prototype, "pontos", void 0);
__decorate([
    (0, validadores_1.Lista)(50),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => DiagonalDesenhoDto),
    __metadata("design:type", Array)
], DesenhoDto.prototype, "diagonais", void 0);
__decorate([
    (0, validadores_1.Inteiro)({ opcional: true, min: 1, max: 2, mensagem: 'Status inválido.' }),
    __metadata("design:type", Number)
], DesenhoDto.prototype, "status", void 0);
//# sourceMappingURL=desenho.dto.js.map