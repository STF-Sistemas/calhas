import { ChangeDetectionStrategy, Component, computed, forwardRef, input, signal, ViewEncapsulation } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'ui-input-number',
  templateUrl: './campo-numero.html',
  styleUrl: './campo-numero.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CampoNumero), multi: true }],
  host: { class: 'ui-campo-host' },
})
export class CampoNumero implements ControlValueAccessor {
  readonly inputId = input<string | undefined>();
  readonly placeholder = input<string | undefined>();
  readonly min = input<number | null | undefined>();
  readonly max = input<number | null | undefined>();
  readonly maxFractionDigits = input<number>(0);
  readonly suffix = input<string | undefined>();
  readonly styleClass = input<string | undefined>('');
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });

  protected readonly texto = signal('');
  protected readonly desabilitado = signal(false);
  protected readonly passo = computed(() => (this.maxFractionDigits() > 0 ? 10 ** -this.maxFractionDigits() : 1));

  private aoMudar: (valor: number | null) => void = () => undefined;
  private aoTocarFn: () => void = () => undefined;

  writeValue(valor: number | string | null): void {
    this.texto.set(valor === null || valor === undefined || valor === '' ? '' : String(valor));
  }

  registerOnChange(fn: (valor: number | null) => void): void {
    this.aoMudar = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.aoTocarFn = fn;
  }

  setDisabledState(desabilitado: boolean): void {
    this.desabilitado.set(desabilitado);
  }

  protected aoDigitar(evento: Event): void {
    const texto = (evento.target as HTMLInputElement).value;
    this.texto.set(texto);
    this.aoMudar(texto === '' ? null : this.ajustar(Number(texto)));
  }

  protected aoTocar(evento: Event): void {
    const campo = evento.target as HTMLInputElement;
    if (campo.value !== '') {
      const ajustado = this.ajustar(Number(campo.value));
      if (String(ajustado) !== campo.value) {
        this.texto.set(String(ajustado));
        campo.value = String(ajustado);
        this.aoMudar(ajustado);
      }
    }
    this.aoTocarFn();
  }

  private ajustar(numero: number): number {
    let valor = Number.isFinite(numero) ? numero : 0;
    const minimo = this.min();
    const maximo = this.max();
    if (minimo !== null && minimo !== undefined) valor = Math.max(minimo, valor);
    if (maximo !== null && maximo !== undefined) valor = Math.min(maximo, valor);
    const fator = 10 ** this.maxFractionDigits();
    return Math.round(valor * fator) / fator;
  }
}
