import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { ROTA_PUBLICA } from '../decorators';
import { falha } from '../falha';
import { JwtPayload } from '../jwt-payload';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const publica = this.reflector.getAllAndOverride<boolean>(ROTA_PUBLICA, [ctx.getHandler(), ctx.getClass()]);
    if (publica) return true;

    const req = ctx.switchToHttp().getRequest<Request>();
    const header = req.headers['authorization'];
    if (!header?.startsWith('Bearer ')) throw falha(HttpStatus.UNAUTHORIZED, 'Token não fornecido.');
    try {
      req.user = jwt.verify(header.slice(7), process.env['JWT_SECRET'] as string) as JwtPayload;
      return true;
    } catch {
      throw falha(HttpStatus.UNAUTHORIZED, 'Token inválido ou expirado.');
    }
  }
}
