import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { DialogWrapperComponent } from '#shared-frontend/components/dialog-wrapper/dialog-wrapper.component';
import { PedidoService } from '#core/services/pedido.service';
import { FornecedorService } from '#core/services/fornecedor.service';
import { PedidoImpressaoDesenhoService } from '#core/services/pedido-impressao-desenho.service';
import { IPedido, IFornecedor } from '#shared/interfaces';

@Component({
  selector: 'app-ordem-corte-envio-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, SelectModule, DialogWrapperComponent],
  templateUrl: './ordem-corte-envio-dialog.component.html',
  styleUrls: ['./ordem-corte-envio-dialog.component.scss'],
})
export class OrdemCorteEnvioDialogComponent {
  visible = false;
  passo: 'opcoes' | 'fornecedor' = 'opcoes';
  pedido: IPedido | null = null;

  fornecedores: IFornecedor[] = [];
  fornecedorSelecionado: IFornecedor | null = null;
  carregandoFornecedores = false;
  enviando = false;

  constructor(
    private pedidoService: PedidoService,
    private fornecedorService: FornecedorService,
    private impressaoDesenhoService: PedidoImpressaoDesenhoService,
    private messageService: MessageService,
  ) {}

  abrir(pedido: IPedido): void {
    this.pedido = pedido;
    this.passo = 'opcoes';
    this.fornecedorSelecionado = null;
    this.visible = true;
  }

  fechar(): void {
    this.visible = false;
  }

  onImprimir(): void {
    if (!this.pedido) return;
    this.impressaoDesenhoService.imprimir(this.pedido);
    this.fechar();
  }

  onEscolherWhatsApp(): void {
    this.passo = 'fornecedor';
    if (this.fornecedores.length > 0) return;
    this.carregandoFornecedores = true;
    this.fornecedorService.listar({ status: 1, limite: 100 }).subscribe({
      next: (res) => {
        this.fornecedores = res.data;
        this.carregandoFornecedores = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar fornecedores.' });
        this.carregandoFornecedores = false;
      },
    });
  }

  voltar(): void {
    this.passo = 'opcoes';
  }

  onEnviarWhatsApp(): void {
    if (!this.pedido || !this.fornecedorSelecionado) return;

    const fone = this.fornecedorSelecionado.fone?.replace(/\D/g, '');
    if (!fone) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Este fornecedor não possui telefone cadastrado.' });
      return;
    }

    this.enviando = true;
    this.pedidoService.gerarLinkOrdemCorte(this.pedido.id).subscribe({
      next: (res) => {
        const url = `${window.location.origin}/ordem-corte/${res.data.token}`;
        const mensagem = `Olá! Segue a ordem de corte referente ao Pedido Nº ${this.pedido!.id}:\n${url}`;
        window.open(`https://wa.me/55${fone}?text=${encodeURIComponent(mensagem)}`, '_blank', 'noopener,noreferrer');
        this.enviando = false;
        this.fechar();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao gerar link da ordem de corte.' });
        this.enviando = false;
      },
    });
  }

  trackByFornecedorId(_: number, item: IFornecedor): number {
    return item.id;
  }
}
