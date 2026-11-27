import { DestroyRef, Injectable, NgZone, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationStart, Router } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { filter } from 'rxjs';
import { ToastService } from '#shared-frontend/services/toast.service';

const INTERVALO_VERIFICACAO_MS = 5 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class AtualizacaoService {
  private readonly sw = inject(SwUpdate);
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly navegador = isPlatformBrowser(inject(PLATFORM_ID));
  private pendente = false;
  private recarregando = false;
  private iniciado = false;

  iniciar(): void {
    if (this.iniciado || !this.navegador || !this.sw.isEnabled) return;
    this.iniciado = true;

    this.sw.versionUpdates
      .pipe(filter((evento) => evento.type === 'VERSION_READY'))
      .subscribe(() => this.versaoPronta());

    this.sw.unrecoverable.subscribe(() => this.recarregar());

    this.router.events
      .pipe(filter((evento): evento is NavigationStart => evento instanceof NavigationStart))
      .subscribe((evento) => {
        if (this.pendente) this.recarregar(evento.url);
      });

    const aoMudarVisibilidade = () => {
      if (document.visibilityState === 'hidden') {
        if (this.pendente) this.recarregar();
      } else {
        this.verificar();
      }
    };
    const aoFicarOnline = () => this.verificar();
    document.addEventListener('visibilitychange', aoMudarVisibilidade);
    window.addEventListener('online', aoFicarOnline);

    const timer = this.zone.runOutsideAngular(() => setInterval(() => this.verificar(), INTERVALO_VERIFICACAO_MS));

    this.destroyRef.onDestroy(() => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', aoMudarVisibilidade);
      window.removeEventListener('online', aoFicarOnline);
    });

    this.verificar();
  }

  private verificar(): void {
    if (this.pendente || !navigator.onLine) return;
    this.sw.checkForUpdate().catch(() => undefined);
  }

  private versaoPronta(): void {
    if (this.pendente) return;
    this.pendente = true;
    if (document.visibilityState === 'hidden') {
      this.recarregar();
      return;
    }
    this.toast.info('Uma nova versão foi instalada e será aplicada ao trocar de tela.', 'Sistema atualizado');
  }

  private recarregar(destino?: string): void {
    if (this.recarregando) return;
    this.recarregando = true;
    this.sw
      .activateUpdate()
      .catch(() => undefined)
      .finally(() => {
        if (destino) window.location.assign(destino);
        else window.location.reload();
      });
  }
}
