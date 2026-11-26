import { ChangeDetectionStrategy, Component, computed, forwardRef, input, signal, ViewEncapsulation } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

function paraTexto(valor: unknown): string {
  if (!valor) return '';
  if (typeof valor === 'string') {
    const iso = /^(\d{4}-\d{2}-\d{2})/.exec(valor);
    if (iso) return iso[1];
    const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valor);
    if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  }
  const data = valor instanceof Date ? valor : new Date(valor as string);
  if (Number.isNaN(data.getTime())) return '';
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${mes}-${dia}`;
}

@Component({
  selector: 'ui-datepicker',
  templateUrl: './campo-data.html',
  styleUrl: './campo-data.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CampoData), multi: true }],
  host: { class: 'ui-campo-host' },
})
export class CampoData implements ControlValueAccessor {
  readonly inputId = input<string | undefined>();
  readonly placeholder = input<string | undefined>();
  readonly styleClass = input<string | undefined>('');
  readonly minDate = input<Date | null | undefined>();
  readonly maxDate = input<Date | null | undefined>();
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });

  protected readonly texto = signal('');
  protected readonly desabilitado = signal(false);
  protected readonly minimo = computed(() => paraTexto(this.minDate()) || null);
  protected readonly maximo = computed(() => paraTexto(this.maxDate()) || null);

  private aoMudar: (valor: Date | null) => void = () => undefined;
  protected aoTocar: () => void = () => undefined;

  writeValue(valor: unknown): void {
    this.texto.set(paraTexto(valor));
  }

  registerOnChange(fn: (valor: Date | null) => void): void {
    this.aoMudar = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.aoTocar = fn;
  }

  setDisabledState(desabilitado: boolean): void {
    this.desabilitado.set(desabilitado);
  }

  protected aoDigitar(evento: Event): void {
    const texto = (evento.target as HTMLInputElement).value;
    this.texto.set(texto);
    const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
    this.aoMudar(partes ? new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3])) : null);
  }
}
