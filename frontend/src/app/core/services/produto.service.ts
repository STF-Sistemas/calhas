import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { IProduto } from '#shared/interfaces';
import { TApiResponse } from '#shared/types';

@Injectable({
  providedIn: 'root'
})
export class ProdutoService {
  private readonly apiUrl = `${environment.apiUrl}/produtos`;

  constructor(private http: HttpClient) {}

  listar() {
    return this.http.get<TApiResponse<IProduto[]>>(this.apiUrl);
  }

  buscarPorId(id: number) {
    return this.http.get<TApiResponse<IProduto>>(`${this.apiUrl}/${id}`);
  }

  buscarPorGtin(gtin: string) {
    return this.http.get<TApiResponse<IProduto>>(`${this.apiUrl}/por-gtin/${gtin}`);
  }

  buscarPorCodigoFornecedor(codFornecedor: number, codigo: string) {
    return this.http.get<TApiResponse<IProduto>>(`${this.apiUrl}/por-codigo-fornecedor`, {
      params: { cod_fornecedor: codFornecedor, codigo },
    });
  }

  salvarCodigoFornecedor(codProduto: number, codFornecedor: number, codigo: string) {
    return this.http.post<TApiResponse<unknown>>(`${this.apiUrl}/${codProduto}/codigo-fornecedor`, { cod_fornecedor: codFornecedor, codigo });
  }

  salvar(produto: Partial<IProduto>) {
    if (produto.id) {
      return this.http.put<TApiResponse<IProduto>>(`${this.apiUrl}/${produto.id}`, produto);
    }
    return this.http.post<TApiResponse<IProduto>>(this.apiUrl, produto);
  }

  alterarStatus(id: number, status: number) {
    return this.http.patch<TApiResponse<IProduto>>(`${this.apiUrl}/${id}/status`, { status });
  }

  desativar(id: number) {
    return this.http.delete<TApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  buscarHistoricoCompras(id: number) {
    return this.http.get<TApiResponse<IHistoricoCompraProduto[]>>(`${this.apiUrl}/${id}/historico-compras`);
  }
}

export interface IHistoricoCompraProduto {
  cod_compra: number;
  numero_nfe: string;
  serie: string;
  data_emissao: string | null;
  fornecedor: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  custo_unitario: number;
}
