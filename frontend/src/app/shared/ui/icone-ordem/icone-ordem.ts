import { ChangeDetectionStrategy, Component, computed, inject, input, ViewEncapsulation } from '@angular/core';
import { Tabela } from '../tabela/tabela';

@Component({
  selector: 'ui-sorticon',
  templateUrl: './icone-ordem.html',
  styleUrl: './icone-ordem.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-table__icone-ordem' },
})
export class IconeOrdem {
  private readonly tabela = inject(Tabela);
  readonly field = input.required<string>();
  protected readonly icone = computed(() => {
    if (this.tabela.campoOrdenacao() !== this.field()) return 'ic-sort';
    return this.tabela.ordem() === 1 ? 'ic-sort-up' : 'ic-sort-down';
  });
}
