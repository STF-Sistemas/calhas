import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DataTableComponent } from '#shared-frontend/components/data-table/data-table.component';
import { MeioPagamentoFormComponent } from './meio-pagamento-form/meio-pagamento-form.component';
import { MeioPagamentoService } from '#core/services/meio-pagamento.service';
import { IMeioPagamento } from '#shared/interfaces';
import { EStatusGeral } from '#shared/enums';

@Component({
  selector: 'app-meios-pagamento',
  standalone: true,
  imports: [
    CommonModule,
    DataTableComponent,
    MeioPagamentoFormComponent,
    ConfirmDialogModule,
    ToastModule
  ],
  templateUrl: './meios-pagamento.component.html',
  styleUrls: ['./meios-pagamento.component.scss'],
  providers: [MessageService, ConfirmationService]
})
export class MeiosPagamentoComponent implements OnInit {
  @ViewChild('form') form!: MeioPagamentoFormComponent;

  meios: IMeioPagamento[] = [];
  loading = false;

  cols = [
    { field: 'descricao', header: 'Descrição' },
    { field: 'ativo', header: 'Status', type: 'status' }
  ];

  constructor(
    private meioService: MeioPagamentoService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
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
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar meios de pagamento' });
        this.loading = false;
      }
    });
  }

  onAdd() {
    this.form.abrir();
  }

  onEdit(meio: IMeioPagamento) {
    this.form.abrir(meio.id);
  }

  onToggleStatus(meio: IMeioPagamento) {
    const novoStatus = meio.ativo === EStatusGeral.Ativo ? EStatusGeral.Inativo : EStatusGeral.Ativo;
    this.meioService.alterarStatus(meio.id, novoStatus).subscribe({
      next: () => { meio.ativo = novoStatus; },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao alterar status' });
      }
    });
  }

  onDelete(meio: IMeioPagamento) {
    this.confirmationService.confirm({
      message: `Deseja realmente excluir o meio de pagamento "${meio.descricao}"?`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      accept: () => {
        this.meioService.desativar(meio.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Meio de pagamento excluído' });
            this.carregar();
          }
        });
      }
    });
  }
}
