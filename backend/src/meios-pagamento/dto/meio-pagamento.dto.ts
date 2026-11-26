import { Inteiro, Texto } from '../../common/validadores';

export class MeioPagamentoDto {
  @Texto(200, 'Descrição é obrigatória.')
  descricao: string;

  @Inteiro({ opcional: true, min: 1, max: 2, mensagem: 'Status inválido.' })
  ativo?: number;
}
