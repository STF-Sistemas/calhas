import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RedefinirSenhaDto {
  @IsString({ message: 'Token inválido.' })
  @IsNotEmpty({ message: 'Token inválido.' })
  @MaxLength(200, { message: 'Token inválido.' })
  token: string;

  @IsString()
  @MinLength(8, { message: 'A senha deve ter pelo menos 8 caracteres.' })
  @MaxLength(255)
  nova_senha: string;
}
