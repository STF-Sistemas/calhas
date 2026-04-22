export interface IPonto {
  x: number;
  y: number;
}

export interface IDiagonal {
  p1: IPonto;
  p2: IPonto;
}

export interface IDesenho {
  id: number;
  cod_empresa: number;
  descricao: string;
  pontos: IPonto[];
  diagonais?: IDiagonal[];
  status: number;
  excluido: boolean;
}
