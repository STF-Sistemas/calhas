import { Injectable } from '@angular/core';
import { IDiagonal, IPedido, IPedidoItem, IPonto } from '#shared/interfaces';
import { ETipoItemPedido } from '#shared/enums';
import { formatDate, formatCpfCnpj, formatPhone } from '#shared/functions/format.functions';

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
    if (!win) { alert('Permita pop-ups para imprimir o pedido.'); return; }
    win.document.write(html);
    win.document.close();
    win.onload = () => win.print();
  }

  // ── Total (mesma lógica do desenho-medida) ────────────────────────────────
  private calcularTotal(pontos: IPonto[], diagonais: IDiagonal[], medidas: number[]): number {
    const baseSeg = Math.max(0, pontos.length - 1);
    const cobertos = this.segmentosCobertos(pontos, diagonais);
    let total = 0;
    for (let i = 0; i < baseSeg; i++) {
      if (!cobertos.has(i)) total += Number(medidas[i]) || 0;
    }
    for (let i = 0; i < diagonais.length; i++) {
      const m1 = Number(medidas[baseSeg + i * 2]) || 0;
      const m2 = Number(medidas[baseSeg + i * 2 + 1]) || 0;
      total += Math.max(m1, m2);
    }
    return Math.round(total * 100) / 100;
  }

  private segmentosCobertos(pontos: IPonto[], diagonais: IDiagonal[]): Set<number> {
    const set = new Set<number>();
    diagonais.forEach(d => {
      const idx = this.segmentoCoberto(pontos, d);
      if (idx >= 0) set.add(idx);
    });
    return set;
  }

  private segmentoCoberto(pontos: IPonto[], d: IDiagonal): number {
    const mid: IPonto = { x: (d.p1.x + d.p2.x) / 2, y: (d.p1.y + d.p2.y) / 2 };
    let minDist = Infinity, idx = -1;
    for (let i = 0; i < pontos.length - 1; i++) {
      const dx = pontos[i + 1].x - pontos[i].x, dy = pontos[i + 1].y - pontos[i].y;
      const lenSq = dx * dx + dy * dy;
      const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((mid.x - pontos[i].x) * dx + (mid.y - pontos[i].y) * dy) / lenSq));
      const dist = Math.hypot(mid.x - (pontos[i].x + t * dx), mid.y - (pontos[i].y + t * dy));
      if (dist < minDist) { minDist = dist; idx = i; }
    }
    return idx;
  }

  // ── Resolução de sobreposição de labels (AABB) ────────────────────────────
  private resolverSobreposicoes(
    labels: Array<{ x: number; y: number; w: number; h: number }>,
    vw: number, vh: number
  ): void {
    const PAD = 3;
    for (let iter = 0; iter < 40; iter++) {
      let moved = false;
      for (let i = 0; i < labels.length; i++) {
        for (let j = i + 1; j < labels.length; j++) {
          const a = labels[i], b = labels[j];
          const minDx = (a.w + b.w) / 2 + PAD;
          const minDy = (a.h + b.h) / 2 + PAD;
          const dx = b.x - a.x, dy = b.y - a.y;
          const ox = minDx - Math.abs(dx), oy = minDy - Math.abs(dy);
          if (ox > 0 && oy > 0) {
            moved = true;
            if (ox <= oy) {
              const p = ox / 2 + 0.5;
              if (dx >= 0) { a.x -= p; b.x += p; } else { a.x += p; b.x -= p; }
            } else {
              const p = oy / 2 + 0.5;
              if (dy >= 0) { a.y -= p; b.y += p; } else { a.y += p; b.y -= p; }
            }
          }
        }
      }
      if (!moved) break;
    }
    for (const lbl of labels) {
      lbl.x = Math.max(lbl.w / 2 + 2, Math.min(vw - lbl.w / 2 - 2, lbl.x));
      lbl.y = Math.max(lbl.h / 2 + 2, Math.min(vh - lbl.h / 2 - 2, lbl.y));
    }
  }

  // ── SVG do desenho com diagonais e medidas ────────────────────────────────
  private gerarSvg(pontos: IPonto[], diagonais: IDiagonal[], medidas: number[]): string {
    if (!pontos || pontos.length < 2) {
      return '<span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:9px;color:#9ca3af">Sem desenho</span>';
    }

    const PAD = 18, VW = 280, VH = 150;
    const xs = pontos.map(p => p.x), ys = pontos.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const rangeX = maxX - minX || 1, rangeY = maxY - minY || 1;
    const drawW = VW - PAD * 2, drawH = VH - PAD * 2;
    const scale = Math.min(drawW / rangeX, drawH / rangeY);
    const offsetX = PAD + (drawW - rangeX * scale) / 2;
    const offsetY = PAD + (drawH - rangeY * scale) / 2;

    const norm = (p: IPonto) => ({
      sx: offsetX + (p.x - minX) * scale,
      sy: offsetY + (p.y - minY) * scale,
    });

    const pts = pontos.map(norm);
    const polyline = pts.map(p => `${p.sx.toFixed(1)},${p.sy.toFixed(1)}`).join(' ');
    const baseSeg = pontos.length - 1;
    const cobertos = this.segmentosCobertos(pontos, diagonais);

    interface LblData {
      x: number; y: number; w: number; h: number;
      mx: number; my: number;
      text: string; bgFill: string; border: string; txtFill: string;
    }

    const lblData: LblData[] = [];

    // Labels dos segmentos base (pula cobertos)
    for (let i = 0; i < baseSeg; i++) {
      if (cobertos.has(i)) continue;
      const a = pts[i], b = pts[i + 1];
      const mx = (a.sx + b.sx) / 2, my = (a.sy + b.sy) / 2;
      const dx = b.sx - a.sx, dy = b.sy - a.sy;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const medida = medidas[i];
      const hasVal = medida != null && Number(medida) > 0;
      const text = hasVal ? `${medida}cm` : `${i + 1}`;
      const w = Math.max(18, text.length * 5.8 + 6);
      lblData.push({
        x: mx + (-dy / len) * 14, y: my + (dx / len) * 14,
        mx, my, w, h: 12, text,
        bgFill: hasVal ? '#dbeafe' : '#f3f4f6',
        border: hasVal ? '#93c5fd' : '#d1d5db',
        txtFill: hasVal ? '#1d4ed8' : '#6b7280',
      });
    }

    // Labels das diagonais: uma label por ponta
    const diagLines: string[] = [];
    for (let i = 0; i < diagonais.length; i++) {
      const d = diagonais[i];
      const dp1 = norm(d.p1), dp2 = norm(d.p2);
      const m1 = Number(medidas[baseSeg + i * 2]) || 0;
      const m2 = Number(medidas[baseSeg + i * 2 + 1]) || 0;

      // Linha da diagonal
      diagLines.push(
        `<line x1="${dp1.sx.toFixed(1)}" y1="${dp1.sy.toFixed(1)}"
               x2="${dp2.sx.toFixed(1)}" y2="${dp2.sy.toFixed(1)}"
               stroke="#1a1a1a" stroke-width="2.2" stroke-linecap="round"/>`
      );

      const dx = dp2.sx - dp1.sx, dy = dp2.sy - dp1.sy;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = -dy / len, ny = dx / len;

      // Label ponta 1
      const t1 = m1 > 0 ? `${m1}cm` : `D${i + 1}P1`;
      const w1 = Math.max(20, t1.length * 5.8 + 6);
      lblData.push({
        x: dp1.sx + nx * 14, y: dp1.sy + ny * 14,
        mx: dp1.sx, my: dp1.sy, w: w1, h: 12, text: t1,
        bgFill: m1 > 0 ? '#fef3c7' : '#f3f4f6',
        border: m1 > 0 ? '#fcd34d' : '#d1d5db',
        txtFill: m1 > 0 ? '#92400e' : '#6b7280',
      });

      // Label ponta 2
      const t2 = m2 > 0 ? `${m2}cm` : `D${i + 1}P2`;
      const w2 = Math.max(20, t2.length * 5.8 + 6);
      lblData.push({
        x: dp2.sx + nx * 14, y: dp2.sy + ny * 14,
        mx: dp2.sx, my: dp2.sy, w: w2, h: 12, text: t2,
        bgFill: m2 > 0 ? '#fef3c7' : '#f3f4f6',
        border: m2 > 0 ? '#fcd34d' : '#d1d5db',
        txtFill: m2 > 0 ? '#92400e' : '#6b7280',
      });
    }

    this.resolverSobreposicoes(lblData, VW, VH);

    const labelsSvg = lblData.map(lbl => {
      const dist = Math.hypot(lbl.x - lbl.mx, lbl.y - lbl.my);
      const leader = dist > 10
        ? `<line x1="${lbl.mx.toFixed(1)}" y1="${lbl.my.toFixed(1)}"
               x2="${lbl.x.toFixed(1)}" y2="${lbl.y.toFixed(1)}"
               stroke="#9ca3af" stroke-width="0.7" stroke-dasharray="2,2"/>`
        : '';
      return `${leader}
        <rect x="${(lbl.x - lbl.w / 2).toFixed(1)}" y="${(lbl.y - lbl.h / 2).toFixed(1)}"
          width="${lbl.w.toFixed(1)}" height="${lbl.h}" rx="2"
          fill="${lbl.bgFill}" stroke="${lbl.border}" stroke-width="0.5"/>
        <text x="${lbl.x.toFixed(1)}" y="${lbl.y.toFixed(1)}"
          font-size="8" fill="${lbl.txtFill}" font-weight="700"
          text-anchor="middle" dominant-baseline="middle">${lbl.text}</text>`;
    }).join('');

    const dots = pts.map(p =>
      `<circle cx="${p.sx.toFixed(1)}" cy="${p.sy.toFixed(1)}" r="2.5" fill="#1a1a1a"/>`
    ).join('');

    return `<svg viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      style="position:absolute;top:0;left:0;width:100%;height:100%;background:#fafafa;border:1px solid #e5e7eb;border-radius:3px;">
      <polyline points="${polyline}" fill="none" stroke="#1a1a1a" stroke-width="2.2"
        stroke-linejoin="round" stroke-linecap="round"/>
      ${diagLines.join('')}
      ${dots}
      ${labelsSvg}
    </svg>`;
  }

  // ── Slot preenchido ───────────────────────────────────────────────────────
  private gerarSlotItem(item: IPedidoItem, seq: number): string {
    const chapa    = item.corte?.chapa?.descricao ?? '-';
    const corte    = item.corte?.descricao ?? '-';
    const corteRef = item.corte?.corte != null ? `${item.corte.corte} cm` : '-';
    const desenho  = item.desenho?.descricao ?? '-';
    const pontos: IPonto[]     = (item.desenho?.pontos   as IPonto[])   ?? [];
    const diagonais: IDiagonal[] = (item.desenho?.diagonais as IDiagonal[]) ?? [];
    const medidas: number[]    = item.medidas ?? [];

    const total = this.calcularTotal(pontos, diagonais, medidas);
    const totalChip = total > 0
      ? `<span class="chip chip--total">Total: ${total} cm</span>` : '';
    const obs = item.observacoes
      ? `<div class="item-obs"><strong>Obs:</strong> ${item.observacoes}</div>` : '';

    return `
    <div class="item-slot item-slot--filled">
      <div class="item-hdr">
        <span class="item-seq">${seq}</span>
        <span class="item-corte">${corte}</span>
        <span class="item-chips">
          <span class="chip">Chapa: ${chapa}</span>
          <span class="chip">Ref: ${corteRef}</span>
          <span class="chip">Desenho: ${desenho}</span>
          <span class="chip">Qtd: ${item.quantidade}</span>
          ${totalChip}
        </span>
      </div>
      <div class="item-body">
        <div class="item-svg">${this.gerarSvg(pontos, diagonais, medidas)}</div>
      </div>
      ${obs}
    </div>`;
  }

  // ── Slot vazio ────────────────────────────────────────────────────────────
  private gerarSlotVazio(): string {
    return `<div class="item-slot item-slot--vazio"></div>`;
  }

  // ── Cabeçalho da empresa ──────────────────────────────────────────────────
  private gerarEmpresaHeader(pedido: IPedido): string {
    const emp = pedido.empresa;
    if (!emp) return '';
    const nomeDisplay = emp.nome_fantasia || emp.razao_social;
    const razaoSecundaria = emp.nome_fantasia
      ? `<div class="empresa-razao">${emp.razao_social}</div>` : '';
    const cnpj  = emp.cnpj     ? `<div class="empresa-detalhe">CNPJ: ${formatCpfCnpj(emp.cnpj)}</div>` : '';
    const tel   = emp.telefone ? `<div class="empresa-detalhe">Tel: ${formatPhone(emp.telefone)}</div>` : '';
    const email = emp.email    ? `<div class="empresa-detalhe">${emp.email}</div>` : '';
    const partes: string[] = [];
    if (emp.endereco) partes.push(emp.endereco + (emp.numero ? ', ' + emp.numero : ''));
    if (emp.bairro) partes.push(emp.bairro);
    const enderecoLinha = partes.length ? `<div class="empresa-detalhe">${partes.join(' — ')}</div>` : '';
    const cidadeLinha = emp.cidade ? `<div class="empresa-detalhe">${emp.cidade.descricao}/${emp.cidade.uf}</div>` : '';
    const cepLinha = emp.cep ? `<div class="empresa-detalhe">CEP: ${emp.cep}</div>` : '';
    return `
    <div class="empresa-header">
      <div class="empresa-info-bloco">
        <div class="empresa-nome">${nomeDisplay}</div>
        ${razaoSecundaria}${cnpj}${tel}${email}
      </div>
      <div class="empresa-endereco-bloco">
        ${enderecoLinha}${cidadeLinha}${cepLinha}
      </div>
    </div>`;
  }

  // ── Páginas com 2 desenhos por linha ─────────────────────────────────────
  private gerarPaginas(pedido: IPedido, itens: IPedidoItem[], qtdPorFolha: number): string {
    const cliente     = pedido.cliente?.razao_social ?? '-';
    const agora       = new Date();
    const dataGeracao = `${formatDate(agora)} ${agora.toTimeString().slice(0, 5)}`;
    const cnpjCpf     = pedido.cliente?.cpf_cnpj
      ? ` | CPF/CNPJ: ${formatCpfCnpj(pedido.cliente.cpf_cnpj)}` : '';
    const telefone    = pedido.cliente?.telefone
      ? ` | Tel: ${formatPhone(pedido.cliente.telefone)}` : '';
    const cidade      = pedido.cliente?.cidade
      ? ` | ${pedido.cliente.cidade.descricao}/${pedido.cliente.cidade.uf}` : '';
    const rowCount = Math.ceil(qtdPorFolha / 2);
    const paginas: IPedidoItem[][] = [];
    for (let i = 0; i < itens.length; i += qtdPorFolha) paginas.push(itens.slice(i, i + qtdPorFolha));
    if (paginas.length === 0) paginas.push([]);

    return paginas.map((grupo, pIdx) => {
      const slots: string[] = [];
      grupo.forEach((item, i) => slots.push(this.gerarSlotItem(item, pIdx * qtdPorFolha + i + 1)));
      const alvo = rowCount * 2;
      while (slots.length < alvo) slots.push(this.gerarSlotVazio());

      const isFirstPage = pIdx === 0;
      const infoCliente = isFirstPage ? `
      <div class="section-cliente">
        <div class="cliente-nome">${cliente}</div>
        <div class="cliente-info">
          <span class="label">Data do Pedido:</span> ${formatDate(pedido.data_pedido)}${cnpjCpf}${telefone}${cidade}
        </div>
      </div>` : '';

      return `
      <div class="pagina-wrapper">
        ${this.gerarEmpresaHeader(pedido)}
        <div class="titulo-row">
          <h2 class="titulo">Ordem de Corte — Pedido Nº ${pedido.id}</h2>
          <span class="titulo-data">Gerado em: ${dataGeracao}${paginas.length > 1 ? ` &nbsp;|&nbsp; Pág. ${pIdx + 1}/${paginas.length}` : ''}</span>
        </div>
        ${infoCliente}
        <div class="slots-area" style="grid-template-rows: repeat(${rowCount}, 1fr);">
          ${slots.join('')}
        </div>
      </div>`;
    }).join('\n');
  }

  // ── HTML completo ─────────────────────────────────────────────────────────
  private gerarHtml(pedido: IPedido, itens: IPedidoItem[]): string {
    const qtdPorFolha = Math.max(2, Math.min(20, pedido.empresa?.quantidade_desenho_por_folha ?? 4));
    const paginas = this.gerarPaginas(pedido, itens, qtdPorFolha);

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Ordem de Corte — Pedido Nº ${pedido.id}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 10px; color: #1a1a1a; background: #fff; }
    .pagina-wrapper {
      display: flex; flex-direction: column;
      height: 277mm; overflow: hidden; page-break-after: always;
    }
    .pagina-wrapper:last-child { page-break-after: auto; }
    .empresa-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      gap: 1rem; padding-bottom: 6px; border-bottom: 2px solid #f97316;
      margin-bottom: 6px; flex-shrink: 0;
    }
    .empresa-nome { font-size: 12px; font-weight: 700; }
    .empresa-razao { font-size: 9px; color: #6b7280; margin-top: 1px; }
    .empresa-detalhe { font-size: 9px; color: #6b7280; margin-top: 1px; }
    .empresa-endereco-bloco { text-align: right; }
    .titulo-row {
      display: flex; justify-content: space-between; align-items: baseline;
      padding-bottom: 4px; border-bottom: 1px solid #e5e7eb;
      margin-bottom: 5px; flex-shrink: 0;
    }
    .titulo { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
    .titulo-data { font-size: 9px; color: #6b7280; }
    .section-cliente {
      margin-bottom: 4px; padding: 4px 7px; background: #f9fafb;
      border-radius: 4px; border: 1px solid #e5e7eb; flex-shrink: 0;
    }
    .cliente-nome { font-size: 11px; font-weight: 700; }
    .cliente-info { font-size: 9px; color: #6b7280; margin-top: 1px; }
    .label { font-weight: 600; color: #374151; }
    .slots-area {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 4px; flex: 1; min-height: 0;
    }
    .item-slot {
      min-height: 0; overflow: hidden; border: 1px solid #d1d5db;
      border-radius: 3px; padding: 4px 6px;
      display: flex; flex-direction: column;
    }
    .item-slot--vazio { background: #f9fafb; border-style: dashed; border-color: #e5e7eb; }
    .item-hdr {
      display: flex; align-items: center; gap: 4px;
      margin-bottom: 3px; flex-wrap: wrap; flex-shrink: 0;
    }
    .item-seq {
      background: #1a1a1a; color: #fff; border-radius: 50%;
      width: 15px; height: 15px; display: flex; align-items: center;
      justify-content: center; font-size: 8px; font-weight: 700; flex-shrink: 0;
    }
    .item-corte { font-size: 10px; font-weight: 700; }
    .item-chips { display: flex; flex-wrap: wrap; gap: 2px; }
    .chip {
      background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 3px;
      padding: 1px 4px; font-size: 8px; color: #374151;
    }
    .chip--total { background: #dbeafe; border-color: #93c5fd; color: #1d4ed8; font-weight: 700; }
    .item-body { flex: 1; min-height: 0; display: flex; }
    .item-svg { flex: 1; min-height: 0; position: relative; overflow: hidden; }
    .item-obs { font-size: 8px; color: #6b7280; margin-top: 2px; flex-shrink: 0; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { size: A4 portrait; margin: 10mm 12mm 10mm 12mm; }
    }
  </style>
</head>
<body>
  ${paginas}
</body>
</html>`;
  }
}
