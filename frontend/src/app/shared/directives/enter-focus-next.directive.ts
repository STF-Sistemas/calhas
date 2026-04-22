import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appEnterNext]',
  standalone: true
})
export class EnterFocusNextDirective {
  constructor(private el: ElementRef<HTMLFormElement>) {}

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter') return;

    const target = event.target as HTMLElement;
    const tag = target.tagName.toLowerCase();

    if (tag === 'textarea') return;
    if (tag === 'button' || !!target.closest('button')) return;

    const focusable = Array.from(
      this.el.nativeElement.querySelectorAll<HTMLElement>(
        'input:not([type="hidden"]):not([disabled]):not([readonly]), select:not([disabled])'
      )
    ).filter(el => !!(el.offsetWidth || el.offsetHeight));

    const idx = focusable.indexOf(target);
    if (idx === -1) return;

    event.preventDefault();
    event.stopPropagation();

    const next = focusable[idx + 1];
    if (next) {
      next.focus();
      if (next instanceof HTMLInputElement) next.select();
    }
  }
}
