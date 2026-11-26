import { ChangeDetectionStrategy, Component, ElementRef, input, OnDestroy, signal, viewChild, ViewEncapsulation } from '@angular/core';
import { ancoraDo, Flutuante } from '../flutuante';

@Component({
  selector: 'ui-popover',
  templateUrl: './popover-flutuante.html',
  styleUrl: './popover-flutuante.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PopoverFlutuante implements OnDestroy {
  readonly styleClass = input<string | undefined>('');
  private readonly painel = viewChild.required<ElementRef<HTMLElement>>('painel');
  protected readonly aberto = signal(false);
  private flutuante?: Flutuante;

  toggle(evento: Event): void {
    this.obter().alternar(ancoraDo(evento));
    this.aberto.set(this.obter().aberto);
    if (this.aberto()) requestAnimationFrame(() => this.flutuante?.posicionar());
  }

  hide(): void {
    this.flutuante?.fechar();
  }

  ngOnDestroy(): void {
    this.flutuante?.fechar();
  }

  private obter(): Flutuante {
    this.flutuante ??= new Flutuante(this.painel().nativeElement, { alinhar: 'fim', aoFechar: () => this.aberto.set(false) });
    return this.flutuante;
  }
}
