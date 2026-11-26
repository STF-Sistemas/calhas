import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload } from './jwt-payload';

export const ROTA_PUBLICA = 'rotaPublica';
/** Rota sem login (não passa pelo JwtAuthGuard nem pela verificação de licença). */
export const Publico = () => SetMetadata(ROTA_PUBLICA, true);

export const SEM_LICENCA = 'semLicenca';
/** Rota autenticada que funciona mesmo com a licença vencida (ex.: pagamento da licença). */
export const SemLicenca = () => SetMetadata(SEM_LICENCA, true);

export type TPerfilExigido = 'admin' | 'super_admin';
export const PERFIL_EXIGIDO = 'perfilExigido';
/** Admin ou super admin. */
export const ApenasAdmin = () => SetMetadata(PERFIL_EXIGIDO, 'admin');
/** Somente super admin. */
export const ApenasSuperAdmin = () => SetMetadata(PERFIL_EXIGIDO, 'super_admin');

/** Usuário do token JWT (garantido pelo JwtAuthGuard nas rotas não públicas). */
export const UsuarioAtual = createParamDecorator(
  (_dados: unknown, ctx: ExecutionContext): JwtPayload => ctx.switchToHttp().getRequest<Request>().user as JwtPayload,
);

/** cod_empresa do usuário logado (rotas de empresa sempre têm). */
export const EmpresaAtual = createParamDecorator(
  (_dados: unknown, ctx: ExecutionContext): number => ctx.switchToHttp().getRequest<Request>().user?.cod_empresa as number,
);
