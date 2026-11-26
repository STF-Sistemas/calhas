import { UmDe } from '../../common/validadores';

export class StatusMeioPagamentoDto {
  @UmDe([1, 2], 'Status inválido.')
  status: number;
}
