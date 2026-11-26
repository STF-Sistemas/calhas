import { Component, EventEmitter, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ProdutoService } from '#core/services/produto.service';
import { IProduto } from '#shared/interfaces';
import { ToastService } from '#shared-frontend/services/toast.service';
import { normalizarBusca } from '#shared-frontend/busca/normalizar-busca';

@Component({
  selector: 'app-produto-lookup-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TableModule, DialogModule, InputTextModule],
  templateUrl: './produto-lookup-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./produto-lookup-dialog.component.css'],
})
export class ProdutoLookupDialog {
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
    private readonly toast: ToastService,
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
      error: () =>
        this.toast.error('Falha ao carregar produtos'),
    });
  }

  filtrar() {
    const termo = normalizarBusca(this.filtro);
    this.produtosFiltrados = this.produtos.filter(
      (p) => normalizarBusca(p.descricao).includes(termo) || String(p.id).includes(termo),
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
