import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { EStatusGeral } from '#shared/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { ROTA_PUBLICA } from '../decorators';
import { falha } from '../falha';
import { JwtPayload } from '../jwt-payload';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const publica = this.reflector.getAllAndOverride<boolean>(ROTA_PUBLICA, [ctx.getHandler(), ctx.getClass()]);
    if (publica) return true;

    const req = ctx.switchToHttp().getRequest<Request>();
    const header = req.headers['authorization'];
    if (!header?.startsWith('Bearer ')) throw falha(HttpStatus.UNAUTHORIZED, 'Token não fornecido.');

    let payload: JwtPayload;
    try {
      payload = jwt.verify(header.slice(7), process.env['JWT_SECRET'] as string, { algorithms: ['HS256'] }) as JwtPayload;
    } catch {
      throw falha(HttpStatus.UNAUTHORIZED, 'Token inválido ou expirado.');
    }

    const usuario = Number.isInteger(payload?.id)
      ? await this.prisma.usuario.findFirst({
          where: { id: payload.id, excluido: false },
          select: {
            id: true,
            status: true,
            admin: true,
            super_admin: true,
            cod_empresa: true,
            token_versao: true,
            empresa: { select: { ativo: true, excluido: true, data_expiracao: true } },
          },
        })
      : null;
    if (!usuario || usuario.status !== EStatusGeral.Ativo || usuario.token_versao !== (payload.tv ?? 0)) {
      throw falha(HttpStatus.UNAUTHORIZED, 'Sessão encerrada. Entre novamente.');
    }

    req.user = {
      id: usuario.id,
      cod_empresa: usuario.cod_empresa,
      admin: usuario.admin,
      super_admin: usuario.super_admin,
      tv: usuario.token_versao,
    };
    req.licenca = usuario.empresa;
    return true;
  }
}
