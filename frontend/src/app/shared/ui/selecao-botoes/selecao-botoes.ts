import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  forwardRef,
  input,
  output,
  signal,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IMudancaValor } from '../tipos';

@Component({
  selector: 'ui-selectbutton',
  imports: [NgTemplateOutlet],
  templateUrl: './selecao-botoes.html',
  styleUrl: './selecao-botoes.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SelecaoBotoes), multi: true }],
  host: { class: 'ui-selecao-botoes-host' },
})
export class SelecaoBotoes implements ControlValueAccessor {
  readonly options = input<readonly any[] | null | undefined>([]);
  readonly optionLabel = input<string | undefined>();
  readonly optionValue = input<string | undefined>();
  readonly allowEmpty = input(true, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly size = input<'small' | 'large' | null | undefined>();
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly onChange = output<IMudancaValor>();

  protected readonly itemTemplate = contentChild<TemplateRef<unknown>>('item');
  protected readonly valor = signal<any>(null);
  private readonly desabilitadoForm = signal(false);
  protected readonly desabilitado = computed(() => this.disabled() || this.desabilitadoForm());

  private aoMudar: (valor: any) => void = () => undefined;
  private aoTocar: () => void = () => undefined;

  writeValue(valor: any): void {
    this.valor.set(valor ?? null);
  }

  registerOnChange(fn: (valor: any) => void): void {
    this.aoMudar = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.aoTocar = fn;
  }

  setDisabledState(desabilitado: boolean): void {
    this.desabilitadoForm.set(desabilitado);
  }

  protected rotulo(op: any): string {
    const campo = this.optionLabel();
    return String(campo ? op?.[campo] ?? '' : op);
  }

  protected valorDe(op: any): any {
    const campo = this.optionValue();
    return campo ? op?.[campo] : op;
  }

  protected escolher(op: any, evento: Event): void {
    if (this.desabilitado() || op?.disabled) return;
    const valor = this.valorDe(op);
    const novo = valor === this.valor() ? (this.allowEmpty() ? null : valor) : valor;
    if (novo === this.valor()) return;
    this.valor.set(novo);
    this.aoMudar(novo);
    this.aoTocar();
    this.onChange.emit({ value: novo, originalEvent: evento });
  }
}
