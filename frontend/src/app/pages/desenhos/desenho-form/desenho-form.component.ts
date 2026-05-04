import { Component, EventEmitter, Output, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { DialogWrapperComponent } from '#shared-frontend/components/dialog-wrapper/dialog-wrapper.component';
import { DesenhoService } from '#core/services/desenho.service';
import { ThemeService } from '#core/services/theme.service';
import { IDiagonal, IPonto } from '#shared/interfaces';

@Component({
  selector: 'app-desenho-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, ButtonModule, TooltipModule, DialogWrapperComponent],
  templateUrl: './desenho-form.component.html',
  styleUrls: ['./desenho-form.component.scss']
})
export class DesenhoFormComponent implements AfterViewInit {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @Output() saved = new EventEmitter<void>();

  form: FormGroup;
  visible = false;
  isLoadingData = false;
  isSaving = false;
  desenhoId?: number;

  pontos: IPonto[] = [];
  diagonais: IDiagonal[] = [];

  modoInserir = false;
  /** 0 = aguardando P1 | 1 = P1 definido, aguardando P2 */
  diagonalStep: 0 | 1 = 0;
  private diagonalP1?: IPonto;

  private ctx?: CanvasRenderingContext2D;
  private mousePos?: IPonto;

  readonly CANVAS_W = 800;
  readonly CANVAS_H = 320;

  constructor(
    private fb: FormBuilder,
    private desenhoService: DesenhoService,
    private messageService: MessageService,
    private themeService: ThemeService
  ) {
    this.form = this.fb.group({
      descricao: ['', [Validators.required, Validators.maxLength(200)]]
    });
  }

  ngAfterViewInit() { this.initCanvas(); }
  onDialogShow() { this.initCanvas(); }

  private initCanvas() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    canvas.width = this.CANVAS_W;
    canvas.height = this.CANVAS_H;
    this.ctx = canvas.getContext('2d') ?? undefined;
    this.redraw();
  }

  abrir(id?: number) {
    this.desenhoId = id;
    this.visible = true;
    this.form.reset();
    this.pontos = [];
    this.diagonais = [];
    this.mousePos = undefined;
    this.modoInserir = false;
    this.diagonalStep = 0;
    this.diagonalP1 = undefined;
    this.ctx = undefined;

    if (id) {
      this.isLoadingData = true;
      this.desenhoService.buscarPorId(id).subscribe({
        next: (res) => {
          this.form.patchValue(res.data);
          this.pontos = (res.data.pontos as IPonto[]) || [];
          this.diagonais = (res.data.diagonais as IDiagonal[]) || [];
          this.isLoadingData = false;
          setTimeout(() => { this.initCanvas(); }, 0);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao buscar desenho' });
          this.visible = false;
        }
      });
    }
  }

  get cursorStyle(): string { return 'crosshair'; }

  toggleModoInserir() {
    this.modoInserir = !this.modoInserir;
    this.diagonalStep = 0;
    this.diagonalP1 = undefined;
    this.mousePos = undefined;
    this.redraw();
  }

  // ── Clique / Touch ────────────────────────────────────────────────────────

  onCanvasClick(event: MouseEvent) {
    const p = this.toCanvasPoint(event);

    if (this.modoInserir) {
      if (this.diagonalStep === 0) {
        this.diagonalP1 = { x: p.x, y: p.y };
        this.diagonalStep = 1;
        this.redraw();
        return;
      }

      const diagonal: IDiagonal = {
        p1: this.diagonalP1!,
        p2: { x: p.x, y: p.y },
      };
      this.diagonais = [...this.diagonais, diagonal];
      this.diagonalP1 = undefined;
      this.diagonalStep = 0;
      this.mousePos = undefined;
      this.redraw();
      return;
    }

    this.pontos = [...this.pontos, p];
    this.redraw();
  }

  onCanvasMouseMove(event: MouseEvent) {
    this.mousePos = this.toCanvasPoint(event);
    this.redraw();
  }

  onCanvasMouseLeave() {
    this.mousePos = undefined;
    this.redraw();
  }

  onCanvasTouchStart(event: TouchEvent) {
    event.preventDefault();
    const touch = event.touches[0];
    if (!touch) return;
    this.mousePos = this.touchToCanvas(touch);
    this.redraw();
  }

  onCanvasTouchMove(event: TouchEvent) {
    event.preventDefault();
    const touch = event.touches[0];
    if (!touch) return;
    this.mousePos = this.touchToCanvas(touch);
    this.redraw();
  }

  onCanvasTouchEnd(event: TouchEvent) {
    event.preventDefault();
    const touch = event.changedTouches[0];
    if (!touch) return;
    const synthetic = { clientX: touch.clientX, clientY: touch.clientY } as MouseEvent;
    this.onCanvasClick(synthetic);
    this.mousePos = undefined;
    this.redraw();
  }

  private touchToCanvas(touch: Touch): IPonto {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.round((touch.clientX - rect.left) * (this.CANVAS_W / rect.width)),
      y: Math.round((touch.clientY - rect.top) * (this.CANVAS_H / rect.height))
    };
  }

  // ── Edição ────────────────────────────────────────────────────────────────

  undo() {
    if (this.modoInserir) {
      if (this.diagonalStep === 1) {
        this.diagonalP1 = undefined;
        this.diagonalStep = 0;
        this.redraw();
      } else if (this.diagonais.length > 0) {
        this.diagonais = this.diagonais.slice(0, -1);
        this.redraw();
      }
      return;
    }
    this.pontos = this.pontos.slice(0, -1);
    this.redraw();
  }

  clear() {
    this.pontos = [];
    this.diagonais = [];
    this.mousePos = undefined;
    this.modoInserir = false;
    this.diagonalStep = 0;
    this.diagonalP1 = undefined;
    this.redraw();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private toCanvasPoint(event: MouseEvent): IPonto {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.round((event.clientX - rect.left) * (this.CANVAS_W / rect.width)),
      y: Math.round((event.clientY - rect.top) * (this.CANVAS_H / rect.height))
    };
  }

  // ── Renderização ──────────────────────────────────────────────────────────

  private redraw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const W = this.CANVAS_W, H = this.CANVAS_H;
    const dark = this.themeService.isDarkMode();

    ctx.fillStyle = dark ? '#141414' : '#f8f8f8';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = dark ? '#252525' : '#e0e0e0';
    ctx.lineWidth = 1;
    const grid = 40;
    for (let x = 0; x <= W; x += grid) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += grid) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    const lineColor = dark ? '#ef4444' : '#1a1a1a';
    const previewColor = dark ? 'rgba(239,68,68,0.45)' : 'rgba(26,26,26,0.35)';

    if (this.pontos.length >= 2) {
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(this.pontos[0].x, this.pontos[0].y);
      for (let i = 1; i < this.pontos.length; i++) ctx.lineTo(this.pontos[i].x, this.pontos[i].y);
      ctx.stroke();
    }

    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.setLineDash([]);
    for (const d of this.diagonais) {
      ctx.strokeStyle = lineColor;
      ctx.beginPath();
      ctx.moveTo(d.p1.x, d.p1.y);
      ctx.lineTo(d.p2.x, d.p2.y);
      ctx.stroke();
      this.desenharDiamante(ctx, d.p1.x, d.p1.y, lineColor);
      this.desenharDiamante(ctx, d.p2.x, d.p2.y, lineColor);
    }

    if (this.modoInserir && this.diagonalP1 && this.mousePos) {
      ctx.strokeStyle = dark ? 'rgba(249,115,22,0.55)' : 'rgba(26,26,26,0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(this.diagonalP1.x, this.diagonalP1.y);
      ctx.lineTo(this.mousePos.x, this.mousePos.y);
      ctx.stroke();
      ctx.setLineDash([]);
      this.desenharDiamante(ctx, this.diagonalP1.x, this.diagonalP1.y, lineColor);
    }

    if (!this.modoInserir && this.pontos.length > 0 && this.mousePos) {
      const last = this.pontos[this.pontos.length - 1];
      ctx.strokeStyle = previewColor;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(this.mousePos.x, this.mousePos.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.setLineDash([]);

    this.pontos.forEach((p, i) => {
      const isLast = !this.modoInserir && i === this.pontos.length - 1;
      ctx.fillStyle = lineColor;
      ctx.beginPath();
      ctx.arc(p.x, p.y, isLast ? 5 : 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private desenharDiamante(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = color;
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();
  }

  // ── Salvar ────────────────────────────────────────────────────────────────

  onSave() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Informe a descrição do desenho.' });
      return;
    }
    if (this.pontos.length < 2) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'O desenho precisa ter ao menos 2 pontos.' });
      return;
    }

    this.isSaving = true;
    const dados = {
      ...this.form.value,
      pontos: this.pontos,
      diagonais: this.diagonais,
      id: this.desenhoId,
    };

    this.desenhoService.salvar(dados).subscribe({
      next: (res) => {
        if (res.success) {
          this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: `Desenho ${this.desenhoId ? 'atualizado' : 'criado'} com sucesso` });
          this.saved.emit();
          this.visible = false;
        }
        this.isSaving = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao salvar desenho' });
        this.isSaving = false;
      }
    });
  }
}
