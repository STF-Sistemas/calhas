import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SwPush } from '@angular/service-worker';
import { environment } from 'src/environments/environment';
import { TApiResponse } from '#shared/types';

@Injectable({ providedIn: 'root' })
export class PushNotificacaoService {
  private readonly apiUrl = `${environment.apiUrl}/push-subscription`;

  private readonly _inscrito = signal(false);
  readonly inscrito = this._inscrito.asReadonly();

  constructor(private swPush: SwPush, private http: HttpClient) {}

  get suportado(): boolean {
    return this.swPush.isEnabled;
  }

  carregarStatus(): void {
    if (!this.suportado) return;
    this.http.get<TApiResponse<{ inscrito: boolean }>>(`${this.apiUrl}/status`).subscribe({
      next: (res) => this._inscrito.set(res.data.inscrito),
      error: () => {},
    });
  }

  async ativar(): Promise<void> {
    if (!this.suportado || !environment.vapidPublicKey) return;
    try {
      const subscription = await this.swPush.requestSubscription({ serverPublicKey: environment.vapidPublicKey });
      const json = subscription.toJSON();
      await firstValueFrom(this.http.post<TApiResponse<void>>(this.apiUrl, {
        endpoint: json.endpoint,
        keys: { p256dh: json.keys?.['p256dh'], auth: json.keys?.['auth'] },
      }));
      this._inscrito.set(true);
    } catch (err) {
      console.error('[PUSH_ATIVAR]', err);
      throw err;
    }
  }

  async desativar(): Promise<void> {
    if (!this.suportado) return;
    try {
      const subscription = await firstValueFrom(this.swPush.subscription);
      if (subscription) {
        const json = subscription.toJSON();
        await firstValueFrom(this.http.delete<TApiResponse<void>>(this.apiUrl, { body: { endpoint: json.endpoint } }));
        await subscription.unsubscribe();
      }
      this._inscrito.set(false);
    } catch (err) {
      console.error('[PUSH_DESATIVAR]', err);
      throw err;
    }
  }
}
