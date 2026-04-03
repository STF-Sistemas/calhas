import { IChapa } from './IChapa';

export interface ICorte {
  id: number;
  cod_chapa: number;
  descricao: string;
  corte: number;
  valor: number;
  valor_venda?: number;
  largura?: number;
  status: number;
  excluido: boolean;
  chapa?: IChapa;
}
