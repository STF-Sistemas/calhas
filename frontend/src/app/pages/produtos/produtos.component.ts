import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DataTableComponent } from '#shared-frontend/components/data-table/data-table.component';
import { ProdutoFormComponent } from './produto-form/produto-form.component';
import { ProdutoService, IHistoricoCompraProduto } from '#core/services/produto.service';
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
    ToastModule,
    DialogModule,
    TableModule,
    ButtonModule,
  ],
  templateUrl: './produtos.component.html',
  styleUrls: ['./produtos.component.scss'],
  providers: [ConfirmationService]
})
export class ProdutosComponent implements OnInit {
  @ViewChild('form') form!: ProdutoFormComponent;

  produtos: IProduto[] = [];
  loading = false;

  // ── Histórico de compras ──────────────────────────────────────────────────────
  showHistorico = false;
  historicoLoading = false;
  historico: IHistoricoCompraProduto[] = [];
  produtoHistoricoNome = '';
  
  cols = [
    { field: 'descricao', header: 'Descrição' },
    { field: 'unidade_medida', header: 'UN' },
    { field: 'estoque_atual', header: 'Estoque', type: 'decimal' },
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

  onHistorico(produto: IProduto) {
    this.produtoHistoricoNome = produto.descricao;
    this.historico = [];
    this.showHistorico = true;
    this.historicoLoading = true;
    this.produtoService.buscarHistoricoCompras(produto.id).subscribe({
      next: (res) => {
        this.historico = res.data;
        this.historicoLoading = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao buscar histórico de compras' });
        this.historicoLoading = false;
        this.showHistorico = false;
      },
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
