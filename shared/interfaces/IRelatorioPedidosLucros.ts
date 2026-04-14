import { IEmpresa } from './IEmpresa';
import { ICliente } from './ICliente';

export interface IRelatorioItemLucro {
  id: number;
  tipo: number;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  custo_unitario: number;
  custo_total: number;
  lucro: number;
}

export interface IRelatorioPedidoLucro {
  id: number;
  data_pedido: string;
  status: number;
  cliente: ICliente;
  itens: IRelatorioItemLucro[];
  valor_total: number;
  custo_total: number;
  lucro: number;
}

export interface IRelatorioPedidosLucros {
  empresa: IEmpresa;
  filtros: {
    data_inicio: string | null;
    data_fim: string | null;
    cliente: string | null;
    produto: string | null;
  };
  pedidos: IRelatorioPedidoLucro[];
  totais: {
    valor_total: number;
    custo_total: number;
    lucro: number;
    quantidade_pedidos: number;
  };
}
