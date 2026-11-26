import { Component, EventEmitter, Output, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FornecedorService } from '#core/services/fornecedor.service';
import { FornecedorForm } from '../../../fornecedores/fornecedor-form/fornecedor-form.component';
import { IFornecedor } from '#shared/interfaces';
import { ToastService } from '#shared-frontend/services/toast.service';
import { normalizarBusca } from '#shared-frontend/busca/normalizar-busca';
import { Botao, Dialogo, Tabela } from '#ui';

@Component({
  selector: 'app-fornecedor-lookup-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FornecedorForm,
    Botao,
    Dialogo,
    Tabela,
  ],
  templateUrl: './fornecedor-lookup-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./fornecedor-lookup-dialog.component.css'],
})
export class FornecedorLookupDialog {
  @ViewChild('fornecedorForm') fornecedorFormRef?: FornecedorForm;
  @Output() selecionado = new EventEmitter<IFornecedor>();
  @Output() cancelado = new EventEmitter<void>();

  visible = false;
  cnpj = '';
  modo: 'opcoes' | 'relacionar' = 'opcoes';
  private _fechandoComSelecao = false;

  fornecedores: IFornecedor[] = [];
  filtro = '';
  fornecedoresFiltrados: IFornecedor[] = [];

  showForm = false;
  cnpjParaForm = '';
  emitenteParaForm: Record<string, unknown> | undefined;

  constructor(
    private fornecedorService: FornecedorService,
    private readonly toast: ToastService,
  ) {}

  abrir(cnpj: string, emitente?: Record<string, unknown>) {
    this.cnpj = cnpj;
    this.emitenteParaForm = emitente;
    this.modo = 'opcoes';
    this.filtro = '';
    this.showForm = false;
    this.visible = true;
  }

  abrirListagem() {
    this.cnpj = '';
    this.emitenteParaForm = undefined;
    this.filtro = '';
    this.showForm = false;
    this.visible = true;
    this.relacionar();
  }

  incluir() {
    this.cnpjParaForm = this.cnpj;
    this.visible = false;
    this.showForm = true;
    setTimeout(
      () => this.fornecedorFormRef?.abrir(undefined, this.cnpjParaForm, this.emitenteParaForm),
      0,
    );
  }

  relacionar() {
    this.modo = 'relacionar';
    this.fornecedorService.listar().subscribe({
      next: (res) => {
        this.fornecedores = res.data;
        this.fornecedoresFiltrados = res.data;
      },
      error: () =>
        this.toast.error('Falha ao carregar fornecedores'),
    });
  }

  filtrar() {
    const termo = normalizarBusca(this.filtro);
    this.fornecedoresFiltrados = this.fornecedores.filter(
      (f) => normalizarBusca(f.razao_social).includes(termo) || f.cnpj.includes(termo),
    );
  }

  selecionar(fornecedor: IFornecedor) {
    this._fechandoComSelecao = true;
    this.visible = false;
    this.selecionado.emit(fornecedor);
  }

  onFornecedorSalvo(fornecedor: IFornecedor) {
    this.showForm = false;
    this.selecionado.emit(fornecedor);
  }

  onFormCancelado() {
    this.showForm = false;
    this.cancelado.emit();
  }

  onDialogHide() {
    if (!this._fechandoComSelecao) {
      this.cancelado.emit();
    }
    this._fechandoComSelecao = false;
  }

  cancelar() {
    this.visible = false;
    this.cancelado.emit();
  }

  trackById(_: number, item: IFornecedor) {
    return item.id;
  }
}
