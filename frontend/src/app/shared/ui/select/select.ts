import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  ElementRef,
  forwardRef,
  inject,
  Injector,
  input,
  OnDestroy,
  output,
  signal,
  TemplateRef,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { normalizarBusca } from '#shared-frontend/busca/normalizar-busca';
import { Flutuante } from '../flutuante';
import { IMudancaValor } from '../tipos';

let sequencia = 0;

@Component({
  selector: 'ui-select',
  imports: [NgTemplateOutlet],
  templateUrl: './select.html',
  styleUrl: './select.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Select), multi: true }],
  host: { class: 'ui-select-host', '[class.ui-select-host--desabilitado]': 'desabilitado()' },
})
export class Select implements ControlValueAccessor, OnDestroy {
  readonly options = input<readonly any[] | null | undefined>([]);
  readonly optionLabel = input<string | undefined>();
  readonly optionValue = input<string | undefined>();
  readonly placeholder = input<string | undefined>();
  readonly showClear = input(false, { transform: booleanAttribute });
  readonly filter = input(false, { transform: booleanAttribute });
  readonly filterBy = input<string | undefined>();
  readonly inputId = input<string | undefined>();
  readonly styleClass = input<string | undefined>('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly onChange = output<IMudancaValor>();

  protected readonly itemTemplate = contentChild<TemplateRef<unknown>>('item');
  protected readonly selecionadoTemplate = contentChild<TemplateRef<unknown>>('selecionado');
  private readonly gatilho = viewChild.required<ElementRef<HTMLButtonElement>>('gatilho');
  private readonly painel = viewChild.required<ElementRef<HTMLElement>>('painel');
  private readonly campoFiltro = viewChild<ElementRef<HTMLInputElement>>('campoFiltro');

  protected readonly idLista = `ui-select-lista-${++sequencia}`;
  protected readonly valor = signal<any>(null);
  protected readonly aberto = signal(false);
  protected readonly termo = signal('');
  protected readonly indiceAtivo = signal(-1);
  private readonly desabilitadoForm = signal(false);
  protected readonly desabilitado = computed(() => this.disabled() || this.desabilitadoForm());

  protected readonly filtradas = computed(() => {
    const lista = this.options() ?? [];
    const termo = normalizarBusca(this.termo());
    if (!this.filter() || !termo) return lista;
    const campos = (this.filterBy() || this.optionLabel() || '').split(',').map((c) => c.trim()).filter(Boolean);
    return lista.filter((op) => {
      const textos = campos.length ? campos.map((c) => this.ler(op, c)) : [op];
      return textos.some((t) => normalizarBusca(String(t ?? '')).includes(termo));
    });
  });

  protected readonly selecionada = computed(() => {
    const valor = this.valor();
    if (valor === null || valor === undefined) return undefined;
    return (this.options() ?? []).find((op) => this.valorDe(op) === valor);
  });

  private readonly injector = inject(Injector);
  private flutuante?: Flutuante;
  private aoMudar: (valor: any) => void = () => undefined;
  private aoTocar: () => void = () => undefined;

  writeValue(valor: any): void {
    this.valor.set(valor ?? null);
  }

  registerOnChange(fn: (valor: any) => void): void {
    this.aoMudar = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.aoTocar = fn;
  }

  setDisabledState(desabilitado: boolean): void {
    this.desabilitadoForm.set(desabilitado);
  }

  ngOnDestroy(): void {
    this.flutuante?.fechar();
  }

  protected rotulo(op: any): string {
    if (op === null || op === undefined) return '';
    const campo = this.optionLabel();
    return String(campo ? (this.ler(op, campo) ?? '') : op);
  }

  protected valorDe(op: any): any {
    const campo = this.optionValue();
    return campo ? this.ler(op, campo) : op;
  }

  protected alternar(): void {
    if (this.aberto()) this.fechar();
    else this.abrir();
  }

  protected abrir(): void {
    if (this.desabilitado() || this.aberto()) return;
    this.flutuante ??= new Flutuante(this.painel().nativeElement, {
      larguraDaAncora: true,
      aoFechar: () => this.aoFecharPainel(),
    });
    this.termo.set('');
    const atual = this.filtradas().findIndex((op) => this.valorDe(op) === this.valor());
    this.indiceAtivo.set(atual);
    this.aberto.set(true);
    this.flutuante.abrir(this.gatilho().nativeElement);
    afterNextRender(
      () => {
        this.flutuante?.posicionar();
        if (this.filter()) this.campoFiltro()?.nativeElement.focus();
        this.rolarParaAtivo();
      },
      { injector: this.injector },
    );
  }

  protected fechar(focar = true): void {
    this.flutuante?.fechar();
    if (focar) this.gatilho().nativeElement.focus();
  }

  protected escolher(op: any, evento?: Event): void {
    this.definir(this.valorDe(op), evento);
    this.fechar();
  }

  protected limpar(evento: Event): void {
    evento.stopPropagation();
    this.definir(null, evento);
  }

  protected aoDigitarFiltro(evento: Event): void {
    this.termo.set((evento.target as HTMLInputElement).value);
    this.indiceAtivo.set(this.filtradas().length ? 0 : -1);
    afterNextRender(() => this.flutuante?.posicionar(), { injector: this.injector });
  }

  protected teclado(evento: KeyboardEvent): void {
    const lista = this.filtradas();
    switch (evento.key) {
      case 'ArrowDown':
        evento.preventDefault();
        if (!this.aberto()) return this.abrir();
        this.indiceAtivo.set(Math.min(this.indiceAtivo() + 1, lista.length - 1));
        this.rolarParaAtivo();
        break;
      case 'ArrowUp':
        evento.preventDefault();
        if (!this.aberto()) return this.abrir();
        this.indiceAtivo.set(Math.max(this.indiceAtivo() - 1, 0));
        this.rolarParaAtivo();
        break;
      case 'Enter':
      case ' ':
        if (evento.key === ' ' && evento.target === this.campoFiltro()?.nativeElement) return;
        evento.preventDefault();
        if (!this.aberto()) return this.abrir();
        if (lista[this.indiceAtivo()] !== undefined) this.escolher(lista[this.indiceAtivo()], evento);
        break;
      case 'Tab':
        if (this.aberto()) this.fechar(false);
        break;
    }
  }

  private definir(valor: any, evento?: Event): void {
    this.valor.set(valor);
    this.aoMudar(valor);
    this.aoTocar();
    this.onChange.emit({ value: valor, originalEvent: evento });
  }

  private aoFecharPainel(): void {
    this.aberto.set(false);
    this.aoTocar();
  }

  private rolarParaAtivo(): void {
    const item = this.painel().nativeElement.querySelector(`[data-indice="${this.indiceAtivo()}"]`);
    item?.scrollIntoView({ block: 'nearest' });
  }

  private ler(obj: any, caminho: string): any {
    return caminho.split('.').reduce((atual, chave) => (atual == null ? atual : atual[chave]), obj);
  }
}
