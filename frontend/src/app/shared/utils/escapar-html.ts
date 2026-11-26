const ENTIDADES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;',
};

export const escaparHtml = (texto: string): string => texto.replace(/[&<>"'`]/g, (c) => ENTIDADES[c]);

export function escaparProfundo<T>(valor: T): T {
  if (typeof valor === 'string') return escaparHtml(valor) as T;
  if (Array.isArray(valor)) return valor.map((item) => escaparProfundo(item)) as T;
  if (valor && typeof valor === 'object' && !(valor instanceof Date)) {
    const copia: Record<string, unknown> = {};
    for (const [chave, item] of Object.entries(valor as Record<string, unknown>)) copia[chave] = escaparProfundo(item);
    return copia as T;
  }
  return valor;
}
