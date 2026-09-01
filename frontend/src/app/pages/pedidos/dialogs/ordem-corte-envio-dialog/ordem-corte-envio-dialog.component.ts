import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { DialogWrapperComponent } from '#shared-frontend/components/dialog-wrapper/dialog-wrapper.component';
import { PedidoService } from '#core/services/pedido.service';
import { FornecedorService } from '#core/services/fornecedor.service';
import { PedidoImpressaoDesenhoService } from '#core/services/pedido-impressao-desenho.service';
import { IPedido, IPedidoItem, IFornecedor } from '#shared/interfaces';
import { ETipoItemPedido } from '#shared/enums';
import { formatPhone } from '#shared/functions/format.functions';

interface IItemSelecionavel {
  item: IPedidoItem;
  descricao: string;
  selecionado: boolean;
}

@Component({
  selector: 'app-ordem-corte-envio-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, SelectModule, CheckboxModule, DialogWrapperComponent],
  templateUrl: './ordem-corte-envio-dialog.component.html',
  styleUrls: ['./ordem-corte-envio-dialog.component.scss'],
})
export class OrdemCorteEnvioDialogComponent {
  visible = false;
  passo: 'opcoes' | 'fornecedor' | 'itens' = 'opcoes';
  pedido: IPedido | null = null;

  fornecedores: IFornecedor[] = [];
  fornecedorSelecionado: IFornecedor | null = null;
  carregandoFornecedores = false;
  enviando = false;

  itensSelecionaveis: IItemSelecionavel[] = [];

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
    this.itensSelecionaveis = [];
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
    if (this.passo === 'itens') {
      this.passo = 'fornecedor';
      return;
    }
    this.passo = 'opcoes';
  }

  nomeExibicaoFornecedor(fornecedor: IFornecedor): string {
    return fornecedor.nome_vendedor
      ? `${fornecedor.razao_social} - ${fornecedor.nome_vendedor}`
      : fornecedor.razao_social;
  }

  foneVendedorFormatado(fornecedor: IFornecedor): string {
    return fornecedor.fone_vendedor ? formatPhone(fornecedor.fone_vendedor) : '';
  }

  onAvancarItens(): void {
    if (!this.pedido || !this.fornecedorSelecionado) return;

    this.itensSelecionaveis = (this.pedido.itens ?? [])
      .filter((item) => item.tipo === ETipoItemPedido.Corte || item.tipo === ETipoItemPedido.Produto)
      // Produtos primeiro, depois cortes (Produto=10 < Corte=11)
      .sort((a, b) => a.tipo - b.tipo)
      .map((item) => ({
        item,
        descricao: item.produto?.descricao || item.corte?.descricao || item.desenho?.descricao || `Item Nº ${item.id}`,
        selecionado: true,
      }));

    this.passo = 'itens';
  }

  todosSelecionados(): boolean {
    return this.itensSelecionaveis.length > 0 && this.itensSelecionaveis.every((i) => i.selecionado);
  }

  toggleTodos(marcado: boolean): void {
    this.itensSelecionaveis.forEach((i) => (i.selecionado = marcado));
  }

  trackByItemId(_: number, item: IItemSelecionavel): number {
    return item.item.id;
  }

  onEnviarWhatsApp(): void {
    if (!this.pedido || !this.fornecedorSelecionado) return;

    const fone = this.fornecedorSelecionado.fone_vendedor?.replace(/\D/g, '');
    if (!fone) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Este fornecedor não possui telefone do vendedor cadastrado.' });
      return;
    }

    const itensIds = this.itensSelecionaveis.filter((i) => i.selecionado).map((i) => i.item.id);
    if (itensIds.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Selecione ao menos um item para enviar.' });
      return;
    }

    this.enviando = true;
    this.pedidoService.gerarLinkOrdemCorte(this.pedido.id, itensIds).subscribe({
      next: (res) => {
        const url = `${window.location.origin}/ordem-corte/${res.data.token}`;
        const destinatario = this.nomeExibicaoFornecedor(this.fornecedorSelecionado!);
        const mensagem = `Olá, ${destinatario}! Segue a ordem de corte referente ao Pedido Nº ${this.pedido!.id}:\n${url}`;
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
