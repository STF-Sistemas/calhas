import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { ROTA_PUBLICA } from '../decorators';
import { JwtPayload } from '../jwt-payload';

function usuarioDoToken(req: Request): number | null {
  const header = req.headers['authorization'];
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(header.slice(7), process.env['JWT_SECRET'] as string, {
      algorithms: ['HS256'],
    }) as JwtPayload;
    return Number.isInteger(payload?.id) ? payload.id : null;
  } catch {
    return null;
  }
}

@Injectable()
export class LimiteGuard extends ThrottlerGuard {
  protected override async handleRequest(props: ThrottlerRequest): Promise<boolean> {
    const alvos = [props.context.getHandler(), props.context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(ROTA_PUBLICA, alvos)) return super.handleRequest(props);
    const idUsuario = usuarioDoToken(this.getRequestResponse(props.context).req as Request);
    if (!idUsuario) return super.handleRequest(props);
    return super.handleRequest({ ...props, getTracker: async () => `usuario:${idUsuario}` });
  }
}
