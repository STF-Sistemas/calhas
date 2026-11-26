import { ChangeDetectionStrategy, Component, computed, inject, input, ViewEncapsulation } from '@angular/core';
import { Abas } from '../abas/abas';

@Component({
  selector: 'ui-tabpanel',
  templateUrl: './painel-aba.html',
  styleUrl: './painel-aba.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-tabpanel', role: 'tabpanel', '[hidden]': '!ativo()' },
})
export class PainelAba {
  private readonly abas = inject(Abas);
  readonly value = input.required<string | number>();
  protected readonly ativo = computed(() => this.abas.value() === this.value());
}
