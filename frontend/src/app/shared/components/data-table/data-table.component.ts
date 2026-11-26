import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { ThemeService } from '#core/services/theme.service';

export interface IRowAction {
  key: string;
  icon: string;
  tooltip: string;
  ariaLabel: string;
  severity: 'success' | 'info' | 'warn' | 'danger' | 'secondary';
  visible?: (row: any) => boolean;
}
import { CommonModule } from '@angular/common';
import { NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { Botao, Dica, Tag, Tabela, ColunaOrdenavel, IconeOrdem, MenuFlutuante, IMenuItem } from '#ui';

const COR_SEVERIDADE: Record<string, string> = {
  success: 'var(--cor-sucesso)',
  info: 'var(--cor-info)',
  warn: 'var(--cor-alerta)',
  danger: 'var(--cor-perigo)',
  secondary: 'var(--text-secondary)',
};

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    CommonModule,
    NgxMaskPipe,
    Botao,
    Dica,
    Tag,
    Tabela,
    ColunaOrdenavel,
    IconeOrdem,
    MenuFlutuante,
  ],
  providers: [provideNgxMask()],
  templateUrl: './data-table.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./data-table.component.css'],
})
export class DataTable {
  constructor(public themeService: ThemeService) {}

  @ViewChild('menuAcoes') menuAcoes?: MenuFlutuante;
  acoesLinha: IMenuItem[] = [];

  get drawingLineColor(): string {
    return this.themeService.isDarkMode() ? '#ef4444' : '#1a1a1a';
  }

  @Input() data: any[] = [];
  @Input() columns: any[] = [];
  @Input() loading = false;
  @Input() globalFilterFields: string[] = [];
  @Input() rows = 10;
  @Input() title = '';
  @Input() showAddButton = true;
  @Input() addButtonLabel = 'Novo';
  @Input() showToggleStatus = false;
  @Input() statusField = 'status';
  @Input() showPrintButton = false;
  @Input() showPrintDesenhoButton = false;
  @Input() showEditButton = true;
  @Input() showDeleteButton = true;
  @Input() showExtraButton = false;
  @Input() extraButtonIcon = 'ic ic-cog';
  @Input() extraButtonTooltip = '';
  @Input() extraButtonSeverity: 'success' | 'info' | 'warn' | 'danger' | 'secondary' = 'info';
  @Input() rowActions: IRowAction[] = [];
  @Input() paginator = true;

  @Output() add = new EventEmitter<void>();
  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();
  @Output() toggleStatus = new EventEmitter<any>();
  @Output() print = new EventEmitter<any>();
  @Output() printDesenho = new EventEmitter<any>();
  @Output() extraAction = new EventEmitter<any>();
  @Output() rowActionClick = new EventEmitter<{ key: string; row: any }>();

  abrirAcoes(evento: Event, row: any): void {
    this.acoesLinha = this.montarAcoes(row);
    this.menuAcoes?.toggle(evento);
  }

  private montarAcoes(row: any): IMenuItem[] {
    const cor = (severidade: string) => ({ color: COR_SEVERIDADE[severidade] ?? 'var(--text-secondary)' });
    const itens: IMenuItem[] = [];
    if (this.showEditButton) {
      itens.push({ label: 'Editar', icon: 'ic ic-pencil', style: cor('secondary'), command: () => this.edit.emit(row) });
    }
    if (this.showExtraButton) {
      itens.push({
        label: this.extraButtonTooltip,
        icon: this.extraButtonIcon,
        style: cor(this.extraButtonSeverity),
        command: () => this.extraAction.emit(row),
      });
    }
    for (const acao of this.rowActions) {
      if (acao.visible && !acao.visible(row)) continue;
      itens.push({
        label: acao.tooltip,
        icon: acao.icon,
        style: cor(acao.severity),
        command: () => this.rowActionClick.emit({ key: acao.key, row }),
      });
    }
    if (this.showPrintButton) {
      itens.push({ label: 'Imprimir pedido', icon: 'ic ic-print', style: cor('info'), command: () => this.print.emit(row) });
    }
    if (this.showPrintDesenhoButton) {
      itens.push({
        label: 'Imprimir ordem de corte',
        icon: 'ic ic-print',
        style: cor('warn'),
        command: () => this.printDesenho.emit(row),
      });
    }
    if (this.showToggleStatus) {
      const valor = row[this.statusField];
      itens.push({
        label: this.toggleTooltip(valor),
        icon: this.toggleIcon(valor),
        style: cor(this.toggleSeverity(valor)),
        command: () => this.toggleStatus.emit(row),
      });
    }
    if (this.showDeleteButton) {
      if (itens.length) itens.push({ separator: true });
      itens.push({ label: 'Excluir', icon: 'ic ic-trash', perigo: true, command: () => this.delete.emit(row) });
    }
    return itens;
  }

  temAcoes(): boolean {
    return (
      this.showEditButton ||
      this.showDeleteButton ||
      this.showExtraButton ||
      this.showToggleStatus ||
      this.showPrintButton ||
      this.showPrintDesenhoButton ||
      this.rowActions.length > 0
    );
  }

  trackById(index: number, item: any): any {
    return item.id || index;
  }

  isAtivo(value: any): boolean {
    return Number(value) === 1;
  }

  toggleSeverity(value: any): 'success' | 'danger' {
    return this.isAtivo(value) ? 'success' : 'danger';
  }

  toggleIcon(value: any): string {
    return this.isAtivo(value) ? 'ic ic-toggle-on' : 'ic ic-toggle-off';
  }

  toggleTooltip(value: any): string {
    return this.isAtivo(value) ? 'Inativar' : 'Ativar';
  }

  getDrawingPoints(pontos: { x: number; y: number }[]): string {
    if (!pontos || pontos.length < 2) return '';
    const xs = pontos.map((p) => p.x);
    const ys = pontos.map((p) => p.y);
    const minX = Math.min(...xs),
      maxX = Math.max(...xs);
    const minY = Math.min(...ys),
      maxY = Math.max(...ys);
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const pad = 4,
      w = 88,
      h = 36;
    return pontos
      .map((p) => `${pad + ((p.x - minX) / rangeX) * w},${pad + ((p.y - minY) / rangeY) * h}`)
      .join(' ');
  }

  getDrawingDiagonalPoints(
    diagonal: { p1: { x: number; y: number }; p2: { x: number; y: number } },
    pontos: { x: number; y: number }[],
  ): string {
    if (!pontos || pontos.length < 2) return '';
    const xs = pontos.map((p) => p.x);
    const ys = pontos.map((p) => p.y);
    const minX = Math.min(...xs),
      maxX = Math.max(...xs);
    const minY = Math.min(...ys),
      maxY = Math.max(...ys);
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const pad = 4,
      w = 88,
      h = 36;
    const n = (p: { x: number; y: number }) =>
      `${pad + ((p.x - minX) / rangeX) * w},${pad + ((p.y - minY) / rangeY) * h}`;
    return `${n(diagonal.p1)} ${n(diagonal.p2)}`;
  }
}
