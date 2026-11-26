import { Component, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTable } from '#shared-frontend/components/data-table/data-table.component';
import { ChapaForm } from './chapa-form/chapa-form.component';
import { ChapaService } from '#core/services/chapa.service';
import { IChapa } from '#shared/interfaces';
import { EStatusGeral } from '#shared/enums';
import { ToastService } from '#shared-frontend/services/toast.service';
import { ConfirmDialogService } from '#shared-frontend/services/confirm-dialog.service';

@Component({
  selector: 'app-chapas',
  standalone: true,
  imports: [CommonModule, DataTable, ChapaForm],
  templateUrl: './chapas.component.html',
  styleUrls: ['./chapas.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class Chapas implements OnInit {
  @ViewChild('form') form!: ChapaForm;

  chapas: IChapa[] = [];
  loading = false;

  cols = [
    { field: 'descricao', header: 'Descrição' },
    { field: 'status', header: 'Status', type: 'status' },
  ];

  constructor(
    private chapaService: ChapaService,
    private readonly toast: ToastService,
    private readonly confirmDialog: ConfirmDialogService,
  ) {}

  ngOnInit(): void {
    this.carregarChapas();
  }

  carregarChapas() {
    this.loading = true;
    this.chapaService.listar().subscribe({
      next: (res) => {
        this.chapas = res.data;
        this.loading = false;
      },
      error: () => {
        this.toast.error('Falha ao carregar chapas');
        this.loading = false;
      },
    });
  }

  onAdd() {
    this.form.abrir();
  }

  onEdit(chapa: IChapa) {
    this.form.abrir(chapa.id);
  }

  onToggleStatus(chapa: IChapa) {
    const novoStatus =
      chapa.status === EStatusGeral.Ativo ? EStatusGeral.Inativo : EStatusGeral.Ativo;
    this.chapaService.alterarStatus(chapa.id, novoStatus).subscribe({
      next: () => {
        chapa.status = novoStatus;
      },
      error: () => {
        this.toast.error('Falha ao alterar status da chapa');
      },
    });
  }

  onDelete(chapa: IChapa) {
    this.confirmDialog.confirm({
      title: 'Confirmar Exclusão',
      message: `Deseja realmente excluir a chapa "${chapa.descricao}"?`,
      confirmText: 'Sim',
      cancelText: 'Não',
      danger: true,
    }).then((ok) => {
      if (!ok) return;
        this.chapaService.desativar(chapa.id).subscribe({
          next: () => {
            this.toast.success('Chapa excluída');
            this.carregarChapas();
          },
        });
    });
  }
}
