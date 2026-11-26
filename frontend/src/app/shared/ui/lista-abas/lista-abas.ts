import { ChangeDetectionStrategy, Component, ElementRef, inject, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'ui-tablist',
  templateUrl: './lista-abas.html',
  styleUrl: './lista-abas.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-tablist', role: 'tablist', '(keydown)': 'teclado($event)' },
})
export class ListaAbas {
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);

  protected teclado(evento: KeyboardEvent): void {
    if (evento.key !== 'ArrowRight' && evento.key !== 'ArrowLeft') return;
    const abas = Array.from(this.elemento.nativeElement.querySelectorAll<HTMLElement>('[role="tab"]'));
    const atual = abas.indexOf(document.activeElement as HTMLElement);
    if (atual < 0) return;
    const proxima = abas[(atual + (evento.key === 'ArrowRight' ? 1 : abas.length - 1)) % abas.length];
    proxima.focus();
    proxima.click();
    evento.preventDefault();
  }
}
