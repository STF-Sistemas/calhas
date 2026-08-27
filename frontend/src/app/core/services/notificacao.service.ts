import { DestroyRef, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, startWith, switchMap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { INotificacao } from '#shared/interfaces';
import { TApiResponse } from '#shared/types';

const INTERVALO_POLLING_MS = 60_000;

@Injectable({ providedIn: 'root' })
export class NotificacaoService {
  private readonly apiUrl = `${environment.apiUrl}/notificacoes`;

  private readonly _naoLidasCount = signal(0);
  readonly naoLidasCount = this._naoLidasCount.asReadonly();

  constructor(private http: HttpClient) {}

  iniciarPolling(destroyRef: DestroyRef): void {
    interval(INTERVALO_POLLING_MS)
      .pipe(
        startWith(0),
        switchMap(() => this.http.get<TApiResponse<{ count: number }>>(`${this.apiUrl}/nao-lidas/contagem`)),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe({
        next: (res) => this._naoLidasCount.set(res.data.count),
        error: () => {},
      });
  }

  listar(apenasNaoLidas?: boolean) {
    const qs = apenasNaoLidas ? '?apenasNaoLidas=true' : '';
    return this.http.get<TApiResponse<INotificacao[]>>(`${this.apiUrl}${qs}`);
  }

  marcarComoLida(id: number) {
    return this.http.patch<TApiResponse<void>>(`${this.apiUrl}/${id}/lida`, {});
  }

  marcarTodasComoLidas() {
    return this.http.patch<TApiResponse<void>>(`${this.apiUrl}/marcar-todas-lidas`, {});
  }

  decrementarContagem(delta = 1): void {
    this._naoLidasCount.update((v) => Math.max(0, v - delta));
  }

  zerarContagem(): void {
    this._naoLidasCount.set(0);
  }
}
