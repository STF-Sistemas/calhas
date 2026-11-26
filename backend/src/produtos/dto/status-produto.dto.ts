import { UmDe } from '../../common/validadores';

export class StatusProdutoDto {
  @UmDe([1, 2], 'Status inválido.')
  status: number;
}
