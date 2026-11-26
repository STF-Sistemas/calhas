import { IsEmail, MaxLength } from 'class-validator';

export class EsqueciSenhaDto {
  @IsEmail({}, { message: 'E-mail inválido.' })
  @MaxLength(200, { message: 'E-mail inválido.' })
  email: string;
}
