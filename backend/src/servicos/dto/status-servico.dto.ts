import { UmDe } from '../../common/validadores';

export class StatusServicoDto {
  @UmDe([1, 2], 'Status inválido.')
  status: number;
}
