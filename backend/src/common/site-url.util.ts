export function siteUrl(): string {
  const valor = process.env['SITE_URL']?.trim().replace(/\/+$/, '');
  if (valor) return valor;
  if (process.env['NODE_ENV'] === 'production') {
    throw new Error('SITE_URL ausente: defina o endereço público do site (ex.: https://calhas.discloud.app).');
  }
  return `http://localhost:${process.env['PORT'] || 3004}`;
}
