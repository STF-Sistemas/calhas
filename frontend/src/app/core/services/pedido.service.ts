import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { IPedido, IPedidoItem } from '#shared/interfaces';
import { TApiResponse } from '#shared/types';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  private readonly apiUrl = `${environment.apiUrl}/pedidos`;

  constructor(private http: HttpClient) {}

  listar() {
    return this.http.get<TApiResponse<IPedido[]>>(this.apiUrl);
  }

  buscarPorId(id: number) {
    return this.http.get<TApiResponse<IPedido>>(`${this.apiUrl}/${id}`);
  }

  salvar(pedido: Partial<IPedido>) {
    if (pedido.id) {
      return this.http.put<TApiResponse<IPedido>>(`${this.apiUrl}/${pedido.id}`, pedido);
    }
    return this.http.post<TApiResponse<IPedido>>(this.apiUrl, pedido);
  }

  alterarStatus(id: number, status: number) {
    return this.http.patch<TApiResponse<IPedido>>(`${this.apiUrl}/${id}/status`, { status });
  }

  remover(id: number) {
    return this.http.delete<TApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  // Itens do Pedido
  removerItem(pedidoId: number, itemId: number) {
    return this.http.delete<TApiResponse<void>>(`${this.apiUrl}/${pedidoId}/itens/${itemId}`);
  }
}
