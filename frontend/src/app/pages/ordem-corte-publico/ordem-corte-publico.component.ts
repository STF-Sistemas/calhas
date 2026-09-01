import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PedidoService } from '#core/services/pedido.service';
import { calcularTotalCorte, gerarSvgCorte } from '#shared/functions/desenho-corte.functions';
import { formatPhone } from '#shared/functions/format.functions';
import { ETipoItemPedido } from '#shared/enums';
import { IDiagonal, IPonto } from '#shared/interfaces';

interface IItemProdutoExibicao {
  id: number;
  descricao: string;
  quantidade: number;
  unidadeMedida?: string;
  observacoes: string | null;
}

interface IItemCorteExibicao {
  id: number;
  temDesenho: boolean;
  quantidade: number;
  observacoes: string | null;
  chapaDescricao: string;
  corteDescricao: string;
  corteRef: string;
  desenhoDescricao: string;
  total: number;
  svg: SafeHtml | null;
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
  produtos: IItemProdutoExibicao[] = [];
  cortes: IItemCorteExibicao[] = [];
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
        const todos = res.data.itens ?? [];
        this.produtos = todos
          .filter((item: any) => item.tipo === ETipoItemPedido.Produto)
          .map((item: any) => this.montarProduto(item));
        this.cortes = todos
          .filter((item: any) => item.tipo === ETipoItemPedido.Corte)
          .map((item: any) => this.montarCorte(item));
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

  formatTelefone(valor: string | null | undefined): string {
    return formatPhone(valor);
  }

  watermarkTexto(): string {
    const empresa = this.pedido?.empresa;
    if (!empresa) return '';
    return empresa.marca_dagua || empresa.nome_fantasia || empresa.razao_social || '';
  }

  private montarProduto(item: any): IItemProdutoExibicao {
    return {
      id: item.id,
      descricao: item.produto?.descricao || `Item Nº ${item.id}`,
      quantidade: item.quantidade,
      unidadeMedida: item.produto?.unidade_medida,
      observacoes: item.observacoes,
    };
  }

  private montarCorte(item: any): IItemCorteExibicao {
    const temDesenho = !!item.desenho;
    const pontos: IPonto[] = item.desenho?.pontos ?? [];
    const diagonais: IDiagonal[] = item.desenho?.diagonais ?? [];
    const medidas: number[] = item.medidas ?? [];
    const total = temDesenho ? calcularTotalCorte(pontos, diagonais, medidas) : 0;
    return {
      id: item.id,
      temDesenho,
      quantidade: item.quantidade,
      observacoes: item.observacoes,
      chapaDescricao: item.corte?.chapa?.descricao ?? '-',
      corteDescricao: item.corte?.descricao ?? '-',
      corteRef: item.corte?.corte != null ? `${item.corte.corte} cm` : '-',
      desenhoDescricao: item.desenho?.descricao ?? '-',
      total,
      svg: temDesenho ? this.sanitizer.bypassSecurityTrustHtml(gerarSvgCorte(pontos, diagonais, medidas)) : null,
    };
  }
}
