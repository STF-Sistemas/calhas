import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { IRelatorioPedidosLucros } from '#shared/interfaces';
import { TApiResponse } from '#shared/types';

export interface IFiltrosPedidosLucros {
  data_inicio?: string;
  data_fim?: string;
  cod_cliente?: number;
  cod_produto?: number;
}

@Injectable({ providedIn: 'root' })
export class RelatorioService {
  private readonly apiUrl = `${environment.apiUrl}/relatorios`;

  constructor(private http: HttpClient) {}

  pedidosLucros(filtros: IFiltrosPedidosLucros) {
    const params: Record<string, string> = {};
    if (filtros.data_inicio) params['data_inicio'] = filtros.data_inicio;
    if (filtros.data_fim)    params['data_fim']    = filtros.data_fim;
    if (filtros.cod_cliente) params['cod_cliente'] = String(filtros.cod_cliente);
    if (filtros.cod_produto) params['cod_produto'] = String(filtros.cod_produto);
    return this.http.get<TApiResponse<IRelatorioPedidosLucros>>(`${this.apiUrl}/pedidos-lucros`, { params });
  }
}
