import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'cancelarComEsc()' },
})
export class ConfirmDialog {
  protected readonly confirmacao = inject(ConfirmDialogService);
  private readonly botaoConfirmar = viewChild<ElementRef<HTMLButtonElement>>('botaoConfirmar');

  constructor() {
    // Foco no botão principal ao abrir (teclado e leitor de tela).
    effect(() => {
      if (this.confirmacao.aberto()) queueMicrotask(() => this.botaoConfirmar()?.nativeElement.focus());
    });
  }

  protected cancelarComEsc(): void {
    if (this.confirmacao.aberto()) this.confirmacao.responder(false);
  }
}
