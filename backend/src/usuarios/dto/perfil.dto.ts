import { IsEmail, MaxLength } from 'class-validator';
import { Texto } from '../../common/validadores';

export class PerfilDto {
  @Texto(150, 'Nome é obrigatório.')
  nome: string;

  @IsEmail({}, { message: 'E-mail inválido.' })
  @MaxLength(200)
  email: string;
}
