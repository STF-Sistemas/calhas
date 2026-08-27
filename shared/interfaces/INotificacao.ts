export interface INotificacao {
  id: number;
  cod_empresa: number;
  cod_pedido: number | null;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  lida_em: Date | string | null;
  created_at: Date | string;
}
