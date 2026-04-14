export interface IPagamentoPix {
  id: number;
  cod_empresa: number;
  mp_payment_id: string | null;
  valor: number;
  status: 'pendente' | 'aprovado' | 'cancelado';
  qr_code: string | null;
  qr_code_base64: string | null;
  created_at: string;
  pago_em: string | null;
}

export interface ICriarPixResponse {
  pagamento: IPagamentoPix;
  manual: boolean;
  pix_chave: string | null;
  valor: number;
}

export interface IStatusPixResponse {
  pagamento: IPagamentoPix;
  nova_expiracao?: string;
}
