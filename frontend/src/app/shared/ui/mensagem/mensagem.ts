import { ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'ui-message',
  templateUrl: './mensagem.html',
  styleUrl: './mensagem.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()', role: 'status' },
})
export class Mensagem {
  readonly severity = input<'success' | 'info' | 'warn' | 'error' | 'secondary'>('info');
  readonly text = input<string | undefined>();
  readonly styleClass = input<string | undefined>('');
  protected readonly classes = computed(() => `ui-message ui-message--${this.severity()} ${this.styleClass() ?? ''}`);
  protected readonly icone = computed(
    () =>
      ({
        success: 'ic ic-check-circle',
        info: 'ic ic-info-circle',
        warn: 'ic ic-exclamation-triangle',
        error: 'ic ic-times-circle',
        secondary: 'ic ic-info-circle',
      })[this.severity()],
  );
}
