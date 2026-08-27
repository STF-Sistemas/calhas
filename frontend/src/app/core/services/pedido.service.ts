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

  listar(params?: { dataInicio?: string; dataFim?: string; codCliente?: number; status?: number; pagina?: number; limite?: number }) {
    const query = new URLSearchParams();
    if (params?.dataInicio) query.set('dataInicio', params.dataInicio);
    if (params?.dataFim) query.set('dataFim', params.dataFim);
    if (params?.codCliente != null) query.set('codCliente', String(params.codCliente));
    if (params?.status != null) query.set('status', String(params.status));
    if (params?.pagina != null) query.set('pagina', String(params.pagina));
    if (params?.limite != null) query.set('limite', String(params.limite));
    const qs = query.toString();
    return this.http.get<TApiResponse<IPedido[]> & { total: number; pagina: number; totalPaginas: number }>(`${this.apiUrl}${qs ? '?' + qs : ''}`);
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

  gerarLink(id: number) {
    return this.http.post<TApiResponse<{ token: string; expiracao: string; mensagem_padrao: string }>>(`${this.apiUrl}/${id}/gerar-link`, {});
  }

  gerarLinkOrdemCorte(id: number) {
    return this.http.post<TApiResponse<{ token: string; expiracao: string }>>(`${this.apiUrl}/${id}/gerar-link-corte`, {});
  }

  buscarPublico(token: string) {
    return this.http.get<TApiResponse<any>>(`${environment.apiUrl}/pedidos-publico/${token}`);
  }

  buscarOrdemCortePublico(token: string) {
    return this.http.get<TApiResponse<any>>(`${environment.apiUrl}/ordem-corte-publico/${token}`);
  }

  autorizarPublico(token: string, assinatura: string) {
    return this.http.post<TApiResponse<{ aprovacao_status: number; aprovacao_data: string }>>(
      `${environment.apiUrl}/pedidos-publico/${token}/autorizar`,
      { assinatura }
    );
  }

  recusarPublico(token: string, motivo?: string) {
    return this.http.post<TApiResponse<{ aprovacao_status: number; aprovacao_data: string }>>(
      `${environment.apiUrl}/pedidos-publico/${token}/recusar`,
      { motivo }
    );
  }
}
