import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Erro de API no formato que o frontend já espera: `{ success: false, message, ...extra }`.
 * Usar no service no lugar de `res.status(...).json(...)`.
 */
export function falha(status: HttpStatus | number, message: string, extra: Record<string, unknown> = {}): HttpException {
  return new HttpException({ success: false, message, ...extra }, status);
}
