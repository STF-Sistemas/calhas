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
  desconto_tipo: number;
  desconto_valor: number;
  valor_desconto: number;
  valor_liquido: number;
  observacoes: string | null;
  excluido: boolean;
  estoque_baixado: boolean;
  token_acesso?: string | null;
  token_expiracao?: Date | string | null;
  token_acesso_corte?: string | null;
  token_expiracao_corte?: Date | string | null;
  itens_corte_selecionados?: number[] | null;
  aprovacao_status?: number;
  aprovacao_data?: Date | string | null;
  aprovacao_assinatura?: string | null;
  aprovacao_ip?: string | null;
  recusa_motivo?: string | null;
  empresa?: IEmpresa;
  cliente?: ICliente;
  meio_pagamento?: IMeioPagamento;
  itens?: IPedidoItem[];
}
