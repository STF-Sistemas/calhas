import { Directive, ElementRef, HostListener, Input, OnInit, OnDestroy, Optional, Self } from '@angular/core';
import { NgControl } from '@angular/forms';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[appCurrencyMask]',
  standalone: true
})
export class CurrencyMaskDirective implements OnInit, OnDestroy {
  @Input() decimals = 2;

  private units = 0; // valor interno × 10^decimals (inteiro)
  private _internalChange = false;
  private _subscription?: Subscription;

  private get multiplier() { return Math.pow(10, this.decimals); }
  private get maxUnits()   { return 99999999 * this.multiplier; }

  constructor(
    private el: ElementRef<HTMLInputElement>,
    @Optional() @Self() private ngControl: NgControl
  ) {}

  ngOnInit(): void {
    this.el.nativeElement.style.textAlign = 'right';
    this.el.nativeElement.setAttribute('autocomplete', 'off');
    this.el.nativeElement.setAttribute('inputmode', 'numeric');

    if (this.ngControl?.control) {
      this._subscription = this.ngControl.control.valueChanges.subscribe((val) => {
        if (!this._internalChange) {
          const numVal = val != null ? Number(val) : 0;
          this.units = isNaN(numVal) ? 0 : Math.round(numVal * this.multiplier);
          this.exibir();
        }
      });

      setTimeout(() => {
        const val = this.ngControl?.control?.value;
        if (val != null && !this._internalChange) {
          const numVal = Number(val);
          if (!isNaN(numVal)) {
            this.units = Math.round(numVal * this.multiplier);
            this.exibir();
          }
        }
      });
    }
  }

  ngOnDestroy(): void {
    this._subscription?.unsubscribe();
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const key = event.key;

    if (key >= '0' && key <= '9') {
      event.preventDefault();
      const novoValor = this.units * 10 + parseInt(key, 10);
      if (novoValor <= this.maxUnits) {
        this.units = novoValor;
      }
      this.emitir();
    } else if (key === 'Backspace') {
      event.preventDefault();
      this.units = Math.floor(this.units / 10);
      this.emitir();
    } else if (key === 'Delete') {
      event.preventDefault();
      this.units = 0;
      this.emitir();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const texto = event.clipboardData?.getData('text') ?? '';
    const apenasNumeros = texto.replace(/\D/g, '');
    if (apenasNumeros) {
      const novoValor = parseInt(apenasNumeros, 10);
      if (novoValor <= this.maxUnits) {
        this.units = novoValor;
        this.emitir();
      }
    }
  }

  private emitir(): void {
    const valor = this.units / this.multiplier;
    this._internalChange = true;
    if (this.ngControl?.control) {
      this.ngControl.control.setValue(valor, { emitEvent: true });
    }
    this._internalChange = false;
    this.exibir();
  }

  private exibir(): void {
    const valor = this.units / this.multiplier;
    this.el.nativeElement.value = valor.toLocaleString('pt-BR', {
      minimumFractionDigits: this.decimals,
      maximumFractionDigits: this.decimals,
    });
  }
}
