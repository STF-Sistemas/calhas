"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdPipe = void 0;
exports.Texto = Texto;
exports.TextoOpcional = TextoOpcional;
exports.Numero = Numero;
exports.Inteiro = Inteiro;
exports.Id = Id;
exports.Booleano = Booleano;
exports.Data = Data;
exports.UmDe = UmDe;
exports.Lista = Lista;
const common_1 = require("@nestjs/common");
const falha_1 = require("./falha");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const paraNumero = ({ value }) => value === '' || value === null || value === undefined ? value : typeof value === 'string' ? Number(value) : value;
const aparar = ({ value }) => (typeof value === 'string' ? value.trim() : value);
function Texto(max, mensagem = 'Campo obrigatório.') {
    return (0, common_1.applyDecorators)((0, class_transformer_1.Transform)(aparar), (0, class_validator_1.IsString)({ message: mensagem }), (0, class_validator_1.IsNotEmpty)({ message: mensagem }), (0, class_validator_1.MaxLength)(max, { message: `Máximo de ${max} caracteres.` }));
}
function TextoOpcional(max) {
    return (0, common_1.applyDecorators)((0, class_validator_1.IsOptional)(), (0, class_transformer_1.Transform)(aparar), (0, class_validator_1.IsString)({ message: 'Texto inválido.' }), (0, class_validator_1.MaxLength)(max, { message: `Máximo de ${max} caracteres.` }));
}
function Numero(opcoes = {}) {
    const msg = opcoes.mensagem ?? 'Número inválido.';
    const lista = [
        ...(opcoes.opcional ? [(0, class_validator_1.IsOptional)()] : []),
        (0, class_transformer_1.Transform)(paraNumero),
        (0, class_validator_1.IsNumber)({ allowNaN: false, allowInfinity: false }, { message: msg }),
        ...(opcoes.min !== undefined ? [(0, class_validator_1.Min)(opcoes.min, { message: msg })] : []),
        ...(opcoes.max !== undefined ? [(0, class_validator_1.Max)(opcoes.max, { message: msg })] : []),
    ];
    return (0, common_1.applyDecorators)(...lista);
}
function Inteiro(opcoes = {}) {
    const msg = opcoes.mensagem ?? 'Número inteiro inválido.';
    const lista = [
        ...(opcoes.opcional ? [(0, class_validator_1.IsOptional)()] : []),
        (0, class_transformer_1.Transform)(paraNumero),
        (0, class_validator_1.IsInt)({ message: msg }),
        ...(opcoes.min !== undefined ? [(0, class_validator_1.Min)(opcoes.min, { message: msg })] : []),
        ...(opcoes.max !== undefined ? [(0, class_validator_1.Max)(opcoes.max, { message: msg })] : []),
    ];
    return (0, common_1.applyDecorators)(...lista);
}
function Id(opcional = false, mensagem = 'Registro inválido.') {
    return Inteiro({ opcional, min: 1, mensagem });
}
function Booleano(opcional = true) {
    return (0, common_1.applyDecorators)(...(opcional ? [(0, class_validator_1.IsOptional)()] : []), (0, class_validator_1.IsBoolean)({ message: 'Valor inválido.' }));
}
function Data(opcional = true, mensagem = 'Data inválida.') {
    return (0, common_1.applyDecorators)(...(opcional ? [(0, class_validator_1.IsOptional)()] : []), (0, class_validator_1.IsDateString)({}, { message: mensagem }));
}
function UmDe(valores, mensagem = 'Valor inválido.', opcional = false) {
    return (0, common_1.applyDecorators)(...(opcional ? [(0, class_validator_1.IsOptional)()] : []), (0, class_transformer_1.Transform)(paraNumero), (0, class_validator_1.IsIn)(valores, { message: mensagem }));
}
function Lista(max, opcional = true) {
    return (0, common_1.applyDecorators)(...(opcional ? [(0, class_validator_1.IsOptional)(), (0, class_validator_1.ValidateIf)((_o, v) => v !== null)] : []), (0, class_validator_1.IsArray)({ message: 'Lista inválida.' }), (0, class_validator_1.ArrayMaxSize)(max, { message: `Máximo de ${max} itens.` }));
}
exports.IdPipe = new common_1.ParseIntPipe({
    exceptionFactory: () => (0, falha_1.falha)(common_1.HttpStatus.BAD_REQUEST, 'Identificador inválido.'),
});
//# sourceMappingURL=validadores.js.map