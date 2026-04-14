import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { DialogWrapperComponent } from '#shared-frontend/components/dialog-wrapper/dialog-wrapper.component';
import { CurrencyMaskDirective } from '#shared-frontend/directives/currency-mask.directive';
import { ServicoService } from '#core/services/servico.service';

@Component({
  selector: 'app-servico-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    CurrencyMaskDirective,
    DialogWrapperComponent
  ],
  templateUrl: './servico-form.component.html',
  styleUrls: ['./servico-form.component.scss']
})
export class ServicoFormComponent {
  @Output() saved = new EventEmitter<void>();

  form: FormGroup;
  visible = false;
  isLoadingData = false;
  isSaving = false;
  servicoId?: number;

  constructor(
    private fb: FormBuilder,
    private servicoService: ServicoService,
    private messageService: MessageService
  ) {
    this.form = this.fb.group({
      descricao: ['', [Validators.required, Validators.maxLength(200)]],
      valor: [0, [Validators.required, Validators.min(0.01)]],
      custo: [0, [Validators.required, Validators.min(0)]]
    });
  }

  abrir(id?: number) {
    this.servicoId = id;
    this.visible = true;
    this.form.reset({ valor: 0, custo: 0 });

    if (id) {
      this.isLoadingData = true;
      this.servicoService.buscarPorId(id).subscribe({
        next: (res) => {
          this.form.patchValue(res.data);
          this.isLoadingData = false;
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao buscar dados do serviço' });
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
    const dados = { ...this.form.value, id: this.servicoId };

    this.servicoService.salvar(dados).subscribe({
      next: (res) => {
        if (res.success) {
          this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: `Serviço ${this.servicoId ? 'atualizado' : 'criado'} com sucesso` });
          this.saved.emit();
          this.visible = false;
        }
        this.isSaving = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao salvar serviço' });
        this.isSaving = false;
      }
    });
  }
}
