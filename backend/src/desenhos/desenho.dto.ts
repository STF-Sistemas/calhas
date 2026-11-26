import { Inteiro, Lista, Texto } from '../common/validadores';

export class DesenhoDto {
  @Texto(200, 'Descrição é obrigatória.')
  descricao: string;

  @Lista(200)
  pontos?: unknown[];

  @Lista(50)
  diagonais?: unknown[];

  @Inteiro({ opcional: true, min: 1, max: 2, mensagem: 'Status inválido.' })
  status?: number;
}
