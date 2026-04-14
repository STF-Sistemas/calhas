import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '#config/prisma';
import { JwtPayload } from './auth.middleware';

/**
 * Verifica se a licença da empresa está vigente.
 * Super admin e usuários sem empresa vinculada sempre passam.
 * Retorna 402 se a licença estiver expirada.
 */
export const empresaValidadeMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) { next(); return; }

  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, process.env['JWT_SECRET'] as string) as JwtPayload;

    // Super admin e usuários sem empresa: bypass
    if (payload.super_admin || !payload.cod_empresa) { next(); return; }

    const empresa = await prisma.empresa.findFirst({
      where: { id: payload.cod_empresa, excluido: false },
      select: { data_expiracao: true, ativo: true },
    });

    if (!empresa || empresa.ativo !== 1) {
      res.status(403).json({ success: false, code: 'EMPRESA_INATIVA', message: 'Empresa inativa.' });
      return;
    }

    if (empresa.data_expiracao && new Date() > new Date(empresa.data_expiracao)) {
      res.status(402).json({
        success: false,
        code: 'LICENCA_EXPIRADA',
        message: 'Licença expirada. Efetue o pagamento para continuar.',
      });
      return;
    }

    next();
  } catch {
    // JWT inválido ou erro inesperado: deixa passar (auth middleware rejeita se necessário)
    next();
  }
};
