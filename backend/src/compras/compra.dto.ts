import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Id, Numero, Texto, TextoOpcional, UmDe } from '../common/validadores';

const valorOpcional = (mensagem = 'Valor inválido.') => Numero({ opcional: true, min: 0, mensagem });

export class CompraItemDto {
  @Id(false, 'Produto é obrigatório em todos os itens.')
  cod_produto: number;

  @TextoOpcional(200) descricao_xml?: string | null;

  @Texto(200, 'Descrição do item é obrigatória.')
  descricao: string;

  @TextoOpcional(10) ncm?: string | null;
  @TextoOpcional(5) cfop?: string | null;

  @Texto(10, 'Unidade é obrigatória.')
  unidade: string;

  @Numero({ min: 0.0001, mensagem: 'Quantidade inválida.' })
  quantidade: number;

  @Numero({ min: 0, mensagem: 'Valor unitário inválido.' })
  valor_unitario: number;

  @Numero({ min: 0, mensagem: 'Valor total inválido.' })
  valor_total: number;

  @valorOpcional() desconto?: number | null;
  @valorOpcional() base_icms?: number | null;
  @valorOpcional() aliq_icms?: number | null;
  @valorOpcional() valor_icms?: number | null;
  @valorOpcional() base_icms_st?: number | null;
  @valorOpcional() valor_icms_st?: number | null;
  @valorOpcional() valor_ipi?: number | null;
  @valorOpcional() aliq_pis?: number | null;
  @valorOpcional() valor_pis?: number | null;
  @valorOpcional() aliq_cofins?: number | null;
  @valorOpcional() valor_cofins?: number | null;
}

export class CompraDto {
  @Id(false, 'Fornecedor é obrigatório.')
  cod_fornecedor: number;

  @TextoOpcional(20) numero_nfe?: string | null;
  @TextoOpcional(5) serie?: string | null;
  @TextoOpcional(44) chave_acesso?: string | null;
  @TextoOpcional(40) data_emissao?: string | null;
  @TextoOpcional(40) data_entrada?: string | null;

  @valorOpcional() valor_frete?: number | null;
  @valorOpcional() valor_seguro?: number | null;
  @valorOpcional() valor_desconto?: number | null;
  @valorOpcional() valor_outros?: number | null;

  @TextoOpcional(500) observacao?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1_500_000, { message: 'XML muito grande.' })
  xml_content?: string;

  @IsArray({ message: 'Informe ao menos um item.' })
  @ArrayMinSize(1, { message: 'Informe ao menos um item.' })
  @ArrayMaxSize(500, { message: 'Itens demais na compra.' })
  @ValidateNested({ each: true })
  @Type(() => CompraItemDto)
  itens: CompraItemDto[];
}

export class StatusCompraDto {
  @UmDe([1, 2, 3], 'Status inválido. Use 1=Rascunho, 2=Confirmada, 3=Cancelada.')
  status: number;

  @TextoOpcional(500)
  motivo_cancelamento?: string | null;
}
