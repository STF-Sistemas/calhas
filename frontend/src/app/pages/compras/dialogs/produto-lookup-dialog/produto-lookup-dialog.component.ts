import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { ProdutoService } from '#core/services/produto.service';
import { IProduto } from '#shared/interfaces';

@Component({
  selector: 'app-produto-lookup-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
  ],
  templateUrl: './produto-lookup-dialog.component.html',
  styleUrls: ['./produto-lookup-dialog.component.scss'],
})
export class ProdutoLookupDialogComponent {
  @Output() selecionado = new EventEmitter<{ produto: IProduto; itemIndex: number }>();
  @Output() cancelado = new EventEmitter<void>();

  visible = false;
  modo: 'opcoes' | 'relacionar' = 'opcoes';
  itemIndex = 0;
  codigoDigitado = '';

  produtos: IProduto[] = [];
  filtro = '';
  produtosFiltrados: IProduto[] = [];

  constructor(
    private produtoService: ProdutoService,
    private messageService: MessageService
  ) {}

  abrir(itemIndex: number, codigoDigitado: string) {
    this.itemIndex = itemIndex;
    this.codigoDigitado = codigoDigitado;
    this.modo = 'opcoes';
    this.filtro = '';
    this.visible = true;
  }

  abrirListagem(itemIndex: number) {
    this.itemIndex = itemIndex;
    this.codigoDigitado = '';
    this.filtro = '';
    this.visible = true;
    this.relacionar();
  }

  relacionar() {
    this.modo = 'relacionar';
    this.produtoService.listar().subscribe({
      next: (res) => {
        this.produtos = res.data.filter((p: any) => p.status === 1);
        this.produtosFiltrados = this.produtos;
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar produtos' }),
    });
  }

  filtrar() {
    const termo = this.filtro.toLowerCase();
    this.produtosFiltrados = this.produtos.filter(
      (p) => p.descricao.toLowerCase().includes(termo) || String(p.id).includes(termo)
    );
  }

  selecionar(produto: IProduto) {
    this.visible = false;
    this.selecionado.emit({ produto, itemIndex: this.itemIndex });
  }

  cancelar() {
    this.visible = false;
    this.cancelado.emit();
  }

  trackById(_: number, item: IProduto) {
    return item.id;
  }
}
