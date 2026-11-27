import { DestroyRef, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, Subject } from 'rxjs';
import { environment } from '#environments/environment';
import { IEventoTempoReal } from '#shared/interfaces';
import { AuthService } from './auth.service';

const ESPERA_INICIAL_MS = 2_000;
const ESPERA_MAXIMA_MS = 30_000;

@Injectable({ providedIn: 'root' })
export class EventosService {
  private readonly auth = inject(AuthService);
  private readonly noNavegador = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly _pedidoAprovacao = new Subject<IEventoTempoReal>();
  readonly pedidoAprovacao$: Observable<IEventoTempoReal> = this._pedidoAprovacao.asObservable();

  private controle?: AbortController;
  private espera = ESPERA_INICIAL_MS;
  private timerReconexao?: ReturnType<typeof setTimeout>;

  conectar(destroyRef: DestroyRef): void {
    if (!this.noNavegador || this.controle) return;
    destroyRef.onDestroy(() => this.desconectar());
    void this.abrirFluxo();
  }

  desconectar(): void {
    if (this.timerReconexao) clearTimeout(this.timerReconexao);
    this.timerReconexao = undefined;
    this.controle?.abort();
    this.controle = undefined;
    this.espera = ESPERA_INICIAL_MS;
  }

  private async abrirFluxo(): Promise<void> {
    const token = this.auth.token;
    if (!token) return;
    const controle = new AbortController();
    this.controle = controle;
    try {
      const resposta = await fetch(`${environment.apiUrl}/eventos/fluxo`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
        signal: controle.signal,
        cache: 'no-store',
      });
      if (resposta.status === 401 || resposta.status === 402 || resposta.status === 403) {
        this.controle = undefined;
        return;
      }
      if (!resposta.ok || !resposta.body) throw new Error(String(resposta.status));
      this.espera = ESPERA_INICIAL_MS;
      await this.lerFluxo(resposta.body);
    } catch {
      if (controle.signal.aborted) return;
    }
    if (controle.signal.aborted || this.controle !== controle) return;
    this.agendarReconexao(controle);
  }

  private agendarReconexao(controle: AbortController): void {
    this.timerReconexao = setTimeout(() => {
      if (this.controle !== controle) return;
      this.controle = undefined;
      void this.abrirFluxo();
    }, this.espera);
    this.espera = Math.min(this.espera * 2, ESPERA_MAXIMA_MS);
  }

  private async lerFluxo(corpo: ReadableStream<Uint8Array>): Promise<void> {
    const leitor = corpo.getReader();
    const decodificador = new TextDecoder();
    let pendente = '';
    for (;;) {
      const { value, done } = await leitor.read();
      if (done) return;
      pendente += decodificador.decode(value, { stream: true }).replace(/\r\n/g, '\n');
      let fim = pendente.indexOf('\n\n');
      while (fim >= 0) {
        this.processarBloco(pendente.slice(0, fim));
        pendente = pendente.slice(fim + 2);
        fim = pendente.indexOf('\n\n');
      }
    }
  }

  private processarBloco(bloco: string): void {
    let tipo = 'message';
    const dados: string[] = [];
    for (const linha of bloco.split('\n')) {
      if (linha.startsWith('event:')) tipo = linha.slice(6).trim();
      else if (linha.startsWith('data:')) dados.push(linha.slice(5).trimStart());
    }
    if (tipo !== 'pedido_aprovacao' || !dados.length) return;
    try {
      const evento = JSON.parse(dados.join('\n')) as IEventoTempoReal;
      if (Number.isInteger(evento?.cod_pedido)) this._pedidoAprovacao.next(evento);
    } catch {
      return;
    }
  }
}
