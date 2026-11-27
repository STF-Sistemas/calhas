import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ViewChild, inject } from '@angular/core';
import { TelaService } from '#core/services/tela.service';
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
import { Botao, Dica, Tag, Tabela, ColunaOrdenavel, IconeOrdem, MenuFlutuante, IMenuItem, Spinner } from '#ui';

const TAMANHO_PAGINA_CELULAR = 20;
const CAMPOS_COM_ROTULO = new Set(['id', 'numero_nfe']);
const TIPOS_LADO = new Set(['currency', 'status', 'tag', 'drawing']);
const MOEDA = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const DECIMAL = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 });

function normalizar(texto: unknown): string {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function aplicarMascara(digitos: string, mascara: string): string {
  let i = 0;
  let saida = '';
  for (const c of mascara) {
    if (i >= digitos.length) break;
    saida += c === '0' ? digitos[i++] : c;
  }
  return saida;
}

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
    Spinner,
  ],
  providers: [provideNgxMask()],
  templateUrl: './data-table.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./data-table.component.css'],
})
export class DataTable {
  constructor(public themeService: ThemeService) {}

  readonly tela = inject(TelaService);
  termoCelular = '';
  limiteCelular = TAMANHO_PAGINA_CELULAR;

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
  @Input() campoTituloCelular = '';
  @Input() campoValorCelular = '';

  @Output() add = new EventEmitter<void>();
  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();
  @Output() toggleStatus = new EventEmitter<any>();
  @Output() print = new EventEmitter<any>();
  @Output() printDesenho = new EventEmitter<any>();
  @Output() extraAction = new EventEmitter<any>();
  @Output() rowActionClick = new EventEmitter<{ key: string; row: any }>();

  get filtradosCelular(): any[] {
    const termo = normalizar(this.termoCelular.trim());
    if (!termo) return this.data ?? [];
    const digitos = termo.replace(/\D/g, '');
    const campos = this.globalFilterFields.length ? this.globalFilterFields : this.columns.map((c) => c.field);
    return (this.data ?? []).filter((row) =>
      campos.some((campo) => {
        const texto = normalizar(campo.split('.').reduce((o: any, k: string) => o?.[k], row));
        return texto.includes(termo) || (digitos.length >= 3 && texto.replace(/\D/g, '').includes(digitos));
      }),
    );
  }

  get visiveisCelular(): any[] {
    return this.filtradosCelular.slice(0, this.limiteCelular);
  }

  pesquisarCelular(termo: string): void {
    this.termoCelular = termo;
    this.limiteCelular = TAMANHO_PAGINA_CELULAR;
  }

  carregarMaisCelular(): void {
    this.limiteCelular += TAMANHO_PAGINA_CELULAR;
  }

  colunaValor(): any {
    return (
      this.columns.find((c) => c.field === this.campoValorCelular) ?? this.columns.find((c) => c.type === 'currency')
    );
  }

  colunaStatus(): any {
    return this.columns.find((c) => c.type === 'status');
  }

  colunaEtiqueta(): any {
    return this.columns.find((c) => c.type === 'tag') ?? this.colunaStatus();
  }

  colunaDesenho(): any {
    return this.columns.find((c) => c.type === 'drawing');
  }

  private colunasTexto(): any[] {
    const textos = this.columns.filter((c) => !TIPOS_LADO.has(c.type));
    const titulo = textos.find((c) => c.field === this.campoTituloCelular);
    return titulo ? [titulo, ...textos.filter((c) => c !== titulo)] : textos;
  }

  tituloCartao(row: any): string {
    const coluna = this.colunasTexto()[0];
    return (coluna && this.formatar(coluna, row)) || '—';
  }

  detalheCartao(row: any): string {
    return this.colunasTexto()
      .slice(1)
      .map((c) => {
        const texto = this.formatar(c, row);
        return texto && CAMPOS_COM_ROTULO.has(c.field) ? `${c.header} ${texto}` : texto;
      })
      .filter(Boolean)
      .slice(0, 3)
      .join(' · ');
  }

  iniciais(texto: string): string {
    const partes = texto.replace(/[^\p{L}\p{N} ]/gu, ' ').trim().split(/\s+/).filter(Boolean);
    if (!partes.length) return '#';
    return (partes.length > 1 ? partes[0][0] + partes[1][0] : partes[0].slice(0, 2)).toUpperCase();
  }

  formatar(col: any, row: any): string {
    const valor = row?.[col.field];
    if (valor === null || valor === undefined || valor === '') return '';
    switch (col.type) {
      case 'currency':
        return MOEDA.format(Number(valor) || 0);
      case 'decimal':
        return DECIMAL.format(Number(valor) || 0);
      case 'date': {
        const data = new Date(valor);
        if (Number.isNaN(data.getTime())) return String(valor);
        return data.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
      }
      case 'phone': {
        const d = String(valor).replace(/\D/g, '');
        return aplicarMascara(d, d.length > 10 ? '(00) 00000-0000' : '(00) 0000-0000');
      }
      case 'cpf_cnpj': {
        const d = String(valor).replace(/\D/g, '');
        return aplicarMascara(d, d.length > 11 ? '00.000.000/0000-00' : '000.000.000-00');
      }
      default:
        return typeof valor === 'object' ? '' : String(valor);
    }
  }

  tocarCartao(evento: Event, row: any): void {
    if (this.showEditButton) this.edit.emit(row);
    else if (this.temAcoes()) this.abrirAcoes(evento, row);
  }

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
