import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { DataTableComponent } from '#shared-frontend/components/data-table/data-table.component';
import { PedidoFormComponent } from './pedido-form/pedido-form.component';
import { PedidoService } from '#core/services/pedido.service';
import { PedidoImpressaoService } from '#core/services/pedido-impressao.service';
import { PedidoImpressaoDesenhoService } from '#core/services/pedido-impressao-desenho.service';
import { IPedido } from '#shared/interfaces';
import { EStatusPedido } from '#shared/enums';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [
    CommonModule, 
    DataTableComponent, 
    PedidoFormComponent, 
    ConfirmDialogModule,
    ToastModule,
    TagModule
  ],
  templateUrl: './pedidos.component.html',
  styleUrls: ['./pedidos.component.scss'],
  providers: [MessageService, ConfirmationService]
})
export class PedidosComponent implements OnInit {
  @ViewChild('form') form!: PedidoFormComponent;
  
  pedidos: IPedido[] = [];
  loading = false;
  
  cols = [
    { field: 'id', header: 'Nº Pedido' },
    { field: 'cliente_nome', header: 'Cliente' },
    { field: 'data_pedido', header: 'Data', type: 'date' },
    { field: 'valor_total', header: 'Total', type: 'currency' },
    { field: 'status_label', header: 'Status' }
  ];

  constructor(
    private pedidoService: PedidoService,
    private impressaoService: PedidoImpressaoService,
    private impressaoDesenhoService: PedidoImpressaoDesenhoService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.carregarPedidos();
  }

  carregarPedidos() {
    this.loading = true;
    this.pedidoService.listar().subscribe({
      next: (res) => {
        this.pedidos = res.data.map((p: IPedido) => {
          let statusLabel = 'Desconhecido';
          if (p.status === EStatusPedido.Aberto) statusLabel = 'Aberto';
          else if (p.status === EStatusPedido.EmProducao) statusLabel = 'Em Produção';
          else if (p.status === EStatusPedido.Concluido) statusLabel = 'Finalizado';
          else if (p.status === EStatusPedido.Cancelado) statusLabel = 'Cancelado';
          
          return {
            ...p,
            cliente_nome: p.cliente?.razao_social,
            status_label: statusLabel
          };
        });
        this.loading = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar pedidos' });
        this.loading = false;
      }
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
      error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar dados do pedido' })
    });
  }

  onPrintDesenho(pedido: IPedido) {
    this.pedidoService.buscarPorId(pedido.id).subscribe({
      next: (res) => this.impressaoDesenhoService.imprimir(res.data),
      error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar dados do pedido' })
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
