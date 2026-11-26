import { IProduto } from './IProduto';
import { ICorte } from './ICorte';
import { IServico } from './IServico';
import { IDesenho, IPonto, IDiagonal } from './IDesenho';

export interface IPedidoItem {
  id: number;
  cod_pedido: number;
  cod_produto: number | null;
  cod_servico: number | null;
  cod_corte: number | null;
  cod_desenho: number | null;
  medidas: number[] | null;
  /** Desenho livre feito à mão no pedido (já endireitado). Usado quando cod_desenho é nulo. */
  desenho_pontos?: IPonto[] | null;
  /** Linhas transversais do desenho livre (2 medidas cada; vale a maior). */
  desenho_diagonais?: IDiagonal[] | null;
  tipo: number;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  custo_unitario: number;
  observacoes: string | null;
  produto?: IProduto;
  corte?: ICorte;
  servico?: IServico;
  desenho?: IDesenho;
}
