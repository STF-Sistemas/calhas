import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { IChapa, ICorte } from '#shared/interfaces';
import { TApiResponse } from '#shared/types';

@Injectable({
  providedIn: 'root'
})
export class ChapaService {
  private readonly apiUrl = `${environment.apiUrl}/chapas`;

  constructor(private http: HttpClient) {}

  listar() {
    return this.http.get<TApiResponse<IChapa[]>>(this.apiUrl);
  }

  buscarPorId(id: number) {
    return this.http.get<TApiResponse<IChapa>>(`${this.apiUrl}/${id}`);
  }

  salvar(chapa: Partial<IChapa>) {
    if (chapa.id) {
      return this.http.put<TApiResponse<IChapa>>(`${this.apiUrl}/${chapa.id}`, chapa);
    }
    return this.http.post<TApiResponse<IChapa>>(this.apiUrl, chapa);
  }

  alterarStatus(id: number, status: number) {
    return this.http.patch<TApiResponse<IChapa>>(`${this.apiUrl}/${id}/status`, { status });
  }

  desativar(id: number) {
    return this.http.delete<TApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  // Cortes subordinados
  adicionarCorte(chapaId: number, corte: Partial<ICorte>) {
    return this.http.post<TApiResponse<ICorte>>(`${this.apiUrl}/${chapaId}/cortes`, corte);
  }

  atualizarCorte(chapaId: number, corteId: number, corte: Partial<ICorte>) {
    return this.http.put<TApiResponse<ICorte>>(`${this.apiUrl}/${chapaId}/cortes/${corteId}`, corte);
  }

  removerCorte(chapaId: number, corteId: number) {
    return this.http.delete<TApiResponse<void>>(`${this.apiUrl}/${chapaId}/cortes/${corteId}`);
  }
}
