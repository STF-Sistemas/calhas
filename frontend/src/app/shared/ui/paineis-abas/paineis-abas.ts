import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'ui-tabpanels',
  templateUrl: './paineis-abas.html',
  styleUrl: './paineis-abas.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-tabpanels' },
})
export class PaineisAbas {}
