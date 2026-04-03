import { Component, EventEmitter, Output, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { IDesenho, IPonto } from '#shared/interfaces';

@Component({
  selector: 'app-desenho-medida',
  standalone: true,
  imports: [CommonModule, FormsModule, InputNumberModule, ButtonModule, DialogModule],
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
  readonly CANVAS_W = 800;
  readonly CANVAS_H = 320;

  get segmentos(): number[] {
    return this.medidas.map((_, i) => i);
  }

  ngAfterViewInit() {
    this.initCanvas();
  }

  abrir(index: number, desenho: IDesenho, medidasAtuais: number[]) {
    this.itemIndex = index;
    this.desenho = desenho;
    const segCount = Math.max(0, desenho.pontos.length - 1);
    this.medidas = Array.from({ length: segCount }, (_, i) => medidasAtuais[i] ?? 0);
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

  redraw() {
    if (!this.ctx || !this.desenho) return;
    const ctx = this.ctx;
    const pontos = this.desenho.pontos as IPonto[];
    const W = this.CANVAS_W, H = this.CANVAS_H;

    // Fundo
    ctx.fillStyle = '#141414';
    ctx.fillRect(0, 0, W, H);

    // Grade
    ctx.strokeStyle = '#252525';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y <= H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    if (pontos.length < 2) return;

    // Desenha cada segmento com cor baseada se tem medida
    for (let i = 0; i < pontos.length - 1; i++) {
      const p1 = pontos[i], p2 = pontos[i + 1];
      const temMedida = this.medidas[i] > 0;
      const cor = temMedida ? '#22c55e' : '#ef4444';

      ctx.strokeStyle = cor;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // Badge numerado no meio do segmento
      const mx = (p1.x + p2.x) / 2;
      const my = (p1.y + p2.y) / 2;

      ctx.fillStyle = cor;
      ctx.beginPath();
      ctx.arc(mx, my, 13, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), mx, my);

      // Medida abaixo do badge
      if (temMedida) {
        ctx.fillStyle = '#22c55e';
        ctx.font = '11px sans-serif';
        ctx.fillText(`${this.medidas[i]} cm`, mx, my + 20);
      }
    }

    // Pontos
    ctx.fillStyle = '#888';
    pontos.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}
