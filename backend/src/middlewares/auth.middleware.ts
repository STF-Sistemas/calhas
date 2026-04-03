import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';

export interface JwtPayload {
  id: number;
  cod_empresa: number | null;
  admin: boolean;
  super_admin: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: 'Token não fornecido.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env['JWT_SECRET'] as string;
    const payload = jwt.verify(token, secret) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: 'Token inválido ou expirado.' });
  }
}

export function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!req.user?.admin && !req.user?.super_admin) {
    res.status(StatusCodes.FORBIDDEN).json({ success: false, message: 'Acesso negado. Requer privilégio de administrador.' });
    return;
  }
  next();
}

export function superAdminMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!req.user?.super_admin) {
    res.status(StatusCodes.FORBIDDEN).json({ success: false, message: 'Acesso negado. Requer privilégio de super administrador.' });
    return;
  }
  next();
}
