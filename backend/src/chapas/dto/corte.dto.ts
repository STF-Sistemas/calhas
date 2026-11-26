import { Numero, Texto } from '../../common/validadores';

export class CorteDto {
  @Texto(200, 'Descrição é obrigatória.')
  descricao: string;

  @Numero({ min: 0, mensagem: 'Corte inválido.' })
  corte: number;

  @Numero({ min: 0, mensagem: 'Valor inválido.' })
  valor: number;
}
