import { Inteiro, Texto, UmDe } from '../common/validadores';

export class MeioPagamentoDto {
  @Texto(200, 'Descrição é obrigatória.')
  descricao: string;

  @Inteiro({ opcional: true, min: 1, max: 2, mensagem: 'Status inválido.' })
  ativo?: number;
}

export class StatusDto {
  @UmDe([1, 2], 'Status inválido.')
  status: number;
}
