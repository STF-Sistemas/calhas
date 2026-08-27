import { LOGO_EMPRESA_TAMANHO_MAXIMO_BYTES } from '../constants/LOGO_EMPRESA';

const LOGO_DATA_URI_REGEX = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/]+={0,2})$/;

/**
 * Valida se a string é uma data URI de imagem PNG/JPEG dentro do limite de tamanho.
 * Usado tanto no frontend (preview/seleção) quanto no backend (validação de payload).
 */
export function isLogoDataUriValido(valor: string): boolean {
  const match = LOGO_DATA_URI_REGEX.exec(valor);
  if (!match) return false;

  const base64 = match[2];
  const tamanhoBytes = Math.floor((base64.length * 3) / 4);
  return tamanhoBytes <= LOGO_EMPRESA_TAMANHO_MAXIMO_BYTES;
}
