import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { DialogWrapperComponent } from '#shared-frontend/components/dialog-wrapper/dialog-wrapper.component';
import { MeioPagamentoService } from '#core/services/meio-pagamento.service';

@Component({
  selector: 'app-meio-pagamento-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    DialogWrapperComponent
  ],
  templateUrl: './meio-pagamento-form.component.html',
  styleUrls: ['./meio-pagamento-form.component.scss']
})
export class MeioPagamentoFormComponent {
  @Output() saved = new EventEmitter<void>();

  form: FormGroup;
  visible = false;
  isLoadingData = false;
  isSaving = false;
  meioId?: number;

  constructor(
    private fb: FormBuilder,
    private meioService: MeioPagamentoService,
    private messageService: MessageService
  ) {
    this.form = this.fb.group({
      descricao: ['', [Validators.required, Validators.maxLength(200)]]
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
          this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao buscar dados' });
          this.visible = false;
        }
      });
    }
  }

  onSave() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Preencha todos os campos obrigatórios.' });
      return;
    }

    this.isSaving = true;
    const dados = { ...this.form.value, id: this.meioId };

    this.meioService.salvar(dados).subscribe({
      next: (res) => {
        if (res.success) {
          this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: `Meio de pagamento ${this.meioId ? 'atualizado' : 'criado'} com sucesso` });
          this.saved.emit();
          this.visible = false;
        }
        this.isSaving = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao salvar meio de pagamento' });
        this.isSaving = false;
      }
    });
  }
}
