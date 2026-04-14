import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { IFornecedor } from '#shared/interfaces';
import { TApiResponse } from '#shared/types';

@Injectable({ providedIn: 'root' })
export class FornecedorService {
  private readonly apiUrl = `${environment.apiUrl}/fornecedores`;

  constructor(private http: HttpClient) {}

  listar() {
    return this.http.get<TApiResponse<IFornecedor[]>>(this.apiUrl);
  }

  buscarPorId(id: number) {
    return this.http.get<TApiResponse<IFornecedor>>(`${this.apiUrl}/${id}`);
  }

  buscarPorCnpj(cnpj: string) {
    return this.http.get<TApiResponse<IFornecedor>>(`${this.apiUrl}/por-cnpj/${cnpj}`);
  }

  salvar(fornecedor: Partial<IFornecedor>) {
    if (fornecedor.id) {
      return this.http.put<TApiResponse<IFornecedor>>(`${this.apiUrl}/${fornecedor.id}`, fornecedor);
    }
    return this.http.post<TApiResponse<IFornecedor>>(this.apiUrl, fornecedor);
  }

  alterarStatus(id: number, status: number) {
    return this.http.patch<TApiResponse<IFornecedor>>(`${this.apiUrl}/${id}/status`, { status });
  }

  excluir(id: number) {
    return this.http.delete<TApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
