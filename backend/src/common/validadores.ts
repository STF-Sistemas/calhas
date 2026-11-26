import { applyDecorators, HttpStatus, ParseIntPipe } from '@nestjs/common';
import { falha } from './falha';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

const paraNumero = ({ value }: { value: unknown }) =>
  value === '' || value === null || value === undefined ? value : typeof value === 'string' ? Number(value) : value;

const aparar = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export function Texto(max: number, mensagem = 'Campo obrigatório.') {
  return applyDecorators(
    Transform(aparar),
    IsString({ message: mensagem }),
    IsNotEmpty({ message: mensagem }),
    MaxLength(max, { message: `Máximo de ${max} caracteres.` }),
  );
}

export function TextoOpcional(max: number) {
  return applyDecorators(
    IsOptional(),
    Transform(aparar),
    IsString({ message: 'Texto inválido.' }),
    MaxLength(max, { message: `Máximo de ${max} caracteres.` }),
  );
}

interface IOpcoesNumero {
  opcional?: boolean;
  min?: number;
  max?: number;
  mensagem?: string;
}

export function Numero(opcoes: IOpcoesNumero = {}) {
  const msg = opcoes.mensagem ?? 'Número inválido.';
  const lista = [
    ...(opcoes.opcional ? [IsOptional()] : []),
    Transform(paraNumero),
    IsNumber({ allowNaN: false, allowInfinity: false }, { message: msg }),
    ...(opcoes.min !== undefined ? [Min(opcoes.min, { message: msg })] : []),
    ...(opcoes.max !== undefined ? [Max(opcoes.max, { message: msg })] : []),
  ];
  return applyDecorators(...lista);
}

export function Inteiro(opcoes: IOpcoesNumero = {}) {
  const msg = opcoes.mensagem ?? 'Número inteiro inválido.';
  const lista = [
    ...(opcoes.opcional ? [IsOptional()] : []),
    Transform(paraNumero),
    IsInt({ message: msg }),
    ...(opcoes.min !== undefined ? [Min(opcoes.min, { message: msg })] : []),
    ...(opcoes.max !== undefined ? [Max(opcoes.max, { message: msg })] : []),
  ];
  return applyDecorators(...lista);
}

export function Id(opcional = false, mensagem = 'Registro inválido.') {
  return Inteiro({ opcional, min: 1, mensagem });
}

export function Booleano(opcional = true) {
  return applyDecorators(...(opcional ? [IsOptional()] : []), IsBoolean({ message: 'Valor inválido.' }));
}

export function Data(opcional = true, mensagem = 'Data inválida.') {
  return applyDecorators(...(opcional ? [IsOptional()] : []), IsDateString({}, { message: mensagem }));
}

export function UmDe(valores: readonly unknown[], mensagem = 'Valor inválido.', opcional = false) {
  return applyDecorators(...(opcional ? [IsOptional()] : []), Transform(paraNumero), IsIn(valores as unknown[], { message: mensagem }));
}

export function Lista(max: number, opcional = true) {
  return applyDecorators(
    ...(opcional ? [IsOptional(), ValidateIf((_o, v) => v !== null)] : []),
    IsArray({ message: 'Lista inválida.' }),
    ArrayMaxSize(max, { message: `Máximo de ${max} itens.` }),
  );
}

export const IdPipe = new ParseIntPipe({
  exceptionFactory: () => falha(HttpStatus.BAD_REQUEST, 'Identificador inválido.'),
});
