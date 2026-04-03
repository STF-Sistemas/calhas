import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { IUsuario } from '#shared/interfaces';
import { TApiResponse } from '#shared/types';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private readonly apiUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  listar() {
    return this.http.get<TApiResponse<IUsuario[]>>(this.apiUrl);
  }

  buscarPorId(id: number) {
    return this.http.get<TApiResponse<IUsuario>>(`${this.apiUrl}/${id}`);
  }

  salvar(usuario: any) {
    if (usuario.id) {
      return this.http.put<TApiResponse<IUsuario>>(`${this.apiUrl}/${usuario.id}`, usuario);
    }
    return this.http.post<TApiResponse<IUsuario>>(this.apiUrl, usuario);
  }

  desativar(id: number) {
    return this.http.delete<TApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
