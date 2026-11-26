import { IsEmail, IsOptional, MaxLength, ValidateIf } from 'class-validator';
import { Id, Inteiro, Texto, TextoOpcional } from '../../common/validadores';

export class ClienteDto {
  @Texto(200, 'Razão social é obrigatória.')
  razao_social: string;

  @TextoOpcional(200) nome_fantasia?: string | null;
  @TextoOpcional(20) cpf_cnpj?: string | null;

  @IsOptional()
  @ValidateIf((_o, v) => v !== '')
  @IsEmail({}, { message: 'E-mail inválido.' })
  @MaxLength(200)
  email?: string | null;

  @TextoOpcional(20) telefone?: string | null;

  @Inteiro({ opcional: true, min: 1, max: 2, mensagem: 'Status inválido.' })
  ativo?: number;

  @TextoOpcional(10) cep?: string | null;
  @TextoOpcional(200) endereco?: string | null;
  @TextoOpcional(10) numero?: string | null;
  @TextoOpcional(100) bairro?: string | null;
  @TextoOpcional(100) complemento?: string | null;

  @Id(true, 'Cidade inválida.')
  cod_cidade?: number | null;

  @TextoOpcional(5000) observacoes?: string | null;
}
