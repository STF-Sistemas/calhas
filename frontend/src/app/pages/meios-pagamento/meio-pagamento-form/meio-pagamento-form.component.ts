import { Component, EventEmitter, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogWrapper } from '#shared-frontend/components/dialog-wrapper/dialog-wrapper.component';
import { MeioPagamentoService } from '#core/services/meio-pagamento.service';
import { EnterFocusNextDirective } from '#shared-frontend/directives/enter-focus-next.directive';
import { ToastService } from '#shared-frontend/services/toast.service';

@Component({
  selector: 'app-meio-pagamento-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    EnterFocusNextDirective,
    DialogWrapper,
  ],
  templateUrl: './meio-pagamento-form.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./meio-pagamento-form.component.css'],
})
export class MeioPagamentoForm {
  @Output() saved = new EventEmitter<void>();

  form: FormGroup;
  visible = false;
  isLoadingData = false;
  isSaving = false;
  meioId?: number;

  constructor(
    private fb: FormBuilder,
    private meioService: MeioPagamentoService,
    private readonly toast: ToastService,
  ) {
    this.form = this.fb.group({
      descricao: ['', [Validators.required, Validators.maxLength(200)]],
    });
  }

  abrir(id?: number) {
    this.meioId = id;
    this.visible = true;
    this.form.reset();

    if (id) {
      this.isLoadingData = true;
      this.meioService.buscarPorId(id).subscribe({
        next: (res) => {
          this.form.patchValue(res.data);
          this.isLoadingData = false;
        },
        error: () => {
          this.toast.error('Falha ao buscar dados');
          this.visible = false;
        },
      });
    }
  }

  onSave() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.toast.warn('Preencha todos os campos obrigatórios.');
      return;
    }

    this.isSaving = true;
    const dados = { ...this.form.value, id: this.meioId };

    this.meioService.salvar(dados).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success(`Meio de pagamento ${this.meioId ? 'atualizado' : 'criado'} com sucesso`);
          this.saved.emit();
          this.visible = false;
        }
        this.isSaving = false;
      },
      error: () => {
        this.toast.error('Falha ao salvar meio de pagamento');
        this.isSaving = false;
      },
    });
  }
}
