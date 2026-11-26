import { HttpStatus, ValidationError, ValidationPipe } from '@nestjs/common';
import { falha } from './falha';

function primeiraMensagem(erros: ValidationError[]): string | undefined {
  for (const erro of erros) {
    const msg = erro.constraints ? Object.values(erro.constraints)[0] : undefined;
    if (msg) return msg;
    const filho = erro.children?.length ? primeiraMensagem(erro.children) : undefined;
    if (filho) return filho;
  }
  return undefined;
}

export const validacaoPipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  exceptionFactory: (erros) => falha(HttpStatus.BAD_REQUEST, primeiraMensagem(erros) ?? 'Dados inválidos.'),
});
