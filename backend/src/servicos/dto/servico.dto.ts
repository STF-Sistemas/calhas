import { Numero, Texto } from '../../common/validadores';

export class ServicoDto {
  @Texto(200, 'Descrição é obrigatória.')
  descricao: string;

  @Numero({ min: 0, mensagem: 'Valor inválido.' })
  valor: number;
}
