export function frontendUrl(): string {
  const valor = (process.env['FRONTEND_URL'] || process.env['SITE_URL'])?.trim().replace(/\/+$/, '');
  if (valor) return valor;
  if (process.env['NODE_ENV'] === 'production') {
    throw new Error('FRONTEND_URL ausente: defina o endereço público do site (ex.: https://calhas.discloud.app).');
  }
  return 'http://localhost:4204';
}
