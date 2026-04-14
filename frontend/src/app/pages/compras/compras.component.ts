import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { DataTableComponent, IRowAction } from '#shared-frontend/components/data-table/data-table.component';
import { CompraFormComponent } from './compra-form/compra-form.component';
import { CompraService } from '#core/services/compra.service';
import { DanfePrintService } from '#core/services/danfe-print.service';
import { ICompra } from '#shared/interfaces';
import { EStatusCompra } from '#shared/enums';

@Component({
  selector: 'app-compras',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataTableComponent,
    CompraFormComponent,
    ConfirmDialogModule,
    ToastModule,
    DialogModule,
    ButtonModule,
  ],
  templateUrl: './compras.component.html',
  styleUrls: ['./compras.component.scss'],
  providers: [ConfirmationService],
})
export class ComprasComponent implements OnInit {
  @ViewChild('form') form!: CompraFormComponent;

  compras: ICompra[] = [];
  loading = false;
  isSavingStatus = false;

  // Dialog de cancelamento
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
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private titleService: Title,
    private danfePrintService: DanfePrintService
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
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar compras' });
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
    this.confirmationService.confirm({
      message: `Confirmar a compra <strong>${nfe}</strong>?<br><br>O estoque dos produtos será atualizado.`,
      header: 'Confirmar Compra',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Sim, confirmar',
      rejectLabel: 'Não',
      acceptButtonStyleClass: 'p-button-success',
      accept: () => {
        this.isSavingStatus = true;
        this.compraService.alterarStatus(compra.id, EStatusCompra.Confirmada).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Confirmada', detail: `Compra ${nfe} confirmada com sucesso.` });
            this.carregar();
            this.isSavingStatus = false;
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message ?? 'Falha ao confirmar compra.' });
            this.isSavingStatus = false;
          },
        });
      },
    });
  }

  private abrirDialogCancelamento(compra: ICompra) {
    this.compraCancelando = compra;
    this.motivoCancelamento = '';
    this.showCancelDialog = true;
  }

  onConfirmarCancelamento() {
    if (!this.motivoCancelamento.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Informe o motivo do cancelamento.' });
      return;
    }
    const compra = this.compraCancelando!;
    const nfe = compra.numero_nfe ? `NF-e ${compra.numero_nfe}` : `#${compra.id}`;
    this.isSavingStatus = true;
    this.compraService.alterarStatus(compra.id, EStatusCompra.Cancelada, this.motivoCancelamento.trim()).subscribe({
      next: () => {
        this.messageService.add({ severity: 'info', summary: 'Cancelada', detail: `Compra ${nfe} cancelada. Estoque revertido.` });
        this.showCancelDialog = false;
        this.compraCancelando = null;
        this.carregar();
        this.isSavingStatus = false;
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message ?? 'Falha ao cancelar compra.' });
        this.isSavingStatus = false;
      },
    });
  }

  onDelete(compra: ICompra) {
    const nfe = compra.numero_nfe ? `NF-e ${compra.numero_nfe}` : `#${compra.id}`;
    const avisoEstoque = compra.status === EStatusCompra.Confirmada
      ? '<br><br><strong>Atenção:</strong> o estoque dos produtos será revertido.'
      : '';
    this.confirmationService.confirm({
      message: `Deseja realmente excluir a compra ${nfe}?${avisoEstoque}`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      accept: () => {
        this.compraService.excluir(compra.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Compra excluída' });
            this.carregar();
          },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message ?? 'Falha ao excluir compra' }),
        });
      },
    });
  }

  onAtualizarCusto(compra: ICompra) {
    const nfe = compra.numero_nfe ? `NF-e ${compra.numero_nfe}` : `#${compra.id}`;
    this.confirmationService.confirm({
      message: `Deseja atualizar o custo dos produtos com base na <strong>${nfe}</strong>?<br><br>
                O custo será recalculado considerando os impostos dos itens e o rateio de
                frete, seguro e outros valores da nota.`,
      header: 'Atualizar Custo dos Produtos',
      icon: 'pi pi-sync',
      acceptLabel: 'Sim, atualizar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success',
      accept: () => {
        this.compraService.atualizarCusto(compra.id).subscribe({
          next: () => this.messageService.add({ severity: 'success', summary: 'Custo Atualizado', detail: `Custo dos produtos da ${nfe} atualizado com sucesso.` }),
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message ?? 'Falha ao atualizar custo.' }),
        });
      },
    });
  }
}
