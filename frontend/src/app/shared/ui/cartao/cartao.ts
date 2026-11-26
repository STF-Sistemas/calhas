import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'ui-card',
  templateUrl: './cartao.html',
  styleUrl: './cartao.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': "'ui-card ' + (styleClass() ?? '')" },
})
export class Cartao {
  readonly styleClass = input<string | undefined>('');
}
