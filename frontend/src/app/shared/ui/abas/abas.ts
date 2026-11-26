import { ChangeDetectionStrategy, Component, model, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'ui-tabs',
  templateUrl: './abas.html',
  styleUrl: './abas.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-tabs' },
})
export class Abas {
  readonly value = model<string | number | undefined>();
}
