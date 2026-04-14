import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { ICompra, ICreateCompraDto, IDanfeData } from '#shared/interfaces';
import { TApiResponse } from '#shared/types';

@Injectable({ providedIn: 'root' })
export class CompraService {
  private readonly apiUrl = `${environment.apiUrl}/compras`;

  constructor(private http: HttpClient) {}

  listar() {
    return this.http.get<TApiResponse<ICompra[]>>(this.apiUrl);
  }

  buscarPorId(id: number) {
    return this.http.get<TApiResponse<ICompra>>(`${this.apiUrl}/${id}`);
  }

  salvar(compra: ICreateCompraDto & { id?: number }) {
    if (compra.id) {
      return this.http.put<TApiResponse<ICompra>>(`${this.apiUrl}/${compra.id}`, compra);
    }
    return this.http.post<TApiResponse<ICompra>>(this.apiUrl, compra);
  }

  alterarStatus(id: number, status: number, motivo_cancelamento?: string) {
    return this.http.patch<TApiResponse<ICompra>>(`${this.apiUrl}/${id}/status`, { status, motivo_cancelamento });
  }

  excluir(id: number) {
    return this.http.delete<TApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  atualizarCusto(id: number) {
    return this.http.post<TApiResponse<void>>(`${this.apiUrl}/${id}/atualizar-custo`, {});
  }

  importarXml(arquivo: File) {
    const formData = new FormData();
    formData.append('arquivo', arquivo);
    return this.http.post<TApiResponse<unknown>>(`${this.apiUrl}/importar-xml`, formData);
  }

  getDanfeData(id: number) {
    return this.http.get<TApiResponse<IDanfeData>>(`${this.apiUrl}/${id}/danfe-data`);
  }
}
