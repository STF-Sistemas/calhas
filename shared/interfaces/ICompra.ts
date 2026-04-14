import { IFornecedor } from './IFornecedor';
import { ICompraItem } from './ICompraItem';

export interface ICompra {
  id: number;
  cod_empresa: number;
  cod_fornecedor: number;
  fornecedor?: IFornecedor;
  numero_nfe?: string;
  serie?: string;
  chave_acesso?: string;
  data_emissao?: string;
  data_entrada?: string;
  valor_produtos: number;
  valor_frete: number;
  valor_seguro: number;
  valor_desconto: number;
  valor_outros: number;
  valor_ipi: number;
  valor_total: number;
  status: number;
  observacao?: string;
  motivo_cancelamento?: string;
  excluido: boolean;
  itens?: ICompraItem[];
}
