import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Booleano, Id, Inteiro, TextoOpcional } from '../../common/validadores';

export class AtualizarUsuarioDto {
  @TextoOpcional(150)
  nome?: string | null;

  @IsOptional()
  @IsEmail({}, { message: 'E-mail inválido.' })
  @MaxLength(200)
  email?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'A senha deve ter pelo menos 8 caracteres.' })
  @MaxLength(255)
  senha?: string | null;

  @Booleano()
  admin?: boolean | null;

  @Inteiro({ opcional: true, min: 1, max: 2, mensagem: 'Status inválido.' })
  status?: number | null;

  @Id(true, 'Empresa inválida.')
  cod_empresa?: number | null;
}
