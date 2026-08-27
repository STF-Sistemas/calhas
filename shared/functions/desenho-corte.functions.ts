import { IPonto, IDiagonal } from '../interfaces/IDesenho';

// ── Total de material (mesma lógica usada no editor de desenho e nas impressões) ──
export function calcularTotalCorte(pontos: IPonto[], diagonais: IDiagonal[], medidas: number[]): number {
  const baseSeg = Math.max(0, pontos.length - 1);
  const cobertos = segmentosCobertosCorte(pontos, diagonais);
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

function segmentosCobertosCorte(pontos: IPonto[], diagonais: IDiagonal[]): Set<number> {
  const set = new Set<number>();
  diagonais.forEach(d => {
    const idx = segmentoCobertoCorte(pontos, d);
    if (idx >= 0) set.add(idx);
  });
  return set;
}

function segmentoCobertoCorte(pontos: IPonto[], d: IDiagonal): number {
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

// ── Resolução de sobreposição de labels (AABB) ──────────────────────────────
interface ILabelCorte {
  x: number; y: number; w: number; h: number;
  mx: number; my: number;
  text: string; bgFill: string; border: string; txtFill: string;
}

function resolverSobreposicoesCorte(labels: ILabelCorte[], vw: number, vh: number): void {
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

// ── SVG do desenho com diagonais e medidas ──────────────────────────────────
// Usado na impressão da Ordem de Corte e na página pública enviada ao fornecedor.
export function gerarSvgCorte(pontos: IPonto[], diagonais: IDiagonal[], medidas: number[]): string {
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
  const cobertos = segmentosCobertosCorte(pontos, diagonais);

  const lblData: ILabelCorte[] = [];

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

    diagLines.push(
      `<line x1="${dp1.sx.toFixed(1)}" y1="${dp1.sy.toFixed(1)}"
             x2="${dp2.sx.toFixed(1)}" y2="${dp2.sy.toFixed(1)}"
             stroke="#1a1a1a" stroke-width="2.2" stroke-linecap="round"/>`
    );

    const dx = dp2.sx - dp1.sx, dy = dp2.sy - dp1.sy;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len, ny = dx / len;

    const t1 = m1 > 0 ? `${m1}cm` : `D${i + 1}P1`;
    const w1 = Math.max(20, t1.length * 5.8 + 6);
    lblData.push({
      x: dp1.sx + nx * 14, y: dp1.sy + ny * 14,
      mx: dp1.sx, my: dp1.sy, w: w1, h: 12, text: t1,
      bgFill: m1 > 0 ? '#fef3c7' : '#f3f4f6',
      border: m1 > 0 ? '#fcd34d' : '#d1d5db',
      txtFill: m1 > 0 ? '#92400e' : '#6b7280',
    });

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

  resolverSobreposicoesCorte(lblData, VW, VH);

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
