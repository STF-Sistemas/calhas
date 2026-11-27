import { ICreatePedidoItemDto } from './ICreatePedidoItemDto';

export interface ICreatePedidoDto {
  cod_cliente: number;
  data_pedido: string;
  status: string;
  observacoes?: string;
  observacoes_cliente?: string;
  itens: ICreatePedidoItemDto[];
}
