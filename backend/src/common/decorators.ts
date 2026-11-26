import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload } from './jwt-payload';

export const ROTA_PUBLICA = 'rotaPublica';
export const Publico = () => SetMetadata(ROTA_PUBLICA, true);

export const SEM_LICENCA = 'semLicenca';
export const SemLicenca = () => SetMetadata(SEM_LICENCA, true);

export type TPerfilExigido = 'admin' | 'super_admin';
export const PERFIL_EXIGIDO = 'perfilExigido';
export const ApenasAdmin = () => SetMetadata(PERFIL_EXIGIDO, 'admin');
export const ApenasSuperAdmin = () => SetMetadata(PERFIL_EXIGIDO, 'super_admin');

export const UsuarioAtual = createParamDecorator(
  (_dados: unknown, ctx: ExecutionContext): JwtPayload => ctx.switchToHttp().getRequest<Request>().user as JwtPayload,
);

export const EmpresaAtual = createParamDecorator(
  (_dados: unknown, ctx: ExecutionContext): number => ctx.switchToHttp().getRequest<Request>().user?.cod_empresa as number,
);
