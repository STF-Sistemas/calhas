import { Component, EventEmitter, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { CurrencyMaskDirective } from '#shared-frontend/directives/currency-mask.directive';
import { DialogWrapper } from '#shared-frontend/components/dialog-wrapper/dialog-wrapper.component';
import { ChapaService } from '#core/services/chapa.service';
import { ICorte } from '#shared/interfaces';
import { forkJoin, of, switchMap, Observable } from 'rxjs';
import { EnterFocusNextDirective } from '#shared-frontend/directives/enter-focus-next.directive';
import { ToastService } from '#shared-frontend/services/toast.service';
import { Botao, Tabela } from '#ui';

@Component({
  selector: 'app-chapa-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    CurrencyMaskDirective,
    EnterFocusNextDirective,
    DialogWrapper,
    Botao,
    Tabela,
  ],
  templateUrl: './chapa-form.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./chapa-form.component.css'],
})
export class ChapaForm {
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
    private readonly toast: ToastService,
  ) {
    this.form = this.fb.group({
      descricao: ['', [Validators.required, Validators.maxLength(200)]],
    });
  }

  get cortesVisiveis(): ICorte[] {
    return this.cortes.filter((c) => !c.excluido);
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
          this.cortes = res.data.cortes?.map((c) => ({ ...c })) || [];
          this.isLoadingData = false;
        },
        error: () => {
          this.toast.error('Falha ao buscar dados da chapa');
          this.visible = false;
        },
      });
    }
  }

  adicionarCorte() {
    this.cortes = [
      ...this.cortes,
      { descricao: '', corte: 0, valor: 0, excluido: false } as ICorte,
    ];
  }

  removerCorte(corte: ICorte) {
    if (corte.id) {
      corte.excluido = true;
      this.cortes = [...this.cortes];
    } else {
      this.cortes = this.cortes.filter((c) => c !== corte);
    }
  }

  onSave() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.toast.warn('Informe a descrição da chapa.');
      return;
    }

    const cortesAtivos = this.cortesVisiveis;
    if (cortesAtivos.length === 0) {
      this.toast.warn('Adicione ao menos um corte antes de salvar.');
      return;
    }

    const cortesInvalidos = cortesAtivos.filter((c) => !c.descricao?.trim() || c.valor == null);
    if (cortesInvalidos.length > 0) {
      this.toast.warn('Todos os cortes precisam ter descrição e valor preenchidos.');
      return;
    }

    this.isSaving = true;
    const dados = { ...this.form.value, id: this.chapaId };

    this.chapaService
      .salvar(dados)
      .pipe(
        switchMap((res) => {
          if (!res.success) return of(null);
          this.chapaId = res.data.id;

          const ops: Observable<unknown>[] = [];

          this.cortes
            .filter((c) => !c.id && !c.excluido)
            .forEach((c) => {
              ops.push(this.chapaService.adicionarCorte(this.chapaId!, c));
            });

          this.cortes
            .filter((c) => c.id && c.excluido)
            .forEach((c) => {
              ops.push(this.chapaService.removerCorte(this.chapaId!, c.id));
            });

          this.cortes
            .filter((c) => c.id && !c.excluido)
            .forEach((c) => {
              ops.push(this.chapaService.atualizarCorte(this.chapaId!, c.id, c));
            });

          return ops.length > 0 ? forkJoin(ops) : of([]);
        }),
      )
      .subscribe({
        next: (results) => {
          if (results === null) {
            this.isSaving = false;
            return;
          }
          this.toast.success('Chapa salva com sucesso');
          this.saved.emit();
          this.visible = false;
          this.isSaving = false;
        },
        error: () => {
          this.toast.error('Falha ao salvar chapa');
          this.isSaving = false;
        },
      });
  }
}
