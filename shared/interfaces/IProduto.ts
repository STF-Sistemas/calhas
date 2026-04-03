export interface IProduto {
  id: number;
  cod_empresa: number;
  descricao: string;
  unidade_medida: string;
  valor_unitario: number;
  status: number;
  excluido: boolean;
}
