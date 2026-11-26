import { Directive, ElementRef, HostListener, Input, OnInit, OnDestroy, Optional, Self } from '@angular/core';
import { NgControl } from '@angular/forms';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[appCurrencyMask]',
  standalone: true
})
export class CurrencyMaskDirective implements OnInit, OnDestroy {
  @Input() decimals = 2;

  private units = 0;
  private modoDecimal = false;
  private casasDigitadas = 0;
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
    this.el.nativeElement.setAttribute('inputmode', this.decimals > 0 ? 'decimal' : 'numeric');

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

  @HostListener('beforeinput', ['$event'])
  onBeforeInput(event: InputEvent): void {
    const tipo = event.inputType;
    if (tipo.startsWith('insert')) {
      event.preventDefault();
      for (const ch of event.data ?? '') this.processarCaractere(ch);
      this.emitir();
    } else if (tipo === 'deleteContentBackward') {
      event.preventDefault();
      this.apagarUltimo();
      this.emitir();
    } else if (tipo.startsWith('delete')) {
      event.preventDefault();
      this.zerar();
      this.emitir();
    }
  }

  @HostListener('input')
  onInput(): void {
    this.exibir();
  }

  @HostListener('focus')
  @HostListener('blur')
  onFocoAlterado(): void {
    this.modoDecimal = false;
    this.casasDigitadas = 0;
    this.exibir();
  }

  private processarCaractere(ch: string): void {
    if (ch >= '0' && ch <= '9') {
      const d = parseInt(ch, 10);
      if (this.modoDecimal) {
        if (this.casasDigitadas >= this.decimals) return;
        this.units += d * Math.pow(10, this.decimals - 1 - this.casasDigitadas);
        this.casasDigitadas++;
      } else {
        const novoValor = this.units * 10 + d;
        if (novoValor <= this.maxUnits) this.units = novoValor;
      }
    } else if ((ch === ',' || ch === '.') && this.decimals > 0 && !this.modoDecimal) {
      const inteiro = this.units * this.multiplier;
      if (inteiro <= this.maxUnits) this.units = inteiro;
      this.modoDecimal = true;
      this.casasDigitadas = 0;
    }
  }

  private apagarUltimo(): void {
    if (!this.modoDecimal) {
      this.units = Math.floor(this.units / 10);
      return;
    }
    if (this.casasDigitadas > 0) {
      this.casasDigitadas--;
      const casa = Math.pow(10, this.decimals - 1 - this.casasDigitadas);
      this.units -= Math.floor(this.units / casa) % 10 * casa;
    } else {
      this.units = Math.floor(this.units / this.multiplier);
      this.modoDecimal = false;
    }
  }

  private zerar(): void {
    this.units = 0;
    this.modoDecimal = false;
    this.casasDigitadas = 0;
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const texto = (event.clipboardData?.getData('text') ?? '').trim();
    const m = texto.match(/^(.*?)[.,](\d{1,})$/);
    const num = m
      ? Number(`${m[1].replace(/\D/g, '') || '0'}.${m[2]}`)
      : Number(texto.replace(/\D/g, '')) / this.multiplier;
    if (!Number.isFinite(num)) return;
    const novoValor = Math.round(num * this.multiplier);
    if (novoValor <= this.maxUnits) {
      this.zerar();
      this.units = novoValor;
      this.emitir();
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
    if (this.modoDecimal) {
      const inteiro = Math.floor(this.units / this.multiplier).toLocaleString('pt-BR');
      const frac = String(this.units % this.multiplier).padStart(this.decimals, '0').slice(0, this.casasDigitadas);
      this.el.nativeElement.value = `${inteiro},${frac}`;
      return;
    }
    this.el.nativeElement.value = valor.toLocaleString('pt-BR', {
      minimumFractionDigits: this.decimals,
      maximumFractionDigits: this.decimals,
    });
  }
}
