import { AfterViewInit, Component, DestroyRef, OnInit, ViewChild, ChangeDetectionStrategy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DataTable,
  IRowAction,
} from '#shared-frontend/components/data-table/data-table.component';
import { PedidoForm } from './pedido-form/pedido-form.component';
import { OrdemCorteEnvioDialog } from './dialogs/ordem-corte-envio-dialog/ordem-corte-envio-dialog.component';
import { AutorizacaoDialog } from './dialogs/autorizacao-dialog/autorizacao-dialog.component';
import { PedidoService } from '#core/services/pedido.service';
import { ClienteService } from '#core/services/cliente.service';
import { PedidoImpressaoService } from '#core/services/pedido-impressao.service';
import { IPedido, ICliente } from '#shared/interfaces';
import { EStatusPedido, ETipoItemPedido, EAprovacaoPedido } from '#shared/enums';
import { obterAprovacaoTag } from '#shared/functions/aprovacao.functions';
import { environment } from '#environments/environment';
import { ToastService } from '#shared-frontend/services/toast.service';
import { ConfirmDialogService } from '#shared-frontend/services/confirm-dialog.service';
import { Botao, Select, CampoData, Painel, Paginador } from '#ui';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataTable,
    PedidoForm,
    OrdemCorteEnvioDialog,
    AutorizacaoDialog,
    Botao,
    Select,
    CampoData,
    Painel,
    Paginador,
  ],
  templateUrl: './pedidos.component.html',
  styleUrls: ['./pedidos.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class Pedidos implements OnInit, AfterViewInit {
  private readonly rota = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('form') form!: PedidoForm;
  @ViewChild('ordemCorteDialog') ordemCorteDialog!: OrdemCorteEnvioDialog;
  @ViewChild('autorizacaoDialog') autorizacaoDialog!: AutorizacaoDialog;

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
      icon: 'ic ic-whatsapp',
      tooltip: 'Enviar pelo WhatsApp',
      ariaLabel: 'Enviar orçamento pelo WhatsApp',
      severity: 'success',
      visible: (row) => row.status !== EStatusPedido.Cancelado,
    },
    {
      key: 'iniciar',
      icon: 'ic ic-play',
      tooltip: 'Iniciar Produção',
      ariaLabel: 'Mover para Em Produção',
      severity: 'warn',
      visible: (row) => row.status === EStatusPedido.Aberto,
    },
    {
      key: 'concluir',
      icon: 'ic ic-check',
      tooltip: 'Concluir Pedido',
      ariaLabel: 'Mover para Concluído',
      severity: 'success',
      visible: (row) => row.status === EStatusPedido.EmProducao,
    },
    {
      key: 'reabrir',
      icon: 'ic ic-replay',
      tooltip: 'Reabrir Pedido',
      ariaLabel: 'Voltar para Aberto',
      severity: 'secondary',
      visible: (row) => row.status === EStatusPedido.Concluido,
    },
    {
      key: 'ver-autorizacao',
      icon: 'ic ic-file-check',
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
    { field: 'aprovacao', header: 'Aprovação', type: 'tag' },
  ];

  constructor(
    private pedidoService: PedidoService,
    private clienteService: ClienteService,
    private impressaoService: PedidoImpressaoService,
    private readonly toast: ToastService,
    private readonly confirmDialog: ConfirmDialogService,
  ) {}

  ngOnInit(): void {
    this.clienteService.listar().subscribe({
      next: (res) => {
        this.clienteOptions = res.data.map((c: ICliente) => ({
          label: c.razao_social,
          value: c.id,
        }));
      },
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
          return {
            ...p,
            cliente_nome: p.cliente?.razao_social,
            status_label: statusLabel,
            aprovacao: obterAprovacaoTag(p.aprovacao_status),
          };
        });
        this.loading = false;
      },
      error: () => {
        this.toast.error('Falha ao carregar pedidos');
        this.loading = false;
      },
    });
  }

  onPageChange(event: { first?: number; rows?: number }) {
    this.limite = event.rows ?? this.limite;
    this.pagina = Math.floor((event.first ?? 0) / this.limite) + 1;
    this.carregarPedidos();
  }

  ngAfterViewInit(): void {
    this.rota.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      if (params.get('novo') !== '1') return;
      setTimeout(() => {
        this.form.abrir();
        this.router.navigate([], { relativeTo: this.rota, queryParams: { novo: null }, queryParamsHandling: 'merge', replaceUrl: true });
      });
    });
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
      error: () =>
        this.toast.error('Falha ao carregar dados do pedido'),
    });
  }

  onPrintDesenho(pedido: IPedido) {
    this.pedidoService.buscarPorId(pedido.id).subscribe({
      next: (res) => {
        const temItensEnviaveis = (res.data.itens ?? []).some(
          (i) => i.tipo === ETipoItemPedido.Corte || i.tipo === ETipoItemPedido.Produto,
        );
        if (!temItensEnviaveis) {
          this.toast.warn('Este pedido não possui produtos ou cortes para envio.');
          return;
        }
        this.ordemCorteDialog.abrir(res.data);
      },
      error: () =>
        this.toast.error('Falha ao carregar dados do pedido'),
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
      iniciar: { status: EStatusPedido.EmProducao, label: 'mover para Em Produção' },
      concluir: { status: EStatusPedido.Concluido, label: 'concluir' },
      reabrir: { status: EStatusPedido.Aberto, label: 'reabrir (voltar para Aberto)' },
    };
    const acao = mapa[event.key];
    if (!acao) return;

    this.confirmDialog.confirm({
      title: 'Alterar Status',
      message: `Deseja ${acao.label} o Pedido Nº ${event.row.id}?`,
      confirmText: 'Sim',
      cancelText: 'Não',
    }).then((ok) => {
      if (!ok) return;
        this.pedidoService.alterarStatus(event.row.id, acao.status).subscribe({
          next: () => {
            this.toast.success('Status do pedido atualizado.');
            this.carregarPedidos();
          },
          error: (err) => {
            const erros: string[] = err.error?.erros ?? [];
            const summary = err.error?.message || 'Falha ao alterar status';
            this.toast.error(summary);
            erros.forEach((e) =>
              this.toast.warn(e, 'Estoque insuficiente'),
            );
          },
        });
    });
  }

  onEnviarWhatsApp(pedido: IPedido) {
    this.pedidoService.gerarLink(pedido.id).subscribe({
      next: (res) => {
        const baseUrl = window.location.origin;
        const url = `${baseUrl}/orcamento/${res.data.token}`;
        const mensagem = (res.data.mensagem_padrao || 'Segue o seu orçamento: {link}').replace(
          '{link}',
          url,
        );
        const telefone = (pedido as any).cliente?.telefone ?? '';
        const tel = telefone.replace(/\D/g, '');
        const waUrl = tel
          ? `https://wa.me/55${tel}?text=${encodeURIComponent(mensagem)}`
          : `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      },
      error: () => {
        this.toast.error('Falha ao gerar link do WhatsApp.');
      },
    });
  }

  onDelete(pedido: IPedido) {
    if (pedido.status !== EStatusPedido.Aberto) {
      this.toast.warn('Apenas pedidos em status ABERTO podem ser excluídos.', 'Não permitido');
      return;
    }
    this.confirmDialog.confirm({
      title: 'Confirmar Exclusão',
      message: `Deseja realmente excluir o pedido Nº ${pedido.id}? Esta ação é irreversível.`,
      confirmText: 'Sim',
      cancelText: 'Não',
      danger: true,
    }).then((ok) => {
      if (!ok) return;
        this.pedidoService.remover(pedido.id).subscribe({
          next: () => {
            this.toast.success('Pedido excluído');
            this.carregarPedidos();
          },
        });
    });
  }
}
