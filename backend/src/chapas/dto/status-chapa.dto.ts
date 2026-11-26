import { UmDe } from '../../common/validadores';

export class StatusChapaDto {
  @UmDe([1, 2], 'Status inválido.')
  status: number;
}
