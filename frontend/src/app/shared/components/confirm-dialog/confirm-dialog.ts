import { isPlatformBrowser } from '@angular/common';
import { afterNextRender, ChangeDetectionStrategy, Component, ElementRef, effect, inject, Injector, PLATFORM_ID, viewChild } from '@angular/core';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialog {
  protected readonly confirmacao = inject(ConfirmDialogService);
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');
  private readonly botaoConfirmar = viewChild<ElementRef<HTMLButtonElement>>('botaoConfirmar');
  private readonly injector = inject(Injector);
  private readonly navegador = isPlatformBrowser(inject(PLATFORM_ID));

  constructor() {
    effect(() => {
      const aberto = this.confirmacao.aberto();
      if (!this.navegador) return;
      const elemento = this.dialogo().nativeElement;
      if (aberto && !elemento.open) {
        elemento.showModal();
        afterNextRender(() => this.botaoConfirmar()?.nativeElement.focus(), { injector: this.injector });
      } else if (!aberto && elemento.open) {
        elemento.close();
      }
    });
  }

  protected aoCancelar(evento: Event): void {
    evento.preventDefault();
    this.confirmacao.responder(false);
  }

  protected aoClicar(evento: MouseEvent): void {
    if (evento.target === this.dialogo().nativeElement) this.confirmacao.responder(false);
  }
}
