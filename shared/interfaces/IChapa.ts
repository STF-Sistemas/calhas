import { ICorte } from './ICorte';

export interface IChapa {
  id: number;
  cod_empresa: number;
  descricao: string;
  status: number;
  excluido: boolean;
  cortes?: ICorte[];
}
