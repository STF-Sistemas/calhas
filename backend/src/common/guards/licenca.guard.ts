import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROTA_PUBLICA, SEM_LICENCA } from '../decorators';
import { falha } from '../falha';

@Injectable()
export class LicencaGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const alvos = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(ROTA_PUBLICA, alvos)) return true;
    if (this.reflector.getAllAndOverride<boolean>(SEM_LICENCA, alvos)) return true;

    const req = ctx.switchToHttp().getRequest<Request>();
    const usuario = req.user;
    if (!usuario || usuario.super_admin || !usuario.cod_empresa) return true;

    const empresa = req.licenca;
    if (!empresa || empresa.excluido || empresa.ativo !== 1) {
      throw falha(HttpStatus.FORBIDDEN, 'Empresa inativa.', { code: 'EMPRESA_INATIVA' });
    }
    if (empresa.data_expiracao && new Date() > new Date(empresa.data_expiracao)) {
      throw falha(HttpStatus.PAYMENT_REQUIRED, 'Licença expirada. Efetue o pagamento para continuar.', {
        code: 'LICENCA_EXPIRADA',
      });
    }
    return true;
  }
}
