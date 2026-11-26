import { IsEmail, IsOptional, Length, Matches, MaxLength, ValidateIf } from 'class-validator';
import { Id, Inteiro, Texto, TextoOpcional } from '../../common/validadores';

export class FornecedorDto {
  @Texto(200, 'Razão social é obrigatória.')
  razao_social: string;

  @TextoOpcional(200) nome_fantasia?: string | null;

  @Length(14, 14, { message: 'CNPJ deve ter 14 dígitos numéricos' })
  @Matches(/^\d{14}$/, { message: 'CNPJ deve ter 14 dígitos numéricos' })
  cnpj: string;

  @TextoOpcional(20) ie?: string | null;
  @TextoOpcional(20) iest?: string | null;
  @TextoOpcional(20) im?: string | null;

  @Inteiro({ opcional: true, min: 1, max: 3, mensagem: 'CRT inválido.' })
  crt?: number;

  @IsOptional()
  @ValidateIf((_o, v) => v !== '')
  @IsEmail({}, { message: 'E-mail inválido.' })
  @MaxLength(200)
  email?: string | null;

  @TextoOpcional(20) fone?: string | null;
  @TextoOpcional(200) nome_vendedor?: string | null;
  @TextoOpcional(20) fone_vendedor?: string | null;
  @TextoOpcional(8) cep?: string | null;
  @TextoOpcional(200) logradouro?: string | null;
  @TextoOpcional(20) numero?: string | null;
  @TextoOpcional(100) complemento?: string | null;
  @TextoOpcional(100) bairro?: string | null;

  @Id(true, 'Cidade inválida.')
  cod_cidade?: number | null;
}
