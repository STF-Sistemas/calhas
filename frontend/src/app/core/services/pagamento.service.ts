import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { ICriarPixResponse, IStatusPixResponse } from '#shared/interfaces';

@Injectable({ providedIn: 'root' })
export class PagamentoService {
  private readonly base = `${environment.apiUrl}/pagamentos`;

  constructor(private http: HttpClient) {}

  criarPix() {
    return this.http.post<{ success: boolean; data: ICriarPixResponse }>(`${this.base}/pix/criar`, {});
  }

  verificarStatus(id: number) {
    return this.http.get<{ success: boolean; data: IStatusPixResponse }>(`${this.base}/pix/status/${id}`);
  }
}
