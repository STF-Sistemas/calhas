# Calhas Pro: Sistema de Gestão de Pedidos

Sistema web para gestão de pedidos, orçamentos, clientes, produtos, compras e ordens de corte,
voltado a empresas de calhas e coberturas. Segue as regras de `REGRAS-DESENVOLVIMENTO.md`.

## Visão geral

Monorepo com três pacotes:

| Pacote | Tecnologia | Porta (dev) |
| --- | --- | --- |
| `backend/` | NestJS 12 (Express 5) + Prisma 7 (PostgreSQL, adapter `pg`) | 3004 |
| `frontend/` | Angular 22 nativo, kit de UI próprio (PWA) | 4204 |
| `shared/` | TypeScript (interfaces, enums, funções e constantes) | |

O `shared/` é a fonte única de tipos e regras usada pelos dois lados (alias `#shared/*`).
No backend ele é copiado para `backend/src/shared` no `dev` e no `build` (pasta gerada,
fora do git).

## Rodando localmente

Pré-requisitos: Node 22+ (recomendado 24) e PostgreSQL.

```bash
cp backend/.env.example backend/.env   # preencha DATABASE_URL, JWT_SECRET...
npm install --prefix backend
npm install --prefix frontend

# banco: aplica as migrations e o seed (idempotente)
npm run build --prefix backend
node backend/dist/cli/migrar.js
node backend/dist/cli/seed.js

npm run dev            # backend em http://localhost:3004 (API em /api)
npm run dev:frontend   # frontend em http://localhost:4204
```

Produção local (um único processo servindo API + frontend):

```bash
npm run build
npm run start
```

## Banco de dados

- Schemas `util`, `conf` e `calhas`; modelos em `backend/prisma/schema.prisma`.
- Mudança de modelo: `npx prisma migrate dev --name <nome>` (dentro de `backend/`) gera a
  migration em `backend/prisma/migrations`.
- Em produção as migrations são aplicadas por `backend/src/cli/migrar.ts`, que grava a tabela
  `_prisma_migrations` igual ao Prisma (a CLI do Prisma não vai para a produção). Banco criado
  antes das migrations é reconhecido e o `0_init` é registrado como baseline.
- Os triggers de estoque (compras e pedidos) estão na migration `1_triggers_estoque`.
- Pesquisa sem acento usa a extensão `unaccent` (migration `2_unaccent`).

## Backend

- Cada recurso é um módulo Nest (`controller` + `service` + DTOs com `class-validator`).
- Guards globais: limite de requisições (`@nestjs/throttler`), JWT, licença da empresa
  (402 licença vencida, 403 empresa inativa) e perfil (`@ApenasAdmin()`, `@ApenasSuperAdmin()`).
  Rotas sem login usam `@Publico()`; pagamento da licença usa `@SemLicenca()`.
- Respostas no formato `{ success, data | message }`.
- `helmet` (CSP única do projeto), `compression`, CORS por `FRONTEND_URL`/`ALLOWED_ORIGINS`.

## Deploy (Discloud)

- Um único app `site`: o backend serve o build do frontend.
- A cada push na `main`, o GitHub Actions (`.github/workflows/deploy.yml`) compila tudo,
  instala as dependências de produção no Linux e publica o resultado na branch `deploy`,
  que é a branch conectada na Discloud. Nada é compilado no servidor.
- `scripts/montar-deploy.mjs` define o conteúdo da `deploy`; `scripts/discloud-start.mjs`
  aplica as migrations, roda o seed e sobe o servidor no mesmo processo (heap limitado).
- Variáveis no painel: `NODE_ENV=production`, `PORT=8080`, `DATABASE_URL` (conexão privada,
  com `VLAN=true`), `SITE_URL`, `FRONTEND_URL`, `JWT_SECRET` e as demais do `.env.example`.
  Depois de salvar, reinicie o app.
