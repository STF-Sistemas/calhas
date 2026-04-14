import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { FornecedorService } from '#core/services/fornecedor.service';
import { FornecedorFormComponent } from '../../../fornecedores/fornecedor-form/fornecedor-form.component';
import { IFornecedor } from '#shared/interfaces';

@Component({
  selector: 'app-fornecedor-lookup-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    FornecedorFormComponent,
  ],
  templateUrl: './fornecedor-lookup-dialog.component.html',
  styleUrls: ['./fornecedor-lookup-dialog.component.scss'],
})
export class FornecedorLookupDialogComponent {
  @ViewChild('fornecedorForm') fornecedorFormRef?: FornecedorFormComponent;
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
    private messageService: MessageService
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
    // Aguarda o Angular renderizar o componente antes de chamar abrir()
    setTimeout(() => this.fornecedorFormRef?.abrir(undefined, this.cnpjParaForm, this.emitenteParaForm), 0);
  }

  relacionar() {
    this.modo = 'relacionar';
    this.fornecedorService.listar().subscribe({
      next: (res) => {
        this.fornecedores = res.data;
        this.fornecedoresFiltrados = res.data;
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar fornecedores' }),
    });
  }

  filtrar() {
    const termo = this.filtro.toLowerCase();
    this.fornecedoresFiltrados = this.fornecedores.filter(
      (f) => f.razao_social.toLowerCase().includes(termo) || f.cnpj.includes(termo)
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
