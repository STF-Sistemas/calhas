import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[ERROR]', err.message, err.stack);
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: 'Erro interno do servidor.',
    error: process.env['NODE_ENV'] === 'development' ? err.message : undefined,
  });
}
