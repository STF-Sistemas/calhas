import {
  Component,
  ElementRef,
  EventEmitter,
  NgZone,
  OnDestroy,
  Output,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { DialogWrapper } from '#shared-frontend/components/dialog-wrapper/dialog-wrapper.component';
import { CurrencyMaskDirective } from '#shared-frontend/directives/currency-mask.directive';
import { EnterFocusNextDirective } from '#shared-frontend/directives/enter-focus-next.directive';
import { IDiagonal, IPonto } from '#shared/interfaces';
import { endireitarTraco, endireitarTransversal } from '#shared/functions/desenho-livre.functions';
import {
  calcularTotalCorte,
  segmentosCobertosCorte,
} from '#shared/functions/desenho-corte.functions';
import { reconhecerNumero } from '#shared/functions/reconhecer-numero.functions';
import { SelectButtonModule } from 'primeng/selectbutton';

export interface IDesenhoLivreResultado {
  index: number;
  pontos: IPonto[];
  diagonais: IDiagonal[];
  medidas: number[];
}

interface ISnapshot {
  pontos: IPonto[];
  diagonais: IDiagonal[];
  medidasBase: number[];
  medidasDiag: [number, number][];
}

@Component({
  selector: 'app-desenho-livre',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TooltipModule,
    SelectButtonModule,
    DialogWrapper,
    CurrencyMaskDirective,
    EnterFocusNextDirective,
  ],
  templateUrl: './desenho-livre.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./desenho-livre.component.css'],
})
export class DesenhoLivre implements OnDestroy {
  @ViewChild('canvas') canvasRef?: ElementRef<HTMLCanvasElement>;
  @Output() confirmed = new EventEmitter<IDesenhoLivreResultado>();

  LARGURA = 800;
  ALTURA = 600;
  retrato = false;
  private readonly RAIO_CONTINUAR = 40;
  private readonly MAX_PONTOS = 200;
  private readonly MAX_DIAGONAIS = 50;

  visible = false;
  itemIndex = 0;
  pontos: IPonto[] = [];
  diagonais: IDiagonal[] = [];
  medidasBase: number[] = [];
  medidasDiag: [number, number][] = [];
  cobertos = new Set<number>();
  foco: string | null = null;

  modo: 'desenhar' | 'escrever' = 'desenhar';
  readonly modoOpcoes = [
    { label: 'Desenhar', value: 'desenhar', icon: 'pi pi-pencil' },
    { label: 'Escrever medida', value: 'escrever', icon: 'pi pi-pen-to-square' },
  ];
  alvoAtual: string | null = null;
  ultimoReconhecido: { rotulo: string; texto: string } | null = null;
  naoEntendi = false;

  private tinta: IPonto[][] = [];
  private timerEscrita?: ReturnType<typeof setTimeout>;
  private readonly PAUSA_ESCRITA = 1100;
  private alvosClicaveis: { chave: string; x: number; y: number; r: number }[] = [];

  private historico: ISnapshot[] = [];
  private traco: IPonto[] = [];
  private desenhando = false;
  private pointerId: number | null = null;
  private ctx?: CanvasRenderingContext2D;
  private resizeObs?: ResizeObserver;

  constructor(private zone: NgZone) {}

  get segmentos(): number[] {
    return Array.from({ length: Math.max(0, this.pontos.length - 1) }, (_, i) => i);
  }

  get total(): number {
    return calcularTotalCorte(this.pontos, this.diagonais, this.medidasCompostas());
  }

  get podeDesfazer(): boolean {
    return this.historico.length > 0;
  }

  get sequenciaAlvos(): string[] {
    const linhas = this.segmentos.filter((i) => !this.cobertos.has(i)).map((i) => `s${i}`);
    const transv = this.diagonais.flatMap((_, i) => [`d${i}-1`, `d${i}-2`]);
    return [...linhas, ...transv];
  }

  rotuloAlvo(chave: string | null): string {
    if (!chave) return '';
    if (chave.startsWith('s')) return `Linha ${Number(chave.slice(1)) + 1}`;
    const [d, ponta] = chave.slice(1).split('-');
    return `T${Number(d) + 1} · P${ponta}`;
  }

  maiorDiag(i: number): number {
    const [a, b] = this.medidasDiag[i] ?? [0, 0];
    return Math.max(Number(a) || 0, Number(b) || 0);
  }

  abrir(
    index: number,
    pontos: IPonto[] | null | undefined,
    diagonais: IDiagonal[] | null | undefined,
    medidas: number[] | null | undefined,
  ) {
    this.itemIndex = index;
    this.retrato = window.matchMedia('(max-width: 640px)').matches;
    this.LARGURA = this.retrato ? 600 : 800;
    this.ALTURA = this.retrato ? 800 : 600;

    const pts = (pontos ?? []).map((p) => ({ x: p.x, y: p.y }));
    const diags =
      pts.length >= 2 ? (diagonais ?? []).map((d) => ({ p1: { ...d.p1 }, p2: { ...d.p2 } })) : [];
    const encaixar = this.criarEncaixe([...pts, ...diags.flatMap((d) => [d.p1, d.p2])]);
    this.pontos = pts.map(encaixar);
    this.diagonais = diags.map((d) => ({ p1: encaixar(d.p1), p2: encaixar(d.p2) }));

    const base = this.segmentos.length;
    this.medidasBase = this.segmentos.map((i) => Number(medidas?.[i]) || 0);
    this.medidasDiag = this.diagonais.map((_, i) => [
      Number(medidas?.[base + i * 2]) || 0,
      Number(medidas?.[base + i * 2 + 1]) || 0,
    ]);
    this.atualizarCobertos();
    this.historico = [];
    this.foco = null;
    this.cancelarEscrita();
    this.ultimoReconhecido = null;
    this.naoEntendi = false;
    this.alvoAtual = this.primeiroAlvoVazio();
    this.modo = this.pontos.length >= 2 && this.alvoAtual ? 'escrever' : 'desenhar';
    this.visible = true;
  }

  onShow() {
    this.prepararCanvas();
  }

  ngOnDestroy() {
    this.resizeObs?.disconnect();
    if (this.timerEscrita) clearTimeout(this.timerEscrita);
  }

  private criarEncaixe(todos: IPonto[]): (p: IPonto) => IPonto {
    const ident = (p: IPonto) => ({ x: p.x, y: p.y });
    if (todos.length < 2) return ident;
    const xs = todos.map((p) => p.x),
      ys = todos.map((p) => p.y);
    const minX = Math.min(...xs),
      maxX = Math.max(...xs);
    const minY = Math.min(...ys),
      maxY = Math.max(...ys);
    if (minX >= 0 && minY >= 0 && maxX <= this.LARGURA && maxY <= this.ALTURA) return ident;
    const margem = 60;
    const w = maxX - minX || 1,
      h = maxY - minY || 1;
    const esc = Math.min(1, (this.LARGURA - margem * 2) / w, (this.ALTURA - margem * 2) / h);
    const ox = (this.LARGURA - w * esc) / 2,
      oy = (this.ALTURA - h * esc) / 2;
    return (p: IPonto) => ({ x: ox + (p.x - minX) * esc, y: oy + (p.y - minY) * esc });
  }

  desfazer() {
    const anterior = this.historico.pop();
    if (!anterior) return;
    this.pontos = anterior.pontos;
    this.diagonais = anterior.diagonais;
    this.medidasBase = anterior.medidasBase;
    this.medidasDiag = anterior.medidasDiag;
    this.atualizarCobertos();
    this.redesenhar();
  }

  limpar() {
    if (!this.pontos.length && !this.diagonais.length) return;
    this.salvarHistorico();
    this.pontos = [];
    this.diagonais = [];
    this.medidasBase = [];
    this.medidasDiag = [];
    this.atualizarCobertos();
    this.redesenhar();
  }

  removerTransversal(i: number) {
    this.salvarHistorico();
    this.diagonais = this.diagonais.filter((_, idx) => idx !== i);
    this.medidasDiag = this.medidasDiag.filter((_, idx) => idx !== i);
    this.foco = null;
    this.atualizarCobertos();
    this.redesenhar();
  }

  onMedidaBaseChange(i: number, valor: number) {
    this.medidasBase[i] = Number(valor) || 0;
    this.redesenhar();
  }

  onMedidaDiagChange(i: number, ponta: 0 | 1, valor: number) {
    this.medidasDiag[i][ponta] = Number(valor) || 0;
    this.redesenhar();
  }

  focar(chave: string | null) {
    this.foco = chave;
    this.redesenhar();
  }

  onModoChange() {
    this.cancelarEscrita();
    this.naoEntendi = false;
    if (
      this.modo === 'escrever' &&
      (!this.alvoAtual || !this.sequenciaAlvos.includes(this.alvoAtual))
    ) {
      this.alvoAtual = this.primeiroAlvoVazio() ?? this.sequenciaAlvos[0] ?? null;
    }
    this.redesenhar();
  }

  selecionarAlvo(chave: string, irParaEscrita = false) {
    this.alvoAtual = chave;
    this.naoEntendi = false;
    if (irParaEscrita && this.modo !== 'escrever') {
      this.modo = 'escrever';
      this.cancelarEscrita();
    }
    this.redesenhar();
  }

  reconhecerAgora() {
    if (this.timerEscrita) clearTimeout(this.timerEscrita);
    this.reconhecerTinta();
  }

  limparTinta() {
    this.cancelarEscrita();
    this.naoEntendi = false;
    this.redesenhar();
  }

  pularAlvo() {
    this.cancelarEscrita();
    this.alvoAtual = this.proximoAlvo(this.alvoAtual, false);
    this.redesenhar();
  }

  get temTinta(): boolean {
    return this.tinta.length > 0;
  }

  private cancelarEscrita() {
    if (this.timerEscrita) clearTimeout(this.timerEscrita);
    this.timerEscrita = undefined;
    this.tinta = [];
  }

  private agendarReconhecimento() {
    if (this.timerEscrita) clearTimeout(this.timerEscrita);
    this.timerEscrita = setTimeout(
      () => this.zone.run(() => this.reconhecerTinta()),
      this.PAUSA_ESCRITA,
    );
  }

  private reconhecerTinta() {
    this.timerEscrita = undefined;
    const tinta = this.tinta;
    this.tinta = [];
    if (!tinta.length) {
      this.redesenhar();
      return;
    }

    const resultado = reconhecerNumero(tinta);
    const chave = this.alvoAtual ?? this.primeiroAlvoVazio();
    if (!resultado || resultado.valor <= 0 || !chave) {
      this.naoEntendi = !!chave;
      this.redesenhar();
      return;
    }

    this.salvarHistorico();
    this.gravarValor(chave, Math.round(resultado.valor * 100) / 100);
    this.ultimoReconhecido = { rotulo: this.rotuloAlvo(chave), texto: resultado.texto };
    this.naoEntendi = false;
    this.alvoAtual = this.proximoAlvo(chave, true);
    this.redesenhar();
  }

  private gravarValor(chave: string, valor: number) {
    if (chave.startsWith('s')) {
      this.medidasBase[Number(chave.slice(1))] = valor;
    } else {
      const [d, ponta] = chave.slice(1).split('-').map(Number);
      if (this.medidasDiag[d]) this.medidasDiag[d][ponta === 1 ? 0 : 1] = valor;
    }
  }

  private proximoAlvo(atual: string | null, soVazias: boolean): string | null {
    const seq = this.sequenciaAlvos;
    const idx = atual ? seq.indexOf(atual) : -1;
    const depois = seq.slice(idx + 1).find((ch) => !soVazias || this.valorDoAlvo(ch) <= 0);
    return depois ?? this.primeiroAlvoVazio();
  }

  private primeiroAlvoVazio(): string | null {
    return this.sequenciaAlvos.find((ch) => this.valorDoAlvo(ch) <= 0) ?? null;
  }

  private valorDoAlvo(chave: string): number {
    if (chave.startsWith('s')) return Number(this.medidasBase[Number(chave.slice(1))]) || 0;
    const [d, ponta] = chave.slice(1).split('-').map(Number);
    return Number(this.medidasDiag[d]?.[ponta === 1 ? 0 : 1]) || 0;
  }

  private reapontarAlvo() {
    this.alvoAtual = this.primeiroAlvoVazio();
  }

  confirmar() {
    this.confirmed.emit({
      index: this.itemIndex,
      pontos: this.pontos.map((p) => ({ x: p.x, y: p.y })),
      diagonais: this.diagonais.map((d) => ({ p1: { ...d.p1 }, p2: { ...d.p2 } })),
      medidas: this.medidasCompostas(),
    });
    this.visible = false;
  }

  private medidasCompostas(): number[] {
    const base = this.segmentos.map((i) =>
      this.cobertos.has(i) ? 0 : Number(this.medidasBase[i]) || 0,
    );
    const diag = this.medidasDiag.flatMap(([a, b]) => [Number(a) || 0, Number(b) || 0]);
    return [...base, ...diag];
  }

  private atualizarCobertos() {
    this.cobertos =
      this.pontos.length >= 2 && this.diagonais.length
        ? segmentosCobertosCorte(this.pontos, this.diagonais)
        : new Set<number>();
    if (this.visible) this.reapontarAlvo();
  }

  private prepararCanvas() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    this.ctx = canvas.getContext('2d') ?? undefined;
    this.ajustarResolucao();

    this.resizeObs?.disconnect();
    this.resizeObs = new ResizeObserver(() => this.ajustarResolucao());
    this.resizeObs.observe(canvas);

    this.zone.runOutsideAngular(() => {
      canvas.onpointerdown = (e) => this.onPointerDown(e);
      canvas.onpointermove = (e) => this.onPointerMove(e);
      canvas.onpointerup = (e) => this.onPointerUp(e);
      canvas.onpointercancel = (e) => this.onPointerUp(e);
    });
  }

  private ajustarResolucao() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    this.redesenhar();
  }

  private paraLogico(e: PointerEvent): IPonto {
    const rect = this.canvasRef!.nativeElement.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * this.LARGURA,
      y: ((e.clientY - rect.top) / rect.height) * this.ALTURA,
    };
  }

  private onPointerDown(e: PointerEvent) {
    if (this.desenhando) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    if (this.timerEscrita) clearTimeout(this.timerEscrita);
    this.desenhando = true;
    this.pointerId = e.pointerId;
    this.canvasRef?.nativeElement.setPointerCapture(e.pointerId);
    this.traco = [this.paraLogico(e)];
    this.redesenhar();
  }

  private onPointerMove(e: PointerEvent) {
    if (!this.desenhando || e.pointerId !== this.pointerId) return;
    e.preventDefault();
    const eventos = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [];
    for (const ev of eventos.length ? eventos : [e]) this.traco.push(this.paraLogico(ev));
    this.redesenhar();
  }

  private onPointerUp(e: PointerEvent) {
    if (!this.desenhando || e.pointerId !== this.pointerId) return;
    this.desenhando = false;
    this.pointerId = null;
    const traco = this.traco;
    this.traco = [];
    this.zone.run(() =>
      this.modo === 'escrever' ? this.finalizarEscrita(traco) : this.finalizarTraco(traco),
    );
  }

  private finalizarEscrita(traco: IPonto[]) {
    const xs = traco.map((p) => p.x),
      ys = traco.map((p) => p.y);
    const tamanho = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
    if (!this.tinta.length && tamanho < 12) {
      const p = traco[0];
      const alvo = this.alvosClicaveis.find((a) => Math.hypot(a.x - p.x, a.y - p.y) <= a.r + 8);
      if (alvo) {
        this.selecionarAlvo(alvo.chave);
        return;
      }
    }
    this.tinta.push(
      traco.length === 1 ? [traco[0], { x: traco[0].x + 1, y: traco[0].y + 1 }] : traco,
    );
    this.naoEntendi = false;
    this.redesenhar();
    this.agendarReconhecimento();
  }

  private finalizarTraco(traco: IPonto[]) {
    if (traco.length < 2) {
      this.redesenhar();
      return;
    }

    const inicio = traco[0];
    const perto = (p?: IPonto) =>
      !!p && Math.hypot(inicio.x - p.x, inicio.y - p.y) <= this.RAIO_CONTINUAR;
    const ultimo = this.pontos[this.pontos.length - 1];
    const primeiro = this.pontos[0];

    if (this.pontos.length < 2) {
      const reto = endireitarTraco(traco);
      if (reto.length < 2) {
        this.redesenhar();
        return;
      }
      this.salvarHistorico();
      this.pontos = reto.slice(0, this.MAX_PONTOS);
      this.medidasBase = this.segmentos.map(() => 0);
      this.diagonais = [];
      this.medidasDiag = [];
      this.atualizarCobertos();
      this.redesenhar();
      return;
    }

    if (perto(ultimo) || perto(primeiro)) {
      const reto = endireitarTraco(traco);
      if (reto.length < 2) {
        this.redesenhar();
        return;
      }
      const noFim = perto(ultimo);
      const alvo = noFim ? ultimo : primeiro;
      const dx = alvo.x - reto[0].x,
        dy = alvo.y - reto[0].y;
      const extra = reto.slice(1).map((p) => ({ x: p.x + dx, y: p.y + dy }));
      this.salvarHistorico();
      if (noFim) {
        this.pontos = [...this.pontos, ...extra].slice(0, this.MAX_PONTOS);
      } else {
        this.pontos = [...extra.reverse(), ...this.pontos].slice(0, this.MAX_PONTOS);
        this.medidasBase = [...new Array<number>(extra.length).fill(0), ...this.medidasBase];
      }
      this.medidasBase = this.segmentos.map((i) => Number(this.medidasBase[i]) || 0);
      this.atualizarCobertos();
      this.redesenhar();
      return;
    }

    if (this.diagonais.length >= this.MAX_DIAGONAIS) {
      this.redesenhar();
      return;
    }
    const transversal = endireitarTransversal(traco, this.pontos);
    if (!transversal) {
      this.redesenhar();
      return;
    }
    this.salvarHistorico();
    this.diagonais = [...this.diagonais, transversal];
    this.medidasDiag = [...this.medidasDiag, [0, 0]];
    this.atualizarCobertos();
    this.redesenhar();
  }

  private salvarHistorico() {
    this.historico.push({
      pontos: this.pontos.map((p) => ({ ...p })),
      diagonais: this.diagonais.map((d) => ({ p1: { ...d.p1 }, p2: { ...d.p2 } })),
      medidasBase: [...this.medidasBase],
      medidasDiag: this.medidasDiag.map(([a, b]) => [a, b] as [number, number]),
    });
    if (this.historico.length > 30) this.historico.shift();
  }

  private cor(nome: string, fallback: string): string {
    const v = getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
    return v || fallback;
  }

  redesenhar() {
    const canvas = this.canvasRef?.nativeElement;
    const ctx = this.ctx;
    if (!canvas || !ctx) return;

    ctx.setTransform(canvas.width / this.LARGURA, 0, 0, canvas.height / this.ALTURA, 0, 0);

    const fundo = this.cor('--surface-0', '#ffffff');
    const grade = this.cor('--surface-border', '#e5e7eb');
    const texto = this.cor('--text-color', '#1f2937');
    const primaria = this.cor('--p-primary-color', this.cor('--p-primary', '#3b82f6'));
    const verde = this.cor('--p-green-500', '#22c55e');
    const ambar = this.cor('--p-amber-500', '#f59e0b');
    const transv = this.cor('--p-purple-500', '#a855f7');
    const neutro = this.cor('--text-color-secondary', '#6b7280');

    const destaque = this.foco ?? (this.modo === 'escrever' ? this.alvoAtual : null);
    this.alvosClicaveis = [];

    ctx.fillStyle = fundo;
    ctx.fillRect(0, 0, this.LARGURA, this.ALTURA);

    ctx.strokeStyle = grade;
    ctx.lineWidth = 1;
    for (let x = 0; x <= this.LARGURA; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.ALTURA);
      ctx.stroke();
    }
    for (let y = 0; y <= this.ALTURA; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.LARGURA, y);
      ctx.stroke();
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (!this.pontos.length && !this.traco.length) {
      ctx.fillStyle = neutro;
      ctx.font = '22px sans-serif';
      ctx.fillText('Desenhe aqui com o dedo ou o mouse', this.LARGURA / 2, this.ALTURA / 2);
    }

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (let i = 0; i < this.pontos.length - 1; i++) {
      const a = this.pontos[i],
        b = this.pontos[i + 1];
      const coberta = this.cobertos.has(i);
      const focado = destaque === `s${i}`;
      const temMedida = !coberta && (Number(this.medidasBase[i]) || 0) > 0;
      ctx.strokeStyle = focado ? ambar : coberta ? neutro : temMedida ? verde : texto;
      ctx.lineWidth = focado ? 7 : 5;
      ctx.setLineDash(coberta ? [10, 8] : []);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    this.diagonais.forEach((d, i) => {
      const focoDiag = destaque?.startsWith(`d${i}-`);
      ctx.strokeStyle = focoDiag ? ambar : this.maiorDiag(i) > 0 ? verde : transv;
      ctx.lineWidth = focoDiag ? 7 : 5;
      ctx.beginPath();
      ctx.moveTo(d.p1.x, d.p1.y);
      ctx.lineTo(d.p2.x, d.p2.y);
      ctx.stroke();
    });

    ctx.fillStyle = neutro;
    for (const p of this.pontos) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    const fim = this.pontos[this.pontos.length - 1];
    if (fim && !this.desenhando) {
      ctx.strokeStyle = primaria;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.arc(fim.x, fim.y, this.RAIO_CONTINUAR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    for (let i = 0; i < this.pontos.length - 1; i++) {
      if (this.cobertos.has(i)) continue;
      const a = this.pontos[i],
        b = this.pontos[i + 1];
      const medida = Number(this.medidasBase[i]) || 0;
      const cor = destaque === `s${i}` ? ambar : medida > 0 ? verde : primaria;
      this.badgeComMedida(ctx, a, b, String(i + 1), cor, medida, fundo, texto);
      this.alvosClicaveis.push({ chave: `s${i}`, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, r: 15 });
    }

    this.diagonais.forEach((d, i) => {
      const cor = destaque?.startsWith(`d${i}-`) ? ambar : this.maiorDiag(i) > 0 ? verde : transv;
      this.badgeComMedida(ctx, d.p1, d.p2, `T${i + 1}`, cor, 0, fundo, texto);
      this.alvosClicaveis.push({ chave: `d${i}-1`, ...this.posRotuloPonta(d.p1, d.p2), r: 18 });
      this.alvosClicaveis.push({ chave: `d${i}-2`, ...this.posRotuloPonta(d.p2, d.p1), r: 18 });
      this.rotuloPonta(
        ctx,
        d.p1,
        d.p2,
        'P1',
        this.medidasDiag[i]?.[0] ?? 0,
        destaque === `d${i}-1` ? ambar : cor,
        fundo,
      );
      this.rotuloPonta(
        ctx,
        d.p2,
        d.p1,
        'P2',
        this.medidasDiag[i]?.[1] ?? 0,
        destaque === `d${i}-2` ? ambar : cor,
        fundo,
      );
    });

    ctx.strokeStyle = ambar;
    ctx.lineWidth = 6;
    for (const t of this.tinta) {
      ctx.beginPath();
      ctx.moveTo(t[0].x, t[0].y);
      for (let i = 1; i < t.length; i++) ctx.lineTo(t[i].x, t[i].y);
      ctx.stroke();
    }

    if (this.traco.length > 1) {
      ctx.strokeStyle = this.modo === 'escrever' ? ambar : primaria;
      ctx.lineWidth = this.modo === 'escrever' ? 6 : 4;
      ctx.beginPath();
      ctx.moveTo(this.traco[0].x, this.traco[0].y);
      for (let i = 1; i < this.traco.length; i++) ctx.lineTo(this.traco[i].x, this.traco[i].y);
      ctx.stroke();
    }
  }

  private badgeComMedida(
    ctx: CanvasRenderingContext2D,
    a: IPonto,
    b: IPonto,
    rotulo: string,
    cor: string,
    medida: number,
    fundo: string,
    texto: string,
  ) {
    const mx = (a.x + b.x) / 2,
      my = (a.y + b.y) / 2;
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const nx = -(b.y - a.y) / len,
      ny = (b.x - a.x) / len;
    ctx.fillStyle = cor;
    ctx.beginPath();
    ctx.arc(mx, my, rotulo.length > 1 ? 17 : 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = fundo;
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(rotulo, mx, my);
    if (medida > 0) {
      ctx.fillStyle = texto;
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`${medida.toLocaleString('pt-BR')} cm`, mx + nx * 32, my + ny * 32);
    }
  }

  private rotuloPonta(
    ctx: CanvasRenderingContext2D,
    ponta: IPonto,
    outra: IPonto,
    rotulo: string,
    medida: number,
    cor: string,
    fundo: string,
  ) {
    const { x, y } = this.posRotuloPonta(ponta, outra);
    const txt = medida > 0 ? `${rotulo}: ${Number(medida).toLocaleString('pt-BR')}` : rotulo;
    ctx.font = 'bold 13px sans-serif';
    const w = ctx.measureText(txt).width + 10;
    ctx.fillStyle = cor;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - 10, w, 20, 4);
    ctx.fill();
    ctx.fillStyle = fundo;
    ctx.fillText(txt, x, y);
  }

  private posRotuloPonta(ponta: IPonto, outra: IPonto): IPonto {
    const len = Math.hypot(ponta.x - outra.x, ponta.y - outra.y) || 1;
    return {
      x: ponta.x + ((ponta.x - outra.x) / len) * 26,
      y: ponta.y + ((ponta.y - outra.y) / len) * 26,
    };
  }
}
