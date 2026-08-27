import { EAprovacaoPedido } from '../enums/EAprovacaoPedido';

export interface IAprovacaoTag {
  label: string;
  severity: 'success' | 'danger' | 'secondary';
}

export function obterAprovacaoTag(aprovacaoStatus: number | undefined): IAprovacaoTag {
  if (aprovacaoStatus === EAprovacaoPedido.Autorizado) {
    return { label: 'Autorizado', severity: 'success' };
  }
  if (aprovacaoStatus === EAprovacaoPedido.Recusado) {
    return { label: 'Recusado', severity: 'danger' };
  }
  return { label: 'Pendente', severity: 'secondary' };
}
