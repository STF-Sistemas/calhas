import { DestroyRef, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const CONSULTA_CELULAR = '(max-width: 767px), (max-height: 500px) and (pointer: coarse)';

@Injectable({ providedIn: 'root' })
export class TelaService {
  private readonly _celular = signal(false);
  readonly celular = this._celular.asReadonly();

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    const consulta = window.matchMedia(CONSULTA_CELULAR);
    this._celular.set(consulta.matches);
    const aoMudar = (evento: MediaQueryListEvent) => this._celular.set(evento.matches);
    consulta.addEventListener('change', aoMudar);
    inject(DestroyRef).onDestroy(() => consulta.removeEventListener('change', aoMudar));
  }
}
