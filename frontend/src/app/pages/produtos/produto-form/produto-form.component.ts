import { Component, EventEmitter, OnDestroy, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { Subscription } from 'rxjs';
import { DialogWrapper } from '#shared-frontend/components/dialog-wrapper/dialog-wrapper.component';
import { CurrencyMaskDirective } from '#shared-frontend/directives/currency-mask.directive';
import { ProdutoService } from '#core/services/produto.service';
import { IProduto } from '#shared/interfaces';
import { EnterFocusNextDirective } from '#shared-frontend/directives/enter-focus-next.directive';
import { ToastService } from '#shared-frontend/services/toast.service';

@Component({
  selector: 'app-produto-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    CurrencyMaskDirective,
    EnterFocusNextDirective,
    DialogWrapper,
  ],
  templateUrl: './produto-form.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./produto-form.component.css'],
})
export class ProdutoForm implements OnDestroy {
  @Output() saved = new EventEmitter<IProduto>();

  form: FormGroup;
  visible = false;
  isLoadingData = false;
  isSaving = false;
  produtoId?: number;

  private subs = new Subscription();
  private dadosExtras: Record<string, unknown> = {};
  // Flags para evitar loop de recalculo entre os campos
  private recalculando = false;

  constructor(
    private fb: FormBuilder,
    private produtoService: ProdutoService,
    private readonly toast: ToastService,
  ) {
    this.form = this.fb.group({
      descricao: ['', [Validators.required, Validators.maxLength(200)]],
      unidade_medida: ['UN', [Validators.required, Validators.maxLength(10)]],
      custo: [0, [Validators.required, Validators.min(0)]],
      markup: [0, [Validators.required, Validators.min(0)]],
      valor_unitario: [0, [Validators.required, Validators.min(0)]],
      estoque_atual: [{ value: 0, disabled: true }],
    });

    this.registrarCalculos();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  private registrarCalculos() {
    // Custo ou markup mudou → recalcula valor_unitario
    this.subs.add(
      this.form.get('custo')!.valueChanges.subscribe(() => this.recalcularValorUnitario()),
    );
    this.subs.add(
      this.form.get('markup')!.valueChanges.subscribe(() => this.recalcularValorUnitario()),
    );
    // valor_unitario editado manualmente → back-calcula markup
    this.subs.add(
      this.form.get('valor_unitario')!.valueChanges.subscribe(() => this.recalcularMarkup()),
    );
  }

  private recalcularValorUnitario() {
    if (this.recalculando) return;
    const custo = Number(this.form.get('custo')?.value ?? 0);
    const markup = Number(this.form.get('markup')?.value ?? 0);
    if (custo <= 0) return;
    this.recalculando = true;
    this.form
      .get('valor_unitario')!
      .setValue(+(custo * (1 + markup / 100)).toFixed(4), { emitEvent: false });
    this.recalculando = false;
  }

  private recalcularMarkup() {
    if (this.recalculando) return;
    const custo = Number(this.form.get('custo')?.value ?? 0);
    const valorUnitario = Number(this.form.get('valor_unitario')?.value ?? 0);
    if (custo <= 0) return;
    this.recalculando = true;
    this.form
      .get('markup')!
      .setValue(+((valorUnitario / custo - 1) * 100).toFixed(4), { emitEvent: false });
    this.recalculando = false;
  }

  abrir(id?: number, dadosXml?: Record<string, unknown>) {
    this.produtoId = id;
    this.visible = true;
    this.dadosExtras = {};
    this.form.reset({ unidade_medida: 'UN', custo: 0, markup: 0, valor_unitario: 0 });

    if (id) {
      this.isLoadingData = true;
      this.produtoService.buscarPorId(id).subscribe({
        next: (res) => {
          this.form.patchValue({
            descricao: res.data.descricao,
            unidade_medida: res.data.unidade_medida,
            custo: Number(res.data.custo),
            markup: Number(res.data.markup ?? 0),
            valor_unitario: Number(res.data.valor_unitario),
            estoque_atual: Number(res.data.estoque_atual ?? 0),
          });
          this.isLoadingData = false;
        },
        error: () => {
          this.toast.error('Falha ao buscar dados do produto');
          this.visible = false;
        },
      });
      return;
    }

    if (dadosXml) {
      this.dadosExtras = {
        ncm: dadosXml['ncm'] ?? '',
        cfop_padrao: dadosXml['cfop'] ?? '',
        gtin: dadosXml['gtin'] ?? '',
        origem: 0,
        estoque_atual: 0,
      };
      this.form.patchValue({
        descricao: dadosXml['descricao'] ?? '',
        unidade_medida: dadosXml['unidade'] ?? 'UN',
        custo: Number(dadosXml['valor_unitario'] ?? 0),
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
    const dados = { ...this.dadosExtras, ...this.form.value, id: this.produtoId };

    this.produtoService.salvar(dados).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success(`Produto ${this.produtoId ? 'atualizado' : 'criado'} com sucesso`);
          this.saved.emit(res.data as IProduto);
          this.visible = false;
        }
        this.isSaving = false;
      },
      error: () => {
        this.toast.error('Falha ao salvar produto');
        this.isSaving = false;
      },
    });
  }
}
