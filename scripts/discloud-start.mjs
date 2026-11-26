// Start em um único processo Node: apaga sobras de deploys antigos, confere as dependências
// que vieram prontas (npm ci só no plano B), migrations e seed em processos curtos e depois o
// servidor carregado neste mesmo processo. Nada é compilado nem instalado no caminho normal.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const RAIZ = resolve(import.meta.dirname, '..');
const BACKEND = join(RAIZ, 'backend');
const MAIN = join(BACKEND, 'dist', 'main.js');
const SEED = join(BACKEND, 'dist', 'cli', 'seed.js');
const MIGRAR = join(BACKEND, 'dist', 'cli', 'migrar.js'); // sem CLI do Prisma em produção
const DEPLOY_INFO = join(RAIZ, 'deploy-info.json');
const MANIFESTO = join(RAIZ, 'arquivos-deploy.txt'); // gravado pelo montar-deploy.mjs
const PACOTE_CLIENTE = join(BACKEND, 'node_modules', '@prisma', 'client', 'package.json');
const MARCA_LOCK = join(BACKEND, 'node_modules', '.lock-hash');
// Gravada pelo montar-deploy.mjs --com-dependencias: node_modules veio pronto na branch deploy.
const MARCA_PRONTAS = join(BACKEND, 'node_modules', '.deploy-lock-hash');
// Pacotes com binário nativo do projeto: precisam carregar para aceitar o node_modules pronto.
const NATIVOS = ['bcrypt'];
const NODE_OPTIONS_AUXILIARES = '--max-old-space-size=192 --max-semi-space-size=8';
const ehWindows = process.platform === 'win32';

const log = (mensagem) => console.log(`[start] ${mensagem}`);
function encerrar(mensagem) {
  console.error(`[start] ${mensagem}`);
  process.exit(1);
}

function rodar(comando, args) {
  log(`> ${[comando, ...args].join(' ')}`);
  // No Windows (só uso local) o comando passa pelo shell: caminhos precisam de aspas.
  const citar = (texto) => (ehWindows && /[\\/]/.test(texto) ? `"${texto}"` : texto);
  const resultado = spawnSync(citar(comando), args.map(citar), {
    cwd: BACKEND,
    stdio: ['ignore', 'inherit', 'inherit'],
    shell: ehWindows,
    env: { ...process.env, NODE_OPTIONS: NODE_OPTIONS_AUXILIARES, PRISMA_HIDE_UPDATE_MESSAGE: '1' },
  });
  if (resultado.status !== 0) {
    encerrar(
      `Falhou: ${comando} ${args.join(' ')} (código ${resultado.status}, sinal ${resultado.signal})` +
        (resultado.signal === 'SIGKILL' ? '. SIGKILL indica falta de memória.' : ''),
    );
  }
}

function carregarEnv() {
  const veioDoAmbiente = !!process.env.DATABASE_URL;
  for (const pasta of [BACKEND, RAIZ]) {
    const arquivo = join(pasta, '.env');
    if (existsSync(arquivo)) process.loadEnvFile(arquivo);
    log(`.env em ${arquivo}: ${existsSync(arquivo) ? 'sim' : 'não'}`);
  }
  log(`DATABASE_URL ${veioDoAmbiente ? 'veio do ambiente' : process.env.DATABASE_URL ? 'veio do .env' : 'ausente'}`);
  if (!process.env.DATABASE_URL) {
    encerrar('DATABASE_URL ausente: cadastre a variável no painel e reinicie o app.');
  }
}

const hashDoLock = (comNode) => {
  const hash = createHash('sha256').update(readFileSync(join(BACKEND, 'package-lock.json')));
  if (comNode) hash.update(`node-abi:${process.versions.modules}`);
  return hash.digest('hex');
};

// Os nativos foram instalados no Linux do GitHub Actions: confere num processo curto se
// carregam neste servidor (não carregam se, por exemplo, a Discloud usar musl).
function nativosCarregam() {
  const codigo = NATIVOS.map((nome) => `require('${nome}');`).join(' ');
  const resultado = spawnSync(process.execPath, ['--input-type=commonjs', '-e', codigo], {
    cwd: BACKEND,
    stdio: ['ignore', 'ignore', 'pipe'],
    env: { ...process.env, NODE_OPTIONS: NODE_OPTIONS_AUXILIARES },
  });
  if (resultado.status === 0) return true;
  log(`Dependências prontas não carregaram:\n${resultado.stderr?.toString().slice(0, 800)}`);
  return false;
}

function instalarDependenciasProducao() {
  if (existsSync(MARCA_PRONTAS)) {
    const marca = readFileSync(MARCA_PRONTAS, 'utf8').trim();
    if (marca === hashDoLock(false) && existsSync(PACOTE_CLIENTE) && nativosCarregam()) {
      log('Dependências vieram prontas da branch deploy; npm ci dispensado.');
      // Só aqui o node_modules corresponde ao manifesto (no plano B ele vem do npm ci).
      removerSobrasDoDeploy(['backend/node_modules']);
      rmSync(join(homedir(), '.npm', '_cacache'), { recursive: true, force: true });
      return;
    }
    // Plano B, sem olhar a MARCA_LOCK: ela pode ter sobrado de uma instalação anterior.
    log('Dependências prontas inválidas para este servidor; instalando com npm ci.');
  } else {
    // O hash inclui a versão do Node: foi este servidor que instalou.
    const instalado = existsSync(MARCA_LOCK) ? readFileSync(MARCA_LOCK, 'utf8').trim() : '';
    if (instalado === hashDoLock(true) && existsSync(PACOTE_CLIENTE)) return;
  }
  rodar('npm', ['ci', '--omit=dev', '--no-audit', '--no-fund', '--maxsockets=4', '--loglevel=warn']);
  writeFileSync(MARCA_LOCK, hashDoLock(true) + '\n');
}

// A Discloud não apaga do disco o que saiu da branch deploy. Dentro das pastas geradas pelo
// deploy, apaga tudo que não está no manifesto (e as pastas que ficarem vazias).
function removerSobrasDoDeploy(pastas) {
  if (!existsSync(MANIFESTO)) return;
  const validos = new Set(readFileSync(MANIFESTO, 'utf8').split('\n').filter(Boolean));
  const limpar = (pasta, relativo) => {
    let restam = 0;
    for (const item of readdirSync(pasta, { withFileTypes: true })) {
      const caminho = join(pasta, item.name);
      const caminhoRelativo = `${relativo}/${item.name}`;
      if (item.isDirectory()) {
        if (!limpar(caminho, caminhoRelativo)) restam++;
      } else if (validos.has(caminhoRelativo)) restam++;
      else rmSync(caminho, { force: true });
    }
    if (restam > 0) return false;
    rmSync(pasta, { recursive: true, force: true });
    return true;
  };
  for (const relativo of pastas) {
    if (existsSync(join(RAIZ, relativo))) limpar(join(RAIZ, relativo), relativo);
  }
}

if (!existsSync(MAIN)) encerrar('Build ausente (backend/dist/main.js): publique a branch deploy.');
carregarEnv();
if (existsSync(DEPLOY_INFO)) {
  const info = JSON.parse(readFileSync(DEPLOY_INFO, 'utf8'));
  log(`Build pronto do GitHub Actions: commit ${info.commit} (${info.data})`);
  removerSobrasDoDeploy(['scripts', 'backend/dist', 'backend/prisma', 'frontend/browser']);
  instalarDependenciasProducao();
}
rodar(process.execPath, [MIGRAR]);
rodar(process.execPath, [SEED]);

log(`Subindo o servidor (Node ${process.version})`);
process.chdir(BACKEND);
await import(pathToFileURL(MAIN).href);
