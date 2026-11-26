import { Texto } from '../../common/validadores';

export class ChapaDto {
  @Texto(200, 'Descrição é obrigatória.')
  descricao: string;
}
