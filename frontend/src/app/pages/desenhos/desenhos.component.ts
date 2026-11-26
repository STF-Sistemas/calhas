import { Component, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTable } from '#shared-frontend/components/data-table/data-table.component';
import { DesenhoForm } from './desenho-form/desenho-form.component';
import { DesenhoService } from '#core/services/desenho.service';
import { IDesenho } from '#shared/interfaces';
import { ToastService } from '#shared-frontend/services/toast.service';
import { ConfirmDialogService } from '#shared-frontend/services/confirm-dialog.service';

@Component({
  selector: 'app-desenhos',
  standalone: true,
  imports: [
    CommonModule,
    DataTable,
    DesenhoForm,
  ],
  templateUrl: './desenhos.component.html',
  styleUrls: ['./desenhos.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class Desenhos implements OnInit {
  @ViewChild('form') form!: DesenhoForm;

  desenhos: IDesenho[] = [];
  loading = false;

  cols = [
    { field: 'descricao', header: 'Descrição' },
    { field: 'pontos', header: 'Prévia', type: 'drawing' },
    { field: 'status', header: 'Status', type: 'status' },
  ];

  constructor(
    private desenhoService: DesenhoService,
    private readonly toast: ToastService,
    private readonly confirmDialog: ConfirmDialogService,
  ) {}

  ngOnInit() {
    this.carregarDesenhos();
  }

  carregarDesenhos() {
    this.loading = true;
    this.desenhoService.listar().subscribe({
      next: (res) => {
        this.desenhos = res.data;
        this.loading = false;
      },
      error: () => {
        this.toast.error('Falha ao carregar desenhos');
        this.loading = false;
      },
    });
  }

  onAdd() {
    this.form.abrir();
  }

  onEdit(desenho: IDesenho) {
    this.form.abrir(desenho.id);
  }

  onDelete(desenho: IDesenho) {
    this.confirmDialog.confirm({
      title: 'Confirmar Exclusão',
      message: `Deseja realmente excluir o desenho "${desenho.descricao}"?`,
      confirmText: 'Sim',
      cancelText: 'Não',
      danger: true,
    }).then((ok) => {
      if (!ok) return;
        this.desenhoService.desativar(desenho.id).subscribe({
          next: () => {
            this.toast.success('Desenho excluído');
            this.carregarDesenhos();
          },
        });
    });
  }
}
