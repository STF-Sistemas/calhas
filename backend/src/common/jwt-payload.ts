export interface JwtPayload {
  id: number;
  cod_empresa: number | null;
  admin: boolean;
  super_admin: boolean;
}

declare module 'express' {
  interface Request {
    user?: JwtPayload;
  }
}
