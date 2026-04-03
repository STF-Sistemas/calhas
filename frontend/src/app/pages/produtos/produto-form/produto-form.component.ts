import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { DialogWrapperComponent } from '#shared-frontend/components/dialog-wrapper/dialog-wrapper.component';
import { CurrencyMaskDirective } from '#shared-frontend/directives/currency-mask.directive';
import { ProdutoService } from '#core/services/produto.service';

@Component({
  selector: 'app-produto-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    CurrencyMaskDirective,
    DialogWrapperComponent
  ],
  templateUrl: './produto-form.component.html',
  styleUrls: ['./produto-form.component.scss']
})
export class ProdutoFormComponent {
  @Output() saved = new EventEmitter<void>();

  form: FormGroup;
  visible = false;
  isLoadingData = false;
  isSaving = false;
  produtoId?: number;

  constructor(
    private fb: FormBuilder,
    private produtoService: ProdutoService,
    private messageService: MessageService
  ) {
    this.form = this.fb.group({
      descricao: ['', [Validators.required, Validators.maxLength(200)]],
      unidade_medida: ['UN', [Validators.required, Validators.maxLength(10)]],
      valor_unitario: [0, [Validators.required, Validators.min(0.01)]]
    });
  }

  abrir(id?: number) {
    this.produtoId = id;
    this.visible = true;
    this.form.reset({ unidade_medida: 'UN', valor_unitario: 0 });

    if (id) {
      this.isLoadingData = true;
      this.produtoService.buscarPorId(id).subscribe({
        next: (res) => {
          this.form.patchValue(res.data);
          this.isLoadingData = false;
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao buscar dados do produto' });
          this.visible = false;
        }
      });
    }
  }

  onSave() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Preencha todos os campos obrigatórios.' });
      return;
    }

    this.isSaving = true;
    const dados = { ...this.form.value, id: this.produtoId };

    this.produtoService.salvar(dados).subscribe({
      next: (res) => {
        if (res.success) {
          this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: `Produto ${this.produtoId ? 'atualizado' : 'criado'} com sucesso` });
          this.saved.emit();
          this.visible = false;
        }
        this.isSaving = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao salvar produto' });
        this.isSaving = false;
      }
    });
  }
}
