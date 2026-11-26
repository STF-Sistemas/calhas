import { UmDe } from '../../common/validadores';

export class StatusFornecedorDto {
  @UmDe([1, 2], 'Status inválido.')
  status: number;
}
