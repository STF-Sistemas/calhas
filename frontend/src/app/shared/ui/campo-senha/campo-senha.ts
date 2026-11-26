import { booleanAttribute, ChangeDetectionStrategy, Component, forwardRef, input, signal, ViewEncapsulation } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'ui-password',
  templateUrl: './campo-senha.html',
  styleUrl: './campo-senha.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CampoSenha), multi: true }],
  host: { class: 'ui-campo-host' },
})
export class CampoSenha implements ControlValueAccessor {
  readonly inputId = input<string | undefined>();
  readonly placeholder = input<string | undefined>();
  readonly toggleMask = input(false, { transform: booleanAttribute });
  readonly inputStyleClass = input<string | undefined>('');
  readonly autocomplete = input<string>('current-password');
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });

  protected readonly texto = signal('');
  protected readonly visivel = signal(false);
  protected readonly desabilitado = signal(false);

  private aoMudar: (valor: string) => void = () => undefined;
  protected aoTocar: () => void = () => undefined;

  writeValue(valor: string | null): void {
    this.texto.set(valor ?? '');
  }

  registerOnChange(fn: (valor: string) => void): void {
    this.aoMudar = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.aoTocar = fn;
  }

  setDisabledState(desabilitado: boolean): void {
    this.desabilitado.set(desabilitado);
  }

  protected aoDigitar(evento: Event): void {
    const valor = (evento.target as HTMLInputElement).value;
    this.texto.set(valor);
    this.aoMudar(valor);
  }
}
