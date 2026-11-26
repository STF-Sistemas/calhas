import { isPlatformBrowser } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  model,
  output,
  PLATFORM_ID,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';

@Component({
  selector: 'ui-dialog',
  templateUrl: './dialogo.html',
  styleUrl: './dialogo.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dialogo {
  readonly visible = model(false);
  readonly header = input<string | null | undefined>();
  readonly closable = input(true, { transform: booleanAttribute });
  readonly showHeader = input(true, { transform: booleanAttribute });
  readonly maximizable = input(false, { transform: booleanAttribute });
  readonly position = input<string | null | undefined>('center');
  readonly estilo = input<Record<string, string> | null | undefined>(null);
  readonly contentStyle = input<Record<string, string> | null | undefined>(null);
  readonly styleClass = input<string | null | undefined>('');
  readonly onShow = output<void>();
  readonly onHide = output<void>();

  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');
  private readonly navegador = isPlatformBrowser(inject(PLATFORM_ID));
  protected readonly maximizado = signal(false);

  protected readonly classes = computed(() => {
    const lista = ['ui-dialog', `ui-dialog--${this.position() || 'center'}`];
    if (this.maximizado()) lista.push('ui-dialog--maximizado');
    if (this.styleClass()) lista.push(this.styleClass() as string);
    return lista.join(' ');
  });

  constructor() {
    effect(() => {
      const visivel = this.visible();
      if (!this.navegador) return;
      const elemento = this.dialogo().nativeElement;
      if (visivel && !elemento.open) {
        elemento.showModal();
        this.onShow.emit();
      } else if (!visivel && elemento.open) {
        elemento.close();
      }
    });
  }

  fechar(): void {
    this.dialogo().nativeElement.close();
  }

  protected aoCancelar(evento: Event): void {
    if (!this.closable()) evento.preventDefault();
  }

  protected aoFechar(): void {
    this.maximizado.set(false);
    if (this.visible()) this.visible.set(false);
    this.onHide.emit();
  }
}
