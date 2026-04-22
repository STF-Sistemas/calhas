import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TagModule } from 'primeng/tag';
import { PedidoService } from '#core/services/pedido.service';

@Component({
  selector: 'app-orcamento-publico',
  standalone: true,
  imports: [CommonModule, TagModule],
  templateUrl: './orcamento-publico.component.html',
  styleUrls: ['./orcamento-publico.component.scss'],
})
export class OrcamentoPublicoComponent implements OnInit {
  estado: 'carregando' | 'ok' | 'expirado' | 'cancelado' | 'invalido' = 'carregando';
  pedido: any = null;

  constructor(
    private route: ActivatedRoute,
    private pedidoService: PedidoService,
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token') ?? '';
    this.pedidoService.buscarPublico(token).subscribe({
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

  severityStatus(): 'info' | 'warn' | 'success' | 'secondary' {
    if (!this.pedido) return 'secondary';
    const s = this.pedido.status;
    if (s === 6) return 'info';
    if (s === 7) return 'warn';
    if (s === 8) return 'success';
    return 'secondary';
  }
}
