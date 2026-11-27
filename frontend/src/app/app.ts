import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from '#core/services/theme.service';
import { AtualizacaoService } from '#core/services/atualizacao.service';
import { ToastContainer } from '#shared-frontend/components/toast-container/toast-container';
import { ConfirmDialog } from '#shared-frontend/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainer, ConfirmDialog],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('frontend');

  constructor(
    private themeService: ThemeService,
    atualizacao: AtualizacaoService,
  ) {
    atualizacao.iniciar();
  }
}
