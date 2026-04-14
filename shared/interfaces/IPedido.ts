import { IPedidoItem } from './IPedidoItem';
import { ICliente } from './ICliente';
import { IEmpresa } from './IEmpresa';
import { IMeioPagamento } from './IMeioPagamento';

export interface IPedido {
  id: number;
  cod_empresa: number;
  cod_cliente: number;
  cod_meio_pagamento: number | null;
  data_pedido: Date | string;
  status: number;
  valor_material: number;
  valor_servico: number;
  valor_total: number;
  observacoes: string | null;
  excluido: boolean;
  estoque_baixado: boolean;
  empresa?: IEmpresa;
  cliente?: ICliente;
  meio_pagamento?: IMeioPagamento;
  itens?: IPedidoItem[];
}
