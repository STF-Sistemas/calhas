import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { IMeioPagamento } from '#shared/interfaces';
import { TApiResponse } from '#shared/types';

@Injectable({
  providedIn: 'root'
})
export class MeioPagamentoService {
  private readonly apiUrl = `${environment.apiUrl}/meios-pagamento`;

  constructor(private http: HttpClient) {}

  listar() {
    return this.http.get<TApiResponse<IMeioPagamento[]>>(this.apiUrl);
  }

  buscarPorId(id: number) {
    return this.http.get<TApiResponse<IMeioPagamento>>(`${this.apiUrl}/${id}`);
  }

  salvar(meio: Partial<IMeioPagamento>) {
    if (meio.id) {
      return this.http.put<TApiResponse<IMeioPagamento>>(`${this.apiUrl}/${meio.id}`, meio);
    }
    return this.http.post<TApiResponse<IMeioPagamento>>(this.apiUrl, meio);
  }

  alterarStatus(id: number, status: number) {
    return this.http.patch<TApiResponse<IMeioPagamento>>(`${this.apiUrl}/${id}/status`, { status });
  }

  desativar(id: number) {
    return this.http.delete<TApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
