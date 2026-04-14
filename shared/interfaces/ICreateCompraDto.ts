export interface ICreateCompraItemDto {
  cod_produto: number;
  descricao: string;
  ncm?: string;
  cfop?: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  desconto?: number;
  base_icms?: number;
  aliq_icms?: number;
  valor_icms?: number;
  base_icms_st?: number;
  valor_icms_st?: number;
  valor_ipi?: number;
  aliq_pis?: number;
  valor_pis?: number;
  aliq_cofins?: number;
  valor_cofins?: number;
}

export interface ICreateCompraDto {
  cod_fornecedor: number;
  numero_nfe?: string;
  serie?: string;
  chave_acesso?: string;
  data_emissao?: string;
  data_entrada?: string;
  valor_frete?: number;
  valor_seguro?: number;
  valor_desconto?: number;
  valor_outros?: number;
  observacao?: string;
  xml_content?: string;
  itens: ICreateCompraItemDto[];
}
