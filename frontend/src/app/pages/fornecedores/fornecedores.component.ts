import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DataTableComponent } from '#shared-frontend/components/data-table/data-table.component';
import { FornecedorFormComponent } from './fornecedor-form/fornecedor-form.component';
import { FornecedorService } from '#core/services/fornecedor.service';
import { IFornecedor } from '#shared/interfaces';

@Component({
  selector: 'app-fornecedores',
  standalone: true,
  imports: [
    CommonModule,
    DataTableComponent,
    FornecedorFormComponent,
    ConfirmDialogModule,
    ToastModule,
  ],
  templateUrl: './fornecedores.component.html',
  styleUrls: ['./fornecedores.component.scss'],
  providers: [ConfirmationService],
})
export class FornecedoresComponent implements OnInit {
  @ViewChild('form') form!: FornecedorFormComponent;

  fornecedores: IFornecedor[] = [];
  loading = false;

  cols = [
    { field: 'cnpj', header: 'CNPJ', type: 'text' },
    { field: 'razao_social', header: 'Razão Social' },
    { field: 'cidade_nome', header: 'Cidade/UF', type: 'text' },
    { field: 'fone', header: 'Telefone', type: 'text' },
    { field: 'status', header: 'Status', type: 'status' },
  ];

  constructor(
    private fornecedorService: FornecedorService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private titleService: Title
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle('Fornecedores — Calhas');
    this.carregar();
  }

  carregar() {
    this.loading = true;
    this.fornecedorService.listar().subscribe({
      next: (res) => {
        this.fornecedores = res.data.map((f) => ({
          ...f,
          cidade_nome: f.cidade ? `${f.cidade.descricao}/${f.cidade.uf}` : '',
        }));
        this.loading = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar fornecedores' });
        this.loading = false;
      },
    });
  }

  onAdd() {
    this.form.abrir();
  }

  onEdit(fornecedor: IFornecedor) {
    this.form.abrir(fornecedor.id);
  }

  onStatus(fornecedor: IFornecedor) {
    const novoStatus = fornecedor.status === 1 ? 2 : 1;
    this.fornecedorService.alterarStatus(fornecedor.id, novoStatus).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Status alterado' });
        this.carregar();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao alterar status' }),
    });
  }

  onDelete(fornecedor: IFornecedor) {
    this.confirmationService.confirm({
      message: `Deseja realmente excluir o fornecedor "${fornecedor.razao_social}"?`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      accept: () => {
        this.fornecedorService.excluir(fornecedor.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Fornecedor excluído' });
            this.carregar();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao excluir fornecedor' }),
        });
      },
    });
  }
}
