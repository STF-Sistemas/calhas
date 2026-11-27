import { IPonto } from '../interfaces/IDesenho';

export type ITraco = IPonto[];

export interface IResultadoNumero {
  texto: string;
  valor: number;
  caracteres: { char: string; minX: number; maxX: number; minY: number; maxY: number }[];
}

export type TClassificador = (tracos: ITraco[]) => string;

export function reconhecerNumero(tracos: ITraco[], classificar: TClassificador = classificarDigito): IResultadoNumero | null {
  const validos = tracos.filter(t => t.length > 0);
  if (!validos.length) return null;

  const todasCaixas = validos.map(t => ({ t, ...caixa(t) }));
  const maiorLado = Math.max(...todasCaixas.map(c => Math.max(c.maxY - c.minY, c.maxX - c.minX)), 1);
  const caixas = todasCaixas;
  const alturaLinha = Math.max(...caixas.map(c => c.maxY - c.minY), 1);
  const topoLinha = Math.min(...caixas.map(c => c.minY));
  const ehVirgula = (c: { minY: number; maxY: number; minX: number; maxX: number }) => {
    const h = c.maxY - c.minY, w = c.maxX - c.minX;
    if (c.minY <= topoLinha + alturaLinha * 0.6) return false;
    if (h < alturaLinha * 0.2 && w < alturaLinha * 0.2) return true;
    return h < alturaLinha * 0.65 && w < alturaLinha * 0.55 && h >= w * 0.6;
  };

  const virgulas = caixas.length > 1 ? caixas.filter(ehVirgula) : [];
  const ehMiudo = (c: { minY: number; maxY: number; minX: number; maxX: number }) =>
    Math.max(c.maxY - c.minY, c.maxX - c.minX) < Math.max(alturaLinha, maiorLado) * 0.12;
  const digitos = caixas.filter(c => !virgulas.includes(c) && !(caixas.length > 1 && ehMiudo(c)));
  if (!digitos.length) return null;

  const caracteres: IResultadoNumero['caracteres'] = [];
  for (const g of agruparCaracteres(digitos.map(c => c.t), alturaLinha)) {
    const h = g.maxY - g.minY, w = g.maxX - g.minX;
    const char = w < h * 0.2 ? '1' : classificar(g.tracos);
    caracteres.push({ char, minX: g.minX, maxX: g.maxX, minY: g.minY, maxY: g.maxY });
  }
  for (const v of virgulas) {
    caracteres.push({ char: ',', minX: v.minX, maxX: v.maxX, minY: v.minY, maxY: v.maxY });
  }
  caracteres.sort((a, b) => (a.char === ',' ? a.maxX : (a.minX + a.maxX) / 2) - (b.char === ',' ? b.maxX : (b.minX + b.maxX) / 2));

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

interface IGrupo { tracos: ITraco[]; minX: number; maxX: number; minY: number; maxY: number; }

function caixa(t: ITraco) {
  const xs = t.map(p => p.x), ys = t.map(p => p.y);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}

function juntar(a: IGrupo, b: IGrupo): void {
  a.tracos.push(...b.tracos);
  a.minX = Math.min(a.minX, b.minX); a.maxX = Math.max(a.maxX, b.maxX);
  a.minY = Math.min(a.minY, b.minY); a.maxY = Math.max(a.maxY, b.maxY);
}

function sobreposicaoX(a: IGrupo, b: IGrupo): number {
  return Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX);
}

function contido(a: IGrupo, b: IGrupo, altura: number): boolean {
  const folga = altura * 0.04;
  const dentro = (x: IGrupo, y: IGrupo) => y.minX >= x.minX - folga && y.maxX <= x.maxX + folga && x.maxX - x.minX > y.maxX - y.minX;
  return dentro(a, b) || dentro(b, a);
}

function ehRisco(g: IGrupo, altura: number): boolean {
  const h = g.maxY - g.minY, w = g.maxX - g.minX;
  return h > altura * 0.6 && w < h * 0.3;
}

function agruparCaracteres(tracos: ITraco[], altura: number): IGrupo[] {
  const grupos: IGrupo[] = [];
  for (const t of tracos) {
    const c = caixa(t);
    const novo: IGrupo = { tracos: [t], ...c };
    const ult = grupos[grupos.length - 1];
    if (ult) {
      const sob = sobreposicaoX(ult, novo);
      const menor = Math.max(1, Math.min(ult.maxX - ult.minX, novo.maxX - novo.minX));
      const largura = Math.max(ult.maxX, novo.maxX) - Math.min(ult.minX, novo.minX);
      const doisRiscos = ehRisco(ult, altura) && ehRisco(novo, altura);
      const hUlt = ult.maxY - ult.minY, hNovo = novo.maxY - novo.minY;
      const parcial = Math.min(hUlt, hNovo) < Math.max(hUlt, hNovo) * 0.75;
      const encosta = sob > -altura * 0.08 && largura < altura * 0.85 && !doisRiscos && parcial;
      if (sob > menor * 0.4 || encosta || contido(ult, novo, altura)) {
        juntar(ult, novo);
        continue;
      }
    }
    grupos.push(novo);
  }
  let mudou = true;
  while (mudou) {
    mudou = false;
    for (let i = 0; i < grupos.length && !mudou; i++) {
      for (let j = i + 1; j < grupos.length; j++) {
        const menor = Math.max(1, Math.min(grupos[i].maxX - grupos[i].minX, grupos[j].maxX - grupos[j].minX));
        if (sobreposicaoX(grupos[i], grupos[j]) > menor * 0.5 || contido(grupos[i], grupos[j], altura)) {
          juntar(grupos[i], grupos[j]);
          grupos.splice(j, 1);
          mudou = true;
          break;
        }
      }
    }
  }
  return grupos.sort((a, b) => a.minX - b.minX);
}

const N = 32;

interface IPt { x: number; y: number; id: number; }

function normalizar(tracos: ITraco[]): IPt[] {
  let pts: IPt[] = [];
  const todos = tracos.flat();
  const tamCaixa = Math.max(
    Math.max(...todos.map(p => p.x)) - Math.min(...todos.map(p => p.x)),
    Math.max(...todos.map(p => p.y)) - Math.min(...todos.map(p => p.y)),
  ) || 1;
  tracos.forEach((t, id) => suavizar(preencher(espacar(t, tamCaixa * 0.04), tamCaixa * 0.04)).forEach(p => pts.push({ x: p.x, y: p.y, id })));
  pts = reamostrar(pts, N);
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
  const extras: [string, ITraco[]][] = [
    ['2', [[...arco(0.25, 0.22, 0.2, 0.22, 190, 380), ...linha([0.42, 0.3], [0.05, 1], [0.75, 1])]]],
    ['2', [[...arco(0.3, 0.25, 0.25, 0.25, 180, 390), ...linha([0.5, 0.4], [0.1, 0.85]), ...arco(0.12, 0.9, 0.1, 0.1, 270, 90), ...linha([0.12, 0.9], [0.6, 1])]]],
    ['5', [[...linha([0.05, 0], [0.05, 0.45]), ...arco(0.4, 0.68, 0.4, 0.3, 225, 495)], linha([0.05, 0], [0.7, 0])]],
    ['5', [[...linha([0.6, 0], [0.05, 0], [0.05, 0.4]), ...arco(0.4, 0.68, 0.4, 0.3, 225, 495)]]],
  ];
  const estirar = (tracos: ITraco[], fx: number): ITraco[] => tracos.map(t => t.map(p => ({ x: p.x * fx, y: p.y })));
  const base = [...def, ...extras];
  modelosCache = base.flatMap(([digito, tracos]) =>
    (digito === '1' ? [1] : [0.75, 1, 1.4]).map(fx => ({ digito, nuvem: normalizar(estirar(tracos, fx)) })),
  );
  return modelosCache;
}
