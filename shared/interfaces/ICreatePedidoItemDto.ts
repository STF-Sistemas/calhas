export interface ICreatePedidoItemDto {
  cod_produto?: number;
  cod_servico?: number;
  cod_corte?: number;
  quantidade: number;
  valor_unitario: number;
  custo_unitario: number;
  observacoes?: string;
}
