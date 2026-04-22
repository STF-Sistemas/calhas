import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { ClienteFormComponent } from './cliente-form/cliente-form.component';
import { ClienteService } from '#core/services/cliente.service';
import { PedidoService } from '#core/services/pedido.service';
import { ICliente, IPedido } from '#shared/interfaces';
import { EStatusPedido } from '#shared/enums';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataTableComponent,
    ClienteFormComponent,
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
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.scss'],
  providers: [ConfirmationService]
})
export class ClientesComponent implements OnInit {
  @ViewChild('form') form!: ClienteFormComponent;

  clientes: ICliente[] = [];
  loading = false;

  // ── Histórico de pedidos do cliente ──────────────────────────────────────────
  showHistorico = false;
  historicoLoading = false;
  historicoPedidos: IPedido[] = [];
  clienteHistoricoNome = '';
  clienteHistoricoId: number | null = null;

  historicoFiltros = {
    dataInicio: null as Date | null,
    dataFim: null as Date | null,
  };

  historicoPagina = 1;
  historicoLimite = 10;
  historicoTotal = 0;

  filtros = {
    nome: '',
    endereco: '',
    cpfCnpj: '',
    telefone: '',
    ativo: null as number | null,
  };

  pagina = 1;
  limite = 10;
  totalRegistros = 0;

  statusOptions = [
    { label: 'Ativo', value: 1 },
    { label: 'Inativo', value: 2 },
  ];

  cols = [
    { field: 'razao_social', header: 'Nome / Razão Social' },
    { field: 'cpf_cnpj', header: 'CPF/CNPJ', type: 'cpf_cnpj' },
    { field: 'telefone', header: 'Telefone', type: 'phone' },
    { field: 'endereco_completo', header: 'Endereço' },
    { field: 'ativo', header: 'Status', type: 'status' },
  ];

  constructor(
    private clienteService: ClienteService,
    private pedidoService: PedidoService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.carregarClientes();
  }

  filtrar() {
    this.pagina = 1;
    this.carregarClientes();
  }

  carregarClientes() {
    this.loading = true;
    const params: any = { pagina: this.pagina, limite: this.limite };
    if (this.filtros.nome?.trim()) params.nome = this.filtros.nome.trim();
    if (this.filtros.endereco?.trim()) params.endereco = this.filtros.endereco.trim();
    if (this.filtros.cpfCnpj?.trim()) params.cpfCnpj = this.filtros.cpfCnpj.trim();
    if (this.filtros.telefone?.trim()) params.telefone = this.filtros.telefone.trim();
    if (this.filtros.ativo != null) params.ativo = this.filtros.ativo;

    this.clienteService.listar(params).subscribe({
      next: (res) => {
        this.totalRegistros = res.total ?? 0;
        this.clientes = res.data.map((c: ICliente) => ({
          ...c,
          endereco_completo: this.montarEndereco(c),
        }));
        this.loading = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar clientes' });
        this.loading = false;
      }
    });
  }

  private montarEndereco(c: ICliente): string {
    const partes: string[] = [];
    if (c.endereco) partes.push(c.endereco);
    if (c.numero) partes[0] = (partes[0] ?? '') + ', ' + c.numero;
    if (c.bairro) partes.push(c.bairro);
    if ((c as any).cidade?.descricao) {
      const cidade = (c as any).cidade;
      partes.push(`${cidade.descricao}/${cidade.uf}`);
    }
    return partes.join(' — ');
  }

  onPageChange(event: { first?: number; rows?: number }) {
    this.limite = event.rows ?? this.limite;
    this.pagina = Math.floor((event.first ?? 0) / this.limite) + 1;
    this.carregarClientes();
  }

  onHistorico(cliente: ICliente) {
    this.clienteHistoricoNome = cliente.razao_social;
    this.clienteHistoricoId = cliente.id;
    this.historicoPedidos = [];
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
    if (!this.clienteHistoricoId) return;
    this.historicoLoading = true;
    const params: any = {
      codCliente: this.clienteHistoricoId,
      pagina: this.historicoPagina,
      limite: this.historicoLimite,
    };
    if (this.historicoFiltros.dataInicio) params.dataInicio = this.formatDate(this.historicoFiltros.dataInicio);
    if (this.historicoFiltros.dataFim) params.dataFim = this.formatDate(this.historicoFiltros.dataFim);

    this.pedidoService.listar(params).subscribe({
      next: (res) => {
        this.historicoTotal = res.total ?? 0;
        this.historicoPedidos = res.data.map((p: IPedido) => ({
          ...p,
          status_label: this.labelStatus(p.status),
          status_severity: this.severityStatus(p.status),
        }));
        this.historicoLoading = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar histórico de pedidos' });
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
    if (status === EStatusPedido.Aberto) return 'Aberto';
    if (status === EStatusPedido.EmProducao) return 'Em Produção';
    if (status === EStatusPedido.Concluido) return 'Finalizado';
    if (status === EStatusPedido.Cancelado) return 'Cancelado';
    return 'Desconhecido';
  }

  private severityStatus(status: number): string {
    if (status === EStatusPedido.Aberto) return 'info';
    if (status === EStatusPedido.EmProducao) return 'warn';
    if (status === EStatusPedido.Concluido) return 'success';
    if (status === EStatusPedido.Cancelado) return 'danger';
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
