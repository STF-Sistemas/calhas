import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DataTableComponent } from '#shared-frontend/components/data-table/data-table.component';
import { PedidoFormComponent } from '../pedidos/pedido-form/pedido-form.component';
import { AuthService } from '#core/services/auth.service';
import { DashboardService, IDashboardStats } from '#core/services/dashboard.service';
import { PedidoService } from '#core/services/pedido.service';
import { PedidoImpressaoService } from '#core/services/pedido-impressao.service';
import { PedidoImpressaoDesenhoService } from '#core/services/pedido-impressao-desenho.service';
import { formatCurrency } from '#shared/functions/format.functions';
import { EStatusPedido } from '#shared/enums';
import { IPedido } from '#shared/interfaces';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, ToastModule, ConfirmDialogModule, DataTableComponent, PedidoFormComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  providers: [MessageService, ConfirmationService]
})
export class DashboardComponent implements OnInit {
  @ViewChild('form') form!: PedidoFormComponent;

  loading = true;
  stats: IDashboardStats | null = null;
  pedidosRecentes: any[] = [];

  cols = [
    { field: 'id', header: 'Nº' },
    { field: 'cliente_nome', header: 'Cliente' },
    { field: 'data_pedido', header: 'Data', type: 'date' },
    { field: 'valor_total', header: 'Total', type: 'currency' },
    { field: 'status_label', header: 'Status' },
  ];

  constructor(
    public authService: AuthService,
    private dashboardService: DashboardService,
    private pedidoService: PedidoService,
    private impressaoService: PedidoImpressaoService,
    private impressaoDesenhoService: PedidoImpressaoDesenhoService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.dashboardService.carregar().subscribe({
      next: (res) => {
        this.stats = res.data;
        this.pedidosRecentes = res.data.pedidosRecentes.map((p: IPedido) => ({
          ...p,
          cliente_nome: p.cliente?.razao_social ?? '-',
          status_label: this.statusLabel(p.status),
        }));
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  onEdit(pedido: IPedido) {
    this.form.abrir(pedido.id);
  }

  onDelete(pedido: IPedido) {
    if (pedido.status !== EStatusPedido.Aberto) {
      this.messageService.add({ severity: 'warn', summary: 'Não permitido', detail: 'Apenas pedidos em status ABERTO podem ser excluídos.' });
      return;
    }
    this.confirmationService.confirm({
      message: `Deseja realmente excluir o pedido Nº ${pedido.id}? Esta ação é irreversível.`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      accept: () => {
        this.pedidoService.remover(pedido.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Pedido excluído' });
            this.ngOnInit();
          }
        });
      }
    });
  }

  onPrint(pedido: IPedido) {
    this.pedidoService.buscarPorId(pedido.id).subscribe({
      next: (res) => this.impressaoService.imprimir(res.data)
    });
  }

  onPrintDesenho(pedido: IPedido) {
    this.pedidoService.buscarPorId(pedido.id).subscribe({
      next: (res) => this.impressaoDesenhoService.imprimir(res.data)
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
