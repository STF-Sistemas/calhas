import { EDescontoTipo } from '../enums/EDescontoTipo';

export function calcularValorDesconto(valorTotal: number, tipo: number, descontoValor: number): number {
  const total = Number(valorTotal) || 0;
  const valor = Number(descontoValor) || 0;
  if (valor <= 0 || total <= 0) return 0;

  const bruto = tipo === EDescontoTipo.Percentual ? (total * valor) / 100 : valor;
  const limitado = Math.min(Math.max(bruto, 0), total);
  return Math.round(limitado * 100) / 100;
}

export function calcularValorLiquido(valorTotal: number, valorDesconto: number): number {
  const total = Number(valorTotal) || 0;
  const desconto = Number(valorDesconto) || 0;
  return Math.round((total - desconto) * 100) / 100;
}
