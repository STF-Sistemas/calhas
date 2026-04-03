import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DataTableComponent } from '#shared-frontend/components/data-table/data-table.component';
import { DesenhoFormComponent } from './desenho-form/desenho-form.component';
import { DesenhoService } from '#core/services/desenho.service';
import { IDesenho } from '#shared/interfaces';

@Component({
  selector: 'app-desenhos',
  standalone: true,
  imports: [CommonModule, DataTableComponent, DesenhoFormComponent, ConfirmDialogModule, ToastModule],
  templateUrl: './desenhos.component.html',
  styleUrls: ['./desenhos.component.scss'],
  providers: [MessageService, ConfirmationService]
})
export class DesenhosComponent implements OnInit {
  @ViewChild('form') form!: DesenhoFormComponent;

  desenhos: IDesenho[] = [];
  loading = false;

  cols = [
    { field: 'descricao', header: 'Descrição' },
    { field: 'pontos', header: 'Prévia', type: 'drawing' },
    { field: 'status', header: 'Status', type: 'status' }
  ];

  constructor(
    private desenhoService: DesenhoService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
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
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar desenhos' });
        this.loading = false;
      }
    });
  }

  onAdd() {
    this.form.abrir();
  }

  onEdit(desenho: IDesenho) {
    this.form.abrir(desenho.id);
  }

  onDelete(desenho: IDesenho) {
    this.confirmationService.confirm({
      message: `Deseja realmente excluir o desenho "${desenho.descricao}"?`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      accept: () => {
        this.desenhoService.desativar(desenho.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Desenho excluído' });
            this.carregarDesenhos();
          }
        });
      }
    });
  }
}
