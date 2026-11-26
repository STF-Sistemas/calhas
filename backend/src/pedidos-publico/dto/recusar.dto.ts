import { TextoOpcional } from '../../common/validadores';

export class RecusarDto {
  @TextoOpcional(1000)
  motivo?: string;
}
