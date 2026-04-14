import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DataTableComponent } from '#shared-frontend/components/data-table/data-table.component';
import { ClienteFormComponent } from './cliente-form/cliente-form.component';
import { ClienteService } from '#core/services/cliente.service';
import { ICliente } from '#shared/interfaces';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [
    CommonModule, 
    DataTableComponent, 
    ClienteFormComponent, 
    ConfirmDialogModule,
    ToastModule
  ],
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.scss'],
  providers: [ConfirmationService]
})
export class ClientesComponent implements OnInit {
  @ViewChild('form') form!: ClienteFormComponent;
  
  clientes: ICliente[] = [];
  loading = false;
  
  cols = [
    { field: 'razao_social', header: 'Nome / Razão Social' },
    { field: 'cpf_cnpj', header: 'CPF/CNPJ', type: 'cpf_cnpj' },
    { field: 'email', header: 'E-mail' },
    { field: 'telefone', header: 'Telefone', type: 'phone' },
    { field: 'ativo', header: 'Status', type: 'status' }
  ];

  constructor(
    private clienteService: ClienteService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.carregarClientes();
  }

  carregarClientes() {
    this.loading = true;
    this.clienteService.listar().subscribe({
      next: (res) => {
        this.clientes = res.data;
        this.loading = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar clientes' });
        this.loading = false;
      }
    });
  }

  onAdd() {
    this.form.abrir();
  }

  onEdit(cliente: ICliente) {
    this.form.abrir(cliente.id);
  }

  onDelete(cliente: ICliente) {
    this.confirmationService.confirm({
      message: `Deseja realmente excluir o cliente "${cliente.razao_social}"?`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      accept: () => {
        this.clienteService.desativar(cliente.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Cliente excluído' });
            this.carregarClientes();
          }
        });
      }
    });
  }
}
