import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, ElementRef, inject, PLATFORM_ID, viewChild } from '@angular/core';
import { ToastService, TToastTipo } from '../../services/toast.service';

const ICONES: Record<TToastTipo, string> = {
  success: 'ic ic-check-circle',
  error: 'ic ic-times-circle',
  info: 'ic ic-info-circle',
  warn: 'ic ic-exclamation-triangle',
};

@Component({
  selector: 'app-toast-container',
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainer {
  protected readonly toast = inject(ToastService);
  protected readonly icones = ICONES;
  private readonly camada = viewChild.required<ElementRef<HTMLElement>>('camada');
  private readonly navegador = isPlatformBrowser(inject(PLATFORM_ID));
  private quantidade = 0;

  constructor() {
    effect(() => {
      const total = this.toast.toasts().length;
      if (!this.navegador) return;
      const elemento = this.camada().nativeElement;
      const aberto = elemento.matches(':popover-open');
      if (total > this.quantidade) {
        if (aberto) elemento.hidePopover();
        elemento.showPopover();
      } else if (!total && aberto) {
        elemento.hidePopover();
      }
      this.quantidade = total;
    });
  }
}
