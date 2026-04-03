import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { TApiResponse } from '#shared/types';
import { IPedido } from '#shared/interfaces';

export interface IDashboardStats {
  pedidosMes: number;
  receitaMes: number;
  clientesAtivos: number;
  pedidosAbertos: number;
  pedidosEmProducao: number;
  pedidosConcluidos: number;
  pedidosCancelados: number;
  pedidosRecentes: IPedido[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private http: HttpClient) {}

  carregar() {
    return this.http.get<TApiResponse<IDashboardStats>>(`${environment.apiUrl}/dashboard`);
  }
}
