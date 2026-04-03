import { ICidade } from './ICidade';

export interface ICliente {
  id: number;
  cod_empresa: number;
  razao_social: string;
  nome_fantasia: string | null;
  cpf_cnpj: string | null;
  email: string | null;
  telefone: string | null;
  ativo: number;
  excluido: boolean;
  created_at: Date | string;
  updated_at: Date | string;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  bairro: string | null;
  complemento: string | null;
  cod_cidade: number | null;
  observacoes: string | null;
  cidade?: ICidade;
}
