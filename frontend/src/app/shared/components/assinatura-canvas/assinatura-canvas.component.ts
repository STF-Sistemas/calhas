import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostListener, OnDestroy, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import SignaturePad from 'signature_pad';

@Component({
  selector: 'app-assinatura-canvas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './assinatura-canvas.component.html',
  styleUrls: ['./assinatura-canvas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssinaturaCanvasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @Output() alterado = new EventEmitter<boolean>();

  private signaturePad: SignaturePad | null = null;

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.redimensionar();
    this.signaturePad = new SignaturePad(canvas, {
      backgroundColor: 'rgb(255, 255, 255)',
      penColor: 'rgb(15, 23, 42)',
    });
    this.signaturePad.addEventListener('endStroke', () => {
      this.alterado.emit(!this.estaVazio());
    });
  }

  ngOnDestroy(): void {
    this.signaturePad?.off();
  }

  @HostListener('window:resize')
  redimensionar(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const dadosAnteriores = this.signaturePad?.toData();
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext('2d')?.scale(ratio, ratio);
    if (this.signaturePad && dadosAnteriores?.length) {
      this.signaturePad.fromData(dadosAnteriores);
    }
  }

  limpar(): void {
    this.signaturePad?.clear();
    this.alterado.emit(false);
  }

  estaVazio(): boolean {
    return this.signaturePad?.isEmpty() ?? true;
  }

  obterImagem(): string {
    return this.signaturePad?.toDataURL('image/png') ?? '';
  }
}
