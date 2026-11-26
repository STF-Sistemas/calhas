import { ChangeDetectionStrategy, Component, ElementRef, input, OnDestroy, signal, viewChild, ViewEncapsulation } from '@angular/core';
import { ancoraDo, Flutuante } from '../flutuante';
import { IMenuItem } from '../tipos';

@Component({
  selector: 'ui-menu',
  templateUrl: './menu-flutuante.html',
  styleUrl: './menu-flutuante.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuFlutuante implements OnDestroy {
  readonly model = input<IMenuItem[]>([]);
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

  protected executar(item: IMenuItem): void {
    this.hide();
    item.command?.();
  }

  private obter(): Flutuante {
    this.flutuante ??= new Flutuante(this.painel().nativeElement, { alinhar: 'fim', aoFechar: () => this.aberto.set(false) });
    return this.flutuante;
  }
}
