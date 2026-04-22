import { ICidade } from './ICidade';

export interface IEmpresa {
  id: number;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string;
  email: string | null;
  telefone: string | null;
  data_expiracao: Date | string | null;
  valor_mensalidade: number;
  validar_estoque: boolean;
  quantidade_desenho_por_folha: number;
  ativo: number;
  excluido: boolean;
  created_at: Date | string;
  updated_at: Date | string;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  bairro: string | null;
  complemento: string | null;
  marca_dagua: string | null;
  whatsapp_mensagem_padrao: string | null;
  link_validade_dias: number;
  cod_cidade: number | null;
  cidade?: ICidade;
}
