import './carregar-env';
import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import compression from 'compression';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { AppModule } from './app.module';
import { frontendUrl } from './common/frontend-url.util';
import { validacaoPipe } from './common/validacao.pipe';

const logger = new Logger('Inicio');

function validarAmbiente(): void {
  if (!process.env['DATABASE_URL']) throw new Error('DATABASE_URL ausente.');
  const segredo = process.env['JWT_SECRET'] ?? '';
  if (segredo.length < 32) throw new Error('JWT_SECRET ausente ou com menos de 32 caracteres.');
  frontendUrl();
}

const SHELLS = ['index.csr.html', 'index.html'];

function pastaDoFrontend(): string | undefined {
  const relativos = ['frontend/dist/frontend/browser', 'frontend/browser'];
  const bases = [resolve(process.cwd(), '..'), process.cwd(), resolve(__dirname, '..', '..'), resolve(__dirname, '..')];
  const candidatos = bases.flatMap((base) => relativos.map((r) => join(base, r)));
  const pasta = candidatos.find((p) => SHELLS.some((s) => existsSync(join(p, s))));
  if (!pasta) logger.warn('Build do frontend não encontrado: modo desenvolvimento (só API).');
  return pasta;
}

interface IFrontend {
  pasta: string;
  shell: string;
  paginas: Map<string, string>;
  hashesScripts: string[];
}

function carregarFrontend(pasta: string): IFrontend {
  const ler = (arquivo: string) => readFileSync(arquivo, 'utf8').replaceAll('%FRONTEND_URL%', frontendUrl());
  const shell = ler(join(pasta, SHELLS.find((s) => existsSync(join(pasta, s)))!));
  const paginas = new Map<string, string>();
  for (const item of readdirSync(pasta, { withFileTypes: true })) {
    const arquivo = join(pasta, item.name, 'index.html');
    if (item.isDirectory() && existsSync(arquivo)) paginas.set(`/${item.name}`, ler(arquivo));
  }
  const hashes = new Set<string>();
  for (const html of [shell, ...paginas.values()]) {
    for (const m of html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)) {
      if (/type="application\/json"/.test(m[1]) || !m[2].trim()) continue;
      hashes.add(`'sha256-${createHash('sha256').update(m[2], 'utf8').digest('base64')}'`);
    }
  }
  return { pasta, shell, paginas, hashesScripts: [...hashes] };
}

function origensPermitidas(): string[] {
  const lista = (process.env['ALLOWED_ORIGINS'] || '').split(',').map((o) => o.trim()).filter(Boolean);
  lista.push(frontendUrl());
  if (process.env['NODE_ENV'] !== 'production') lista.push('http://localhost:4204');
  return [...new Set(lista)];
}

async function bootstrap(): Promise<void> {
  validarAmbiente();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
    bodyParser: false,
  });

  const pasta = pastaDoFrontend();
  const frontend = pasta ? carregarFrontend(pasta) : undefined;

  app.set('trust proxy', 1);
  app.use(
    helmet({
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
    }),
  );
  app.use(
    compression({
      filter: (req, res) =>
        String(req.headers.accept ?? '').includes('text/event-stream') ? false : compression.filter(req, res),
    }),
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.enableCors({ origin: origensPermitidas(), credentials: true });
  app.setGlobalPrefix('api', { exclude: ['health'] });
  app.useGlobalPipes(validacaoPipe);
  app.enableShutdownHooks();

  const http = app.getHttpAdapter().getInstance() as express.Express;
  http.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  if (frontend) {
    logger.log(`Servindo o frontend de ${frontend.pasta} (${frontend.paginas.size} páginas pré-renderizadas)`);
    const enviarHtml = (res: Response, html: string) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.type('html').send(html);
    };
    http.get('/', (_req, res) => enviarHtml(res, frontend.shell));
    for (const [rota, html] of frontend.paginas) {
      http.get([rota, `${rota}/`], (_req, res) => enviarHtml(res, html));
    }
    http.use(
      express.static(frontend.pasta, {
        index: false,
        redirect: false,
        setHeaders: (res, caminho) => {
          const imutavel = /\.[0-9a-f]{8,}\.(js|css|woff2?)$/i.test(caminho) || /[-.][A-Z0-9]{8,}\.(js|css)$/.test(caminho);
          res.setHeader('Cache-Control', imutavel ? 'public, max-age=31536000, immutable' : 'no-cache');
        },
      }),
    );
    http.get('/{*splat}', (req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/api/') || req.path === '/api' || req.path === '/health') return next();
      enviarHtml(res, frontend.shell);
    });
  }

  const porta = Number(process.env['PORT'] || 3004);
  await app.listen(porta, '0.0.0.0');
  logger.log(`Servidor rodando na porta ${porta}`);
}

bootstrap().catch((erro) => {
  logger.error(`Falha ao iniciar: ${(erro as Error).message}`);
  process.exit(1);
});
