// Copia ../shared (fonte única do monorepo) para src/shared antes do build e do dev.
// Assim o tsc compila tudo dentro de src/ e a saída fica em dist/main.js (rootDir = src).
// src/shared é gerado: está no .gitignore e nunca deve ser editado à mão.
import { cpSync, existsSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

const backend = resolve(import.meta.dirname, '..');
const origem = join(backend, '..', 'shared');
const destino = join(backend, 'src', 'shared');

if (!existsSync(origem)) {
  console.error(`[copiar-shared] pasta não encontrada: ${origem}`);
  process.exit(1);
}
rmSync(destino, { recursive: true, force: true });
cpSync(origem, destino, { recursive: true });
console.log('[copiar-shared] shared copiado para src/shared');
