import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DataTableComponent } from '#shared-frontend/components/data-table/data-table.component';
import { ProdutoFormComponent } from './produto-form/produto-form.component';
import { ProdutoService } from '#core/services/produto.service';
import { IProduto } from '#shared/interfaces';
import { EStatusGeral } from '#shared/enums';

@Component({
  selector: 'app-produtos',
  standalone: true,
  imports: [
    CommonModule, 
    DataTableComponent, 
    ProdutoFormComponent, 
    ConfirmDialogModule,
    ToastModule
  ],
  templateUrl: './produtos.component.html',
  styleUrls: ['./produtos.component.scss'],
  providers: [MessageService, ConfirmationService]
})
export class ProdutosComponent implements OnInit {
  @ViewChild('form') form!: ProdutoFormComponent;
  
  produtos: IProduto[] = [];
  loading = false;
  
  cols = [
    { field: 'descricao', header: 'Descrição' },
    { field: 'unidade_medida', header: 'UN' },
    { field: 'valor_unitario', header: 'Valor Unit.', type: 'currency' },
    { field: 'status', header: 'Status', type: 'status' }
  ];

  constructor(
    private produtoService: ProdutoService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.carregarProdutos();
  }

  carregarProdutos() {
    this.loading = true;
    this.produtoService.listar().subscribe({
      next: (res) => {
        this.produtos = res.data;
        this.loading = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar produtos' });
        this.loading = false;
      }
    });
  }

  onAdd() {
    this.form.abrir();
  }

  onEdit(produto: IProduto) {
    this.form.abrir(produto.id);
  }

  onToggleStatus(produto: IProduto) {
    const novoStatus = produto.status === EStatusGeral.Ativo ? EStatusGeral.Inativo : EStatusGeral.Ativo;
    this.produtoService.alterarStatus(produto.id, novoStatus).subscribe({
      next: () => {
        produto.status = novoStatus;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao alterar status do produto' });
      }
    });
  }

  onDelete(produto: IProduto) {
    this.confirmationService.confirm({
      message: `Deseja realmente excluir o produto "${produto.descricao}"?`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      accept: () => {
        this.produtoService.desativar(produto.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Produto excluído' });
            this.carregarProdutos();
          }
        });
      }
    });
  }
}
