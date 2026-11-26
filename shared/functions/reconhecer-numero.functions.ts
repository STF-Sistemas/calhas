import { IPonto } from '../interfaces/IDesenho';

/**
 * Reconhecimento local (offline) de números escritos à mão, ex.: "1,33".
 *
 * 1. Agrupa os traços em caracteres pela sobreposição horizontal.
 * 2. Caracteres pequenos e baixos viram vírgula/ponto decimal.
 * 3. Cada caractere é comparado com modelos de dígitos usando o algoritmo $P
 *    (nuvem de pontos — independe da ordem e do sentido dos traços).
 */

export type ITraco = IPonto[];

export interface IResultadoNumero {
  texto: string;       // ex.: "1,33"
  valor: number;       // ex.: 1.33
  caracteres: { char: string; minX: number; maxX: number; minY: number; maxY: number }[];
}

export function reconhecerNumero(tracos: ITraco[]): IResultadoNumero | null {
  const validos = tracos.filter(t => t.length > 0);
  if (!validos.length) return null;

  const grupos = agruparCaracteres(validos);
  const alturas = grupos.map(g => g.maxY - g.minY);
  const alturaLinha = Math.max(...alturas, 1);
  const baseLinha = Math.max(...grupos.map(g => g.maxY));
  const topoLinha = Math.min(...grupos.map(g => g.minY));

  const caracteres: IResultadoNumero['caracteres'] = [];
  for (const g of grupos) {
    const h = g.maxY - g.minY, w = g.maxX - g.minX;
    const centroY = (g.minY + g.maxY) / 2;
    const pequeno = h < alturaLinha * 0.45 && w < alturaLinha * 0.45;
    const embaixo = centroY > topoLinha + (baseLinha - topoLinha) * 0.55;
    let char: string;
    if (grupos.length > 1 && pequeno && embaixo) char = ',';
    else if (w < h * 0.28) char = '1';
    else char = classificarDigito(g.tracos);
    caracteres.push({ char, minX: g.minX, maxX: g.maxX, minY: g.minY, maxY: g.maxY });
  }

  // Monta o texto: só a primeira vírgula vale; vírgula no início/fim é descartada.
  let texto = '';
  for (const c of caracteres) {
    if (c.char === ',') {
      if (!texto || texto.includes(',')) continue;
    }
    texto += c.char;
  }
  texto = texto.replace(/,$/, '');
  if (!/\d/.test(texto)) return null;

  const valor = Number(texto.replace(',', '.'));
  if (!Number.isFinite(valor)) return null;
  return { texto, valor, caracteres };
}

// ── Agrupamento ─────────────────────────────────────────────────────────────

interface IGrupo { tracos: ITraco[]; minX: number; maxX: number; minY: number; maxY: number; }

function caixa(t: ITraco) {
  const xs = t.map(p => p.x), ys = t.map(p => p.y);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}

function agruparCaracteres(tracos: ITraco[]): IGrupo[] {
  const itens = tracos.map(t => ({ t, ...caixa(t) })).sort((a, b) => a.minX - b.minX);
  const grupos: IGrupo[] = [];
  for (const it of itens) {
    const ult = grupos[grupos.length - 1];
    if (ult) {
      const sobreposicao = Math.min(ult.maxX, it.maxX) - Math.max(ult.minX, it.minX);
      const menor = Math.max(1, Math.min(ult.maxX - ult.minX, it.maxX - it.minX));
      // Traços que se sobrepõem bastante na horizontal pertencem ao mesmo caractere (ex.: 4, 5, 7 cortado)
      if (sobreposicao > menor * 0.4) {
        ult.tracos.push(it.t);
        ult.minX = Math.min(ult.minX, it.minX); ult.maxX = Math.max(ult.maxX, it.maxX);
        ult.minY = Math.min(ult.minY, it.minY); ult.maxY = Math.max(ult.maxY, it.maxY);
        continue;
      }
    }
    grupos.push({ tracos: [it.t], minX: it.minX, maxX: it.maxX, minY: it.minY, maxY: it.maxY });
  }
  return grupos;
}

// ── $P point-cloud recognizer ───────────────────────────────────────────────

const N = 32;

interface IPt { x: number; y: number; id: number; }

function normalizar(tracos: ITraco[]): IPt[] {
  let pts: IPt[] = [];
  // Espaçamento mínimo proporcional ao tamanho: o tremor não infla o comprimento das curvas
  const todos = tracos.flat();
  const tamCaixa = Math.max(
    Math.max(...todos.map(p => p.x)) - Math.min(...todos.map(p => p.x)),
    Math.max(...todos.map(p => p.y)) - Math.min(...todos.map(p => p.y)),
  ) || 1;
  tracos.forEach((t, id) => suavizar(preencher(espacar(t, tamCaixa * 0.04), tamCaixa * 0.04)).forEach(p => pts.push({ x: p.x, y: p.y, id })));
  pts = reamostrar(pts, N);
  // Escala uniforme (mantém proporção) + translada para o centróide
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const minX = Math.min(...xs), minY = Math.min(...ys);
  const tam = Math.max(Math.max(...xs) - minX, Math.max(...ys) - minY) || 1;
  pts = pts.map(p => ({ x: (p.x - minX) / tam, y: (p.y - minY) / tam, id: p.id }));
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  return pts.map(p => ({ x: p.x - cx, y: p.y - cy, id: p.id }));
}

function espacar(t: ITraco, min: number): ITraco {
  const out: ITraco = [t[0]];
  for (let i = 1; i < t.length; i++) {
    const u = out[out.length - 1];
    if (Math.hypot(t[i].x - u.x, t[i].y - u.y) >= min) out.push(t[i]);
  }
  if (t.length > 1 && out[out.length - 1] !== t[t.length - 1]) out.push(t[t.length - 1]);
  return out;
}

/** Interpola pontos em trechos longos para que todo o traço tenha densidade parecida. */
function preencher(t: ITraco, passo: number): ITraco {
  const out: ITraco = [t[0]];
  for (let i = 1; i < t.length; i++) {
    const a = t[i - 1], b = t[i];
    const k = Math.floor(Math.hypot(b.x - a.x, b.y - a.y) / passo);
    for (let j = 1; j < k; j++) out.push({ x: a.x + ((b.x - a.x) * j) / k, y: a.y + ((b.y - a.y) * j) / k });
    out.push(b);
  }
  return out;
}

/** Média móvel curta: remove o tremor do dedo sem deformar o caractere. */
function suavizar(t: ITraco): ITraco {
  if (t.length < 4) return t;
  return t.map((_, i) => {
    if (i === 0 || i === t.length - 1) return t[i];
    const ini = Math.max(0, i - 1), fim = Math.min(t.length - 1, i + 1);
    let sx = 0, sy = 0;
    for (let k = ini; k <= fim; k++) { sx += t[k].x; sy += t[k].y; }
    const n = fim - ini + 1;
    return { x: sx / n, y: sy / n };
  });
}

function comprimento(pts: IPt[]): number {
  let d = 0;
  for (let i = 1; i < pts.length; i++) if (pts[i].id === pts[i - 1].id) d += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  return d;
}

function reamostrar(entrada: IPt[], n: number): IPt[] {
  if (entrada.length === 1) return Array.from({ length: n }, () => ({ ...entrada[0] }));
  const pts = entrada.map(p => ({ ...p }));
  const I = comprimento(pts) / (n - 1);
  if (I === 0) return Array.from({ length: n }, () => ({ ...pts[0] }));
  let D = 0;
  const out: IPt[] = [{ ...pts[0] }];
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].id !== pts[i - 1].id) continue;
    const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (D + d >= I) {
      const t = (I - D) / d;
      const q = { x: pts[i - 1].x + t * (pts[i].x - pts[i - 1].x), y: pts[i - 1].y + t * (pts[i].y - pts[i - 1].y), id: pts[i].id };
      out.push(q);
      pts.splice(i, 0, q);
      D = 0;
    } else {
      D += d;
    }
  }
  while (out.length < n) out.push({ ...pts[pts.length - 1] });
  return out.slice(0, n);
}

function distanciaNuvem(a: IPt[], b: IPt[], inicio: number): number {
  const n = a.length;
  const usado = new Array<boolean>(n).fill(false);
  let soma = 0, i = inicio;
  do {
    let min = Infinity, idx = -1;
    for (let j = 0; j < n; j++) {
      if (usado[j]) continue;
      const d = Math.hypot(a[i].x - b[j].x, a[i].y - b[j].y);
      if (d < min) { min = d; idx = j; }
    }
    usado[idx] = true;
    const peso = 1 - ((i - inicio + n) % n) / n;
    soma += peso * min;
    i = (i + 1) % n;
  } while (i !== inicio);
  return soma;
}

function compararNuvens(a: IPt[], b: IPt[]): number {
  const passo = Math.floor(Math.pow(a.length, 0.5));
  let min = Infinity;
  for (let i = 0; i < a.length; i += passo) {
    min = Math.min(min, distanciaNuvem(a, b, i), distanciaNuvem(b, a, i));
  }
  return min;
}

function classificarDigito(tracos: ITraco[]): string {
  const nuvem = normalizar(tracos);
  let melhor = '?', menor = Infinity;
  for (const m of obterModelos()) {
    const d = compararNuvens(nuvem, m.nuvem);
    if (d < menor) { menor = d; melhor = m.digito; }
  }
  return melhor;
}

// ── Modelos de dígitos (caixa ~0.6 x 1, y para baixo) ────────────────────────

function arco(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, passos = 16): IPonto[] {
  const pts: IPonto[] = [];
  for (let k = 0; k <= passos; k++) {
    const a = ((a0 + (a1 - a0) * (k / passos)) * Math.PI) / 180;
    pts.push({ x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) });
  }
  return pts;
}

function linha(...coords: [number, number][]): IPonto[] {
  return coords.map(([x, y]) => ({ x, y }));
}

function oito(): IPonto[] {
  const pts: IPonto[] = [];
  for (let k = 0; k <= 32; k++) {
    const t = (k / 32) * Math.PI * 2;
    pts.push({ x: 0.3 - 0.26 * Math.sin(2 * t), y: 0.5 - 0.5 * Math.cos(t) });
  }
  return pts;
}

let modelosCache: { digito: string; nuvem: IPt[] }[] | null = null;

function obterModelos() {
  if (modelosCache) return modelosCache;
  const barriga5 = arco(0.28, 0.7, 0.3, 0.3, 225, 495);
  const def: [string, ITraco[]][] = [
    ['0', [arco(0.3, 0.5, 0.3, 0.5, -90, 270)]],
    ['0', [arco(0.3, 0.5, 0.2, 0.5, -90, 270)]],
    ['1', [linha([0.1, 0.25], [0.3, 0], [0.3, 1])]],
    ['1', [linha([0.1, 0.25], [0.3, 0], [0.3, 1]), linha([0.1, 1], [0.5, 1])]],
    ['2', [[...arco(0.3, 0.28, 0.28, 0.28, 180, 400), ...linha([0, 1], [0.6, 1])]]],
    ['2', [[...arco(0.3, 0.3, 0.3, 0.3, 200, 380), ...linha([0.05, 1], [0.6, 0.98])]]],
    ['3', [[...arco(0.3, 0.25, 0.28, 0.25, 200, 450), ...arco(0.3, 0.75, 0.3, 0.25, 270, 520)]]],
    ['3', [[...linha([0, 0], [0.55, 0], [0.25, 0.42]), ...arco(0.3, 0.72, 0.3, 0.28, 270, 520)]]],
    ['4', [linha([0.4, 0], [0, 0.65], [0.6, 0.65]), linha([0.45, 0.3], [0.45, 1])]],
    ['4', [linha([0.05, 0], [0.05, 0.6], [0.6, 0.6]), linha([0.45, 0.05], [0.45, 1])]],
    ['4', [linha([0.45, 1], [0.45, 0], [0, 0.65], [0.6, 0.65])]],
    ['5', [[...linha([0.55, 0], [0.08, 0], [0.05, 0.45]), ...barriga5]]],
    ['5', [[...linha([0.05, 0], [0.05, 0.45]), ...barriga5], linha([0.05, 0], [0.55, 0])]],
    ['6', [[...linha([0.5, 0], [0.25, 0.15], [0.08, 0.4], [0.03, 0.7]), ...arco(0.3, 0.75, 0.27, 0.25, 180, 540)]]],
    ['7', [linha([0, 0], [0.6, 0], [0.2, 1])]],
    ['7', [linha([0, 0], [0.6, 0], [0.2, 1]), linha([0.15, 0.5], [0.55, 0.5])]],
    ['8', [oito()]],
    ['9', [[...arco(0.3, 0.27, 0.27, 0.27, 0, 360), ...linha([0.57, 0.27], [0.5, 1])]]],
    ['9', [[...arco(0.3, 0.27, 0.27, 0.27, 0, 360), ...linha([0.57, 0.27], [0.55, 0.7], [0.35, 1])]]],
  ];
  modelosCache = def.map(([digito, tracos]) => ({ digito, nuvem: normalizar(tracos) }));
  return modelosCache;
}
