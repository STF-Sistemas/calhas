import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { ROTA_PUBLICA, SEM_LICENCA } from '../decorators';
import { falha } from '../falha';

/**
 * Bloqueia empresa inativa (403) ou com licença vencida (402).
 * Super admin e usuário sem empresa sempre passam.
 */
@Injectable()
export class LicencaGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const alvos = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(ROTA_PUBLICA, alvos)) return true;
    if (this.reflector.getAllAndOverride<boolean>(SEM_LICENCA, alvos)) return true;

    const usuario = ctx.switchToHttp().getRequest<Request>().user;
    if (!usuario || usuario.super_admin || !usuario.cod_empresa) return true;

    const empresa = await this.prisma.empresa.findFirst({
      where: { id: usuario.cod_empresa, excluido: false },
      select: { data_expiracao: true, ativo: true },
    });
    if (!empresa || empresa.ativo !== 1) {
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
