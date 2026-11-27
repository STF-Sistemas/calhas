"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcularValorDesconto = calcularValorDesconto;
exports.calcularValorLiquido = calcularValorLiquido;
const EDescontoTipo_1 = require("../enums/EDescontoTipo");
function calcularValorDesconto(valorTotal, tipo, descontoValor) {
    const total = Number(valorTotal) || 0;
    const valor = Number(descontoValor) || 0;
    if (valor <= 0 || total <= 0)
        return 0;
    const bruto = tipo === EDescontoTipo_1.EDescontoTipo.Percentual ? (total * valor) / 100 : valor;
    const limitado = Math.min(Math.max(bruto, 0), total);
    return Math.round(limitado * 100) / 100;
}
function calcularValorLiquido(valorTotal, valorDesconto) {
    const total = Number(valorTotal) || 0;
    const desconto = Number(valorDesconto) || 0;
    return Math.round((total - desconto) * 100) / 100;
}
//# sourceMappingURL=desconto.functions.js.map