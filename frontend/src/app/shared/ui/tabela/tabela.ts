import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  PLATFORM_ID,
  signal,
  TemplateRef,
  ViewEncapsulation,
  afterNextRender,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { normalizarBusca } from '#shared-frontend/busca/normalizar-busca';
import { Paginador } from '../paginador/paginador';
import { Spinner } from '../spinner/spinner';
import { IPaginaEvento } from '../tipos';

function ler(obj: any, caminho: string): any {
  return caminho.split('.').reduce((atual, chave) => (atual == null ? atual : atual[chave]), obj);
}

function rotularCelulas(tabela: HTMLTableElement): void {
  const titulos = Array.from(tabela.querySelectorAll<HTMLTableCellElement>(':scope > thead > tr:last-child > th')).map((th) =>
    (th.textContent ?? '').replace(/\*/g, '').replace(/\s+/g, ' ').trim(),
  );
  if (!titulos.length) return;
  for (const linha of Array.from(tabela.querySelectorAll<HTMLTableRowElement>(':scope > tbody > tr, :scope > tfoot > tr'))) {
    let coluna = 0;
    for (const celula of Array.from(linha.cells)) {
      const titulo = titulos[coluna];
      if (titulo && celula.colSpan === 1 && celula.getAttribute('data-label') !== titulo) celula.setAttribute('data-label', titulo);
      coluna += celula.colSpan || 1;
    }
  }
}

function comparar(a: any, b: any): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  return String(a).localeCompare(String(b), 'pt-BR', { numeric: true, sensitivity: 'base' });
}

@Component({
  selector: 'ui-table',
  imports: [NgTemplateOutlet, Paginador, Spinner],
  templateUrl: './tabela.html',
  styleUrl: './tabela.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': "'ui-table ' + (styleClass() ?? '')", '[class.ui-table--hover]': 'rowHover()' },
})
export class Tabela {
  readonly value = input<readonly any[] | null | undefined>([]);
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly noNavegador = isPlatformBrowser(inject(PLATFORM_ID));
  readonly columns = input<any[] | null | undefined>();
  readonly loading = input(false, { transform: booleanAttribute });
  readonly paginator = input(false, { transform: booleanAttribute });
  readonly rows = input(10);
  readonly rowsPerPageOptions = input<number[]>([]);
  readonly scrollable = input(false, { transform: booleanAttribute });
  readonly scrollHeight = input<string | undefined>();
  readonly styleClass = input<string | undefined>('');
  readonly rowHover = input(false, { transform: booleanAttribute });
  readonly dataKey = input<string | undefined>();
  readonly globalFilterFields = input<string[]>([]);
  readonly showCurrentPageReport = input(false, { transform: booleanAttribute });
  readonly currentPageReportTemplate = input('{first} a {last} de {totalRecords}');

  protected readonly captionTpl = contentChild<TemplateRef<unknown>>('caption');
  protected readonly headerTpl = contentChild<TemplateRef<unknown>>('header');
  protected readonly bodyTpl = contentChild<TemplateRef<unknown>>('body');
  protected readonly footerTpl = contentChild<TemplateRef<unknown>>('footer');
  protected readonly vazioTpl = contentChild<TemplateRef<unknown>>('emptymessage');

  readonly campoOrdenacao = signal<string | null>(null);
  readonly ordem = signal<1 | -1>(1);
  private readonly termo = signal('');
  protected readonly primeiro = signal(0);
  protected readonly linhasPorPagina = signal(10);

  protected readonly filtradas = computed(() => {
    const lista = [...(this.value() ?? [])];
    const termo = normalizarBusca(this.termo());
    const campos = this.globalFilterFields();
    const filtrada = termo
      ? lista.filter((linha) => campos.some((c) => normalizarBusca(String(ler(linha, c) ?? '')).includes(termo)))
      : lista;
    const campo = this.campoOrdenacao();
    if (!campo) return filtrada;
    const ordem = this.ordem();
    return filtrada.sort((a, b) => comparar(ler(a, campo), ler(b, campo)) * ordem);
  });

  protected readonly visiveis = computed(() => {
    const lista = this.filtradas();
    if (!this.paginator()) return lista;
    return lista.slice(this.primeiro(), this.primeiro() + this.linhasPorPagina());
  });

  constructor() {
    this.observarRotulos();
    effect(() => this.linhasPorPagina.set(this.rows()));
    effect(() => {
      const total = this.filtradas().length;
      if (this.primeiro() >= total && this.primeiro() > 0) this.primeiro.set(0);
    });
  }

  private observarRotulos(): void {
    if (!this.noNavegador) return;
    afterNextRender(() => {
      const tabela = this.elemento.nativeElement.querySelector<HTMLTableElement>('.ui-table__tabela');
      if (!tabela) return;
      rotularCelulas(tabela);
      const observador = new MutationObserver(() => rotularCelulas(tabela));
      observador.observe(tabela, { childList: true, subtree: true });
      this.destroyRef.onDestroy(() => observador.disconnect());
    });
  }

  filterGlobal(valor: string, _modo?: string): void {
    this.termo.set(valor ?? '');
    this.primeiro.set(0);
  }

  ordenar(campo: string): void {
    if (this.campoOrdenacao() === campo) this.ordem.set(this.ordem() === 1 ? -1 : 1);
    else {
      this.campoOrdenacao.set(campo);
      this.ordem.set(1);
    }
  }

  protected chave(linha: any, indice: number): unknown {
    const campo = this.dataKey();
    return campo && linha ? (ler(linha, campo) ?? indice) : indice;
  }

  protected mudarPagina(evento: IPaginaEvento): void {
    this.primeiro.set(evento.first);
    this.linhasPorPagina.set(evento.rows);
  }
}

@Directive({
  selector: '[uiSortableColumn]',
  host: {
    class: 'ui-table__ordenavel',
    tabindex: '0',
    '[attr.aria-sort]': "ativa() ? (tabela.ordem() === 1 ? 'ascending' : 'descending') : 'none'",
    '(click)': 'tabela.ordenar(uiSortableColumn())',
    '(keydown.enter)': 'tabela.ordenar(uiSortableColumn())',
  },
})
export class ColunaOrdenavel {
  protected readonly tabela = inject(Tabela);
  readonly uiSortableColumn = input.required<string>();
  protected readonly ativa = computed(() => this.tabela.campoOrdenacao() === this.uiSortableColumn());
}
