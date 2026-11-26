export const SITE_CONFIG = {
  nome: 'Calhas Pro',
  developerName: 'Sistemas Tecnologia Futuro',
  developerUrl: 'https://www.sistemastecnologiafuturo.com.br/',
} as const;

export function siteUrl(): string {
  if (typeof document === 'undefined') return '';
  const meta = document.querySelector<HTMLMetaElement>('meta[name="site-url"]')?.content?.trim() ?? '';
  if (!meta || meta.includes('%SITE_URL%')) return location.origin;
  return meta.replace(/\/+$/, '');
}
