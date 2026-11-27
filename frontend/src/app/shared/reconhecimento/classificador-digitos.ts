import { IPonto } from '#shared/interfaces';
import { MODELO_DIGITOS } from './modelo-digitos';

const LADO = 28;
const CAIXA = 20;
const RAIO = 1.1;

interface IPesos {
  c1w: Float32Array;
  c1b: Float32Array;
  c2w: Float32Array;
  c2b: Float32Array;
  f1w: Float32Array;
  f1b: Float32Array;
  f2w: Float32Array;
  f2b: Float32Array;
}

let pesosCache: IPesos | null = null;

function pesos(): IPesos {
  if (pesosCache) return pesosCache;
  const binario = atob(MODELO_DIGITOS.pesos);
  const bytes = new Int8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = (binario.charCodeAt(i) << 24) >> 24;
  const ordem = ['c1w', 'c1b', 'c2w', 'c2b', 'f1w', 'f1b', 'f2w', 'f2b'] as const;
  const saida = {} as IPesos;
  let pos = 0;
  for (const chave of ordem) {
    const meta = MODELO_DIGITOS.meta[chave];
    const total = (meta.forma as readonly number[]).reduce((a: number, b: number) => a * b, 1);
    const arr = new Float32Array(total);
    for (let i = 0; i < total; i++) arr[i] = bytes[pos + i] * meta.escala;
    saida[chave] = arr;
    pos += total;
  }
  pesosCache = saida;
  return saida;
}

function desenharSegmentos(img: Float32Array, segs: [IPonto, IPonto][]): void {
  for (const [a, b] of segs) {
    const x0 = Math.max(0, Math.floor(Math.min(a.x, b.x) - RAIO - 1));
    const x1 = Math.min(LADO - 1, Math.ceil(Math.max(a.x, b.x) + RAIO + 1));
    const y0 = Math.max(0, Math.floor(Math.min(a.y, b.y) - RAIO - 1));
    const y1 = Math.min(LADO - 1, Math.ceil(Math.max(a.y, b.y) + RAIO + 1));
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const comp2 = dx * dx + dy * dy;
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const px = x + 0.5;
        const py = y + 0.5;
        const t = comp2 ? Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / comp2)) : 0;
        const d = Math.hypot(px - (a.x + t * dx), py - (a.y + t * dy));
        const v = Math.max(0, Math.min(1, RAIO + 0.5 - d));
        const i = y * LADO + x;
        if (v > img[i]) img[i] = v;
      }
    }
  }
}

export function rasterizarDigito(tracos: IPonto[][]): Float32Array {
  const todos = tracos.flat();
  const xs = todos.map((p) => p.x);
  const ys = todos.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const w = Math.max(...xs) - minX;
  const h = Math.max(...ys) - minY;
  const escala = CAIXA / Math.max(w, h, 1e-6);
  const montar = (ox: number, oy: number) => {
    const segs: [IPonto, IPonto][] = [];
    for (const t of tracos) {
      const pts = t.map((p) => ({ x: (p.x - minX) * escala + ox, y: (p.y - minY) * escala + oy }));
      if (pts.length === 1) segs.push([pts[0], pts[0]]);
      for (let i = 1; i < pts.length; i++) segs.push([pts[i - 1], pts[i]]);
    }
    const img = new Float32Array(LADO * LADO);
    desenharSegmentos(img, segs);
    return img;
  };
  const ox = (LADO - w * escala) / 2;
  const oy = (LADO - h * escala) / 2;
  const inicial = montar(ox, oy);
  let soma = 0;
  let sx = 0;
  let sy = 0;
  for (let y = 0; y < LADO; y++) {
    for (let x = 0; x < LADO; x++) {
      const v = inicial[y * LADO + x];
      soma += v;
      sx += v * x;
      sy += v * y;
    }
  }
  if (!soma) return inicial;
  return montar(ox + (LADO / 2 - 0.5 - sx / soma), oy + (LADO / 2 - 0.5 - sy / soma));
}

function convolucao(entrada: Float32Array, canais: number, lado: number, w: Float32Array, b: Float32Array): Float32Array {
  const filtros = b.length;
  const saida = new Float32Array(filtros * lado * lado);
  for (let f = 0; f < filtros; f++) {
    for (let y = 0; y < lado; y++) {
      for (let x = 0; x < lado; x++) {
        let soma = b[f];
        for (let c = 0; c < canais; c++) {
          const baseW = (f * canais + c) * 25;
          const baseE = c * lado * lado;
          for (let i = 0; i < 5; i++) {
            const yy = y + i - 2;
            if (yy < 0 || yy >= lado) continue;
            for (let j = 0; j < 5; j++) {
              const xx = x + j - 2;
              if (xx < 0 || xx >= lado) continue;
              soma += entrada[baseE + yy * lado + xx] * w[baseW + i * 5 + j];
            }
          }
        }
        saida[(f * lado + y) * lado + x] = soma > 0 ? soma : 0;
      }
    }
  }
  return saida;
}

function reduzir(entrada: Float32Array, canais: number, lado: number): Float32Array {
  const metade = lado / 2;
  const saida = new Float32Array(canais * metade * metade);
  for (let c = 0; c < canais; c++) {
    for (let y = 0; y < metade; y++) {
      for (let x = 0; x < metade; x++) {
        const base = c * lado * lado;
        const i = base + y * 2 * lado + x * 2;
        saida[(c * metade + y) * metade + x] = Math.max(entrada[i], entrada[i + 1], entrada[i + lado], entrada[i + lado + 1]);
      }
    }
  }
  return saida;
}

function densa(entrada: Float32Array, w: Float32Array, b: Float32Array, relu: boolean): Float32Array {
  const saidas = b.length;
  const out = new Float32Array(saidas);
  for (let j = 0; j < saidas; j++) out[j] = b[j];
  for (let i = 0; i < entrada.length; i++) {
    const v = entrada[i];
    if (!v) continue;
    const base = i * saidas;
    for (let j = 0; j < saidas; j++) out[j] += v * w[base + j];
  }
  if (relu) for (let j = 0; j < saidas; j++) if (out[j] < 0) out[j] = 0;
  return out;
}

export function probabilidadesDigito(img: Float32Array): number[] {
  const p = pesos();
  const c1 = reduzir(convolucao(img, 1, LADO, p.c1w, p.c1b), p.c1b.length, LADO);
  const c2 = reduzir(convolucao(c1, p.c1b.length, LADO / 2, p.c2w, p.c2b), p.c2b.length, LADO / 2);
  const oculta = densa(c2, p.f1w, p.f1b, true);
  const logits = densa(oculta, p.f2w, p.f2b, false);
  const maior = Math.max(...logits);
  const exps = Array.from(logits, (v) => Math.exp(v - maior));
  const total = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / total);
}

export function classificarDigitoRede(tracos: IPonto[][]): string {
  const probs = probabilidadesDigito(rasterizarDigito(tracos));
  let melhor = 0;
  for (let i = 1; i < probs.length; i++) if (probs[i] > probs[melhor]) melhor = i;
  return String(melhor);
}
