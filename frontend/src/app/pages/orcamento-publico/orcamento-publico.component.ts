import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { Textarea } from 'primeng/textarea';
import { PedidoService } from '#core/services/pedido.service';
import { EDescontoTipo, EAprovacaoPedido, EStatusPedido } from '#shared/enums';
import { AssinaturaCanvasComponent } from '#shared-frontend/components/assinatura-canvas/assinatura-canvas.component';

@Component({
  selector: 'app-orcamento-publico',
  standalone: true,
  imports: [CommonModule, FormsModule, TagModule, ButtonModule, Textarea, AssinaturaCanvasComponent],
  templateUrl: './orcamento-publico.component.html',
  styleUrls: ['./orcamento-publico.component.scss'],
})
export class OrcamentoPublicoComponent implements OnInit {
  @ViewChild(AssinaturaCanvasComponent) assinaturaCanvas?: AssinaturaCanvasComponent;

  estado: 'carregando' | 'ok' | 'expirado' | 'cancelado' | 'invalido' = 'carregando';
  pedido: any = null;
  EDescontoTipo = EDescontoTipo;
  EAprovacaoPedido = EAprovacaoPedido;
  EStatusPedido = EStatusPedido;
  readonly watermarkRepeticoes = Array.from({ length: 14 });

  private token = '';

  mostrandoAssinatura = false;
  mostrandoMotivoRecusa = false;
  assinaturaPreenchida = false;
  motivoRecusa = '';
  enviando = false;
  erroDecisao: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private pedidoService: PedidoService,
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';
    this.pedidoService.buscarPublico(this.token).subscribe({
      next: (res) => {
        this.pedido = res.data;
        this.estado = 'ok';
      },
      error: (err) => {
        const code = err.error?.code;
        if (code === 'EXPIRED') this.estado = 'expirado';
        else if (code === 'CANCELLED') this.estado = 'cancelado';
        else this.estado = 'invalido';
      },
    });
  }

  watermarkTexto(): string {
    const empresa = this.pedido?.empresa;
    if (!empresa) return '';
    return empresa.marca_dagua || empresa.nome_fantasia || empresa.razao_social || '';
  }

  severityStatus(): 'info' | 'warn' | 'success' | 'secondary' {
    if (!this.pedido) return 'secondary';
    const s = this.pedido.status;
    if (s === 6) return 'info';
    if (s === 7) return 'warn';
    if (s === 8) return 'success';
    return 'secondary';
  }

  onAutorizar(): void {
    this.erroDecisao = null;
    this.mostrandoMotivoRecusa = false;
    this.mostrandoAssinatura = true;
    this.assinaturaPreenchida = false;
  }

  onCancelarAssinatura(): void {
    this.mostrandoAssinatura = false;
    this.assinaturaPreenchida = false;
  }

  onAssinaturaAlterada(preenchida: boolean): void {
    this.assinaturaPreenchida = preenchida;
  }

  onLimparAssinatura(): void {
    this.assinaturaCanvas?.limpar();
    this.assinaturaPreenchida = false;
  }

  onConfirmarAssinatura(): void {
    if (!this.assinaturaCanvas || this.assinaturaCanvas.estaVazio()) return;
    const assinatura = this.assinaturaCanvas.obterImagem();

    this.enviando = true;
    this.erroDecisao = null;
    this.pedidoService.autorizarPublico(this.token, assinatura).subscribe({
      next: (res) => {
        this.pedido.aprovacao_status = res.data.aprovacao_status;
        this.pedido.aprovacao_data = res.data.aprovacao_data;
        this.mostrandoAssinatura = false;
        this.enviando = false;
      },
      error: (err) => {
        this.enviando = false;
        if (err.error?.code === 'JA_DECIDIDO') {
          this.recarregarPedido();
        } else {
          this.erroDecisao = err.error?.message || 'Não foi possível registrar a autorização. Tente novamente.';
        }
      },
    });
  }

  onRecusar(): void {
    this.erroDecisao = null;
    this.mostrandoAssinatura = false;
    this.mostrandoMotivoRecusa = true;
    this.motivoRecusa = '';
  }

  onCancelarRecusa(): void {
    this.mostrandoMotivoRecusa = false;
  }

  onConfirmarRecusa(): void {
    this.enviando = true;
    this.erroDecisao = null;
    this.pedidoService.recusarPublico(this.token, this.motivoRecusa?.trim() || undefined).subscribe({
      next: (res) => {
        this.pedido.aprovacao_status = res.data.aprovacao_status;
        this.pedido.aprovacao_data = res.data.aprovacao_data;
        this.pedido.recusa_motivo = this.motivoRecusa?.trim() || null;
        this.mostrandoMotivoRecusa = false;
        this.enviando = false;
      },
      error: (err) => {
        this.enviando = false;
        if (err.error?.code === 'JA_DECIDIDO') {
          this.recarregarPedido();
        } else {
          this.erroDecisao = err.error?.message || 'Não foi possível registrar a recusa. Tente novamente.';
        }
      },
    });
  }

  private recarregarPedido(): void {
    this.pedidoService.buscarPublico(this.token).subscribe({
      next: (res) => {
        this.pedido = res.data;
        this.mostrandoAssinatura = false;
        this.mostrandoMotivoRecusa = false;
      },
    });
  }
}
