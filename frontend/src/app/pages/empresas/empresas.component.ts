import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { DataTableComponent } from '#shared-frontend/components/data-table/data-table.component';
import { EmpresaFormComponent } from './empresa-form/empresa-form.component';
import { EmpresaService } from '#core/services/empresa.service';
import { IEmpresa } from '#shared/interfaces';

@Component({
  selector: 'app-empresas',
  standalone: true,
  imports: [
    CommonModule,
    DataTableComponent,
    EmpresaFormComponent,
    ConfirmDialogModule,
    ToastModule,
    TagModule
  ],
  templateUrl: './empresas.component.html',
  styleUrls: ['./empresas.component.scss'],
  providers: [MessageService, ConfirmationService]
})
export class EmpresasComponent implements OnInit {
  @ViewChild('form') form!: EmpresaFormComponent;

  empresas: IEmpresa[] = [];
  loading = false;

  cols = [
    { field: 'razao_social', header: 'Razão Social' },
    { field: 'cnpj', header: 'CNPJ' },
    { field: 'email', header: 'E-mail' },
    { field: 'telefone', header: 'Telefone', type: 'phone' },
    { field: 'ativo', header: 'Status', type: 'status' }
  ];

  constructor(
    private empresaService: EmpresaService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit(): void {
    this.carregarEmpresas();
  }

  carregarEmpresas() {
    this.loading = true;
    this.empresaService.listar().subscribe({
      next: (res) => {
        this.empresas = res.data;
        this.loading = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar empresas' });
        this.loading = false;
      }
    });
  }

  onAdd() {
    this.form.abrir();
  }

  onEdit(empresa: IEmpresa) {
    this.form.abrir(empresa.id);
  }

  onDelete(empresa: IEmpresa) {
    this.confirmationService.confirm({
      message: `Deseja realmente excluir a empresa "${empresa.razao_social}"?`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      accept: () => {
        this.empresaService.desativar(empresa.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Empresa excluída' });
            this.carregarEmpresas();
          }
        });
      }
    });
  }
}
