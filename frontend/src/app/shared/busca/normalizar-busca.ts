export const normalizarBusca = (texto: string | null | undefined): string =>
  (texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
