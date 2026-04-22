import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { IFornecedor } from '#shared/interfaces';
import { TApiResponse } from '#shared/types';

@Injectable({ providedIn: 'root' })
export class FornecedorService {
  private readonly apiUrl = `${environment.apiUrl}/fornecedores`;

  constructor(private http: HttpClient) {}

  listar(params?: { razaoSocial?: string; nomeFantasia?: string; cnpj?: string; telefone?: string; status?: number; pagina?: number; limite?: number }) {
    const query = new URLSearchParams();
    if (params?.razaoSocial) query.set('razaoSocial', params.razaoSocial);
    if (params?.nomeFantasia) query.set('nomeFantasia', params.nomeFantasia);
    if (params?.cnpj) query.set('cnpj', params.cnpj);
    if (params?.telefone) query.set('telefone', params.telefone);
    if (params?.status != null) query.set('status', String(params.status));
    if (params?.pagina != null) query.set('pagina', String(params.pagina));
    if (params?.limite != null) query.set('limite', String(params.limite));
    const qs = query.toString();
    return this.http.get<TApiResponse<IFornecedor[]> & { total: number; pagina: number; totalPaginas: number }>(`${this.apiUrl}${qs ? '?' + qs : ''}`);
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
