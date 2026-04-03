import { IUsuario } from './IUsuario';

export interface ILoginResponse {
  token: string;
  usuario: Omit<IUsuario, 'senha'>;
}
