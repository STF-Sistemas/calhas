export interface JwtPayload {
  id: number;
  cod_empresa: number | null;
  admin: boolean;
  super_admin: boolean;
  tv?: number;
}

export interface ILicencaEmpresa {
  ativo: number;
  excluido: boolean;
  data_expiracao: Date | null;
}

declare module 'express' {
  interface Request {
    user?: JwtPayload;
    licenca?: ILicencaEmpresa | null;
  }
}
