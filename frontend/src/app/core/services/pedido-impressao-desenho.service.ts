import { Injectable } from '@angular/core';
import { IPedido, IPedidoItem, IPonto } from '#shared/interfaces';
import { ETipoItemPedido } from '#shared/enums';
import { formatDate } from '#shared/functions/format.functions';

@Injectable({ providedIn: 'root' })
export class PedidoImpressaoDesenhoService {

  imprimir(pedido: IPedido): void {
    const itensCorte = (pedido.itens ?? []).filter(
      i => i.tipo === ETipoItemPedido.Corte && i.cod_desenho
    );

    if (itensCorte.length === 0) {
      alert('Este pedido não possui itens de corte com desenho para imprimir.');
      return;
    }

    const html = this.gerarHtml(pedido, itensCorte);
    const win = window.open('', '_blank');
    if (!win) {
      alert('Permita pop-ups para imprimir o pedido.');
      return;
    }
    win.document.write(html);
    win.document.close();
    win.onload = () => win.print();
  }

  private gerarSvg(pontos: IPonto[], medidas: number[]): string {
    if (!pontos || pontos.length < 2) return '<em>Sem pontos</em>';

    const PAD = 30;
    const W = 500;
    const H = 180;

    const xs = pontos.map(p => p.x);
    const ys = pontos.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;

    // Mantém proporção dentro da área útil
    const drawW = W - PAD * 2;
    const drawH = H - PAD * 2;
    const scale = Math.min(drawW / rangeX, drawH / rangeY);

    const offsetX = PAD + (drawW - rangeX * scale) / 2;
    const offsetY = PAD + (drawH - rangeY * scale) / 2;

    const norm = (p: IPonto) => ({
      sx: offsetX + (p.x - minX) * scale,
      sy: offsetY + (p.y - minY) * scale,
    });

    const pts = pontos.map(norm);
    const polyline = pts.map(p => `${p.sx.toFixed(1)},${p.sy.toFixed(1)}`).join(' ');

    // Rótulos de medida por segmento
    const labels = pontos.slice(0, -1).map((_, i) => {
      const a = pts[i];
      const b = pts[i + 1];
      const mx = (a.sx + b.sx) / 2;
      const my = (a.sy + b.sy) / 2;
      const medida = medidas?.[i];
      const label = medida != null && medida > 0 ? `${medida} cm` : '';

      // Desloca o label levemente perpendicular ao segmento para não sobrepor a linha
      const dx = b.sx - a.sx;
      const dy = b.sy - a.sy;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = -dy / len * 12;
      const ny = dx / len * 12;

      return label
        ? `<text x="${(mx + nx).toFixed(1)}" y="${(my + ny).toFixed(1)}" font-size="11" fill="#1a1a1a" text-anchor="middle" dominant-baseline="middle">${label}</text>`
        : '';
    }).join('');

    // Pontos vértice
    const dots = pts.map(p =>
      `<circle cx="${p.sx.toFixed(1)}" cy="${p.sy.toFixed(1)}" r="3" fill="#ef4444"/>`
    ).join('');

    return `
      <svg width="${W}" height="${H}" style="max-width:100%;display:block;border:1px solid #e5e7eb;border-radius:4px;background:#fafafa;">
        <polyline points="${polyline}" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
        ${dots}
        ${labels}
      </svg>`;
  }

  private gerarBlocoItem(item: IPedidoItem, seq: number): string {
    const chapa = item.corte?.chapa?.descricao ?? '-';
    const corte = item.corte?.descricao ?? '-';
    const corteTotal = item.corte?.corte != null ? `${item.corte.corte} cm` : '-';
    const desenho = item.desenho?.descricao ?? '-';
    const medidas: number[] = item.medidas ?? [];
    const totalMedidas = medidas.reduce((s, m) => s + (Number(m) || 0), 0);
    const obs = item.observacoes ? `<div class="obs-item"><strong>Obs:</strong> ${item.observacoes}</div>` : '';

    const medidasHtml = medidas.length > 0
      ? medidas.map((m, i) => `<span class="medida-tag">Seg ${i + 1}: ${m} cm</span>`).join('')
      : '<span class="text-muted">—</span>';

    const svgHtml = this.gerarSvg(item.desenho?.pontos ?? [], medidas);

    return `
      <div class="item-bloco">
        <div class="item-header">
          <span class="item-seq">${seq}</span>
          <span class="item-title">${corte}</span>
        </div>
        <div class="item-info-grid">
          <div><span class="label">Chapa:</span> ${chapa}</div>
          <div><span class="label">Corte ref.:</span> ${corteTotal}</div>
          <div><span class="label">Desenho:</span> ${desenho}</div>
          <div><span class="label">Total medido:</span> ${totalMedidas}</div>
          <div><span class="label">Quantidade:</span> ${item.quantidade}</div>
        </div>
        <div class="svg-wrapper">${svgHtml}</div>
        <div class="medidas-row">${medidasHtml}</div>
        ${obs}
      </div>`;
  }

  private gerarHtml(pedido: IPedido, itens: IPedidoItem[]): string {
    const cliente = pedido.cliente?.razao_social ?? '-';
    const blocos = itens.map((item, i) => this.gerarBlocoItem(item, i + 1)).join('');

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Cortes — Pedido Nº ${pedido.id}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; background: #fff; }
    .page { max-width: 800px; margin: 0 auto; padding: 24px 28px; }

    /* Cabeçalho */
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 12px; border-bottom: 2px solid #1a1a1a; margin-bottom: 16px; }
    .header-title { font-size: 20px; font-weight: 700; }
    .header-sub { font-size: 11px; color: #555; margin-top: 2px; }
    .pedido-badge { text-align: right; }
    .pedido-num { font-size: 24px; font-weight: 800; }
    .pedido-num span { font-size: 11px; font-weight: 400; display: block; color: #555; }

    /* Seção cliente */
    .section { margin-bottom: 14px; }
    .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; margin-bottom: 6px; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; }
    .cliente-name { font-size: 13px; font-weight: 700; }
    .label { font-weight: 600; color: #374151; }

    /* Bloco de item */
    .item-bloco { border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px 14px; margin-bottom: 16px; break-inside: avoid; page-break-inside: avoid; }
    .item-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .item-seq { background: #1a1a1a; color: #fff; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
    .item-title { font-size: 13px; font-weight: 700; }
    .item-info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px 16px; margin-bottom: 10px; font-size: 11px; }
    .svg-wrapper { margin-bottom: 10px; }
    .medidas-row { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 6px; }
    .medida-tag { background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; padding: 2px 8px; font-size: 11px; }
    .obs-item { font-size: 10px; color: #6b7280; margin-top: 4px; }
    .text-muted { color: #9ca3af; }

    /* Rodapé */
    .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #9ca3af; display: flex; justify-content: space-between; }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 0; }
      @page { margin: 12mm 12mm 12mm 12mm; }
    }
  </style>
</head>
<body>
<div class="page">

  <div class="header">
    <div>
      <div class="header-title">Ordem de Corte</div>
      <div class="header-sub">Calhas &amp; Coberturas</div>
    </div>
    <div class="pedido-badge">
      <div class="pedido-num"><span>Nº do Pedido</span>${pedido.id}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Cliente</div>
    <div class="cliente-name">${cliente}</div>
    <div style="font-size:11px;color:#374151;margin-top:3px;">
      <span class="label">Data:</span> ${formatDate(pedido.data_pedido)}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Itens de Corte (${itens.length})</div>
    ${blocos}
  </div>

  <div class="footer">
    <span>Gerado em ${formatDate(new Date())} ${new Date().toTimeString().slice(0, 5)}</span>
    <span>Pedido Nº ${pedido.id} — ${cliente}</span>
  </div>

</div>
</body>
</html>`;
  }
}
