"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./carregar-env");
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const compression_1 = __importDefault(require("compression"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const node_crypto_1 = require("node:crypto");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const app_module_1 = require("./app.module");
const frontend_url_util_1 = require("./common/frontend-url.util");
const validacao_pipe_1 = require("./common/validacao.pipe");
const logger = new common_1.Logger('Inicio');
function validarAmbiente() {
    if (!process.env['DATABASE_URL'])
        throw new Error('DATABASE_URL ausente.');
    const segredo = process.env['JWT_SECRET'] ?? '';
    if (segredo.length < 32)
        throw new Error('JWT_SECRET ausente ou com menos de 32 caracteres.');
    (0, frontend_url_util_1.frontendUrl)();
}
const SHELLS = ['index.csr.html', 'index.html'];
function pastaDoFrontend() {
    const relativos = ['frontend/dist/frontend/browser', 'frontend/browser'];
    const bases = [(0, node_path_1.resolve)(process.cwd(), '..'), process.cwd(), (0, node_path_1.resolve)(__dirname, '..', '..'), (0, node_path_1.resolve)(__dirname, '..')];
    const candidatos = bases.flatMap((base) => relativos.map((r) => (0, node_path_1.join)(base, r)));
    const pasta = candidatos.find((p) => SHELLS.some((s) => (0, node_fs_1.existsSync)((0, node_path_1.join)(p, s))));
    if (!pasta)
        logger.warn('Build do frontend não encontrado: modo desenvolvimento (só API).');
    return pasta;
}
function carregarFrontend(pasta) {
    const ler = (arquivo) => (0, node_fs_1.readFileSync)(arquivo, 'utf8').replaceAll('%FRONTEND_URL%', (0, frontend_url_util_1.frontendUrl)());
    const shell = ler((0, node_path_1.join)(pasta, SHELLS.find((s) => (0, node_fs_1.existsSync)((0, node_path_1.join)(pasta, s)))));
    const paginas = new Map();
    for (const item of (0, node_fs_1.readdirSync)(pasta, { withFileTypes: true })) {
        const arquivo = (0, node_path_1.join)(pasta, item.name, 'index.html');
        if (item.isDirectory() && (0, node_fs_1.existsSync)(arquivo))
            paginas.set(`/${item.name}`, ler(arquivo));
    }
    const hashes = new Set();
    for (const html of [shell, ...paginas.values()]) {
        for (const m of html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)) {
            if (/type="application\/json"/.test(m[1]) || !m[2].trim())
                continue;
            hashes.add(`'sha256-${(0, node_crypto_1.createHash)('sha256').update(m[2], 'utf8').digest('base64')}'`);
        }
    }
    return { pasta, shell, paginas, hashesScripts: [...hashes] };
}
function origensPermitidas() {
    const lista = (process.env['ALLOWED_ORIGINS'] || '').split(',').map((o) => o.trim()).filter(Boolean);
    lista.push((0, frontend_url_util_1.frontendUrl)());
    if (process.env['NODE_ENV'] !== 'production')
        lista.push('http://localhost:4204');
    return [...new Set(lista)];
}
async function bootstrap() {
    validarAmbiente();
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['error', 'warn', 'log'],
        bodyParser: false,
    });
    const pasta = pastaDoFrontend();
    const frontend = pasta ? carregarFrontend(pasta) : undefined;
    app.set('trust proxy', 1);
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", ...(frontend?.hashesScripts ?? [])],
                scriptSrcAttr: ["'none'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'blob:'],
                fontSrc: ["'self'", 'data:'],
                connectSrc: ["'self'", ...origensPermitidas()],
                workerSrc: ["'self'"],
                manifestSrc: ["'self'"],
                frameAncestors: ["'none'"],
                objectSrc: ["'none'"],
                baseUri: ["'self'"],
                formAction: ["'self'"],
            },
        },
        crossOriginEmbedderPolicy: false,
    }));
    app.use((0, compression_1.default)({
        filter: (req, res) => String(req.headers.accept ?? '').includes('text/event-stream') ? false : compression_1.default.filter(req, res),
    }));
    app.use(express_1.default.json({ limit: '2mb' }));
    app.use(express_1.default.urlencoded({ extended: false, limit: '100kb' }));
    app.enableCors({ origin: origensPermitidas(), credentials: true });
    app.setGlobalPrefix('api', { exclude: ['health'] });
    app.useGlobalPipes(validacao_pipe_1.validacaoPipe);
    app.enableShutdownHooks();
    const http = app.getHttpAdapter().getInstance();
    http.get('/health', (_req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    if (frontend) {
        logger.log(`Servindo o frontend de ${frontend.pasta} (${frontend.paginas.size} páginas pré-renderizadas)`);
        const enviarHtml = (res, html) => {
            res.setHeader('Cache-Control', 'no-cache');
            res.type('html').send(html);
        };
        http.get('/', (_req, res) => enviarHtml(res, frontend.shell));
        for (const [rota, html] of frontend.paginas) {
            http.get([rota, `${rota}/`], (_req, res) => enviarHtml(res, html));
        }
        http.use(express_1.default.static(frontend.pasta, {
            index: false,
            redirect: false,
            setHeaders: (res, caminho) => {
                const imutavel = /\.[0-9a-f]{8,}\.(js|css|woff2?)$/i.test(caminho) || /[-.][A-Z0-9]{8,}\.(js|css)$/.test(caminho);
                res.setHeader('Cache-Control', imutavel ? 'public, max-age=31536000, immutable' : 'no-cache');
            },
        }));
        http.get('/{*splat}', (req, res, next) => {
            if (req.path.startsWith('/api/') || req.path === '/api' || req.path === '/health')
                return next();
            enviarHtml(res, frontend.shell);
        });
    }
    const porta = Number(process.env['PORT'] || 3004);
    await app.listen(porta, '0.0.0.0');
    logger.log(`Servidor rodando na porta ${porta}`);
}
bootstrap().catch((erro) => {
    logger.error(`Falha ao iniciar: ${erro.message}`);
    process.exit(1);
});
//# sourceMappingURL=main.js.map