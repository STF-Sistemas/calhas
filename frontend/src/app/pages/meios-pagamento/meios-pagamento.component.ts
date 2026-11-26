import { Component, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTable } from '#shared-frontend/components/data-table/data-table.component';
import { MeioPagamentoForm } from './meio-pagamento-form/meio-pagamento-form.component';
import { MeioPagamentoService } from '#core/services/meio-pagamento.service';
import { IMeioPagamento } from '#shared/interfaces';
import { EStatusGeral } from '#shared/enums';
import { ToastService } from '#shared-frontend/services/toast.service';
import { ConfirmDialogService } from '#shared-frontend/services/confirm-dialog.service';

@Component({
  selector: 'app-meios-pagamento',
  standalone: true,
  imports: [
    CommonModule,
    DataTable,
    MeioPagamentoForm,
  ],
  templateUrl: './meios-pagamento.component.html',
  styleUrls: ['./meios-pagamento.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class MeiosPagamento implements OnInit {
  @ViewChild('form') form!: MeioPagamentoForm;

  meios: IMeioPagamento[] = [];
  loading = false;

  cols = [
    { field: 'descricao', header: 'Descrição' },
    { field: 'ativo', header: 'Status', type: 'status' },
  ];

  constructor(
    private meioService: MeioPagamentoService,
    private readonly toast: ToastService,
    private readonly confirmDialog: ConfirmDialogService,
  ) {}

  ngOnInit(): void {
    this.carregar();
  }

  carregar() {
    this.loading = true;
    this.meioService.listar().subscribe({
      next: (res) => {
        this.meios = res.data;
        this.loading = false;
      },
      error: () => {
        this.toast.error('Falha ao carregar meios de pagamento');
        this.loading = false;
      },
    });
  }

  onAdd() {
    this.form.abrir();
  }

  onEdit(meio: IMeioPagamento) {
    this.form.abrir(meio.id);
  }

  onToggleStatus(meio: IMeioPagamento) {
    const novoStatus =
      meio.ativo === EStatusGeral.Ativo ? EStatusGeral.Inativo : EStatusGeral.Ativo;
    this.meioService.alterarStatus(meio.id, novoStatus).subscribe({
      next: () => {
        meio.ativo = novoStatus;
      },
      error: () => {
        this.toast.error('Falha ao alterar status');
      },
    });
  }

  onDelete(meio: IMeioPagamento) {
    this.confirmDialog.confirm({
      title: 'Confirmar Exclusão',
      message: `Deseja realmente excluir o meio de pagamento "${meio.descricao}"?`,
      confirmText: 'Sim',
      cancelText: 'Não',
      danger: true,
    }).then((ok) => {
      if (!ok) return;
        this.meioService.desativar(meio.id).subscribe({
          next: () => {
            this.toast.success('Meio de pagamento excluído');
            this.carregar();
          },
        });
    });
  }
}
