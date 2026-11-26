import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class AlterarSenhaDto {
  @IsString({ message: 'Senha atual é obrigatória.' })
  @IsNotEmpty({ message: 'Senha atual é obrigatória.' })
  @MaxLength(255)
  senha_atual: string;

  @IsString()
  @MinLength(8, { message: 'A nova senha deve ter pelo menos 8 caracteres.' })
  @MaxLength(255)
  nova_senha: string;
}
