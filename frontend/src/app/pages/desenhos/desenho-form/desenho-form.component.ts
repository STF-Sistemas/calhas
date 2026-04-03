import { Component, EventEmitter, Output, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { DialogWrapperComponent } from '#shared-frontend/components/dialog-wrapper/dialog-wrapper.component';
import { DesenhoService } from '#core/services/desenho.service';
import { IPonto } from '#shared/interfaces';

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
  private ctx?: CanvasRenderingContext2D;
  private mousePos?: IPonto;

  readonly CANVAS_W = 800;
  readonly CANVAS_H = 320;

  constructor(
    private fb: FormBuilder,
    private desenhoService: DesenhoService,
    private messageService: MessageService
  ) {
    this.form = this.fb.group({
      descricao: ['', [Validators.required, Validators.maxLength(200)]]
    });
  }

  ngAfterViewInit() {
    this.initCanvas();
  }

  onDialogShow() {
    this.initCanvas();
  }

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
    this.mousePos = undefined;
    this.ctx = undefined;

    if (id) {
      this.isLoadingData = true;
      this.desenhoService.buscarPorId(id).subscribe({
        next: (res) => {
          this.form.patchValue(res.data);
          this.pontos = (res.data.pontos as IPonto[]) || [];
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

  onCanvasClick(event: MouseEvent) {
    const p = this.toCanvasPoint(event);
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

  onCanvasTouchEnd(event: TouchEvent) {
    event.preventDefault(); // evita o click sintético do browser
    const touch = event.changedTouches[0];
    if (!touch) return;
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const p: IPonto = {
      x: Math.round((touch.clientX - rect.left) * (this.CANVAS_W / rect.width)),
      y: Math.round((touch.clientY - rect.top) * (this.CANVAS_H / rect.height))
    };
    this.pontos = [...this.pontos, p];
    this.redraw();
  }

  undo() {
    this.pontos = this.pontos.slice(0, -1);
    this.redraw();
  }

  clear() {
    this.pontos = [];
    this.mousePos = undefined;
    this.redraw();
  }

  private toCanvasPoint(event: MouseEvent): IPonto {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.round((event.clientX - rect.left) * (this.CANVAS_W / rect.width)),
      y: Math.round((event.clientY - rect.top) * (this.CANVAS_H / rect.height))
    };
  }

  private redraw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const W = this.CANVAS_W, H = this.CANVAS_H;

    // Fundo
    ctx.fillStyle = '#141414';
    ctx.fillRect(0, 0, W, H);

    // Grade
    ctx.strokeStyle = '#252525';
    ctx.lineWidth = 1;
    const grid = 40;
    for (let x = 0; x <= W; x += grid) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y <= H; y += grid) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    if (this.pontos.length === 0 && !this.mousePos) return;

    // Linha sólida entre pontos existentes
    if (this.pontos.length >= 2) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(this.pontos[0].x, this.pontos[0].y);
      for (let i = 1; i < this.pontos.length; i++) {
        ctx.lineTo(this.pontos[i].x, this.pontos[i].y);
      }
      ctx.stroke();
    }

    // Linha de prévia (último ponto → cursor)
    if (this.pontos.length > 0 && this.mousePos) {
      const last = this.pontos[this.pontos.length - 1];
      ctx.strokeStyle = 'rgba(239,68,68,0.45)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(this.mousePos.x, this.mousePos.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Pontos
    this.pontos.forEach((p, i) => {
      const isLast = i === this.pontos.length - 1;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(p.x, p.y, isLast ? 5 : 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  onSave() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Informe a descrição do desenho.' });
      return;
    }
    if (this.pontos.length < 2) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'O desenho precisa ter ao menos 2 pontos.' });
      return;
    }

    this.isSaving = true;
    const dados = { ...this.form.value, pontos: this.pontos, id: this.desenhoId };

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
