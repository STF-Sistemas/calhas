import { Component, OnInit, ViewChild, ChangeDetectionStrategy, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  DataTable,
  IRowAction,
} from '#shared-frontend/components/data-table/data-table.component';
import { PedidoForm } from '../pedidos/pedido-form/pedido-form.component';
import { OrdemCorteEnvioDialog } from '../pedidos/dialogs/ordem-corte-envio-dialog/ordem-corte-envio-dialog.component';
import { AutorizacaoDialog } from '../pedidos/dialogs/autorizacao-dialog/autorizacao-dialog.component';
import { AuthService } from '#core/services/auth.service';
import { DashboardService, IDashboardStats } from '#core/services/dashboard.service';
import { PedidoService } from '#core/services/pedido.service';
import { EventosService } from '#core/services/eventos.service';
import { PedidoImpressaoService } from '#core/services/pedido-impressao.service';
import { formatCurrency } from '#shared/functions/format.functions';
import { obterAprovacaoTag } from '#shared/functions/aprovacao.functions';
import { EStatusPedido, ETipoItemPedido, EAprovacaoPedido } from '#shared/enums';
import { IPedido } from '#shared/interfaces';
import { ToastService } from '#shared-frontend/services/toast.service';
import { ConfirmDialogService } from '#shared-frontend/services/confirm-dialog.service';
import { Botao } from '#ui';
import { frontendUrl } from '#core/config/site-config';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DataTable,
    PedidoForm,
    OrdemCorteEnvioDialog,
    AutorizacaoDialog,
    Botao,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class Dashboard implements OnInit {
  @ViewChild('form') form!: PedidoForm;
  @ViewChild('ordemCorteDialog') ordemCorteDialog!: OrdemCorteEnvioDialog;
  @ViewChild('autorizacaoDialog') autorizacaoDialog!: AutorizacaoDialog;

  loading = true;
  stats: IDashboardStats | null = null;
  pedidosRecentes: any[] = [];

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
    { field: 'id', header: 'Nº' },
    { field: 'cliente_nome', header: 'Cliente' },
    { field: 'data_pedido', header: 'Data', type: 'date' },
    { field: 'valor_total', header: 'Total', type: 'currency' },
    { field: 'valor_desconto', header: 'Desconto', type: 'currency' },
    { field: 'valor_liquido', header: 'Total Líquido', type: 'currency' },
    { field: 'status_label', header: 'Status' },
    { field: 'aprovacao', header: 'Aprovação', type: 'tag' },
  ];

  constructor(
    public authService: AuthService,
    private dashboardService: DashboardService,
    private pedidoService: PedidoService,
    private impressaoService: PedidoImpressaoService,
    private readonly toast: ToastService,
    private readonly confirmDialog: ConfirmDialogService,
  ) {}

  private readonly destroyRef = inject(DestroyRef);
  private readonly eventosService = inject(EventosService);

  ngOnInit(): void {
    this.carregar();
    this.eventosService.pedidoAprovacao$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.carregar());
  }

  carregar(): void {
    this.dashboardService.carregar().subscribe({
      next: (res) => {
        this.stats = res.data;
        this.pedidosRecentes = res.data.pedidosRecentes.map((p: IPedido) => ({
          ...p,
          cliente_nome: p.cliente?.razao_social ?? '-',
          status_label: this.statusLabel(p.status),
          aprovacao: obterAprovacaoTag(p.aprovacao_status),
        }));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
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
            this.carregar();
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
        const baseUrl = frontendUrl();
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

  onEdit(pedido: IPedido) {
    this.form.abrir(pedido.id);
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
            this.carregar();
          },
        });
    });
  }

  onPrint(pedido: IPedido) {
    this.pedidoService.buscarPorId(pedido.id).subscribe({
      next: (res) => this.impressaoService.imprimir(res.data),
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

  private statusLabel(status: number): string {
    const map: Record<number, string> = {
      [EStatusPedido.Aberto]: 'Aberto',
      [EStatusPedido.EmProducao]: 'Em Produção',
      [EStatusPedido.Concluido]: 'Finalizado',
      [EStatusPedido.Cancelado]: 'Cancelado',
    };
    return map[status] ?? '-';
  }

  formatCurrency = formatCurrency;
}
