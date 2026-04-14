import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DataTableComponent } from '#shared-frontend/components/data-table/data-table.component';
import { ServicoFormComponent } from './servico-form/servico-form.component';
import { ServicoService } from '#core/services/servico.service';
import { IServico } from '#shared/interfaces';
import { EStatusGeral } from '#shared/enums';

@Component({
  selector: 'app-servicos',
  standalone: true,
  imports: [
    CommonModule, 
    DataTableComponent, 
    ServicoFormComponent, 
    ConfirmDialogModule,
    ToastModule
  ],
  templateUrl: './servicos.component.html',
  styleUrls: ['./servicos.component.scss'],
  providers: [ConfirmationService]
})
export class ServicosComponent implements OnInit {
  @ViewChild('form') form!: ServicoFormComponent;
  
  servicos: IServico[] = [];
  loading = false;
  
  cols = [
    { field: 'descricao', header: 'Descrição' },
    { field: 'valor', header: 'Preço Sugerido', type: 'currency' },
    { field: 'status', header: 'Status', type: 'status' }
  ];

  constructor(
    private servicoService: ServicoService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
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
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar serviços' });
        this.loading = false;
      }
    });
  }

  onAdd() {
    this.form.abrir();
  }

  onEdit(servico: IServico) {
    this.form.abrir(servico.id);
  }

  onToggleStatus(servico: IServico) {
    const novoStatus = servico.status === EStatusGeral.Ativo ? EStatusGeral.Inativo : EStatusGeral.Ativo;
    this.servicoService.alterarStatus(servico.id, novoStatus).subscribe({
      next: () => {
        servico.status = novoStatus;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao alterar status do serviço' });
      }
    });
  }

  onDelete(servico: IServico) {
    this.confirmationService.confirm({
      message: `Deseja realmente excluir o serviço "${servico.descricao}"?`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      accept: () => {
        this.servicoService.desativar(servico.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Serviço excluído' });
            this.carregarServicos();
          }
        });
      }
    });
  }
}
