import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { PanelModule } from 'primeng/panel';
import { SelectModule } from 'primeng/select';
import { PaginatorModule } from 'primeng/paginator';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { DataTableComponent } from '#shared-frontend/components/data-table/data-table.component';
import { FornecedorFormComponent } from './fornecedor-form/fornecedor-form.component';
import { FornecedorService } from '#core/services/fornecedor.service';
import { CompraService } from '#core/services/compra.service';
import { IFornecedor, ICompra } from '#shared/interfaces';
import { EStatusCompra } from '#shared/enums';

@Component({
  selector: 'app-fornecedores',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataTableComponent,
    FornecedorFormComponent,
    ConfirmDialogModule,
    ToastModule,
    PanelModule,
    SelectModule,
    PaginatorModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    TableModule,
    DatePickerModule,
    TagModule,
  ],
  templateUrl: './fornecedores.component.html',
  styleUrls: ['./fornecedores.component.scss'],
  providers: [ConfirmationService],
})
export class FornecedoresComponent implements OnInit {
  @ViewChild('form') form!: FornecedorFormComponent;

  fornecedores: IFornecedor[] = [];
  loading = false;

  // ── Histórico de compras do fornecedor ────────────────────────────────────────
  showHistorico = false;
  historicoLoading = false;
  historicoCompras: ICompra[] = [];
  fornecedorHistoricoNome = '';
  fornecedorHistoricoId: number | null = null;

  historicoFiltros = {
    dataInicio: null as Date | null,
    dataFim: null as Date | null,
  };

  historicoPagina = 1;
  historicoLimite = 10;
  historicoTotal = 0;

  filtros = {
    razaoSocial: '',
    nomeFantasia: '',
    cnpj: '',
    telefone: '',
    status: null as number | null,
  };

  pagina = 1;
  limite = 10;
  totalRegistros = 0;

  statusOptions = [
    { label: 'Ativo', value: 1 },
    { label: 'Inativo', value: 2 },
  ];

  cols = [
    { field: 'cnpj', header: 'CNPJ', type: 'cpf_cnpj' },
    { field: 'razao_social', header: 'Razão Social' },
    { field: 'nome_fantasia', header: 'Nome Fantasia' },
    { field: 'cidade_nome', header: 'Cidade/UF' },
    { field: 'fone', header: 'Telefone', type: 'phone' },
    { field: 'status', header: 'Status', type: 'status' },
  ];

  constructor(
    private fornecedorService: FornecedorService,
    private compraService: CompraService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private titleService: Title
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle('Fornecedores — Calhas');
    this.carregar();
  }

  filtrar() {
    this.pagina = 1;
    this.carregar();
  }

  carregar() {
    this.loading = true;
    const params: any = { pagina: this.pagina, limite: this.limite };
    if (this.filtros.razaoSocial?.trim()) params.razaoSocial = this.filtros.razaoSocial.trim();
    if (this.filtros.nomeFantasia?.trim()) params.nomeFantasia = this.filtros.nomeFantasia.trim();
    if (this.filtros.cnpj?.trim()) params.cnpj = this.filtros.cnpj.trim();
    if (this.filtros.telefone?.trim()) params.telefone = this.filtros.telefone.trim();
    if (this.filtros.status != null) params.status = this.filtros.status;

    this.fornecedorService.listar(params).subscribe({
      next: (res) => {
        this.totalRegistros = res.total ?? 0;
        this.fornecedores = res.data.map((f) => ({
          ...f,
          cidade_nome: f.cidade ? `${f.cidade.descricao}/${f.cidade.uf}` : '',
        }));
        this.loading = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar fornecedores' });
        this.loading = false;
      },
    });
  }

  onPageChange(event: { first?: number; rows?: number }) {
    this.limite = event.rows ?? this.limite;
    this.pagina = Math.floor((event.first ?? 0) / this.limite) + 1;
    this.carregar();
  }

  onHistorico(fornecedor: IFornecedor) {
    this.fornecedorHistoricoNome = fornecedor.razao_social;
    this.fornecedorHistoricoId = fornecedor.id;
    this.historicoCompras = [];
    this.historicoPagina = 1;
    this.historicoFiltros = { dataInicio: null, dataFim: null };
    this.showHistorico = true;
    this.carregarHistorico();
  }

  filtrarHistorico() {
    this.historicoPagina = 1;
    this.carregarHistorico();
  }

  limparHistoricoFiltros() {
    this.historicoFiltros = { dataInicio: null, dataFim: null };
    this.historicoPagina = 1;
    this.carregarHistorico();
  }

  carregarHistorico() {
    if (!this.fornecedorHistoricoId) return;
    this.historicoLoading = true;
    const params: any = {
      codFornecedor: this.fornecedorHistoricoId,
      pagina: this.historicoPagina,
      limite: this.historicoLimite,
    };
    if (this.historicoFiltros.dataInicio) params.dataInicio = this.formatDate(this.historicoFiltros.dataInicio);
    if (this.historicoFiltros.dataFim) params.dataFim = this.formatDate(this.historicoFiltros.dataFim);

    this.compraService.listar(params).subscribe({
      next: (res) => {
        this.historicoTotal = res.total ?? 0;
        this.historicoCompras = res.data.map((c: ICompra) => ({
          ...c,
          status_label: this.labelStatus(c.status),
          status_severity: this.severityStatus(c.status),
        }));
        this.historicoLoading = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar histórico de compras' });
        this.historicoLoading = false;
      },
    });
  }

  onHistoricoPageChange(event: { first?: number; rows?: number }) {
    this.historicoLimite = event.rows ?? this.historicoLimite;
    this.historicoPagina = Math.floor((event.first ?? 0) / this.historicoLimite) + 1;
    this.carregarHistorico();
  }

  private labelStatus(status: number): string {
    if (status === EStatusCompra.Rascunho) return 'Rascunho';
    if (status === EStatusCompra.Confirmada) return 'Confirmada';
    if (status === EStatusCompra.Cancelada) return 'Cancelada';
    return 'Desconhecido';
  }

  private severityStatus(status: number): string {
    if (status === EStatusCompra.Rascunho) return 'secondary';
    if (status === EStatusCompra.Confirmada) return 'success';
    if (status === EStatusCompra.Cancelada) return 'danger';
    return 'secondary';
  }

  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  onAdd() {
    this.form.abrir();
  }

  onEdit(fornecedor: IFornecedor) {
    this.form.abrir(fornecedor.id);
  }

  onStatus(fornecedor: IFornecedor) {
    const novoStatus = fornecedor.status === 1 ? 2 : 1;
    this.fornecedorService.alterarStatus(fornecedor.id, novoStatus).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Status alterado' });
        this.carregar();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao alterar status' }),
    });
  }

  onDelete(fornecedor: IFornecedor) {
    this.confirmationService.confirm({
      message: `Deseja realmente excluir o fornecedor "${fornecedor.razao_social}"?`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      accept: () => {
        this.fornecedorService.excluir(fornecedor.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Fornecedor excluído' });
            this.carregar();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao excluir fornecedor' }),
        });
      },
    });
  }
}
