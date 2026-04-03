import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { IServico } from '#shared/interfaces';
import { TApiResponse } from '#shared/types';

@Injectable({
  providedIn: 'root'
})
export class ServicoService {
  private readonly apiUrl = `${environment.apiUrl}/servicos`;

  constructor(private http: HttpClient) {}

  listar() {
    return this.http.get<TApiResponse<IServico[]>>(this.apiUrl);
  }

  buscarPorId(id: number) {
    return this.http.get<TApiResponse<IServico>>(`${this.apiUrl}/${id}`);
  }

  salvar(servico: Partial<IServico>) {
    if (servico.id) {
      return this.http.put<TApiResponse<IServico>>(`${this.apiUrl}/${servico.id}`, servico);
    }
    return this.http.post<TApiResponse<IServico>>(this.apiUrl, servico);
  }

  alterarStatus(id: number, status: number) {
    return this.http.patch<TApiResponse<IServico>>(`${this.apiUrl}/${id}/status`, { status });
  }

  desativar(id: number) {
    return this.http.delete<TApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
