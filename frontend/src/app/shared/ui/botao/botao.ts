import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, output, ViewEncapsulation } from '@angular/core';
import { TSeveridade } from '../tipos';

@Component({
  selector: 'ui-button',
  templateUrl: './botao.html',
  styleUrl: './botao.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-button-host' },
})
export class Botao {
  readonly label = input<string | null | undefined>();
  readonly icon = input<string | null | undefined>();
  readonly iconPos = input<'left' | 'right'>('left');
  readonly severity = input<TSeveridade | null | undefined>('primary');
  readonly text = input(false, { transform: booleanAttribute });
  readonly outlined = input(false, { transform: booleanAttribute });
  readonly rounded = input(false, { transform: booleanAttribute });
  readonly link = input(false, { transform: booleanAttribute });
  readonly size = input<'small' | 'large' | null | undefined>();
  readonly loading = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly styleClass = input<string | null | undefined>('');
  readonly ariaLabel = input<string | null | undefined>(undefined, { alias: 'aria-label' });
  readonly onClick = output<MouseEvent>();

  protected readonly classes = computed(() => {
    const lista = ['ui-button', `ui-button--${this.severity() || 'primary'}`];
    if (this.text()) lista.push('ui-button--text');
    if (this.outlined()) lista.push('ui-button--outlined');
    if (this.link()) lista.push('ui-button--link');
    if (this.rounded()) lista.push('ui-button--rounded');
    if (this.size()) lista.push(`ui-button--${this.size()}`);
    if (!this.label()) lista.push('ui-button--icone');
    if (this.iconPos() === 'right') lista.push('ui-button--icone-direita');
    if (this.styleClass()) lista.push(this.styleClass() as string);
    return lista.join(' ');
  });
}
