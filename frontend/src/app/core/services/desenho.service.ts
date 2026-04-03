import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { IDesenho } from '#shared/interfaces';
import { TApiResponse } from '#shared/types';

@Injectable({
  providedIn: 'root'
})
export class DesenhoService {
  private readonly apiUrl = `${environment.apiUrl}/desenhos`;

  constructor(private http: HttpClient) {}

  listar() {
    return this.http.get<TApiResponse<IDesenho[]>>(this.apiUrl);
  }

  buscarPorId(id: number) {
    return this.http.get<TApiResponse<IDesenho>>(`${this.apiUrl}/${id}`);
  }

  salvar(desenho: Partial<IDesenho>) {
    if (desenho.id) {
      return this.http.put<TApiResponse<IDesenho>>(`${this.apiUrl}/${desenho.id}`, desenho);
    }
    return this.http.post<TApiResponse<IDesenho>>(this.apiUrl, desenho);
  }

  desativar(id: number) {
    return this.http.delete<TApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
