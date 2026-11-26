import { Id, Texto } from '../../common/validadores';

export class CodigoFornecedorDto {
  @Id(false, 'cod_fornecedor e codigo são obrigatórios.')
  cod_fornecedor: number;

  @Texto(60, 'cod_fornecedor e codigo são obrigatórios.')
  codigo: string;
}
