import { Component, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTable } from '#shared-frontend/components/data-table/data-table.component';
import { ServicoForm } from './servico-form/servico-form.component';
import { ServicoService } from '#core/services/servico.service';
import { IServico } from '#shared/interfaces';
import { EStatusGeral } from '#shared/enums';
import { ToastService } from '#shared-frontend/services/toast.service';
import { ConfirmDialogService } from '#shared-frontend/services/confirm-dialog.service';

@Component({
  selector: 'app-servicos',
  standalone: true,
  imports: [
    CommonModule,
    DataTable,
    ServicoForm,
  ],
  templateUrl: './servicos.component.html',
  styleUrls: ['./servicos.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class Servicos implements OnInit {
  @ViewChild('form') form!: ServicoForm;

  servicos: IServico[] = [];
  loading = false;

  cols = [
    { field: 'descricao', header: 'Descrição' },
    { field: 'valor', header: 'Preço Sugerido', type: 'currency' },
    { field: 'status', header: 'Status', type: 'status' },
  ];

  constructor(
    private servicoService: ServicoService,
    private readonly toast: ToastService,
    private readonly confirmDialog: ConfirmDialogService,
  ) {}

  ngOnInit(): void {
    this.carregarServicos();
  }

  carregarServicos() {
    this.loading = true;
    this.servicoService.listar().subscribe({
      next: (res) => {
        this.servicos = res.data;
        this.loading = false;
      },
      error: () => {
        this.toast.error('Falha ao carregar serviços');
        this.loading = false;
      },
    });
  }

  onAdd() {
    this.form.abrir();
  }

  onEdit(servico: IServico) {
    this.form.abrir(servico.id);
  }

  onToggleStatus(servico: IServico) {
    const novoStatus =
      servico.status === EStatusGeral.Ativo ? EStatusGeral.Inativo : EStatusGeral.Ativo;
    this.servicoService.alterarStatus(servico.id, novoStatus).subscribe({
      next: () => {
        servico.status = novoStatus;
      },
      error: () => {
        this.toast.error('Falha ao alterar status do serviço');
      },
    });
  }

  onDelete(servico: IServico) {
    this.confirmDialog.confirm({
      title: 'Confirmar Exclusão',
      message: `Deseja realmente excluir o serviço "${servico.descricao}"?`,
      confirmText: 'Sim',
      cancelText: 'Não',
      danger: true,
    }).then((ok) => {
      if (!ok) return;
        this.servicoService.desativar(servico.id).subscribe({
          next: () => {
            this.toast.success('Serviço excluído');
            this.carregarServicos();
          },
        });
    });
  }
}
