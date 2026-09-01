import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { PanelModule } from 'primeng/panel';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { PaginatorModule } from 'primeng/paginator';
import { ButtonModule } from 'primeng/button';
import { DataTableComponent, IRowAction } from '#shared-frontend/components/data-table/data-table.component';
import { PedidoFormComponent } from './pedido-form/pedido-form.component';
import { OrdemCorteEnvioDialogComponent } from './dialogs/ordem-corte-envio-dialog/ordem-corte-envio-dialog.component';
import { AutorizacaoDialogComponent } from './dialogs/autorizacao-dialog/autorizacao-dialog.component';
import { PedidoService } from '#core/services/pedido.service';
import { ClienteService } from '#core/services/cliente.service';
import { PedidoImpressaoService } from '#core/services/pedido-impressao.service';
import { IPedido, ICliente } from '#shared/interfaces';
import { EStatusPedido, ETipoItemPedido, EAprovacaoPedido } from '#shared/enums';
import { obterAprovacaoTag } from '#shared/functions/aprovacao.functions';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataTableComponent,
    PedidoFormComponent,
    OrdemCorteEnvioDialogComponent,
    AutorizacaoDialogComponent,
    ConfirmDialogModule,
    ToastModule,
    TagModule,
    PanelModule,
    DatePickerModule,
    SelectModule,
    PaginatorModule,
    ButtonModule,
  ],
  templateUrl: './pedidos.component.html',
  styleUrls: ['./pedidos.component.scss'],
  providers: [ConfirmationService]
})
export class PedidosComponent implements OnInit {
  @ViewChild('form') form!: PedidoFormComponent;
  @ViewChild('ordemCorteDialog') ordemCorteDialog!: OrdemCorteEnvioDialogComponent;
  @ViewChild('autorizacaoDialog') autorizacaoDialog!: AutorizacaoDialogComponent;

  pedidos: IPedido[] = [];
  loading = false;

  filtros = {
    dataInicio: null as Date | null,
    dataFim: null as Date | null,
    codCliente: null as number | null,
    status: null as number | null,
  };

  pagina = 1;
  limite = 10;
  totalRegistros = 0;

  clienteOptions: { label: string; value: number }[] = [];

  statusOptions = [
    { label: 'Aberto', value: EStatusPedido.Aberto },
    { label: 'Em Produção', value: EStatusPedido.EmProducao },
    { label: 'Finalizado', value: EStatusPedido.Concluido },
    { label: 'Cancelado', value: EStatusPedido.Cancelado },
  ];

  rowActions: IRowAction[] = [
    {
      key: 'whatsapp',
      icon: 'pi pi-whatsapp',
      tooltip: 'Enviar pelo WhatsApp',
      ariaLabel: 'Enviar orçamento pelo WhatsApp',
      severity: 'success',
      visible: (row) => row.status !== EStatusPedido.Cancelado,
    },
    {
      key: 'iniciar',
      icon: 'pi pi-play',
      tooltip: 'Iniciar Produção',
      ariaLabel: 'Mover para Em Produção',
      severity: 'warn',
      visible: (row) => row.status === EStatusPedido.Aberto,
    },
    {
      key: 'concluir',
      icon: 'pi pi-check',
      tooltip: 'Concluir Pedido',
      ariaLabel: 'Mover para Concluído',
      severity: 'success',
      visible: (row) => row.status === EStatusPedido.EmProducao,
    },
    {
      key: 'reabrir',
      icon: 'pi pi-replay',
      tooltip: 'Reabrir Pedido',
      ariaLabel: 'Voltar para Aberto',
      severity: 'secondary',
      visible: (row) => row.status === EStatusPedido.Concluido,
    },
    {
      key: 'ver-autorizacao',
      icon: 'pi pi-file-check',
      tooltip: 'Ver Autorização/Recusa',
      ariaLabel: 'Ver detalhes da autorização ou recusa do cliente',
      severity: 'info',
      visible: (row) => row.aprovacao_status !== EAprovacaoPedido.Pendente,
    },
  ];

  cols = [
    { field: 'id', header: 'Nº Pedido' },
    { field: 'cliente_nome', header: 'Cliente' },
    { field: 'data_pedido', header: 'Data', type: 'date' },
    { field: 'valor_total', header: 'Total', type: 'currency' },
    { field: 'valor_desconto', header: 'Desconto', type: 'currency' },
    { field: 'valor_liquido', header: 'Total Líquido', type: 'currency' },
    { field: 'status_label', header: 'Status' },
    { field: 'aprovacao', header: 'Aprovação', type: 'tag' }
  ];

  constructor(
    private pedidoService: PedidoService,
    private clienteService: ClienteService,
    private impressaoService: PedidoImpressaoService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.clienteService.listar().subscribe({
      next: (res) => {
        this.clienteOptions = res.data.map((c: ICliente) => ({ label: c.razao_social, value: c.id }));
      }
    });
    this.carregarPedidos();
  }

  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  filtrar() {
    this.pagina = 1;
    this.carregarPedidos();
  }

  carregarPedidos() {
    this.loading = true;
    const params: any = { pagina: this.pagina, limite: this.limite };
    if (this.filtros.dataInicio) params.dataInicio = this.formatDate(this.filtros.dataInicio);
    if (this.filtros.dataFim) params.dataFim = this.formatDate(this.filtros.dataFim);
    if (this.filtros.codCliente != null) params.codCliente = this.filtros.codCliente;
    if (this.filtros.status != null) params.status = this.filtros.status;

    this.pedidoService.listar(params).subscribe({
      next: (res) => {
        this.totalRegistros = res.total ?? 0;
        this.pedidos = res.data.map((p: IPedido) => {
          let statusLabel = 'Desconhecido';
          if (p.status === EStatusPedido.Aberto) statusLabel = 'Aberto';
          else if (p.status === EStatusPedido.EmProducao) statusLabel = 'Em Produção';
          else if (p.status === EStatusPedido.Concluido) statusLabel = 'Finalizado';
          else if (p.status === EStatusPedido.Cancelado) statusLabel = 'Cancelado';
          return { ...p, cliente_nome: p.cliente?.razao_social, status_label: statusLabel, aprovacao: obterAprovacaoTag(p.aprovacao_status) };
        });
        this.loading = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar pedidos' });
        this.loading = false;
      }
    });
  }

  onPageChange(event: { first?: number; rows?: number }) {
    this.limite = event.rows ?? this.limite;
    this.pagina = Math.floor((event.first ?? 0) / this.limite) + 1;
    this.carregarPedidos();
  }

  onAdd() {
    this.form.abrir();
  }

  onEdit(pedido: IPedido) {
    this.form.abrir(pedido.id);
  }

  onPrint(pedido: IPedido) {
    this.pedidoService.buscarPorId(pedido.id).subscribe({
      next: (res) => this.impressaoService.imprimir(res.data),
      error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar dados do pedido' })
    });
  }

  onPrintDesenho(pedido: IPedido) {
    this.pedidoService.buscarPorId(pedido.id).subscribe({
      next: (res) => {
        const temItensEnviaveis = (res.data.itens ?? []).some(
          i => i.tipo === ETipoItemPedido.Corte || i.tipo === ETipoItemPedido.Produto
        );
        if (!temItensEnviaveis) {
          this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Este pedido não possui produtos ou cortes para envio.' });
          return;
        }
        this.ordemCorteDialog.abrir(res.data);
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar dados do pedido' })
    });
  }

  onRowAction(event: { key: string; row: IPedido }) {
    if (event.key === 'whatsapp') {
      this.onEnviarWhatsApp(event.row);
      return;
    }
    if (event.key === 'ver-autorizacao') {
      this.autorizacaoDialog.abrir(event.row);
      return;
    }

    const mapa: Record<string, { status: EStatusPedido; label: string }> = {
      iniciar:  { status: EStatusPedido.EmProducao, label: 'mover para Em Produção' },
      concluir: { status: EStatusPedido.Concluido,  label: 'concluir' },
      reabrir:  { status: EStatusPedido.Aberto,     label: 'reabrir (voltar para Aberto)' },
    };
    const acao = mapa[event.key];
    if (!acao) return;

    this.confirmationService.confirm({
      message: `Deseja ${acao.label} o Pedido Nº <strong>${event.row.id}</strong>?`,
      header: 'Alterar Status',
      icon: 'pi pi-question-circle',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      accept: () => {
        this.pedidoService.alterarStatus(event.row.id, acao.status).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Status do pedido atualizado.' });
            this.carregarPedidos();
          },
          error: (err) => {
            const erros: string[] = err.error?.erros ?? [];
            const summary = err.error?.message || 'Falha ao alterar status';
            this.messageService.add({ severity: 'error', summary, life: 6000 });
            erros.forEach(e =>
              this.messageService.add({ severity: 'warn', summary: 'Estoque insuficiente', detail: e, life: 8000 })
            );
          }
        });
      }
    });
  }

  onEnviarWhatsApp(pedido: IPedido) {
    this.pedidoService.gerarLink(pedido.id).subscribe({
      next: (res) => {
        const baseUrl = window.location.origin;
        const url = `${baseUrl}/orcamento/${res.data.token}`;
        const mensagem = (res.data.mensagem_padrao || 'Segue o seu orçamento: {link}').replace('{link}', url);
        const telefone = (pedido as any).cliente?.telefone ?? '';
        const tel = telefone.replace(/\D/g, '');
        const waUrl = tel
          ? `https://wa.me/55${tel}?text=${encodeURIComponent(mensagem)}`
          : `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao gerar link do WhatsApp.' });
      },
    });
  }

  onDelete(pedido: IPedido) {
    if (pedido.status !== EStatusPedido.Aberto) {
      this.messageService.add({ severity: 'warn', summary: 'Não permitido', detail: 'Apenas pedidos em status ABERTO podem ser excluídos.' });
      return;
    }
    this.confirmationService.confirm({
      message: `Deseja realmente excluir o pedido Nº ${pedido.id}? Esta ação é irreversível.`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-danger',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      accept: () => {
        this.pedidoService.remover(pedido.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Pedido excluído' });
            this.carregarPedidos();
          }
        });
      }
    });
  }
}
