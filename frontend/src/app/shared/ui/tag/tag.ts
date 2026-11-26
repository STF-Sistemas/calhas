import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from '@angular/core';
import { TSeveridade } from '../tipos';

@Component({
  selector: 'ui-tag',
  templateUrl: './tag.html',
  styleUrl: './tag.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()' },
})
export class Tag {
  readonly value = input<string | number | null | undefined>();
  readonly severity = input<TSeveridade | string | null | undefined>('primary');
  readonly rounded = input(false, { transform: booleanAttribute });
  readonly icon = input<string | undefined>();
  readonly styleClass = input<string | undefined>('');
  protected readonly classes = computed(
    () =>
      `ui-tag ui-tag--${this.severity() || 'primary'}${this.rounded() ? ' ui-tag--rounded' : ''} ${this.styleClass() ?? ''}`,
  );
}
