import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { IEmpresa } from '#shared/interfaces';
import { TApiResponse } from '#shared/types';

@Injectable({
  providedIn: 'root'
})
export class EmpresaService {
  private readonly apiUrl = `${environment.apiUrl}/empresas`;

  constructor(private http: HttpClient) {}

  listar() {
    return this.http.get<TApiResponse<IEmpresa[]>>(this.apiUrl);
  }

  buscarPorId(id: number) {
    return this.http.get<TApiResponse<IEmpresa>>(`${this.apiUrl}/${id}`);
  }

  salvar(empresa: Partial<IEmpresa>) {
    if (empresa.id) {
      return this.http.put<TApiResponse<IEmpresa>>(`${this.apiUrl}/${empresa.id}`, empresa);
    }
    return this.http.post<TApiResponse<IEmpresa>>(this.apiUrl, empresa);
  }

  desativar(id: number) {
    return this.http.delete<TApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
