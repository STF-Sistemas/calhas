import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { ICliente, ICepResponse } from '#shared/interfaces';
import { TApiResponse } from '#shared/types';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private readonly apiUrl = `${environment.apiUrl}/clientes`;

  constructor(private http: HttpClient) {}

  listar() {
    return this.http.get<TApiResponse<ICliente[]>>(this.apiUrl);
  }

  buscarPorId(id: number) {
    return this.http.get<TApiResponse<ICliente>>(`${this.apiUrl}/${id}`);
  }

  salvar(cliente: Partial<ICliente>) {
    if (cliente.id) {
      return this.http.put<TApiResponse<ICliente>>(`${this.apiUrl}/${cliente.id}`, cliente);
    }
    return this.http.post<TApiResponse<ICliente>>(this.apiUrl, cliente);
  }

  desativar(id: number) {
    return this.http.delete<TApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  buscarCep(cep: string) {
    return this.http.get<TApiResponse<ICepResponse>>(`${environment.apiUrl}/cep/${cep}`);
  }
}
