import { booleanAttribute, ChangeDetectionStrategy, Component, input, model, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'ui-panel',
  templateUrl: './painel.html',
  styleUrl: './painel.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': "'ui-panel ' + (styleClass() ?? '')" },
})
export class Painel {
  readonly header = input<string | undefined>();
  readonly toggleable = input(false, { transform: booleanAttribute });
  readonly collapsed = model(false);
  readonly styleClass = input<string | undefined>('');
}
