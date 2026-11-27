export type TTipoEventoTempoReal = 'pedido_aprovacao';

export interface IEventoTempoReal {
  tipo: TTipoEventoTempoReal;
  cod_pedido: number;
  aprovacao_status: number;
  titulo: string;
  mensagem: string;
}
