import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { CurrencyMaskDirective } from '#shared-frontend/directives/currency-mask.directive';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { DialogWrapperComponent } from '#shared-frontend/components/dialog-wrapper/dialog-wrapper.component';
import { ChapaService } from '#core/services/chapa.service';
import { ICorte } from '#shared/interfaces';
import { forkJoin, of, switchMap, Observable } from 'rxjs';

@Component({
  selector: 'app-chapa-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    InputTextModule,
    InputNumberModule,
    TableModule,
    ButtonModule,
    CurrencyMaskDirective,
    DialogWrapperComponent
  ],
  templateUrl: './chapa-form.component.html',
  styleUrls: ['./chapa-form.component.scss']
})
export class ChapaFormComponent {
  @Output() saved = new EventEmitter<void>();

  form: FormGroup;
  visible = false;
  isLoadingData = false;
  isSaving = false;
  chapaId?: number;

  cortes: ICorte[] = [];

  constructor(
    private fb: FormBuilder,
    private chapaService: ChapaService,
    private messageService: MessageService
  ) {
    this.form = this.fb.group({
      descricao: ['', [Validators.required, Validators.maxLength(200)]]
    });
  }

  get cortesVisiveis(): ICorte[] {
    return this.cortes.filter(c => !c.excluido);
  }

  abrir(id?: number) {
    this.chapaId = id;
    this.visible = true;
    this.form.reset();
    this.cortes = [];

    if (id) {
      this.isLoadingData = true;
      this.chapaService.buscarPorId(id).subscribe({
        next: (res) => {
          this.form.patchValue(res.data);
          this.cortes = res.data.cortes?.map(c => ({ ...c })) || [];
          this.isLoadingData = false;
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao buscar dados da chapa' });
          this.visible = false;
        }
      });
    }
  }

  adicionarCorte() {
    this.cortes = [...this.cortes, { descricao: '', corte: 0, valor: 0, excluido: false } as ICorte];
  }

  removerCorte(corte: ICorte) {
    if (corte.id) {
      // Existente: marca como excluído em memória
      corte.excluido = true;
      this.cortes = [...this.cortes];
    } else {
      // Novo (sem id): remove direto da lista
      this.cortes = this.cortes.filter(c => c !== corte);
    }
  }

  onSave() {
    if (this.form.invalid) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Informe a descrição da chapa.' });
      this.form.markAllAsTouched();
      return;
    }

    const cortesAtivos = this.cortesVisiveis;
    if (cortesAtivos.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Adicione ao menos um corte antes de salvar.' });
      return;
    }

    const cortesInvalidos = cortesAtivos.filter(c => !c.descricao?.trim() || c.valor == null);
    if (cortesInvalidos.length > 0) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Todos os cortes precisam ter descrição e valor preenchidos.' });
      return;
    }

    this.isSaving = true;
    const dados = { ...this.form.value, id: this.chapaId };

    this.chapaService.salvar(dados).pipe(
      switchMap(res => {
        if (!res.success) return of(null);
        this.chapaId = res.data.id;

        const ops: Observable<unknown>[] = [];

        // Novos cortes (sem id)
        this.cortes.filter(c => !c.id && !c.excluido).forEach(c => {
          ops.push(this.chapaService.adicionarCorte(this.chapaId!, c));
        });

        // Cortes existentes excluídos
        this.cortes.filter(c => c.id && c.excluido).forEach(c => {
          ops.push(this.chapaService.removerCorte(this.chapaId!, c.id));
        });

        // Cortes existentes atualizados
        this.cortes.filter(c => c.id && !c.excluido).forEach(c => {
          ops.push(this.chapaService.atualizarCorte(this.chapaId!, c.id, c));
        });

        return ops.length > 0 ? forkJoin(ops) : of([]);
      })
    ).subscribe({
      next: (results) => {
        if (results === null) { this.isSaving = false; return; }
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Chapa salva com sucesso' });
        this.saved.emit();
        this.visible = false;
        this.isSaving = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao salvar chapa' });
        this.isSaving = false;
      }
    });
  }
}
