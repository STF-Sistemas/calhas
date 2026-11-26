import './carregar-env';
import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import compression from 'compression';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { AppModule } from './app.module';
import { siteUrl } from './common/site-url.util';
import { validacaoPipe } from './common/validacao.pipe';

const logger = new Logger('Inicio');

function validarAmbiente(): void {
  if (!process.env['DATABASE_URL']) throw new Error('DATABASE_URL ausente.');
  const segredo = process.env['JWT_SECRET'] ?? '';
  if (segredo.length < 32) throw new Error('JWT_SECRET ausente ou com menos de 32 caracteres.');
  siteUrl(); // falha em produção sem SITE_URL
}

/** Build do frontend: layout do `ng build` e layout achatado da branch deploy. */
function pastaDoFrontend(): string | undefined {
  const relativos = ['frontend/dist/frontend/browser', 'frontend/browser'];
  const bases = [resolve(process.cwd(), '..'), process.cwd(), resolve(__dirname, '..', '..'), resolve(__dirname, '..')];
  const candidatos = bases.flatMap((base) => relativos.map((r) => join(base, r)));
  const pasta = candidatos.find((p) => existsSync(join(p, 'index.html')));
  if (!pasta) logger.warn('Build do frontend não encontrado: modo desenvolvimento (só API).');
  return pasta;
}

function origensPermitidas(): string[] {
  const lista = (process.env['ALLOWED_ORIGINS'] || '').split(',').map((o) => o.trim()).filter(Boolean);
  const frontend = process.env['FRONTEND_URL']?.trim().replace(/\/+$/, '');
  if (frontend) lista.push(frontend);
  if (process.env['NODE_ENV'] !== 'production') lista.push('http://localhost:4204');
  return [...new Set(lista)];
}

async function bootstrap(): Promise<void> {
  validarAmbiente();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
    bodyParser: false,
  });

  app.set('trust proxy', 1);
  app.use(
    helmet({
      // Fonte única da CSP (o index.html não tem meta CSP).
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
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
  app.use(compression());
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

  const pasta = pastaDoFrontend();
  if (pasta) {
    logger.log(`Servindo o frontend de ${pasta}`);
    // Template lido uma vez e mantido em memória, com o %SITE_URL% já trocado.
    const indexHtml = readFileSync(join(pasta, 'index.html'), 'utf8').replaceAll('%SITE_URL%', siteUrl());
    const enviarIndex = (_req: Request, res: Response) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.type('html').send(indexHtml);
    };
    http.get('/', enviarIndex);
    http.use(
      express.static(pasta, {
        index: false,
        setHeaders: (res, caminho) => {
          // Arquivos com hash no nome podem ficar em cache por 1 ano; o resto revalida.
          const imutavel = /\.[0-9a-f]{8,}\.(js|css|woff2?)$/i.test(caminho) || /[-.][A-Z0-9]{8,}\.(js|css)$/.test(caminho);
          res.setHeader('Cache-Control', imutavel ? 'public, max-age=31536000, immutable' : 'no-cache');
        },
      }),
    );
    // Fallback da SPA (Express 5 exige `/{*splat}`); a API e o /health ficam de fora.
    http.get('/{*splat}', (req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/api/') || req.path === '/api' || req.path === '/health') return next();
      enviarIndex(req, res);
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
