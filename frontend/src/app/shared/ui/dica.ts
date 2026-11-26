import { Directive, input } from '@angular/core';

@Directive({
  selector: '[dica]',
  host: { '[attr.title]': 'dica() || null' },
})
export class Dica {
  readonly dica = input<string | null | undefined>();
}
