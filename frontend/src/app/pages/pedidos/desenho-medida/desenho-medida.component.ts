import { Component, EventEmitter, Output, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { CurrencyMaskDirective } from '#shared-frontend/directives/currency-mask.directive';
import { EnterFocusNextDirective } from '#shared-frontend/directives/enter-focus-next.directive';
import { IDiagonal, IDesenho, IPonto } from '#shared/interfaces';
import { ThemeService } from '#core/services/theme.service';

@Component({
  selector: 'app-desenho-medida',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, DialogModule, InputTextModule, CurrencyMaskDirective, EnterFocusNextDirective],
  templateUrl: './desenho-medida.component.html',
  styleUrls: ['./desenho-medida.component.scss']
})
export class DesenhoMedidaComponent implements AfterViewInit {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @Output() confirmed = new EventEmitter<{ index: number; medidas: number[] }>();

  visible = false;
  desenho?: IDesenho;
  medidas: number[] = [];
  itemIndex = 0;

  private ctx?: CanvasRenderingContext2D;

  constructor(private themeService: ThemeService) {}
  readonly CANVAS_W = 800;
  readonly CANVAS_H = 320;

  // ── Getters ───────────────────────────────────────────────────────────────

  get segmentosBase(): number[] {
    const n = this.desenho ? Math.max(0, this.desenho.pontos.length - 1) : 0;
    return Array.from({ length: n }, (_, i) => i);
  }

  get segmentosCobertos(): Set<number> {
    const set = new Set<number>();
    (this.desenho?.diagonais ?? []).forEach((_, i) => {
      const idx = this.segmentoCoberto(i);
      if (idx >= 0) set.add(idx);
    });
    return set;
  }

  /** Cada diagonal gera 2 entradas: p1 e p2. */
  get segmentosDiagonaisInfo(): { diagIdx: number; p1Idx: number; p2Idx: number; coberto: number }[] {
    const base = this.segmentosBase.length;
    return (this.desenho?.diagonais ?? []).map((_, i) => ({
      diagIdx: i,
      p1Idx: base + i * 2,
      p2Idx: base + i * 2 + 1,
      coberto: this.segmentoCoberto(i),
    }));
  }

  /** Retorna o índice do segmento base mais próximo do ponto médio da diagonal. */
  segmentoCoberto(diagIdx: number): number {
    const pontos = this.desenho?.pontos ?? [];
    const d = this.desenho?.diagonais?.[diagIdx];
    if (!d || pontos.length < 2) return -1;
    const mid: IPonto = { x: (d.p1.x + d.p2.x) / 2, y: (d.p1.y + d.p2.y) / 2 };
    let minDist = Infinity, idx = -1;
    for (let i = 0; i < pontos.length - 1; i++) {
      const dist = this.distToSegment(mid, pontos[i], pontos[i + 1]);
      if (dist < minDist) { minDist = dist; idx = i; }
    }
    return idx;
  }

  private distToSegment(p: IPonto, a: IPonto, b: IPonto): number {
    const dx = b.x - a.x, dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngAfterViewInit() { this.initCanvas(); }

  abrir(index: number, desenho: IDesenho, medidasAtuais: number[]) {
    this.itemIndex = index;
    this.desenho = desenho;
    const baseSeg = Math.max(0, desenho.pontos.length - 1);
    const diagCount = (desenho.diagonais ?? []).length;
    // 2 medidas por diagonal (ponta 1 e ponta 2)
    const total = baseSeg + diagCount * 2;
    this.medidas = Array.from({ length: total }, (_, i) => medidasAtuais[i] ?? 0);
    this.ctx = undefined;
    this.visible = true;
    setTimeout(() => this.initCanvas(), 0);
  }

  private initCanvas() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || !this.desenho) return;
    canvas.width = this.CANVAS_W;
    canvas.height = this.CANVAS_H;
    this.ctx = canvas.getContext('2d') ?? undefined;
    this.redraw();
  }

  onMedidaChange(index: number, value: number) {
    this.medidas[index] = value ?? 0;
    this.redraw();
  }

  confirmar() {
    this.confirmed.emit({ index: this.itemIndex, medidas: [...this.medidas] });
    this.visible = false;
  }

  // ── Canvas ────────────────────────────────────────────────────────────────

  redraw() {
    if (!this.ctx || !this.desenho) return;
    const ctx = this.ctx;
    const pontos = this.desenho.pontos as IPonto[];
    const diagonais: IDiagonal[] = (this.desenho.diagonais as IDiagonal[]) ?? [];
    const cobertos = this.segmentosCobertos;
    const W = this.CANVAS_W, H = this.CANVAS_H;

    const dark = this.themeService.isDarkMode();
    const baseColor = dark ? '#ef4444' : '#1a1a1a';

    ctx.fillStyle = dark ? '#141414' : '#f8f8f8';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = dark ? '#252525' : '#e0e0e0';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    if (pontos.length < 2) return;

    const base = pontos.length - 1;

    // Segmentos base
    for (let i = 0; i < base; i++) {
      const p1 = pontos[i], p2 = pontos[i + 1];
      const coberto = cobertos.has(i);
      const temMedida = !coberto && this.medidas[i] > 0;
      const cor = temMedida ? '#22c55e' : baseColor;

      ctx.strokeStyle = cor;
      ctx.lineWidth = 3.5;
      ctx.setLineDash([]);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();

      if (!coberto) {
        const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
        this.desenharBadge(ctx, mx, my, i + 1, cor);
        if (temMedida) this.desenharMedidaLabel(ctx, mx, my, this.medidas[i], cor);
      }
    }

    // Diagonais (por cima)
    for (let i = 0; i < diagonais.length; i++) {
      const d = diagonais[i];
      const p1Idx = base + i * 2;
      const p2Idx = base + i * 2 + 1;
      const m1 = this.medidas[p1Idx] ?? 0;
      const m2 = this.medidas[p2Idx] ?? 0;
      const temQualquer = m1 > 0 || m2 > 0;
      const cor = temQualquer ? '#22c55e' : baseColor;

      ctx.strokeStyle = cor;
      ctx.lineWidth = 3.5;
      ctx.setLineDash([]);
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(d.p1.x, d.p1.y); ctx.lineTo(d.p2.x, d.p2.y); ctx.stroke();

      // Badge no meio com número sequencial
      const mx = (d.p1.x + d.p2.x) / 2, my = (d.p1.y + d.p2.y) / 2;
      this.desenharBadge(ctx, mx, my, base + i + 1, cor);

      // Labels nas pontas
      if (m1 > 0) this.desenharMedidaLabel(ctx, d.p1.x, d.p1.y - 18, m1, '#22c55e');
      if (m2 > 0) this.desenharMedidaLabel(ctx, d.p2.x, d.p2.y - 18, m2, '#22c55e');
    }

    // Pontos
    ctx.fillStyle = dark ? '#888' : '#555';
    pontos.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill(); });
  }

  private desenharBadge(ctx: CanvasRenderingContext2D, x: number, y: number, num: number, cor: string) {
    ctx.fillStyle = cor;
    ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(num), x, y);
  }

  private desenharMedidaLabel(ctx: CanvasRenderingContext2D, x: number, y: number, medida: number, cor: string) {
    ctx.fillStyle = cor;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`${medida} cm`, x, y + 20);
  }
}
