import { ChangeDetectionStrategy, Component, computed, inject, input, ViewEncapsulation } from '@angular/core';
import { Abas } from '../abas/abas';

@Component({
  selector: 'ui-tab',
  templateUrl: './aba.html',
  styleUrl: './aba.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-tab',
    role: 'tab',
    '[attr.tabindex]': 'ativa() ? 0 : -1',
    '[attr.aria-selected]': 'ativa()',
    '[class.ui-tab--ativa]': 'ativa()',
    '(click)': 'abas.value.set(value())',
    '(keydown.enter)': 'abas.value.set(value())',
    '(keydown.space)': 'abas.value.set(value()); $event.preventDefault()',
  },
})
export class Aba {
  protected readonly abas = inject(Abas);
  readonly value = input.required<string | number>();
  protected readonly ativa = computed(() => this.abas.value() === this.value());
}
