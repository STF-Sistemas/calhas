import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Response } from 'express';

/**
 * Mantém o formato de erro da API: `{ success: false, message, ... }`.
 * Erro inesperado vira 500 genérico (o detalhe fica só no log).
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Erro');

  catch(erro: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();

    if (erro instanceof ThrottlerException) {
      res.status(HttpStatus.TOO_MANY_REQUESTS).json({
        success: false,
        message: 'Muitas requisições. Tente novamente em alguns minutos.',
      });
      return;
    }

    if (erro instanceof HttpException) {
      const status = erro.getStatus();
      const corpo = erro.getResponse();
      if (typeof corpo === 'object' && corpo !== null && 'success' in corpo) {
        res.status(status).json(corpo);
        return;
      }
      const bruta = typeof corpo === 'string' ? corpo : (corpo as { message?: unknown }).message;
      const mensagem = Array.isArray(bruta) ? String(bruta[0]) : String(bruta ?? erro.message);
      res.status(status).json({ success: false, message: status === 404 ? 'Recurso não encontrado.' : mensagem });
      return;
    }

    this.logger.error(erro instanceof Error ? (erro.stack ?? erro.message) : String(erro));
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Erro interno do servidor.',
      error: process.env['NODE_ENV'] === 'development' && erro instanceof Error ? erro.message : undefined,
    });
  }
}
