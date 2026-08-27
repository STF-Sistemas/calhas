import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { isLogoDataUriValido } from '#shared/functions/logo.functions';
import { LOGO_EMPRESA_TIPOS_ACEITOS, LOGO_EMPRESA_TAMANHO_MAXIMO_BYTES } from '#shared/constants';

@Component({
  selector: 'app-logo-uploader',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './logo-uploader.component.html',
  styleUrls: ['./logo-uploader.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LogoUploaderComponent),
      multi: true,
    },
  ],
})
export class LogoUploaderComponent implements ControlValueAccessor {
  @ViewChild('inputArquivo') inputArquivo!: ElementRef<HTMLInputElement>;

  preview: string | null = null;
  disabled = false;
  erro: string | null = null;

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private messageService: MessageService) {}

  writeValue(value: string | null): void {
    this.preview = value ?? null;
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  abrirSeletor(): void {
    this.inputArquivo.nativeElement.click();
  }

  aoSelecionarArquivo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0] ?? null;
    input.value = '';
    if (!arquivo) return;

    this.erro = null;

    if (!(LOGO_EMPRESA_TIPOS_ACEITOS as readonly string[]).includes(arquivo.type)) {
      this.erro = 'Formato inválido. Envie um arquivo PNG, JPG ou JPEG.';
      this.messageService.add({ severity: 'warn', summary: 'Formato inválido', detail: this.erro });
      return;
    }

    if (arquivo.size > LOGO_EMPRESA_TAMANHO_MAXIMO_BYTES) {
      this.erro = 'Arquivo muito grande. Tamanho máximo: 1MB.';
      this.messageService.add({ severity: 'warn', summary: 'Arquivo muito grande', detail: this.erro });
      return;
    }

    const leitor = new FileReader();
    leitor.onload = () => {
      const resultado = leitor.result as string;
      if (!isLogoDataUriValido(resultado)) {
        this.erro = 'Não foi possível processar o arquivo selecionado.';
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: this.erro });
        return;
      }
      this.preview = resultado;
      this.onChange(resultado);
      this.onTouched();
    };
    leitor.onerror = () => {
      this.erro = 'Falha ao ler o arquivo selecionado.';
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: this.erro });
    };
    leitor.readAsDataURL(arquivo);
  }

  remover(): void {
    this.preview = null;
    this.erro = null;
    this.onChange(null);
    this.onTouched();
  }
}
