import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Id, Inteiro, Numero, Texto, TextoOpcional } from '../../common/validadores';

export class PontoDto {
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: 'Ponto do desenho inválido.' })
  @Min(-10_000) @Max(10_000)
  x: number;

  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: 'Ponto do desenho inválido.' })
  @Min(-10_000) @Max(10_000)
  y: number;
}

export class DiagonalDto {
  @ValidateNested() @Type(() => PontoDto)
  p1: PontoDto;

  @ValidateNested() @Type(() => PontoDto)
  p2: PontoDto;
}

export class PedidoItemDto {
  @Id(true)
  id?: number | null;

  @Inteiro({ min: 10, max: 12, mensagem: 'Tipo de item inválido.' })
  tipo: number;

  @Id(true, 'Produto inválido.') cod_produto?: number | null;
  @Id(true, 'Serviço inválido.') cod_servico?: number | null;
  @Id(true, 'Corte inválido.') cod_corte?: number | null;
  @Id(true, 'Desenho inválido.') cod_desenho?: number | null;

  @IsOptional()
  @IsArray({ message: 'Medidas inválidas.' })
  @ArrayMaxSize(500, { message: 'Medidas demais.' })
  @IsNumber({ allowNaN: false, allowInfinity: false }, { each: true, message: 'Medida inválida.' })
  @Min(0, { each: true, message: 'Medida não pode ser negativa.' })
  @Max(1_000_000, { each: true, message: 'Medida inválida.' })
  medidas?: number[] | null;

  @IsOptional()
  @IsArray({ message: 'Desenho inválido.' })
  @ArrayMaxSize(200, { message: 'Desenho com pontos demais.' })
  @ValidateNested({ each: true })
  @Type(() => PontoDto)
  desenho_pontos?: PontoDto[] | null;

  @IsOptional()
  @IsArray({ message: 'Desenho inválido.' })
  @ArrayMaxSize(50, { message: 'Desenho com transversais demais.' })
  @ValidateNested({ each: true })
  @Type(() => DiagonalDto)
  desenho_diagonais?: DiagonalDto[] | null;

  @Numero({ min: 0.0001, mensagem: 'Quantidade inválida.' })
  quantidade: number;

  @Numero({ min: 0, mensagem: 'Valor unitário inválido.' })
  valor_unitario: number;

  @TextoOpcional(1000)
  observacoes?: string | null;
}

export class PedidoDto {
  @Id(false, 'Cliente é obrigatório.')
  cod_cliente: number;

  @Id(true, 'Meio de pagamento inválido.')
  cod_meio_pagamento?: number | null;

  @Texto(40, 'Data do pedido é obrigatória.')
  data_pedido: string;

  @TextoOpcional(2000)
  observacoes?: string | null;

  @TextoOpcional(2000)
  observacoes_cliente?: string | null;

  @Inteiro({ opcional: true, min: 1, max: 2, mensagem: 'Tipo de desconto inválido.' })
  desconto_tipo?: number;

  @Numero({ opcional: true, min: 0, mensagem: 'Desconto não pode ser negativo.' })
  desconto_valor?: number;

  @IsArray({ message: 'Informe ao menos um item.' })
  @ArrayMinSize(1, { message: 'Informe ao menos um item.' })
  @ArrayMaxSize(300, { message: 'Itens demais no pedido.' })
  @ValidateNested({ each: true })
  @Type(() => PedidoItemDto)
  itens: PedidoItemDto[];
}

export class PedidoUpdateDto extends PedidoDto {
  @IsInt({ message: 'Status inválido.' })
  @Min(1, { message: 'Status inválido.' })
  status: number;
}

export class StatusPedidoDto {
  @Inteiro({ mensagem: 'Status inválido.' })
  status: number;
}

export class GerarLinkCorteDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(300)
  @IsInt({ each: true, message: 'Item inválido.' })
  @Min(1, { each: true, message: 'Item inválido.' })
  itens?: number[] | null;
}
