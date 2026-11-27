"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endireitarTraco = endireitarTraco;
exports.resolverDesenhoItem = resolverDesenhoItem;
exports.endireitarTransversal = endireitarTransversal;
function endireitarTraco(bruto, opcoes = {}) {
    const tolerancia = opcoes.tolerancia ?? 14;
    const minLen = opcoes.comprimentoMinimo ?? 18;
    const snap = opcoes.snapAngulo ?? 10;
    const pontos = removerPontosProximos(bruto, 2);
    if (pontos.length < 2)
        return [];
    let simplificado = douglasPeucker(pontos, tolerancia);
    simplificado = removerSegmentosCurtos(simplificado, minLen);
    if (simplificado.length < 2)
        return [];
    let resultado = ajustarAngulos(simplificado, snap);
    resultado = unirColineares(resultado);
    return resultado.map(p => ({ x: arred(p.x), y: arred(p.y) }));
}
function resolverDesenhoItem(item) {
    if (item.desenho && Array.isArray(item.desenho.pontos)) {
        return {
            descricao: item.desenho.descricao ?? '-',
            pontos: item.desenho.pontos,
            diagonais: (Array.isArray(item.desenho.diagonais) ? item.desenho.diagonais : []),
            livre: false,
        };
    }
    if (Array.isArray(item.desenho_pontos) && item.desenho_pontos.length >= 2) {
        const diagonais = Array.isArray(item.desenho_diagonais) ? item.desenho_diagonais : [];
        return { descricao: 'Desenho livre', pontos: item.desenho_pontos, diagonais, livre: true };
    }
    return null;
}
function arred(n) {
    return Math.round(n * 10) / 10;
}
function removerPontosProximos(pts, dist) {
    const out = [];
    for (const p of pts) {
        if (!Number.isFinite(p.x) || !Number.isFinite(p.y))
            continue;
        const ult = out[out.length - 1];
        if (!ult || Math.hypot(p.x - ult.x, p.y - ult.y) >= dist)
            out.push({ x: p.x, y: p.y });
    }
    const ultimoBruto = pts[pts.length - 1];
    if (out.length && ultimoBruto && out[out.length - 1] !== ultimoBruto) {
        out[out.length - 1] = { x: ultimoBruto.x, y: ultimoBruto.y };
    }
    return out;
}
function distanciaAoSegmento(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0)
        return Math.hypot(p.x - a.x, p.y - a.y);
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}
function douglasPeucker(pts, eps) {
    if (pts.length < 3)
        return pts.slice();
    const manter = new Array(pts.length).fill(false);
    manter[0] = manter[pts.length - 1] = true;
    const pilha = [[0, pts.length - 1]];
    while (pilha.length) {
        const [ini, fim] = pilha.pop();
        let maxDist = 0, idx = -1;
        for (let i = ini + 1; i < fim; i++) {
            const d = distanciaAoSegmento(pts[i], pts[ini], pts[fim]);
            if (d > maxDist) {
                maxDist = d;
                idx = i;
            }
        }
        if (idx !== -1 && maxDist > eps) {
            manter[idx] = true;
            pilha.push([ini, idx], [idx, fim]);
        }
    }
    return pts.filter((_, i) => manter[i]);
}
function removerSegmentosCurtos(pts, minLen) {
    if (pts.length <= 2)
        return pts;
    const out = [pts[0]];
    for (let i = 1; i < pts.length - 1; i++) {
        const ult = out[out.length - 1];
        if (Math.hypot(pts[i].x - ult.x, pts[i].y - ult.y) >= minLen)
            out.push(pts[i]);
    }
    const fim = pts[pts.length - 1];
    const ult = out[out.length - 1];
    if (out.length > 1 && Math.hypot(fim.x - ult.x, fim.y - ult.y) < minLen)
        out[out.length - 1] = fim;
    else
        out.push(fim);
    return out;
}
function ajustarAngulos(pts, snapGraus) {
    const out = [{ ...pts[0] }];
    const passo = Math.PI / 4;
    const lim = (snapGraus * Math.PI) / 180;
    for (let i = 1; i < pts.length; i++) {
        const dx = pts[i].x - pts[i - 1].x, dy = pts[i].y - pts[i - 1].y;
        const len = Math.hypot(dx, dy);
        let ang = Math.atan2(dy, dx);
        const alvo = Math.round(ang / passo) * passo;
        if (Math.abs(ang - alvo) <= lim)
            ang = alvo;
        const ult = out[out.length - 1];
        out.push({ x: ult.x + Math.cos(ang) * len, y: ult.y + Math.sin(ang) * len });
    }
    return out;
}
function unirColineares(pts) {
    if (pts.length < 3)
        return pts;
    const out = [pts[0]];
    for (let i = 1; i < pts.length - 1; i++) {
        const a = out[out.length - 1], b = pts[i], c = pts[i + 1];
        const a1 = Math.atan2(b.y - a.y, b.x - a.x);
        const a2 = Math.atan2(c.y - b.y, c.x - b.x);
        let diff = Math.abs(a1 - a2);
        if (diff > Math.PI)
            diff = 2 * Math.PI - diff;
        if (diff > (2 * Math.PI) / 180)
            out.push(b);
    }
    out.push(pts[pts.length - 1]);
    return out;
}
function endireitarTransversal(bruto, desenho, opcoes = {}) {
    const minLen = opcoes.comprimentoMinimo ?? 20;
    const raio = opcoes.raioIma ?? 25;
    const pts = removerPontosProximos(bruto, 2);
    if (pts.length < 2)
        return null;
    const ini = pts[0], fim = pts[pts.length - 1];
    if (Math.hypot(fim.x - ini.x, fim.y - ini.y) < minLen)
        return null;
    const [a, b] = ajustarAngulos([ini, fim], opcoes.snapAngulo ?? 10);
    const p1 = imaNoDesenho(a, desenho, raio);
    const p2 = imaNoDesenho(b, desenho, raio);
    if (Math.hypot(p2.x - p1.x, p2.y - p1.y) < minLen)
        return null;
    return { p1: { x: arred(p1.x), y: arred(p1.y) }, p2: { x: arred(p2.x), y: arred(p2.y) } };
}
function imaNoDesenho(p, desenho, raio) {
    let melhor = null, dist = raio;
    for (const v of desenho) {
        const d = Math.hypot(p.x - v.x, p.y - v.y);
        if (d <= dist) {
            dist = d;
            melhor = v;
        }
    }
    if (melhor)
        return { ...melhor };
    dist = raio * 0.8;
    for (let i = 0; i < desenho.length - 1; i++) {
        const a = desenho[i], b = desenho[i + 1];
        const dx = b.x - a.x, dy = b.y - a.y;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0)
            continue;
        const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
        const proj = { x: a.x + t * dx, y: a.y + t * dy };
        const d = Math.hypot(p.x - proj.x, p.y - proj.y);
        if (d <= dist) {
            dist = d;
            melhor = proj;
        }
    }
    return melhor ?? p;
}
//# sourceMappingURL=desenho-livre.functions.js.map