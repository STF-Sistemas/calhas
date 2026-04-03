import { Directive, ElementRef, HostListener, OnInit, OnDestroy, Optional, Self } from '@angular/core';
import { NgControl } from '@angular/forms';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[appCurrencyMask]',
  standalone: true
})
export class CurrencyMaskDirective implements OnInit, OnDestroy {
  private centavos = 0;
  private _internalChange = false;
  private _subscription?: Subscription;

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
          this.centavos = isNaN(numVal) ? 0 : Math.round(numVal * 100);
          this.exibir();
        }
      });

      // Lê o valor inicial (pode já estar preenchido no patchValue)
      setTimeout(() => {
        const val = this.ngControl?.control?.value;
        if (val != null && !this._internalChange) {
          const numVal = Number(val);
          if (!isNaN(numVal)) {
            this.centavos = Math.round(numVal * 100);
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
      const novoValor = this.centavos * 10 + parseInt(key, 10);
      if (novoValor <= 99999999999) {
        this.centavos = novoValor;
      }
      this.emitir();
    } else if (key === 'Backspace') {
      event.preventDefault();
      this.centavos = Math.floor(this.centavos / 10);
      this.emitir();
    } else if (key === 'Delete') {
      event.preventDefault();
      this.centavos = 0;
      this.emitir();
    }
    // Tab, setas e demais teclas passam normalmente
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const texto = event.clipboardData?.getData('text') ?? '';
    const apenasNumeros = texto.replace(/\D/g, '');
    if (apenasNumeros) {
      const novoValor = parseInt(apenasNumeros, 10);
      if (novoValor <= 99999999999) {
        this.centavos = novoValor;
        this.emitir();
      }
    }
  }

  private emitir(): void {
    const valor = this.centavos / 100;
    this._internalChange = true;
    if (this.ngControl?.control) {
      this.ngControl.control.setValue(valor, { emitEvent: true });
    }
    this._internalChange = false;
    this.exibir();
  }

  private exibir(): void {
    const valor = this.centavos / 100;
    this.el.nativeElement.value = valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}
