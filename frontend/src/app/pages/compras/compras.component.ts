import { Component, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import {
  DataTable,
  IRowAction,
} from '#shared-frontend/components/data-table/data-table.component';
import { CompraForm } from './compra-form/compra-form.component';
import { CompraService } from '#core/services/compra.service';
import { DanfePrintService } from '#core/services/danfe-print.service';
import { ICompra } from '#shared/interfaces';
import { EStatusCompra } from '#shared/enums';
import { ToastService } from '#shared-frontend/services/toast.service';
import { ConfirmDialogService } from '#shared-frontend/services/confirm-dialog.service';

@Component({
  selector: 'app-compras',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataTable,
    CompraForm,
    DialogModule,
    ButtonModule,
  ],
  templateUrl: './compras.component.html',
  styleUrls: ['./compras.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class Compras implements OnInit {
  @ViewChild('form') form!: CompraForm;

  compras: ICompra[] = [];
  loading = false;
  isSavingStatus = false;

  showCancelDialog = false;
  motivoCancelamento = '';
  compraCancelando: ICompra | null = null;

  cols = [
    { field: 'numero_nfe', header: 'NF-e' },
    { field: 'fornecedor_nome', header: 'Fornecedor' },
    { field: 'data_entrada', header: 'Entrada', type: 'date' },
    { field: 'valor_total', header: 'Valor Total', type: 'currency' },
    { field: 'status_label', header: 'Status' },
  ];

  rowActions: IRowAction[] = [
    {
      key: 'danfe',
      icon: 'pi pi-file-pdf',
      tooltip: 'Imprimir DANFE',
      ariaLabel: 'Imprimir DANFE da nota fiscal',
      severity: 'info',
      visible: (row: ICompra) => row.status !== EStatusCompra.Cancelada,
    },
    {
      key: 'confirmar',
      icon: 'pi pi-check-circle',
      tooltip: 'Confirmar compra',
      ariaLabel: 'Confirmar compra e atualizar estoque',
      severity: 'success',
      visible: (row: ICompra) => row.status === EStatusCompra.Rascunho,
    },
    {
      key: 'cancelar',
      icon: 'pi pi-ban',
      tooltip: 'Cancelar compra',
      ariaLabel: 'Cancelar compra confirmada',
      severity: 'danger',
      visible: (row: ICompra) => row.status === EStatusCompra.Confirmada,
    },
  ];

  constructor(
    private compraService: CompraService,
    private readonly toast: ToastService,
    private readonly confirmDialog: ConfirmDialogService,
    private titleService: Title,
    private danfePrintService: DanfePrintService,
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle('Compras — Calhas');
    this.carregar();
  }

  carregar() {
    this.loading = true;
    this.compraService.listar().subscribe({
      next: (res) => {
        this.compras = res.data.map((c) => ({
          ...c,
          fornecedor_nome: c.fornecedor?.razao_social ?? '',
          status_label: this.getStatusLabel(c.status),
        }));
        this.loading = false;
      },
      error: () => {
        this.toast.error('Falha ao carregar compras');
        this.loading = false;
      },
    });
  }

  private getStatusLabel(status: number): string {
    const labels: Record<number, string> = {
      [EStatusCompra.Rascunho]: 'Rascunho',
      [EStatusCompra.Confirmada]: 'Confirmada',
      [EStatusCompra.Cancelada]: 'Cancelada',
    };
    return labels[status] ?? String(status);
  }

  onAdd() {
    this.form.abrir();
  }

  onEdit(compra: ICompra) {
    this.form.abrir(compra.id);
  }

  onRowAction(event: { key: string; row: ICompra }) {
    if (event.key === 'danfe') {
      this.danfePrintService.imprimir(event.row.id);
    } else if (event.key === 'confirmar') {
      this.onConfirmar(event.row);
    } else if (event.key === 'cancelar') {
      this.abrirDialogCancelamento(event.row);
    }
  }

  private onConfirmar(compra: ICompra) {
    const nfe = compra.numero_nfe ? `NF-e ${compra.numero_nfe}` : `#${compra.id}`;
    this.confirmDialog.confirm({
      title: 'Confirmar Compra',
      message: `Confirmar a compra ${nfe}?\n\nO estoque dos produtos será atualizado.`,
      confirmText: 'Sim, confirmar',
      cancelText: 'Não',
    }).then((ok) => {
      if (!ok) return;
        this.isSavingStatus = true;
        this.compraService.alterarStatus(compra.id, EStatusCompra.Confirmada).subscribe({
          next: () => {
            this.toast.success(`Compra ${nfe} confirmada com sucesso.`, 'Confirmada');
            this.carregar();
            this.isSavingStatus = false;
          },
          error: (err) => {
            this.toast.error(err?.error?.message ?? 'Falha ao confirmar compra.');
            this.isSavingStatus = false;
          },
        });
    });
  }

  private abrirDialogCancelamento(compra: ICompra) {
    this.compraCancelando = compra;
    this.motivoCancelamento = '';
    this.showCancelDialog = true;
  }

  onConfirmarCancelamento() {
    if (!this.motivoCancelamento.trim()) {
      this.toast.warn('Informe o motivo do cancelamento.');
      return;
    }
    const compra = this.compraCancelando!;
    const nfe = compra.numero_nfe ? `NF-e ${compra.numero_nfe}` : `#${compra.id}`;
    this.isSavingStatus = true;
    this.compraService
      .alterarStatus(compra.id, EStatusCompra.Cancelada, this.motivoCancelamento.trim())
      .subscribe({
        next: () => {
          this.toast.info(`Compra ${nfe} cancelada. Estoque revertido.`, 'Cancelada');
          this.showCancelDialog = false;
          this.compraCancelando = null;
          this.carregar();
          this.isSavingStatus = false;
        },
        error: (err) => {
          this.toast.error(err?.error?.message ?? 'Falha ao cancelar compra.');
          this.isSavingStatus = false;
        },
      });
  }

  onDelete(compra: ICompra) {
    const nfe = compra.numero_nfe ? `NF-e ${compra.numero_nfe}` : `#${compra.id}`;
    const avisoEstoque =
      compra.status === EStatusCompra.Confirmada
        ? '\n\nAtenção: o estoque dos produtos será revertido.'
        : '';
    this.confirmDialog.confirm({
      title: 'Confirmar Exclusão',
      message: `Deseja realmente excluir a compra ${nfe}?${avisoEstoque}`,
      confirmText: 'Sim',
      cancelText: 'Não',
      danger: true,
    }).then((ok) => {
      if (!ok) return;
        this.compraService.excluir(compra.id).subscribe({
          next: () => {
            this.toast.success('Compra excluída');
            this.carregar();
          },
          error: (err) =>
            this.toast.error(err?.error?.message ?? 'Falha ao excluir compra'),
        });
    });
  }

  onAtualizarCusto(compra: ICompra) {
    const nfe = compra.numero_nfe ? `NF-e ${compra.numero_nfe}` : `#${compra.id}`;
    this.confirmDialog.confirm({
      title: 'Atualizar Custo dos Produtos',
      message: `Deseja atualizar o custo dos produtos com base na ${nfe}?\n\nO custo será recalculado considerando os impostos dos itens e o rateio de frete, seguro e outros valores da nota.`,
      confirmText: 'Sim, atualizar',
      cancelText: 'Cancelar',
    }).then((ok) => {
      if (!ok) return;
        this.compraService.atualizarCusto(compra.id).subscribe({
          next: () =>
            this.toast.success(`Custo dos produtos da ${nfe} atualizado com sucesso.`, 'Custo Atualizado'),
          error: (err) =>
            this.toast.error(err?.error?.message ?? 'Falha ao atualizar custo.'),
        });
    });
  }
}
