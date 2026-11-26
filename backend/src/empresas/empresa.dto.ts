import { IsEmail, IsOptional, MaxLength, ValidateBy, ValidateIf } from 'class-validator';
import { isLogoDataUriValido } from '#shared/functions/logo.functions';
import { Booleano, Data, Id, Inteiro, Numero, Texto, TextoOpcional } from '../common/validadores';

const LogoValido = () =>
  ValidateBy({
    name: 'logoValido',
    validator: {
      validate: (valor: unknown) => valor === null || (typeof valor === 'string' && isLogoDataUriValido(valor)),
      defaultMessage: () => 'Logo inválido. Envie um arquivo PNG ou JPG de até 1MB.',
    },
  });

export class MinhaEmpresaDto {
  @Texto(200, 'Razão social é obrigatória.')
  razao_social: string;

  @TextoOpcional(200)
  nome_fantasia?: string | null;

  @Texto(20, 'CNPJ é obrigatório.')
  cnpj: string;

  @IsOptional()
  @ValidateIf((_o, v) => v !== '')
  @IsEmail({}, { message: 'E-mail inválido.' })
  @MaxLength(200)
  email?: string | null;

  @TextoOpcional(20) telefone?: string | null;
  @TextoOpcional(10) cep?: string | null;
  @TextoOpcional(200) endereco?: string | null;
  @TextoOpcional(10) numero?: string | null;
  @TextoOpcional(100) bairro?: string | null;
  @TextoOpcional(100) complemento?: string | null;

  @Id(true, 'Cidade inválida.')
  cod_cidade?: number | null;

  @TextoOpcional(250)
  marca_dagua?: string | null;

  @IsOptional()
  @LogoValido()
  logo_url?: string | null;

  @Booleano()
  validar_estoque?: boolean;

  @Inteiro({ opcional: true, min: 1, max: 20, mensagem: 'Quantidade de desenhos por folha inválida.' })
  quantidade_desenho_por_folha?: number;

  @TextoOpcional(4000)
  whatsapp_mensagem_padrao?: string | null;

  @Inteiro({ opcional: true, min: 1, max: 365, mensagem: 'Validade do link inválida.' })
  link_validade_dias?: number;
}

export class EmpresaDto extends MinhaEmpresaDto {
  @Data()
  data_expiracao?: string | null;

  @Numero({ opcional: true, min: 0, mensagem: 'Valor da mensalidade inválido.' })
  valor_mensalidade?: number;

  @Inteiro({ opcional: true, min: 1, max: 2, mensagem: 'Status inválido.' })
  ativo?: number;
}

export class ValidadeDto {
  @Data()
  data_expiracao?: string | null;

  @Numero({ opcional: true, min: 0, mensagem: 'Valor da mensalidade inválido.' })
  valor_mensalidade?: number;
}
