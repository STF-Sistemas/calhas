import { HttpException, HttpStatus } from '@nestjs/common';

export function falha(status: HttpStatus | number, message: string, extra: Record<string, unknown> = {}): HttpException {
  return new HttpException({ success: false, message, ...extra }, status);
}
