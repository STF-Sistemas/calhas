export interface IPonto {
  x: number;
  y: number;
}

export interface IDesenho {
  id: number;
  cod_empresa: number;
  descricao: string;
  pontos: IPonto[];
  status: number;
  excluido: boolean;
}
