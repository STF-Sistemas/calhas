import { IProduto } from './IProduto';
import { ICorte } from './ICorte';
import { IServico } from './IServico';
import { IDesenho } from './IDesenho';

export interface IPedidoItem {
  id: number;
  cod_pedido: number;
  cod_produto: number | null;
  cod_servico: number | null;
  cod_corte: number | null;
  cod_desenho: number | null;
  medidas: number[] | null;
  tipo: number;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  observacoes: string | null;
  produto?: IProduto;
  corte?: ICorte;
  servico?: IServico;
  desenho?: IDesenho;
}
