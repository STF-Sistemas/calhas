import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DataTableComponent } from '#shared-frontend/components/data-table/data-table.component';
import { ChapaFormComponent } from './chapa-form/chapa-form.component';
import { ChapaService } from '#core/services/chapa.service';
import { IChapa } from '#shared/interfaces';
import { EStatusGeral } from '#shared/enums';

@Component({
  selector: 'app-chapas',
  standalone: true,
  imports: [
    CommonModule, 
    DataTableComponent, 
    ChapaFormComponent, 
    ConfirmDialogModule,
    ToastModule
  ],
  templateUrl: './chapas.component.html',
  styleUrls: ['./chapas.component.scss'],
  providers: [MessageService, ConfirmationService]
})
export class ChapasComponent implements OnInit {
  @ViewChild('form') form!: ChapaFormComponent;
  
  chapas: IChapa[] = [];
  loading = false;
  
  cols = [
    { field: 'descricao', header: 'Descrição' },
    { field: 'status', header: 'Status', type: 'status' }
  ];

  constructor(
    private chapaService: ChapaService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
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
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar chapas' });
        this.loading = false;
      }
    });
  }

  onAdd() {
    this.form.abrir();
  }

  onEdit(chapa: IChapa) {
    this.form.abrir(chapa.id);
  }

  onToggleStatus(chapa: IChapa) {
    const novoStatus = chapa.status === EStatusGeral.Ativo ? EStatusGeral.Inativo : EStatusGeral.Ativo;
    this.chapaService.alterarStatus(chapa.id, novoStatus).subscribe({
      next: () => {
        chapa.status = novoStatus;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao alterar status da chapa' });
      }
    });
  }

  onDelete(chapa: IChapa) {
    this.confirmationService.confirm({
      message: `Deseja realmente excluir a chapa "${chapa.descricao}"?`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      accept: () => {
        this.chapaService.desativar(chapa.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Chapa excluída' });
            this.carregarChapas();
          }
        });
      }
    });
  }
}
