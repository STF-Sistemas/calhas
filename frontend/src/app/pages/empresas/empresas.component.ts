import { Component, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { DataTable } from '#shared-frontend/components/data-table/data-table.component';
import { EmpresaForm } from './empresa-form/empresa-form.component';
import { EmpresaService } from '#core/services/empresa.service';
import { IEmpresa } from '#shared/interfaces';
import { ToastService } from '#shared-frontend/services/toast.service';
import { ConfirmDialogService } from '#shared-frontend/services/confirm-dialog.service';

@Component({
  selector: 'app-empresas',
  standalone: true,
  imports: [
    CommonModule,
    DataTable,
    EmpresaForm,
    TagModule,
  ],
  templateUrl: './empresas.component.html',
  styleUrls: ['./empresas.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class Empresas implements OnInit {
  @ViewChild('form') form!: EmpresaForm;

  empresas: IEmpresa[] = [];
  loading = false;

  cols = [
    { field: 'razao_social', header: 'Razão Social' },
    { field: 'cnpj', header: 'CNPJ' },
    { field: 'email', header: 'E-mail' },
    { field: 'telefone', header: 'Telefone', type: 'phone' },
    { field: 'ativo', header: 'Status', type: 'status' },
  ];

  constructor(
    private empresaService: EmpresaService,
    private readonly toast: ToastService,
    private readonly confirmDialog: ConfirmDialogService,
  ) {}

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
        this.toast.error('Falha ao carregar empresas');
        this.loading = false;
      },
    });
  }

  onAdd() {
    this.form.abrir();
  }

  onEdit(empresa: IEmpresa) {
    this.form.abrir(empresa.id);
  }

  onDelete(empresa: IEmpresa) {
    this.confirmDialog.confirm({
      title: 'Confirmar Exclusão',
      message: `Deseja realmente excluir a empresa "${empresa.razao_social}"?`,
      confirmText: 'Sim',
      cancelText: 'Não',
      danger: true,
    }).then((ok) => {
      if (!ok) return;
        this.empresaService.desativar(empresa.id).subscribe({
          next: () => {
            this.toast.success('Empresa excluída');
            this.carregarEmpresas();
          },
        });
    });
  }
}
