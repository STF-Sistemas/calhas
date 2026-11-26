import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'E-mail inválido.' })
  @MaxLength(200, { message: 'E-mail inválido.' })
  email: string;

  @IsString({ message: 'Senha é obrigatória.' })
  @IsNotEmpty({ message: 'Senha é obrigatória.' })
  @MaxLength(255)
  senha: string;
}
