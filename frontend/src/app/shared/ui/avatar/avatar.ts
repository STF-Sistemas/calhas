import { ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'ui-avatar',
  templateUrl: './avatar.html',
  styleUrl: './avatar.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()' },
})
export class Avatar {
  readonly label = input<string | undefined>();
  readonly shape = input<'square' | 'circle'>('square');
  readonly styleClass = input<string | undefined>('');
  protected readonly classes = computed(() => `ui-avatar ui-avatar--${this.shape()} ${this.styleClass() ?? ''}`);
}
