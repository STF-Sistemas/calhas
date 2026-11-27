export const SITE_CONFIG = {
  nome: 'Calhas Pro',
  developerName: 'Sistemas Tecnologia Futuro',
  developerUrl: 'https://www.sistemastecnologiafuturo.com.br/',
} as const;

export function frontendUrl(): string {
  if (typeof document === 'undefined') return '';
  const meta = document.querySelector<HTMLMetaElement>('meta[name="frontend-url"]')?.content?.trim() ?? '';
  if (!meta || meta.includes('%FRONTEND_URL%')) return location.origin;
  return meta.replace(/\/+$/, '');
}
