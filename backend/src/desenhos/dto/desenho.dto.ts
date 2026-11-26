import { Type } from 'class-transformer';
import { IsNumber, Max, Min, ValidateNested } from 'class-validator';
import { Inteiro, Lista, Texto } from '../../common/validadores';

export class PontoDesenhoDto {
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: 'Ponto do desenho inválido.' })
  @Min(-10_000)
  @Max(10_000)
  x: number;

  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: 'Ponto do desenho inválido.' })
  @Min(-10_000)
  @Max(10_000)
  y: number;
}

export class DiagonalDesenhoDto {
  @ValidateNested()
  @Type(() => PontoDesenhoDto)
  p1: PontoDesenhoDto;

  @ValidateNested()
  @Type(() => PontoDesenhoDto)
  p2: PontoDesenhoDto;
}

export class DesenhoDto {
  @Texto(200, 'Descrição é obrigatória.')
  descricao: string;

  @Lista(200)
  @ValidateNested({ each: true })
  @Type(() => PontoDesenhoDto)
  pontos?: PontoDesenhoDto[];

  @Lista(50)
  @ValidateNested({ each: true })
  @Type(() => DiagonalDesenhoDto)
  diagonais?: DiagonalDesenhoDto[];

  @Inteiro({ opcional: true, min: 1, max: 2, mensagem: 'Status inválido.' })
  status?: number;
}
