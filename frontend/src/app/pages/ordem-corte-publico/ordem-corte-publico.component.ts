import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PedidoService } from '#core/services/pedido.service';
import { calcularTotalCorte, gerarSvgCorte } from '#shared/functions/desenho-corte.functions';
import { IDiagonal, IPonto } from '#shared/interfaces';

interface IItemCorteExibicao {
  id: number;
  quantidade: number;
  observacoes: string | null;
  chapaDescricao: string;
  corteDescricao: string;
  corteRef: string;
  desenhoDescricao: string;
  total: number;
  svg: SafeHtml;
}

@Component({
  selector: 'app-ordem-corte-publico',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ordem-corte-publico.component.html',
  styleUrls: ['./ordem-corte-publico.component.scss'],
})
export class OrdemCortePublicoComponent implements OnInit {
  estado: 'carregando' | 'ok' | 'expirado' | 'cancelado' | 'invalido' = 'carregando';
  pedido: any = null;
  itens: IItemCorteExibicao[] = [];
  readonly watermarkRepeticoes = Array.from({ length: 14 });

  constructor(
    private route: ActivatedRoute,
    private pedidoService: PedidoService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token') ?? '';
    this.pedidoService.buscarOrdemCortePublico(token).subscribe({
      next: (res) => {
        this.pedido = res.data;
        this.itens = (res.data.itens ?? []).map((item: any) => this.montarItem(item));
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

  private montarItem(item: any): IItemCorteExibicao {
    const pontos: IPonto[] = item.desenho?.pontos ?? [];
    const diagonais: IDiagonal[] = item.desenho?.diagonais ?? [];
    const medidas: number[] = item.medidas ?? [];
    const total = calcularTotalCorte(pontos, diagonais, medidas);
    return {
      id: item.id,
      quantidade: item.quantidade,
      observacoes: item.observacoes,
      chapaDescricao: item.corte?.chapa?.descricao ?? '-',
      corteDescricao: item.corte?.descricao ?? '-',
      corteRef: item.corte?.corte != null ? `${item.corte.corte} cm` : '-',
      desenhoDescricao: item.desenho?.descricao ?? '-',
      total,
      svg: this.sanitizer.bypassSecurityTrustHtml(gerarSvgCorte(pontos, diagonais, medidas)),
    };
  }
}
