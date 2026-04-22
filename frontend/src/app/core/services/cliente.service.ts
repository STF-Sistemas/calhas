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

  listar(params?: { nome?: string; endereco?: string; cpfCnpj?: string; telefone?: string; ativo?: number; pagina?: number; limite?: number }) {
    const query = new URLSearchParams();
    if (params?.nome) query.set('nome', params.nome);
    if (params?.endereco) query.set('endereco', params.endereco);
    if (params?.cpfCnpj) query.set('cpfCnpj', params.cpfCnpj);
    if (params?.telefone) query.set('telefone', params.telefone);
    if (params?.ativo != null) query.set('ativo', String(params.ativo));
    if (params?.pagina != null) query.set('pagina', String(params.pagina));
    if (params?.limite != null) query.set('limite', String(params.limite));
    const qs = query.toString();
    return this.http.get<TApiResponse<ICliente[]> & { total: number; pagina: number; totalPaginas: number }>(`${this.apiUrl}${qs ? '?' + qs : ''}`);
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

  consultarReceita(cpfCnpj: string) {
    return this.http.get<TApiResponse<any>>(`${this.apiUrl}/consultar-receita/${cpfCnpj}`);
  }

  buscarCep(cep: string) {
    return this.http.get<TApiResponse<ICepResponse>>(`${environment.apiUrl}/cep/${cep}`);
  }
}
