import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { Booleano, Id, Texto } from '../../common/validadores';

export class CriarUsuarioDto {
  @Texto(150, 'Nome é obrigatório.')
  nome: string;

  @IsEmail({}, { message: 'E-mail inválido.' })
  @MaxLength(200)
  email: string;

  @IsString()
  @MinLength(8, { message: 'A senha deve ter pelo menos 8 caracteres.' })
  @MaxLength(255)
  senha: string;

  @Booleano()
  admin?: boolean | null;

  @Id(true, 'Empresa inválida.')
  cod_empresa?: number | null;
}
