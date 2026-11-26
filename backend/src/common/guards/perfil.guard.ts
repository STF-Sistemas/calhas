import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PERFIL_EXIGIDO, TPerfilExigido } from '../decorators';
import { falha } from '../falha';

@Injectable()
export class PerfilGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const exigido = this.reflector.getAllAndOverride<TPerfilExigido>(PERFIL_EXIGIDO, [ctx.getHandler(), ctx.getClass()]);
    if (!exigido) return true;
    const usuario = ctx.switchToHttp().getRequest<Request>().user;
    if (exigido === 'super_admin' && !usuario?.super_admin) {
      throw falha(HttpStatus.FORBIDDEN, 'Acesso negado. Requer privilégio de super administrador.');
    }
    if (exigido === 'admin' && !usuario?.admin && !usuario?.super_admin) {
      throw falha(HttpStatus.FORBIDDEN, 'Acesso negado. Requer privilégio de administrador.');
    }
    return true;
  }
}
