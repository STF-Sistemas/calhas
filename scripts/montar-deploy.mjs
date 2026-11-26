// Monta o conteúdo da branch `deploy` (o que a Discloud publica): builds prontos do backend e
// do frontend, migrations, package.json/lock só de produção, script de start e um
// discloud.config sem BUILD. Uso: node scripts/montar-deploy.mjs <pasta> [--com-dependencias]
// O --com-dependencias (só no GitHub Actions, Linux) instala o node_modules de produção.
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..');
const destinoArg = process.argv.slice(2).find((a) => !a.startsWith('--'));
if (!destinoArg) {
  console.error('Uso: node scripts/montar-deploy.mjs <pasta> [--com-dependencias]');
  process.exit(1);
}
const pastaDestino = resolve(destinoArg);
const backendDeploy = join(pastaDestino, 'backend');
const ehWindows = process.platform === 'win32';

const log = (mensagem) => console.log(`[montar-deploy] ${mensagem}`);
const lerJson = (arquivo) => JSON.parse(readFileSync(arquivo, 'utf8'));
const escreverJson = (arquivo, dados) => writeFileSync(arquivo, JSON.stringify(dados, null, 2) + '\n');
function npm(args, cwd) {
  const r = spawnSync('npm', args, { cwd, stdio: 'inherit', shell: ehWindows });
  if (r.status !== 0) throw new Error(`npm ${args.join(' ')} falhou (código ${r.status})`);
}

// Origem (na main) -> destino (na deploy). Arquivo novo que a produção precise entra aqui.
const ITENS = [
  ['backend/dist', 'backend/dist'],
  ['backend/prisma/migrations', 'backend/prisma/migrations'],
  ['backend/package-lock.json', 'backend/package-lock.json'],
  ['backend/.npmrc', 'backend/.npmrc', { opcional: true }],
  ['frontend/dist/frontend/browser', 'frontend/browser'],
  ['scripts/discloud-start.mjs', 'scripts/discloud-start.mjs'],
];

for (const [origem] of ITENS.filter(([, , o]) => !o?.opcional)) {
  if (!existsSync(join(RAIZ, origem))) throw new Error(`Falta ${origem}: rode "npm run build" antes.`);
}
if (!existsSync(join(RAIZ, 'backend/dist/main.js'))) throw new Error('Falta backend/dist/main.js.');

rmSync(pastaDestino, { recursive: true, force: true });
mkdirSync(pastaDestino, { recursive: true });
for (const [origem, destino, opcoes] of ITENS) {
  if (opcoes?.opcional && !existsSync(join(RAIZ, origem))) continue;
  cpSync(join(RAIZ, origem), join(pastaDestino, destino), {
    recursive: true,
    // Source maps não vão para produção.
    filter: (arquivo) => !arquivo.endsWith('.map') && !arquivo.endsWith('.tsbuildinfo'),
  });
}

// discloud.config: sem BUILD (nada compila no servidor) e com o MAIN que existe na deploy.
const config = readFileSync(join(RAIZ, 'discloud.config'), 'utf8')
  .split(/\r?\n/)
  .filter((linha) => !/^BUILD=/.test(linha))
  .map((linha) => (/^MAIN=/.test(linha) ? 'MAIN=backend/dist/main.js' : linha))
  .join('\n');
writeFileSync(join(pastaDestino, 'discloud.config'), config.trimEnd() + '\n');

// package.json da raiz da deploy: só o start.
const raiz = lerJson(join(RAIZ, 'package.json'));
escreverJson(join(pastaDestino, 'package.json'), {
  name: raiz.name,
  private: true,
  scripts: { start: raiz.scripts.start },
});

let commit = 'local';
try {
  commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: RAIZ }).toString().trim();
} catch {
  // fora de um repositório git
}
escreverJson(join(pastaDestino, 'deploy-info.json'), { commit, data: new Date().toISOString() });

// package.json do backend só com dependencies (sem devDependencies e sem scripts, para o
// postinstall com prisma generate não rodar no servidor: o cliente já vem em dist/generated).
const pacote = lerJson(join(RAIZ, 'backend', 'package.json'));
escreverJson(join(backendDeploy, 'package.json'), {
  name: pacote.name,
  private: true,
  type: pacote.type,
  engines: pacote.engines,
  dependencies: pacote.dependencies,
});
npm(['install', '--package-lock-only', '--ignore-scripts', '--no-audit', '--no-fund'], backendDeploy);
const lock = lerJson(join(backendDeploy, 'package-lock.json'));
// A CLI do prisma (devDependency) não pode entrar na deploy.
if (Object.values(lock.packages).some((dados) => dados.dev) || lock.packages['node_modules/prisma']) {
  throw new Error('lock de produção com pacote de desenvolvimento ou com a CLI do prisma');
}

// Com --com-dependencias (só no GitHub Actions) instala aqui e manda o node_modules pronto.
// Localmente, no Windows, não usar: os nativos sairiam para Windows.
if (process.argv.includes('--com-dependencias')) {
  npm(['ci', '--omit=dev', '--no-audit', '--no-fund', '--loglevel=warn'], backendDeploy);
  // Sem .bin (links simbólicos), tipos, source maps e documentação.
  const ARQUIVO_PODAVEL = /(\.d\.[cm]?ts|\.ts|\.map|\.md|\.markdown|\.tsbuildinfo)$/i;
  const PASTA_PODAVEL = new Set(['.bin', '.github', '@types']);
  const podar = (pasta) => {
    for (const item of readdirSync(pasta, { withFileTypes: true })) {
      const caminho = join(pasta, item.name);
      if (item.isDirectory()) {
        if (PASTA_PODAVEL.has(item.name)) rmSync(caminho, { recursive: true, force: true });
        else podar(caminho);
      } else if (ARQUIVO_PODAVEL.test(item.name)) rmSync(caminho, { force: true });
    }
  };
  podar(join(backendDeploy, 'node_modules'));
  const hash = createHash('sha256').update(readFileSync(join(backendDeploy, 'package-lock.json'))).digest('hex');
  writeFileSync(join(backendDeploy, 'node_modules', '.deploy-lock-hash'), hash + '\n');
}

// .gitignore da deploy: só o node_modules da raiz fica de fora.
writeFileSync(join(pastaDestino, '.gitignore'), '/node_modules/\n.env\n.env.*\n');

// Por último: lista de tudo que foi publicado, para o start apagar as sobras.
const listar = (pasta) =>
  readdirSync(pasta, { withFileTypes: true }).flatMap((item) => {
    const caminho = join(pasta, item.name);
    if (item.isDirectory()) return item.name === '.git' ? [] : listar(caminho);
    return [relative(pastaDestino, caminho).split(sep).join('/')];
  });
const arquivos = [...listar(pastaDestino), 'arquivos-deploy.txt'].sort();
writeFileSync(join(pastaDestino, 'arquivos-deploy.txt'), arquivos.join('\n') + '\n');
log(`Pronto em ${pastaDestino} (${arquivos.length} arquivos, commit ${commit}).`);
