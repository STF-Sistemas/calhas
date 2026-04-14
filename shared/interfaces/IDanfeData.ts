export interface IDanfeEmitente {
  razao_social: string;
  nome_fantasia?: string;
  cnpj: string;
  ie?: string;
  iest?: string;
  crt?: number;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  fone?: string;
}

export interface IDanfeDestinatario {
  razao_social: string;
  cnpj?: string;
  cpf?: string;
  ie?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  fone?: string;
  email?: string;
}

export interface IDanfeItem {
  num: number;
  codigo: string;
  descricao: string;
  ncm?: string;
  cst?: string;
  cfop?: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  base_icms?: number;
  valor_icms?: number;
  valor_ipi?: number;
  aliq_icms?: number;
  aliq_ipi?: number;
  base_icms_st?: number;
  valor_icms_st?: number;
  desconto?: number;
}

export interface IDanfeTotais {
  base_icms: number;
  valor_icms: number;
  base_icms_st: number;
  valor_icms_st: number;
  valor_produtos: number;
  valor_frete: number;
  valor_seguro: number;
  desconto: number;
  outros: number;
  valor_ipi: number;
  valor_total: number;
}

export interface IDanfeTransporte {
  modalidade_frete: string;
  transportadora?: string;
  cnpj?: string;
  ie?: string;
  endereco?: string;
  municipio?: string;
  uf?: string;
  placa?: string;
  uf_veiculo?: string;
  rntc?: string;
  quantidade_volumes?: number;
  especie?: string;
  marca?: string;
  numero_volumes?: string;
  peso_liquido?: number;
  peso_bruto?: number;
}

export interface IDanfeFatura {
  numero: string;
  vencimento: string;
  valor: number;
}

export interface IDanfeData {
  source: 'xml' | 'db';
  chave_acesso?: string;
  protocolo?: string;
  data_protocolo?: string;
  natureza_operacao?: string;
  tipo_operacao?: number; // 0=entrada, 1=saída
  numero_nfe?: string;
  serie?: string;
  data_emissao?: string;
  data_saida?: string;
  emitente: IDanfeEmitente;
  destinatario?: IDanfeDestinatario;
  itens: IDanfeItem[];
  totais: IDanfeTotais;
  transporte?: IDanfeTransporte;
  faturas?: IDanfeFatura[];
  info_complementar?: string;
}
