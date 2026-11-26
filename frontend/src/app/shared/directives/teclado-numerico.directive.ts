import { AfterViewInit, Directive, ElementRef, Input } from '@angular/core';

@Directive({
  selector: '[appTecladoNumerico]',
  standalone: true,
})
export class TecladoNumericoDirective implements AfterViewInit {
  @Input('appTecladoNumerico') modo: 'numeric' | 'decimal' | '' = 'numeric';

  constructor(private el: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    const host = this.el.nativeElement;
    const input = host instanceof HTMLInputElement ? host : host.querySelector('input');
    input?.setAttribute('inputmode', this.modo === 'decimal' ? 'decimal' : 'numeric');
  }
}
