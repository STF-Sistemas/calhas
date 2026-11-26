import { Component, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTable } from '#shared-frontend/components/data-table/data-table.component';
import { ProdutoForm } from './produto-form/produto-form.component';
import { ProdutoService, IHistoricoCompraProduto } from '#core/services/produto.service';
import { IProduto } from '#shared/interfaces';
import { EStatusGeral } from '#shared/enums';
import { ToastService } from '#shared-frontend/services/toast.service';
import { ConfirmDialogService } from '#shared-frontend/services/confirm-dialog.service';
import { Botao, Dialogo, Tabela } from '#ui';

@Component({
  selector: 'app-produtos',
  standalone: true,
  imports: [
    CommonModule,
    DataTable,
    ProdutoForm,
    Botao,
    Dialogo,
    Tabela,
  ],
  templateUrl: './produtos.component.html',
  styleUrls: ['./produtos.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class Produtos implements OnInit {
  @ViewChild('form') form!: ProdutoForm;

  produtos: IProduto[] = [];
  loading = false;

  showHistorico = false;
  historicoLoading = false;
  historico: IHistoricoCompraProduto[] = [];
  produtoHistoricoNome = '';

  cols = [
    { field: 'descricao', header: 'Descrição' },
    { field: 'unidade_medida', header: 'UN' },
    { field: 'estoque_atual', header: 'Estoque', type: 'decimal' },
    { field: 'valor_unitario', header: 'Valor Unit.', type: 'currency' },
    { field: 'status', header: 'Status', type: 'status' },
  ];

  constructor(
    private produtoService: ProdutoService,
    private readonly toast: ToastService,
    private readonly confirmDialog: ConfirmDialogService,
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
        this.toast.error('Falha ao carregar produtos');
        this.loading = false;
      },
    });
  }

  onAdd() {
    this.form.abrir();
  }

  onEdit(produto: IProduto) {
    this.form.abrir(produto.id);
  }

  onToggleStatus(produto: IProduto) {
    const novoStatus =
      produto.status === EStatusGeral.Ativo ? EStatusGeral.Inativo : EStatusGeral.Ativo;
    this.produtoService.alterarStatus(produto.id, novoStatus).subscribe({
      next: () => {
        produto.status = novoStatus;
      },
      error: () => {
        this.toast.error('Falha ao alterar status do produto');
      },
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
        this.toast.error('Falha ao buscar histórico de compras');
        this.historicoLoading = false;
        this.showHistorico = false;
      },
    });
  }

  onDelete(produto: IProduto) {
    this.confirmDialog.confirm({
      title: 'Confirmar Exclusão',
      message: `Deseja realmente excluir o produto "${produto.descricao}"?`,
      confirmText: 'Sim',
      cancelText: 'Não',
      danger: true,
    }).then((ok) => {
      if (!ok) return;
        this.produtoService.desativar(produto.id).subscribe({
          next: () => {
            this.toast.success('Produto excluído');
            this.carregarProdutos();
          },
        });
    });
  }
}
