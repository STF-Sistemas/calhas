import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { DialogWrapperComponent } from '#shared-frontend/components/dialog-wrapper/dialog-wrapper.component';
import { PedidoService } from '#core/services/pedido.service';
import { IPedido } from '#shared/interfaces';
import { EAprovacaoPedido } from '#shared/enums';

@Component({
  selector: 'app-autorizacao-dialog',
  standalone: true,
  imports: [CommonModule, TagModule, DialogWrapperComponent],
  templateUrl: './autorizacao-dialog.component.html',
  styleUrls: ['./autorizacao-dialog.component.scss'],
})
export class AutorizacaoDialogComponent {
  visible = false;
  isLoadingData = false;
  pedido: IPedido | null = null;
  EAprovacaoPedido = EAprovacaoPedido;

  constructor(
    private pedidoService: PedidoService,
    private messageService: MessageService,
  ) {}

  abrir(pedido: IPedido): void {
    this.pedido = pedido;
    this.visible = true;
    this.isLoadingData = true;
    this.pedidoService.buscarPorId(pedido.id).subscribe({
      next: (res) => {
        this.pedido = res.data;
        this.isLoadingData = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar dados da autorização.' });
        this.isLoadingData = false;
      },
    });
  }

  fechar(): void {
    this.visible = false;
  }

  severity(): 'success' | 'danger' | 'secondary' {
    if (this.pedido?.aprovacao_status === EAprovacaoPedido.Autorizado) return 'success';
    if (this.pedido?.aprovacao_status === EAprovacaoPedido.Recusado) return 'danger';
    return 'secondary';
  }

  label(): string {
    if (this.pedido?.aprovacao_status === EAprovacaoPedido.Autorizado) return 'Autorizado';
    if (this.pedido?.aprovacao_status === EAprovacaoPedido.Recusado) return 'Recusado';
    return 'Aguardando aprovação do cliente';
  }
}
