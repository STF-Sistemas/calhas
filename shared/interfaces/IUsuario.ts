export interface IUsuario {
  id: number;
  nome: string;
  email: string;
  /** senha omitida nas respostas da API */
  senha?: string;
  status: number;
  data_criacao: Date | string;
  admin: boolean;
  super_admin: boolean;
  cod_empresa: number | null;
  excluido: boolean;
}
