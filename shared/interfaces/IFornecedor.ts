import { ICidade } from './ICidade';

export interface IFornecedor {
  id: number;
  cod_empresa: number;
  razao_social: string;
  nome_fantasia?: string;
  cnpj: string;
  ie?: string;
  iest?: string;
  im?: string;
  crt: number;
  email?: string;
  fone?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cod_cidade?: number;
  cidade?: ICidade;
  status: number;
  excluido: boolean;
}
