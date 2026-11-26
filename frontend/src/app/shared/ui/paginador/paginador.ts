import { ChangeDetectionStrategy, Component, computed, input, output, ViewEncapsulation } from '@angular/core';
import { IPaginaEvento } from '../tipos';

@Component({
  selector: 'ui-paginator',
  templateUrl: './paginador.html',
  styleUrl: './paginador.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': "'ui-paginador ' + (styleClass() ?? '')" },
})
export class Paginador {
  readonly first = input(0);
  readonly rows = input(10);
  readonly totalRecords = input(0);
  readonly rowsPerPageOptions = input<number[]>([]);
  readonly currentPageReportTemplate = input<string | undefined>();
  readonly styleClass = input<string | undefined>('');
  readonly onPageChange = output<IPaginaEvento>();

  protected readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.totalRecords() / Math.max(1, this.rows()))));
  protected readonly pagina = computed(() => Math.min(Math.floor(this.first() / Math.max(1, this.rows())), this.totalPaginas() - 1));

  protected readonly paginasVisiveis = computed(() => {
    const total = this.totalPaginas();
    const atual = this.pagina();
    const quantidade = Math.min(5, total);
    const inicio = Math.max(0, Math.min(atual - 2, total - quantidade));
    return Array.from({ length: quantidade }, (_, i) => inicio + i);
  });

  protected readonly relatorio = computed(() => {
    const modelo = this.currentPageReportTemplate();
    if (!modelo) return '';
    const total = this.totalRecords();
    const primeiro = total ? this.first() + 1 : 0;
    const ultimo = Math.min(this.first() + this.rows(), total);
    return modelo
      .replace('{first}', String(primeiro))
      .replace('{last}', String(ultimo))
      .replace('{totalRecords}', String(total))
      .replace('{currentPage}', String(this.pagina() + 1))
      .replace('{totalPages}', String(this.totalPaginas()));
  });

  protected ir(pagina: number): void {
    const destino = Math.max(0, Math.min(pagina, this.totalPaginas() - 1));
    this.onPageChange.emit({ first: destino * this.rows(), rows: this.rows(), page: destino, pageCount: this.totalPaginas() });
  }

  protected mudarLinhas(evento: Event): void {
    const linhas = Number((evento.target as HTMLSelectElement).value);
    const paginas = Math.max(1, Math.ceil(this.totalRecords() / linhas));
    this.onPageChange.emit({ first: 0, rows: linhas, page: 0, pageCount: paginas });
  }
}
