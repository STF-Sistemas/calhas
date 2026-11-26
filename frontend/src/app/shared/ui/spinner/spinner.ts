import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'ui-spinner',
  templateUrl: './spinner.html',
  styleUrl: './spinner.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': "'ui-spinner ' + (styleClass() ?? '')",
    role: 'progressbar',
    '[attr.aria-label]': 'ariaLabel()',
    'aria-busy': 'true',
  },
})
export class Spinner {
  readonly ariaLabel = input('Carregando');
  readonly styleClass = input<string | undefined>('');
}
