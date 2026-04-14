export interface IProduto {
  id: number;
  cod_empresa: number;
  descricao: string;
  unidade_medida: string;
  valor_unitario: number;
  custo: number;
  markup: number;
  estoque_atual: number;
  ncm?: string;
  cest?: string;
  gtin?: string;
  cfop_padrao?: string;
  origem: number;
  status: number;
  excluido: boolean;
}
