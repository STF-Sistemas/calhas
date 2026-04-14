import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface IRowAction {
  key: string;
  icon: string;
  tooltip: string;
  ariaLabel: string;
  severity: 'success' | 'info' | 'warn' | 'danger' | 'secondary';
  visible?: (row: any) => boolean;
}
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { NgxMaskPipe, provideNgxMask } from 'ngx-mask';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    TagModule,
    NgxMaskPipe
  ],
  providers: [provideNgxMask()],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss']
})
export class DataTableComponent {
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
  @Input() extraButtonIcon = 'pi pi-cog';
  @Input() extraButtonTooltip = '';
  @Input() extraButtonSeverity: 'success' | 'info' | 'warn' | 'danger' | 'secondary' = 'info';
  @Input() rowActions: IRowAction[] = [];

  @Output() add = new EventEmitter<void>();
  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();
  @Output() toggleStatus = new EventEmitter<any>();
  @Output() print = new EventEmitter<any>();
  @Output() printDesenho = new EventEmitter<any>();
  @Output() extraAction = new EventEmitter<any>();
  @Output() rowActionClick = new EventEmitter<{ key: string; row: any }>();

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
    return this.isAtivo(value) ? 'pi pi-toggle-on' : 'pi pi-toggle-off';
  }

  toggleTooltip(value: any): string {
    return this.isAtivo(value) ? 'Inativar' : 'Ativar';
  }

  getDrawingPoints(pontos: { x: number; y: number }[]): string {
    if (!pontos || pontos.length < 2) return '';
    const xs = pontos.map(p => p.x);
    const ys = pontos.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const pad = 4, w = 88, h = 36;
    return pontos.map(p =>
      `${pad + ((p.x - minX) / rangeX) * w},${pad + ((p.y - minY) / rangeY) * h}`
    ).join(' ');
  }
}
