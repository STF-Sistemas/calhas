# Regras de Desenvolvimento: Padrão de Projetos

Este documento define as convenções, tecnologias e padrões de layout que devem ser
seguidos em projetos web (landing pages, sites institucionais e aplicações fullstack).
Use-o como referência em qualquer novo projeto antes de começar a codar.

## Stack padrão

**Frontend**
- Angular (versão mais recente estável), com **componentes standalone** (sem `NgModule`).
- Gerenciamento de estado local com `signal()` em vez de variáveis simples quando o
  valor precisa refletir na UI.
- Server-Side Rendering (SSR) habilitado, com hidratação (`provideClientHydration` +
  `withEventReplay`) e `withFetch()` no `HttpClient`.
- Cada componente é dividido em três arquivos: `.ts`, `.html` e `.css` (nunca usar
  template ou estilo inline em componentes de página/seção).
- Nome das classes de componente **sem o sufixo `Component`** (ex.: `HeroSection`,
  não `HeroSectionComponent`).
- Aplicação deve funcionar como **PWA** (ver seção própria abaixo).

**Backend**
- NestJS como framework de API, organizado por módulos de domínio (um módulo por
  feature: auth, newsletter, etc.), cada um com `controller`, `service` e `module`.
- Validação de entrada via DTOs com `class-validator`/`class-transformer`.
- Prisma como ORM, com schema versionado e migrations.
- Seed do banco (usuário inicial, dados de referência) configurado via `prisma.config.ts`
  (campo `migrations.seed`), nunca pelo campo `package.json#prisma` (depreciado a partir do
  Prisma 6, removido no Prisma 7). O `prisma.config.ts` importa `dotenv/config` no topo,
  antes de `defineConfig`, para garantir que o `.env` já esteja carregado quando o comando
  de seed/migração for resolvido; `dotenv` precisa estar em `dependencies` (não só
  transitivo via outro pacote).
- PostgreSQL como banco relacional padrão.
- Segurança básica de API: `helmet`, rate limiting (`@nestjs/throttler`), guards JWT
  para rotas autenticadas.
- Compressão gzip de todas as respostas com o middleware `compression` (pacote em
  `dependencies`, `@types/compression` em `devDependencies`), registrado no `main.ts` com
  `app.use(compression())` logo após o `helmet()`. Sem isso o Nest/Express manda HTML, JS, CSS
  e JSON sem compressão, e o HTML pré-renderizado pelo SSR (que costuma passar de 100 KB) vai
  cheio pela rede; o Lighthouse aponta como "No compression applied" em "Document request
  latency". Vale mesmo quando existe um proxy na frente (IIS, nginx): não depender de o proxy
  estar configurado para comprimir. Após adicionar o pacote, rodar `npm install` também no
  servidor antes de reiniciar o processo.

**Infraestrutura**
- Portas de desenvolvimento fixas e não-padrão para frontend e backend (evita conflito
  quando há vários projetos rodando ao mesmo tempo na máquina). A porta do backend fica
  em `PORT` no `.env` e a do frontend na config do dev-server (ex.: `angular.json` →
  `serve.options.port`). Sempre que a porta do frontend mudar, atualizar junto a origem
  de CORS no backend (`FRONTEND_URL`) e, sempre que a porta do backend mudar, atualizar
  a `apiUrl` usada pelo frontend: as duas pontas têm que ficar em sincronia.

## Scripts de desenvolvimento (package.json)

Para todo projeto subir em dev sempre com o mesmo comando, independente do
projeto:

- **Backend**: `npm run dev` (equivalente a `nest start --watch` no NestJS, ou o
  comando de watch/reload equivalente no framework usado). Mesmo que o
  schematic gere `start:dev` por padrão, adicionar `dev` como script (pode
  manter `start:dev` também, apontando pro mesmo comando).
- **Frontend**: `npm run start` (equivalente a `ng serve` no Angular). Esse já é
  o nome padrão gerado pelo Angular CLI, então normalmente não precisa de
  ajuste.

Documentar esses dois comandos no `README.md` do projeto.

## Estrutura de pastas (frontend)

```
src/app/
  core/            # infraestrutura transversal: config, guards, interceptors, services
  shared/          # componentes reutilizáveis em múltiplas features
  <feature>/       # uma pasta por área da aplicação (ex.: landing, admin)
    components/    # componentes pequenos e focados, um por seção/bloco de UI
    <feature>-page/
```

- Configurações que variam por cliente/ambiente (links de contato, WhatsApp, redes
  sociais, dados da empresa) ficam centralizadas em um único arquivo de config
  (ex.: `core/config/site-config.ts`), nunca espalhadas pelos componentes.
- Imports entre pastas distantes (ex.: um componente dentro de `features/x/y/z`
  importando algo de `shared/`) usam **path alias** configurado em
  `tsconfig.app.json`/`tsconfig.spec.json` (`paths`), nunca uma cadeia longa de
  `../../../../..`. Alias mínimo esperado em todo projeto Angular: `#shared/*` →
  `src/app/shared/*`, `#interfaces/*` → pasta de interfaces compartilhadas,
  `#environments/*` → `src/environments/*`; acrescentar outros conforme a estrutura
  do projeto (ex.: `#features/*`). O Angular CLI já resolve `paths` do `tsconfig` no
  build/dev-server sozinho, sem precisar de pacote adicional. Backend Node "puro"
  (compilado com `tsc`, sem bundler) é diferente: o `tsc` apaga os tipos mas não
  reescreve os caminhos de import no `.js` gerado, então os mesmos `paths` do
  `tsconfig.json` só funcionam em runtime com `tsconfig-paths` (`-r
  tsconfig-paths/register` no `ts-node`/`node`, como já usado neste padrão no
  backend — ver seção de scripts de desenvolvimento).
- Funções utilitárias pequenas e específicas (ex.: montar link de WhatsApp) ficam
  junto da config que as originou, exportadas como funções puras.

## Mensagens ao usuário (toasts e confirmação)

Nunca usar `alert()`/`confirm()` nativos do navegador (feios, bloqueiam a thread,
não seguem o tema do site) nem espalhar banners de erro/sucesso ad-hoc por cada
página. Todo projeto tem, em `shared/services/`, dois serviços únicos (Angular
`signal()` guardando o estado, injetáveis com `providedIn: 'root'`) e seus
componentes de UI correspondentes, montados **uma única vez** no componente raiz
(`app.html`), fora do `<router-outlet>`:

- **`ToastService`** (`success(texto)` / `error(texto)` / `info(texto)`): mensagens
  transitórias de resultado de ação (salvou, excluiu, falhou ao carregar, etc.),
  renderizadas como cards empilhados no canto da tela, com auto-dismiss. Substitui
  qualquer `<div class="alert alert--error">{{ error }}</div>` de banner de ação.
- **`ConfirmDialogService`** (`confirm({ title?, message, confirmText?, cancelText?,
  danger? }): Promise<boolean>`): modal de confirmação estilizado (tema escuro do
  projeto), usado no lugar de `confirm()` nativo para qualquer ação destrutiva
  (excluir, remover, cancelar assinatura). O método chamador precisa ser `async` e
  dar `await` na Promise antes de prosseguir.

Nem toda mensagem de erro deve virar toast: erro de campo de formulário (senha
incorreta, validação de e-mail) continua **inline, perto do campo**, porque o
usuário precisa da mensagem visível enquanto corrige o problema, não por 5 segundos
num canto da tela. Toast é para o resultado de uma ação (confirmação de sucesso,
falha ao salvar/excluir/carregar), não para estado de validação nem para o estado
de carregamento da própria página.

## Estrutura de pastas (backend)

```
src/
  main.ts              # bootstrap: cria a app, configura CORS/helmet/pipes, serve o build do frontend
  app.module.ts         # módulo raiz, importa os módulos de domínio
  app.controller.ts     # rota raiz/health-check (quando existir)
  app.service.ts
  <dominio>/             # um módulo por feature (ex.: auth, newsletter)
    <dominio>.module.ts
    <dominio>.controller.ts
    <dominio>.service.ts
    dto/                 # classes de entrada validadas com class-validator/class-transformer
      create-x.dto.ts
      x.dto.ts
    guards/              # guards específicos do módulo (ex.: jwt-auth.guard.ts em auth/)
  prisma/                # módulo transversal de acesso a banco
    prisma.module.ts
    prisma.service.ts
  mail/                  # módulo transversal de envio de e-mail
    mail.module.ts
    mail.service.ts
```

- Cada módulo de domínio é autocontido: `module` (declara/importa providers e controllers),
  `controller` (rotas HTTP) e `service` (regra de negócio), nunca lógica de negócio dentro
  do controller.
- `dto/` fica dentro do módulo que o usa, um arquivo por formato de entrada (não um DTO
  genérico compartilhado entre módulos diferentes).
- `guards/` fica dentro do módulo dono do guard (ex.: `jwt-auth.guard.ts` mora em `auth/guards/`,
  não numa pasta `core`/`common` genérica), a menos que o mesmo guard seja reutilizado por
  múltiplos módulos, aí sim sobe para uma pasta transversal.
- Módulos transversais (usados por mais de um módulo de domínio, ex.: `prisma`, `mail`) ficam
  na raiz de `src/`, no mesmo nível dos módulos de domínio, sempre com o par
  `<nome>.module.ts` + `<nome>.service.ts`.
- Nome de arquivo sempre `<dominio>.<camada>.ts` (ex.: `newsletter.controller.ts`), nunca
  abreviado ou fora desse padrão, para o nome do arquivo já indicar o que ele é.

## Pesquisa sem acento

Toda pesquisa por texto ignora acentos e maiúsculas: quem digita "joao" precisa encontrar
"João". Vale para pesquisas no banco e para filtros de listas já carregadas no frontend.

**Banco (PostgreSQL)**
- Habilitar a extensão `unaccent` por uma migration própria (nunca à mão no painel), para ela
  existir em todos os ambientes:

  ```sql
  CREATE EXTENSION IF NOT EXISTS unaccent;
  ```

  A `unaccent` é "trusted" desde o PostgreSQL 13: o dono do banco cria sem superusuário. A
  migration roda pelo `migrar.js` como qualquer outra.
- O Prisma não tem `mode` para acento (`mode: 'insensitive'` só trata maiúsculas). A condição
  vai em SQL cru, sempre parametrizada com `Prisma.sql` (nunca concatenar o termo), por um
  helper único em `src/prisma/busca-sem-acento.ts`:

  ```ts
  const escaparLike = (termo: string) => termo.replace(/[\\%_]/g, (c) => `\\${c}`);
  export const padraoContem = (termo: string) => `%${escaparLike(termo.trim())}%`;
  export const contemSemAcento = (coluna: Prisma.Sql, termo: string) =>
    Prisma.sql`unaccent(lower(${coluna})) LIKE unaccent(lower(${padraoContem(termo)}))`;
  ```

- O `$queryRaw` busca só os `id` (com `ORDER BY` e `LIMIT`, ver "Orçamento de memória",
  regra 11) e um `findMany({ where: { id: { in: ids } } })` carrega os registros, mantendo os
  tipos e os `select`/`include` do Prisma.
- Escapar `%`, `_` e `\` do termo (o `padraoContem` já faz) e limitar o tamanho do termo no
  controller (ex.: 100 caracteres).
- Telefone e outros campos numéricos: comparar só os dígitos do termo (`termo.replace(/\D/g, '')`).
- Tabela grande: criar índice de expressão com uma função `IMMUTABLE` que envolva o `unaccent`
  (a própria `unaccent` não é imutável e não entra direto em índice), com `pg_trgm`.

**Frontend (filtros em memória)**
- Nunca `texto.toLowerCase().includes(termo)`. Usar o utilitário compartilhado
  `shared/busca/normalizar-busca.ts`, nos dois lados da comparação:

  ```ts
  export const normalizarBusca = (texto: string | null | undefined) =>
    (texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  ```

- Busca que vai ao backend: espera de ~300 ms na digitação, descartar respostas fora de ordem e
  manter a lista atual na tela enquanto a nova chega (sem piscar "Carregando...").

## Padrões de layout

- Uma landing page é composta por seções isoladas e reutilizáveis, montadas na página
  principal em sequência (hero, sobre, serviços, depoimentos, galeria, newsletter,
  call-to-action, rodapé), cada seção em seu próprio componente.
- Cabeçalho (`nav-header`) fixo/sticky no topo, com marca (logo/avatar + nome),
  navegação por âncoras (`#secao`), CTA principal em destaque, e menu mobile via
  botão hambúrguer com estado controlado por signal.
- Rodapé (`footer-section`) contém marca, tagline curta, redes sociais, aviso de
  direitos autorais e, **obrigatoriamente**, o crédito de desenvolvimento (ver regra
  abaixo).
- Retratos/fotos de pessoas em destaque (avatar de cabeçalho, seção "sobre") usam
  recorte circular com moldura sutil, nunca a foto "crua" sem tratamento.
- Todo layout é mobile-first e responsivo, com breakpoints ajustados por
  `@media (min-width: ...)` incrementais (não desktop-first).
- Divisores/elementos decorativos entre seções são componentes próprios e reutilizáveis,
  não CSS duplicado em cada seção.

## Regra de crédito de desenvolvimento (copyright)

Todo site desenvolvido deve exibir, no rodapé, um crédito visível para a empresa
desenvolvedora, com link clicável para o site oficial:

```
Desenvolvido por <a href="https://www.sistemastecnologiafuturo.com.br/" target="_blank" rel="noopener">Sistemas Tecnologia Futuro</a>
```

Esse crédito fica **abaixo** da linha de copyright do próprio cliente/projeto, nunca a
substitui. O nome da empresa e a URL ficam centralizados no arquivo de config do site
(`developerName` / `developerUrl`), nunca hardcoded direto no template.

## SEO e compartilhamento

Todo site que vai ser divulgado por link (WhatsApp, redes sociais) precisa ter, no
`<head>`, as tags de Open Graph e Twitter Card completas. Não deixar para depois:

- `og:type`, `og:site_name`, `og:locale`, `og:url`, `og:title`, `og:description`
- `og:image` (URL **absoluta**, com `og:image:width`, `og:image:height` e `og:image:alt`)
- `twitter:card` (`summary_large_image`), `twitter:title`, `twitter:description`,
  `twitter:image`

Sem isso, o preview do link no WhatsApp/redes sociais fica quebrado ou genérico.
`og:title`/`og:description` reaproveitam o `<title>` e a meta `description` já
existentes; `og:image` deve apontar para uma imagem real do site (nunca placeholder).

**URL pública sempre do `SITE_URL`:** toda URL absoluta das meta tags (`canonical`, `og:url`,
`og:image`, `twitter:image`, JSON-LD), do `sitemap.xml` e do `robots.txt` é montada a partir da
variável de ambiente `SITE_URL` (endereço público final, com `https://`, sem barra no fim).
Nunca escrever o domínio fixo no código, no `index.html` nem no `site-config.ts`: o mesmo build
roda no subdomínio da hospedagem, no domínio próprio e em testes, e um domínio fixo faz o preview
do WhatsApp e o canonical apontarem para o endereço errado depois de uma troca de domínio.

- Backend: uma única função lê `SITE_URL` (ex.: `common/site-url.util.ts`, removendo a barra
  final). Em produção, sem a variável, o app **falha ao subir** com mensagem clara, em vez de
  cair num domínio padrão; em desenvolvimento usa `http://localhost:<PORT>`.
- `index.html`: usar o marcador `%SITE_URL%` no lugar do domínio (ex.:
  `content="%SITE_URL%/og-cinejales.jpg"`) e incluir `<meta name="site-url" content="%SITE_URL%">`.
  O backend troca todos os `%SITE_URL%` ao carregar o template, antes de servir o HTML.
- Frontend: as URLs absolutas (meta tags atualizadas na navegação, link de compartilhamento)
  vêm de uma função `siteUrl()` no `site-config.ts`, que lê `<meta name="site-url">`; se o
  marcador não foi substituído (rodando só com `ng serve`), usa `location.origin`.
- `SITE_URL` fica no `.env.example` e nas variáveis do painel da hospedagem; ao trocar de
  domínio, basta atualizar a variável e reiniciar o app.

## Imagens em WebP

Toda imagem usada no site deve estar em **WebP**, que carrega bem mais rápido que JPG/PNG
com a mesma qualidade (principal ganho em internet móvel lenta):

- **Imagens do próprio site** (fotos, banners, fundos, galerias): converter para `.webp`
  antes de colocar no projeto (ex.: `sharp` em um script `npm run imagens`, ou `cwebp`).
  Nunca commitar a foto original pesada no lugar da versão otimizada.
- **Imagens enviadas por upload** (painel administrativo, cadastro de produtos, fotos de
  usuários): o backend converte para WebP no momento do upload, com `sharp`, antes de
  salvar. O arquivo original enviado não é guardado nem servido. Aceitar na entrada os
  formatos comuns (JPG, PNG, WEBP, AVIF) e sempre gravar a saída em `.webp`.
- Gerar a imagem já no tamanho em que ela aparece na tela (e, quando fizer sentido,
  algumas larguras para `srcset`/`sizes`), nunca servir uma foto de 4000 px para
  exibir em 400 px. Aplicar `rotate()` (orientação EXIF) e remover metadados na conversão.
- Qualidade de referência: entre 70 e 80 (fotos) e `effort` 4 a 6 no `sharp`.
- Nome de arquivo com hash ou versão (ex.: `cartaz-a1b2c3-500.webp`) para poder servir
  com cache longo (`max-age=31536000, immutable`); ao substituir a imagem, apagar os
  arquivos antigos.

Exceções (formatos que plataformas externas exigem): ícones do PWA e `apple-touch-icon`
em PNG, `favicon.ico`/`favicon.svg`, e a imagem de `og:image` em **JPG** (o preview do
WhatsApp e de algumas redes sociais não é confiável com WebP). Essas continuam sendo
geradas otimizadas, só que no formato exigido.

## PWA (Progressive Web App)

Todo aplicativo desenvolvido deve funcionar como PWA (instalável e com suporte básico a
uso offline), não só como site comum:

- Usar `@angular/pwa` (`ng add @angular/pwa`) para gerar o `manifest.webmanifest` e o
  service worker (`ngsw-config.json`) já integrados ao build do Angular.
- `manifest.webmanifest` preenchido com dados reais do projeto: `name`, `short_name`,
  `description`, `theme_color`, `background_color`, `display: "standalone"` e o conjunto
  completo de ícones (mínimo 192x192 e 512x512, incluindo variante `maskable`). Nunca
  deixar os valores de exemplo gerados pelo schematic.
- `index.html` referencia o manifest (`<link rel="manifest" href="manifest.webmanifest">`)
  e inclui `<meta name="theme-color" content="...">` com a mesma cor do manifest.
- Service worker (`ngsw-config.json`) configurado para cache de assets estáticos (JS, CSS,
  fontes, ícones) e, quando fizer sentido para o projeto, das chamadas de API somente
  leitura (estratégia `freshness`, nunca cache agressivo em rotas de escrita/autenticação).
- Registro do service worker só em produção (`provideServiceWorker('ngsw-worker.js', { enabled: !isDevMode() })`),
  para não atrapalhar o hot-reload em desenvolvimento.
- Se o backend serve o build do frontend (ver seção própria), garantir que `manifest.webmanifest`
  e `ngsw-worker.js` sejam servidos como arquivos estáticos normais (mesma pasta do `index.html`),
  sem cair no fallback de SPA.

## CSP para scripts de marketing (GTM / Pixel do Facebook)

Todo site que carrega Google Tag Manager e/ou Pixel do Facebook precisa liberar esses
domínios na Content-Security-Policy (`<meta http-equiv="Content-Security-Policy">` no
`index.html`, ou header equivalente no servidor). O que cada domínio libera:

- `googletagmanager.com`: carregar o script do GTM
- `google-analytics.com` / `*.analytics.google.com` / `*.g.doubleclick.net`: envio de
  dados de analytics/ads do Google
- `connect.facebook.net`: carregar o `fbevents.js` (script do Pixel)
- `www.facebook.com`: a chamada de conversão `www.facebook.com/tr` (o "pixel" de
  rastreamento em si)

Além desses, sempre incluir em `connect-src` a própria origem da API do projeto (dev e
produção). Sem isso a CSP quebra as chamadas do site para o próprio backend (formulários,
login, etc.). Ajustar `script-src`/`style-src`/`font-src`/`img-src` conforme os recursos
que o projeto realmente usa (fontes externas, CDN de imagens, etc.), mas nunca deixar
`default-src` aberto: sempre partir de `'self'` e liberar domínio por domínio.

**reCAPTCHA (Google)**: além de `script-src` (`www.google.com`, `www.gstatic.com`) e
`frame-src` (`www.google.com`, para o iframe do widget), é obrigatório liberar os mesmos
domínios em `connect-src`. O reCAPTCHA v3 faz chamadas de rede próprias (`recaptcha/api2/...`)
além de só carregar o script; sem isso em `connect-src`, o script carrega mas a geração do
token falha silenciosamente/é bloqueada no console.

**Quando o backend usa `helmet()`**: se o mesmo backend serve o HTML do frontend (ver seção
seguinte), a CSP **tem que ser configurada no `helmet({ contentSecurityPolicy: { directives: {...} } })`**,
nunca só na tag `<meta http-equiv="Content-Security-Policy">` do `index.html`. O `helmet()`
sem configuração manda uma política própria e bem mais restritiva
(`script-src 'self'`, sem domínios externos) em **todo** response, inclusive quando serve o
HTML. Quando existem duas CSPs (uma via header, outra via meta tag), o navegador aplica as
duas ao mesmo tempo, e a mais restritiva sempre vence, ignorando a meta tag mais permissiva.
Por isso a CSP do projeto deve ter uma única fonte de verdade: configurar tudo no `helmet()`
do backend e não duplicar (nem deixar desatualizada) a meta tag no `index.html`. Detalhe fácil
de esquecer: `script-src-attr` é uma diretiva separada de `script-src` (o `helmet()` padrão
usa `'none'`) e bloqueia atributos de evento inline (`onload="..."`, etc.) mesmo com
`script-src` liberado, como o `onload` que o Angular injeta para CSS crítico não bloqueante.

O jeito certo de resolver esse caso específico do Angular **não** é afrouxar `script-src-attr`
com `'unsafe-inline'` (isso reabre a porta pra qualquer atributo de evento inline no HTML,
enfraquecendo a proteção contra XSS que a CSP existe pra dar). É desligar a inlinagem de CSS
crítico na origem, em `angular.json`, na configuração `production` do target `build`:

```json
"optimization": {
  "scripts": true,
  "fonts": true,
  "styles": { "minify": true, "inlineCritical": false }
}
```

Sem `inlineCritical`, o Angular nunca gera o `<link ... onload="...">`, e a CSP do `helmet()`
continua estrita (`script-src-attr: 'none'`) sem exceção nenhuma. Sintoma no console do
navegador antes da correção: `Executing inline event handler violates the following Content
Security Policy directive 'script-src-attr 'none''`.

## Backend servindo o build do frontend

O backend (API) sempre tem uma rotina no bootstrap (`main.ts`/`app.ts`) que localiza e
serve o build estático do frontend, para permitir rodar tudo a partir de um único
processo/deploy quando necessário:

- Testa uma lista de caminhos possíveis, em ordem de prioridade, cobrindo dev local,
  Docker e variações de estrutura de pastas (ex.: `dist` aninhado ou não, `backend`
  como CWD, raiz do monorepo como CWD). Usa o primeiro caminho que existir
  (`existsSync`).
- Se encontrar o build, serve os arquivos estáticos e aplica um fallback de SPA: toda
  rota que não seja da API devolve o `index.html`, para o roteamento client-side do
  frontend funcionar em qualquer URL.
- O fallback de SPA precisa excluir explicitamente os prefixos de rota da própria API
  (ex.: `/auth`, `/admin`, ou `/api` se o projeto usar prefixo único). Senão uma rota de
  API inexistente ou com erro acaba devolvendo o `index.html` em vez de um 404 de
  verdade.
- Em **Express 5** (usado pelo NestJS mais recente via `@nestjs/platform-express`), a
  rota coringa desse fallback precisa ser `.get('/{*splat}', ...)`, com chaves. A sintaxe
  sem chaves (`/*splat`) exige pelo menos um segmento de caminho e não bate com a raiz
  (`GET /`) sozinha: o site inteiro funciona (`/login`, `/planejamentos`, etc.), menos a
  home, que cai no 404 padrão do Nest mesmo com o build do frontend encontrado
  corretamente. Sintoma típico: `{"message":"Cannot GET /","statusCode":404}` só na raiz.
- Se não encontrar nenhum build, apenas loga um aviso de "modo desenvolvimento". Nesse
  caso o frontend roda separado (dev-server do Angular/Vite/etc.) e o backend serve só
  a API.
- Os caminhos exatos dependem de onde o `outDir` do build do backend cai (ex.:
  `dist/` vs `dist/src/`). Sempre conferir isso antes de copiar a lista de caminhos
  de um projeto para outro.
- Esse `outDir` muda sozinho se o `tsconfig.build.json` não excluir todo `.ts` fora de
  `src/` que não faça parte do app compilado (ex.: `prisma.config.ts`).
  Sem `rootDir` explícito, o TypeScript infere a raiz de saída pela ancestral comum de
  **todos** os arquivos que entram na compilação: bastou um `.ts` fora de `src/` (não
  excluído) para a saída inteira deslocar de `dist/main.js` para `dist/src/main.js`,
  quebrando quem espera o caminho padrão (ex.: `pm2 start dist/main.js`,
  `start:prod: "node dist/main"`). Sempre manter `prisma/` e qualquer `.ts` solto na raiz
  do backend (como `prisma.config.ts`) no `exclude` do `tsconfig.build.json`.
- Cobrir **os dois layouts de pasta possíveis** para o build do frontend, não só um:
  - Estrutura padrão do `ng build` (Angular): `frontend/dist/frontend/browser`.
  - Estrutura "achatada" usada em alguns deploys (ex.: Docker, onde só a pasta
    `browser/` final é copiada pro servidor, sem o `dist/frontend` no meio):
    `frontend/browser`, irmã de `backend/` na raiz do projeto.

  Testar ambos como candidatos (relativos a `process.cwd()` e a `__dirname`), porque o
  mesmo `main.ts` roda tanto em dev local (primeira estrutura) quanto no servidor de
  produção (segunda estrutura), e usar só uma lista assumindo um layout fixo faz o build
  não ser encontrado no outro ambiente.

## Orçamento de memória (Discloud)

O plano da Discloud tem pouca RAM (512 MB) e o painel derruba o app quando passa do limite
("falta de memória", reinício em loop). Um app NestJS + Prisma + Angular estático cabe com
folga (~130 MB em execução) **desde que** siga as regras abaixo. Sem elas o mesmo app passou
de 600 MB: eram três processos Node (`npm start` → script de start → servidor), sem limite
de heap, com seed via `tsx` e `npm ci` lendo o lock com as dependências de desenvolvimento.
Mesmo só com produção, o `npm ci` no servidor ainda chegava a 575 MB; por isso as
dependências vão **já instaladas** na branch `deploy` (regra 7).

**Regras:**

1. **Um único processo Node em produção.** O `START` do `discloud.config` chama `node`
   direto, nunca `npm start`, `npm run` nem `npx`: cada um deixa um processo Node parado na
   memória só esperando o filho terminar. O script de start carrega o servidor com
   `await import('dist/main.js')` no **próprio processo**, em vez de abrir um filho com
   `spawn`.
2. **Heap sempre limitado**: `--max-old-space-size=256 --max-semi-space-size=8`, iguais no
   `START` do `discloud.config` e no `start` do `package.json` da raiz. Sem a flag o V8 cresce
   até perto do limite do contêiner antes de coletar lixo. Estourou o heap: aumentar o número
   depois de medir, nunca remover a flag.
3. **Processos auxiliares curtos e antes do servidor**: migrations (`node dist/cli/migrar.js`,
   ver regra 12), seed (e o `npm ci`, só quando a regra 7 cai no plano B) rodam com
   `spawnSync` (um de cada vez, terminam antes de o servidor subir) e com
   `NODE_OPTIONS=--max-old-space-size=192 --max-semi-space-size=8`. Nada de `npx` nem
   `node_modules/.bin`.
4. **Build nunca no servidor.** O GitHub Actions compila e publica o resultado pronto na
   branch `deploy` (ver "Build no GitHub Actions"). O start só confere se o `dist/main.js`
   existe e falha com mensagem clara se não existir; não existe "compilar se faltar".
5. **Seed compilado**: o seed fica em `backend/src/cli/seed.ts` (dentro de `src/`, então o
   `nest build` gera `dist/cli/seed.js`) e roda com `node dist/cli/seed.js`. Nada de `tsx`,
   `ts-node` ou esbuild em produção: ficam em `devDependencies`. O seed é idempotente,
   porque roda a cada início, e importa utilitários do próprio `src/` (sem cópias).
6. **Lock só de produção na branch `deploy`**: o `montar-deploy.mjs` grava um
   `backend/package.json` só com `dependencies` (sem `devDependencies` e **sem `scripts`**,
   para o `postinstall` com `prisma generate` não rodar no servidor: o cliente já vem
   compilado em `dist/generated`) e roda `npm install --package-lock-only --ignore-scripts`
   para enxugar o lock (no Cine Jales: 562 → 315 pacotes).
7. **Dependências instaladas no GitHub Actions, nunca no servidor.** O `npm ci` é o maior
   pico da subida (500–575 MB medidos, contra ~120–135 MB do servidor rodando). Então:
   - O workflow roda `node scripts/montar-deploy.mjs <pasta> --com-dependencias`: o
     `npm ci --omit=dev` acontece no Linux do runner (mesmas flags do start), e o
     `backend/node_modules` vai **commitado** na branch `deploy` (~90 MB compactado).
   - Antes do commit: apagar todas as pastas `node_modules/**/.bin` (a Discloud não preserva
     links simbólicos; nada em produção usa `.bin`) e gravar `node_modules/.deploy-lock-hash`
     com o sha256 **só do lock** (sem a versão do Node: `sharp` e `bcrypt` usam N-API, e o
     runner roda Node 24 enquanto a Discloud usa a versão `latest`).
   - `.gitignore` da `deploy` com `/node_modules/` (só a raiz), nunca `node_modules/`; e
     `git add -A --force` na publicação, porque pacotes às vezes trazem `.gitignore` próprio.
   - O `discloud-start.mjs` pula o `npm ci` quando a marca bate com o lock, o pacote
     `@prisma/client` existe **e** os nativos (`sharp`, `bcrypt`, ou os que o projeto tiver) carregam num
     processo curto (`node -e "require(...)"`). Log esperado:
     `Dependências vieram prontas da branch deploy; npm ci dispensado.`
   - Plano B: se os nativos não carregarem (ex.: servidor com musl em vez de glibc), roda o
     `npm ci` como antes, **sem consultar** a marca antiga `.lock-hash` (ela pode ter sobrado
     e não descreve o `node_modules` que veio). Depois disso vale a `.lock-hash` (hash do lock
     somado à versão do Node), e reinícios não reinstalam.
   - Dependência nova com binário nativo: incluir no `require` da verificação do start.
8. **Pool do banco pequeno**: `new PrismaPg({ connectionString, max: 5 })`. O padrão do `pg`
   é 10 conexões.
9. **`sharp` econômico** (uploads):
   - `sharp.cache(false)` e `sharp.concurrency(1)` no topo do serviço.
   - Decodificar o original **uma única vez**, já recortado na maior largura, em `raw`, e
     gerar as larguras menores e o blur a partir dessa cópia, **uma de cada vez** (`for`,
     nunca `Promise.all` de várias saídas a partir do original: cada `sharp(original)`
     decodifica a foto inteira de novo).
   - Upload com `multer` em memória limitado (`fileSize` de até 15 MB, `files: 1`).
10. **O servidor SSR do Angular não roda na Discloud**: o SSR pode continuar configurado no
   `angular.json` (pré-renderização no build), mas para a `deploy` vai só a pasta `browser`,
   servida pelo próprio backend, que injeta as meta tags de SEO no `index.html` (template lido
   uma vez e mantido em memória). Subir o `dist/.../server` seria um segundo processo Node.
11. Cache em memória só com tamanho máximo e TTL; preferir cabeçalhos HTTP (`Cache-Control`).
    Nenhuma consulta sem limite (`take`) nem carregar tabela inteira em memória.
12. **Poucos arquivos no disco (inodes).** A Discloud também limita a **quantidade de
    arquivos** do app e desliga com o aviso `Abuso de SSD` / `[Discloud] abuse ssd (inodes)`.
    Com o `node_modules` commitado (regra 7), um app NestJS + Prisma 7 passou de 22.800
    arquivos; com as medidas abaixo caiu para ~6.500:
    - **A CLI do Prisma não vai para produção**: `prisma` fica em `devDependencies` (só o build
      e o desenvolvimento usam). Ela sozinha traz ~10 mil arquivos (`effect`, `lodash`,
      `fast-check`, `@electric-sql/pglite`, `mysql2`...). As migrations são aplicadas por
      `backend/src/cli/migrar.ts` (compilado para `dist/cli/migrar.js`), que usa o `pg` e grava
      a tabela `_prisma_migrations` **igual ao Prisma** (mesmas colunas, checksum sha256 do
      `migration.sql`, mesmo advisory lock `72707369`; migration com falha fica com
      `finished_at` nulo e bloqueia as próximas). Assim `prisma migrate status/dev/resolve`
      continuam funcionando sobre o mesmo banco. O `prisma.config.ts` e o `schema.prisma` não
      vão para a `deploy`.
    - **Poda do `node_modules`** no `montar-deploy.mjs`, depois do `npm ci`: apagar
      `*.d.ts`/`*.d.mts`/`*.d.cts`, `*.ts`, `*.map`, `*.md`, `*.tsbuildinfo` e as pastas
      `.bin`, `.github` e `@types` (nada disso é carregado em produção).
    - **Sobras de deploys antigos**: a Discloud **não apaga** do disco os arquivos que saem da
      branch `deploy`, então só encolher a branch não basta. O `montar-deploy.mjs` grava
      `arquivos-deploy.txt` (todos os arquivos publicados) e o `discloud-start.mjs` apaga, dentro
      das pastas geradas pelo deploy (`scripts`, `backend/dist`, `backend/prisma`,
      `backend/uploads-iniciais`, `frontend/browser` e, só quando as dependências prontas foram
      aceitas, `backend/node_modules`), tudo que não estiver na lista, além do cache
      `~/.npm/_cacache` de um `npm ci` antigo. Uploads e `.env` ficam fora dessas pastas e
      nunca são tocados.
    - Uploads também contam: ao excluir um registro, apagar do disco as fotos e áudios dele
      (conferindo antes que nenhum outro registro aponte para o mesmo arquivo); ao editar,
      apagar as mídias que saíram.

**`package.json` da raiz:**

```json
{
  "scripts": {
    "build:backend": "npm install --prefix backend --include=dev --no-audit --no-fund && npm run build --prefix backend",
    "build:frontend": "npm install --prefix frontend --include=dev --no-audit --no-fund && npm run build --prefix frontend",
    "build": "npm run build:backend && npm run build:frontend",
    "start": "node --max-old-space-size=256 --max-semi-space-size=8 scripts/discloud-start.mjs",
    "montar-deploy": "node scripts/montar-deploy.mjs"
  }
}
```

**`backend/prisma.config.ts`** (só desenvolvimento e build, com o seed rodando via `tsx`; ele
não vai para a `deploy`, onde não existe CLI do Prisma — regra 12):

```ts
import './src/carregar-env.js';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations', seed: 'tsx src/cli/seed.ts' },
  datasource: { url: process.env['DATABASE_URL'] },
});
```

**`scripts/discloud-start.mjs`** (modelo; ajustar `DATABASE_URL`/seed se o projeto não usar
banco):

```js
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
const MIGRAR = join(BACKEND, 'dist', 'cli', 'migrar.js'); // regra 12: sem CLI do Prisma
const DEPLOY_INFO = join(RAIZ, 'deploy-info.json');
const MANIFESTO = join(RAIZ, 'arquivos-deploy.txt'); // gravado pelo montar-deploy.mjs
const PACOTE_CLIENTE = join(BACKEND, 'node_modules', '@prisma', 'client', 'package.json');
const MARCA_LOCK = join(BACKEND, 'node_modules', '.lock-hash');
// Gravada pelo montar-deploy.mjs --com-dependencias: node_modules veio pronto na branch deploy.
const MARCA_PRONTAS = join(BACKEND, 'node_modules', '.deploy-lock-hash');
// Pacotes com binário nativo do projeto: precisam carregar para aceitar o node_modules pronto.
const NATIVOS = ['sharp', 'bcrypt'];
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
  for (const pasta of [BACKEND, RAIZ]) {
    const arquivo = join(pasta, '.env');
    if (existsSync(arquivo)) process.loadEnvFile(arquivo);
    log(`.env em ${arquivo}: ${existsSync(arquivo) ? 'sim' : 'não'}`);
  }
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

// Regra 12: a Discloud não apaga do disco o que saiu da branch deploy. Dentro das pastas
// geradas pelo deploy, apaga tudo que não está no manifesto (e as pastas que ficarem vazias).
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
  removerSobrasDoDeploy(['scripts', 'backend/dist', 'backend/prisma', 'frontend/browser']);
  instalarDependenciasProducao();
}
rodar(process.execPath, [MIGRAR]);
rodar(process.execPath, [SEED]);

log(`Subindo o servidor (Node ${process.version})`);
process.chdir(BACKEND);
await import(pathToFileURL(MAIN).href);
```

O servidor (`main.ts`) continua com `app.enableShutdownHooks()`: como ele roda no mesmo
processo, recebe o `SIGTERM` da Discloud direto, sem repasse.

**Trecho do `scripts/montar-deploy.mjs`** que gera o pacote e o lock de produção (depois de
copiar `backend/.npmrc`, se existir, e o `backend/package-lock.json` para a pasta da
`deploy`):

```js
const pacote = lerJson(join(RAIZ, 'backend', 'package.json'));
escreverJson(join(backendDeploy, 'package.json'), {
  name: pacote.name,
  private: true,
  type: pacote.type,
  engines: pacote.engines,
  dependencies: pacote.dependencies, // sem devDependencies e sem scripts
});
npm(['install', '--package-lock-only', '--ignore-scripts', '--no-audit', '--no-fund'], backendDeploy);
const lock = lerJson(join(backendDeploy, 'package-lock.json'));
// Regra 12: a CLI do prisma (devDependency) não pode entrar na deploy.
if (Object.values(lock.packages).some((dados) => dados.dev) || lock.packages['node_modules/prisma']) {
  throw new Error('lock de produção com pacote de desenvolvimento ou com a CLI do prisma');
}

// Regra 7: com --com-dependencias (só no GitHub Actions) instala aqui e manda o node_modules
// pronto. Localmente, no Windows, não usar: os nativos sairiam para Windows.
if (process.argv.includes('--com-dependencias')) {
  npm(['ci', '--omit=dev', '--no-audit', '--no-fund', '--loglevel=warn'], backendDeploy);
  // Sem .bin (links simbólicos) e, pela regra 12, sem tipos, source maps e documentação.
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
  const hash = createHash('sha256')
    .update(readFileSync(join(backendDeploy, 'package-lock.json')))
    .digest('hex');
  writeFileSync(join(backendDeploy, 'node_modules', '.deploy-lock-hash'), hash + '\n');
}

// .gitignore da deploy: só o node_modules da raiz fica de fora.
writeFileSync(join(pastaDestino, '.gitignore'), '/node_modules/\n.env\n.env.*\nbackend/uploads/\n');

// Por último (regra 12): lista de tudo que foi publicado, para o start apagar as sobras.
const listar = (pasta) =>
  readdirSync(pasta, { withFileTypes: true }).flatMap((item) => {
    const caminho = join(pasta, item.name);
    return item.isDirectory() ? listar(caminho) : [relative(pastaDestino, caminho).split(sep).join('/')];
  });
const arquivos = [...listar(pastaDestino), 'arquivos-deploy.txt'].sort();
writeFileSync(join(pastaDestino, 'arquivos-deploy.txt'), arquivos.join('\n') + '\n');
```

**Trecho do `.github/workflows/deploy.yml`** (montagem e publicação):

```yaml
      - name: Montar conteúdo da branch deploy
        run: node scripts/montar-deploy.mjs "$RUNNER_TEMP/deploy" --com-dependencias

      # ... no passo "Publicar na branch deploy", depois do cp -a:
          git add -A --force
```

**`sharp` no serviço de upload:**

```ts
sharp.cache(false);
sharp.concurrency(1);

const maior = larguras[larguras.length - 1];
const recorte = await sharp(arquivo)
  .rotate()
  .resize({ width: maior, height: Math.round(maior / proporcao), fit: 'cover' })
  .raw()
  .toBuffer({ resolveWithObject: true });
const base = () =>
  sharp(recorte.data, {
    raw: { width: recorte.info.width, height: recorte.info.height, channels: recorte.info.channels },
  });

for (const largura of larguras) {
  const buffer = await base()
    .resize({ width: largura, height: Math.round(largura / proporcao), fit: 'cover' })
    .webp({ quality: 80, effort: 5 })
    .toBuffer();
  await writeFile(join(pasta, `${nomeBase}-${largura}.webp`), buffer);
}
```

**Aplicar num app que já existe** (checklist):

- [ ] `START` do `discloud.config` com `node --max-old-space-size=256 --max-semi-space-size=8
      scripts/discloud-start.mjs`, e o mesmo comando no `start` do `package.json` da raiz.
- [ ] `discloud-start.mjs` sem `spawn` do servidor, sem build e com `import()` do `main.js`.
- [ ] Seed movido para `src/cli/seed.ts`; `prisma.config.ts` apontando para ele;
      `tsx` e `prisma` em `devDependencies` (rodar `npm install` no backend).
- [ ] `src/cli/migrar.ts` (regra 12) no lugar do `prisma migrate deploy` no start; testar num
      banco vazio, de novo no mesmo banco e conferir com `prisma migrate status`.
- [ ] `montar-deploy.mjs` gerando `package.json`/lock de produção (sem `prisma`), sem copiar
      `src/`, `prisma.config.ts` nem `schema.prisma`, podando o `node_modules` e gravando o
      `arquivos-deploy.txt`; `discloud-start.mjs` apagando as sobras fora dele.
- [ ] `montar-deploy.mjs` com `--com-dependencias` (npm ci, sem `.bin`, marca
      `.deploy-lock-hash`), `.gitignore` da `deploy` com `/node_modules/`; workflow chamando
      com a opção e publicando com `git add -A --force`.
- [ ] `discloud-start.mjs` com a verificação dos nativos (lista `NATIVOS` do projeto) e o
      plano B com `npm ci`.
- [ ] `PrismaPg` com `max: 5`; `sharp` com `cache(false)`, `concurrency(1)` e uma decodificação.
- [ ] Teste local antes do push: `npm run build`, `node scripts/montar-deploy.mjs <pasta>
      --com-dependencias`, copiar o `backend/.env` para `<pasta>/backend/.env` e rodar
      `node --max-old-space-size=256 --max-semi-space-size=8 scripts/discloud-start.mjs` dentro
      de `<pasta>` (com `PORT` livre). Deve logar `npm ci dispensado`, subir um único `node` e o
      site responder. Contar os arquivos (`arquivos-deploy.txt` tem uma linha por arquivo): um
      app NestJS + Prisma fica perto de 6.500. Para testar o plano B, renomear `node_modules/@img` antes de rodar: deve
      cair no `npm ci` e subir do mesmo jeito.
- [ ] Depois do deploy: no log da Discloud aparece `[start] Subindo o servidor` (e não
      `> npm start`) e `Dependências vieram prontas da branch deploy; npm ci dispensado.`; a
      RAM no painel fica perto de 130 MB.

## Deploy na Discloud (via GitHub)

Frontend e backend sobem como **um único app** do tipo `site`: o backend serve o build do
frontend (ver seção anterior). Não criar dois apps.

**Arquivos na raiz do repositório** (a Discloud só lê a raiz, não subpastas):

- `discloud.config`:

  ```
  NAME=Nome do Projeto
  TYPE=site
  ID=subdominio            # o subdomínio criado no painel (até 20 caracteres)
  MAIN=backend/src/main.ts # só precisa existir no zip; quem inicia é o START. Na branch
                           # deploy vira backend/dist/main.js (montar-deploy.mjs troca)
  RAM=512                  # o app em execução fica em ~130 MB (ver "Orçamento de memória");
                           # nunca compilar no servidor, o ng build sozinho passa de 1 GB
  VERSION=latest
  AUTORESTART=true
  VLAN=true                # obrigatório para acessar o banco da Discloud (rede privada)
  BUILD=npm run build
  START=node --max-old-space-size=256 --max-semi-space-size=8 scripts/discloud-start.mjs
                           # node direto, nunca "npm start" (ver "Orçamento de memória")
  ```

- `VERSION=latest` sempre. Não fixar a versão do Node (ex.: `VERSION=24`): com versão fixa
  a Discloud monta o projeto de outro jeito, os `tsconfig*.json` do backend somem e o
  `nest build` falha com `Could not find TypeScript configuration file "tsconfig.json"`. A
  versão do Node fica garantida pelo `engines` e pelo GitHub Actions.
- `package.json` da raiz, só com scripts, chamando os projetos com `--prefix`:
  - `build:backend` / `build:frontend`: `npm install --prefix <pasta> --include=dev
    --no-audit --no-fund && npm run build --prefix <pasta>`. O `--include=dev` é
    obrigatório: com `NODE_ENV=production` o npm pula as `devDependencies`, e sem elas não
    existem `nest`, `ng`, `prisma` nem `tsx`.
  - `build`: backend **antes** do frontend. O build do Angular é o que mais consome memória
    e o mais provável de falhar; se ele vier primeiro e falhar, o backend nunca é instalado e
    o app fica offline com `sh: 1: prisma: not found`.
  - `start`: o mesmo comando do `START` do `discloud.config`.

- O npm 12 não roda scripts de instalação de dependências sem autorização (aviso
  `install-scripts ... not yet covered by allowScripts`). Para `bcrypt`, `sharp`, `esbuild` e
  `prisma` isso não impede o funcionamento, porque eles trazem binários prontos; uma dependência
  nativa sem binário pronto precisaria ser liberada.

**Backend:**

- Escutar na porta **8080** e no host `0.0.0.0`: `app.listen(porta, '0.0.0.0')`, com
  `PORT=8080` nas variáveis de ambiente. Em outra porta o app nunca fica acessível.
- A Discloud gera o `.env` na **raiz do repositório**, mas o backend roda dentro de
  `backend/`. Carregar o `.env` das duas pastas com um arquivo único
  (`src/carregar-env.ts`: `config({ path: ['.env', '../.env'], quiet: true })`), importado na
  primeira linha de `main.ts`, `src/cli/seed.ts` e `prisma.config.ts`, no lugar de
  `import 'dotenv/config'`.
- Banco de dados: usar o PostgreSQL da própria Discloud (**Databases** no painel). O host dele
  (ex.: `sistemas692`) é **privado**: só responde para apps com `VLAN=true` no
  `discloud.config` e no mesmo cluster. Sem a VLAN, as migrations do start não alcançam o banco
  (`ENOTFOUND`/`ECONNREFUSED`, ou `P1001: Can't reach database server` na CLI do Prisma) e o
  app fica reiniciando. A `DATABASE_URL` é a URL
  mostrada em **Conexão privada** no painel do banco. Esse host não existe fora da Discloud,
  então em desenvolvimento local o `.env` aponta para um Postgres local.

**Painel da Discloud:**

1. Criar o subdomínio antes do primeiro deploy e usar o mesmo nome no `ID`.
2. Em **Settings → GitHub integration**, conectar a conta dona do repositório; depois
   **+ Upload → GitHub**, escolhendo o repositório e a branch **`deploy`** (não a `main`, ver
   "Build no GitHub Actions" abaixo). Cada push na `main` gera o build e um novo commit na
   `deploy`, que a Discloud publica sozinha; então só dar push quando a mudança estiver pronta.
3. Cadastrar as variáveis de ambiente: `NODE_ENV=production`, `PORT=8080`, `DATABASE_URL`,
   `SITE_URL` e `FRONTEND_URL` (os dois com o endereço público final, com `https://`),
   `JWT_SECRET` e as demais do `.env.example`. Depois de salvar, **reiniciar o app**: a
   Discloud só grava o `.env` na raiz quando o app sobe. Os nomes têm que ser exatos
   (maiúsculas, sem espaço no início ou no fim).
4. Hospedar site exige o plano Platinum ou superior; domínio próprio exige o Diamond.

**Build no GitHub Actions (branch `deploy`):**

- Compilar no servidor exige reservar ~1 GB de `RAM` só para o pico do `ng build`, enquanto o
  site rodando usa ~100 MB. Por isso o build é feito no GitHub Actions
  (`.github/workflows/deploy.yml`) a cada push na `main`, e o resultado pronto vai para a
  branch `deploy`, que é a que a Discloud usa.
- `scripts/montar-deploy.mjs` define o que vai para a `deploy`: builds do backend e do
  frontend (só a pasta `browser`), as migrations do Prisma (sem `schema.prisma` nem
  `prisma.config.ts`: não há CLI do Prisma em produção), o `package.json`/lock só de produção, o script de start, um
  `discloud.config` sem `BUILD` e com `MAIN=backend/dist/main.js` (o `backend/src/main.ts` não
  vai para a `deploy`, e sem essa troca a Discloud recusa com "O arquivo principal
  backend/src/main.ts não foi encontrado dentro do zip") e o `deploy-info.json` (commit e data
  do build) e o `arquivos-deploy.txt` (lista de tudo que foi publicado, regra 12). Arquivo
  novo que o servidor precise em produção tem que entrar na lista `ITENS` desse script.
- Na `deploy`, o `discloud-start.mjs` encontra o `deploy-info.json` e não compila nada. O
  `backend/node_modules` já vem instalado no Linux do GitHub Actions
  (`montar-deploy.mjs --com-dependencias`, ~90 MB compactado); o start confere se `sharp` e
  `bcrypt` carregam e só roda `npm ci --omit=dev` se não carregarem. Antes apaga do disco as
  sobras de deploys antigos (fora do `arquivos-deploy.txt`); depois aplica as migrations com
  `node dist/cli/migrar.js`, roda o seed e sobe o servidor. Por isso `prisma` fica em
  `devDependencies`: o build usa (`prisma generate`), a produção não.
  O `git add` da publicação usa `--force`, porque pacotes às vezes trazem `.gitignore` próprio.
- Nunca editar a branch `deploy` à mão: ela é sobrescrita a cada push na `main`. Se o build
  falhar no GitHub, a `deploy` não muda e o site continua na versão anterior; o erro aparece
  na aba **Actions** do repositório.
- O `discloud.config` da `main` continua valendo como origem (o da `deploy` é gerado a partir
  dele). Publicar a `main` direto exigiria compilar no servidor, o que não cabe nos 512 MB.

**Trocar a branch ou recriar o app:** antes, salvar as variáveis de ambiente e a pasta
`backend/uploads` (fotos enviadas pelo painel). Recriar o app pode apagar os dois; depois,
cadastrar as variáveis de novo, reiniciar e devolver as fotos. Se o banco também for recriado,
o host dele muda (ex.: `sistemas692` → `sistemas685`) e a `DATABASE_URL` precisa ser
atualizada; nenhum host de banco fica fixo no código.

**Diagnóstico de problemas comuns:**

| Sintoma | Causa e solução |
| --- | --- |
| Log: `DATABASE_URL ausente` e `The datasource.url property is required` (Prisma) | A variável não chegou ao app. Conferir o nome exato no painel e **reiniciar** o app depois de salvar. O `discloud-start.mjs` loga se a variável veio do ambiente, onde existe um `.env` e quais nomes ele tem (nunca os valores). |
| Log: `DATABASE_URL inválida` | Senha com `@ # / ? : %` precisa ser codificada na URL (ex.: `@` vira `%40`). |
| `P1001: Can't reach database server` / `ENOTFOUND <host>` | Falta `VLAN=true`, o banco está em outro cluster ou o host mudou (banco recriado). Usar a URL de **Conexão privada** atual do painel do banco. |
| App reinicia em loop sem erro no log | Falta de memória (o processo é morto). Ver `RAM` e "Build no GitHub Actions". |
| Push feito, mas o site continua igual | Na branch `deploy`: conferir se o workflow **Deploy** ficou verde na aba **Actions**. O log mostra `Build pronto do GitHub Actions: commit <hash>`, que deve ser o do último push. |
| Build: `Could not find TypeScript configuration file "tsconfig.json"` (Nest) com o arquivo no repositório | `VERSION` fixo no `discloud.config` (ex.: `VERSION=24`). Voltar para `VERSION=latest`. |
| `Error checking files` / `O arquivo principal backend/src/main.ts não foi encontrado dentro do zip` | O `MAIN` do `discloud.config` aponta para um arquivo que não está na branch publicada. Na `deploy`, o `montar-deploy.mjs` precisa trocar o `MAIN` por `backend/dist/main.js`. |
| Start: `npm ci` falha com `EUSAGE` (`package.json and package-lock.json ... are in sync`, `Missing: ... from lock file`) e imprime a ajuda do comando | O lock foi gerado com um `.npmrc` (ex.: `legacy-peer-deps=true`) que não foi para a branch `deploy`. Incluir `backend/.npmrc` em `ITENS` do `montar-deploy.mjs`. Teste local: `npm ci --omit=dev --dry-run` dentro da pasta montada pelo script. |
| `Deploy Failed to fetch` no painel | Erro de comunicação do painel, não do build. Recarregar a página e ver o resultado nos **Logs** do app. |
| Página "Almost There! Configuration in Progress" | Domínio ainda sendo configurado pela Discloud (DNS/certificado). Esperar a propagação; não é erro do app. |
| `{"message":"Build do frontend não encontrado."}` (404) | O build do frontend não existe no servidor: conferir se a Discloud está na branch `deploy` e se o GitHub Actions ficou verde. |
| `Abuso de SSD` / `[Discloud] abuse ssd (inodes)` | Arquivos demais no disco do app (o limite é de quantidade, não de espaço). Seguir a regra 12 do "Orçamento de memória": CLI do Prisma fora da produção, `node_modules` podado e o start apagando as sobras de deploys antigos pelo `arquivos-deploy.txt`. Conferir também se os uploads de registros excluídos são apagados. |
| Painel acusa falta de memória / RAM acima do plano | Seguir a seção "Orçamento de memória": `START` com `node` direto e flags de heap, um processo só, nada compilado no servidor, lock só de produção. |
| Domínio sem `www` não abre (erro de certificado ou conexão expirada), `www` funciona | Ver "Domínio principal com e sem `www`" abaixo. Conferir no RDAP se os servidores DNS são os da Cloudflare, se o registro raiz está **laranja** e se a regra de redirecionamento está ativa. Se o DNS responde `192.0.2.1` direto (não IPs da Cloudflare), o registro está sem proxy ou foi criado na zona do Registro.br. |
| `www` com erro de certificado (`SEC_E_ILLEGAL_MESSAGE`, `ERR_SSL_PROTOCOL_ERROR`) | O `www` não está cadastrado em **Domains** na Discloud ou está com a nuvem laranja na Cloudflare. |
| 503/504 de um servidor Apache, ou o site antigo, logo depois de trocar o DNS | Cache de DNS ainda apontando para o servidor anterior. Esperar a propagação; no PC, `ipconfig /flushdns` e `chrome://net-internals/#dns` → **Clear host cache**. |

Os erros de build e de início aparecem nos **Logs** do app no painel (o terminal do app); os
do build no GitHub, na aba **Actions** do repositório.

**Domínio próprio (subdomínio de um domínio que já existe):**

- O domínio continua no registrador (ex.: Registro.br) e o DNS atual não muda: só se
  **acrescenta** o registro do subdomínio. Os registros existentes (`www`, raiz, e-mail) não
  são tocados.
- O registro é criado onde o DNS do domínio está hospedado de fato: no Registro.br, se os
  servidores DNS forem `a.dns.br`/`b.dns.br` (**Configurar zona DNS**); senão, no provedor
  para onde eles apontam (hospedagem, Cloudflare etc.).
- Na Discloud: **Domains → + Add domain** (domínio + prefixo do subdomínio) → **See DNS**, e
  criar exatamente os registros mostrados ali (hoje, dois registros `A` para o subdomínio;
  pode haver um `TXT` de verificação). Na Cloudflare, deixar como **DNS only** (nuvem cinza),
  senão o certificado HTTPS não é emitido.
- Depois da propagação, clicar em **Rebuild** no app e atualizar `SITE_URL` e `FRONTEND_URL`
  para o novo endereço.

**Domínio principal com e sem `www` (Cloudflare):**

A Discloud não redireciona um domínio para outro e, na prática, só mantém o certificado HTTPS
de um deles (ao cadastrar o `www`, o domínio sem `www` perdeu o certificado). Por isso o app
fica só no `www` e a Cloudflare (plano Free) atende o domínio sem `www`, redirecionando para o
`www`. Configuração atual do `cinejales.com.br`:

- **Discloud:** só `www.cinejales.com.br` cadastrado em **Domains**. Variáveis:
  `SITE_URL=https://www.cinejales.com.br` e `FRONTEND_URL=https://www.cinejales.com.br` (o
  domínio sem `www` nunca chega ao app).
- **Registro.br:** em **DNS → Alterar servidores DNS**, os dois nameservers da Cloudflare
  (hoje `sydney.ns.cloudflare.com` e `yisroel.ns.cloudflare.com`). Não confundir com
  **Configurar zona DNS**: essa zona deixa de valer quando os servidores mudam, e o DNS passa a
  ser editado só na Cloudflare.
- **Cloudflare → DNS → Registros** (só estes três):

  | Tipo | Nome | Conteúdo | Status do proxy |
  |---|---|---|---|
  | A | `cinejales.com.br` (`@`) | `192.0.2.1` | Com proxy (nuvem laranja) |
  | A | `www` | `75.2.96.173` | Somente DNS (nuvem cinza) |
  | A | `www` | `99.83.186.151` | Somente DNS (nuvem cinza) |

  - O `www` fica **cinza** para ir direto à Discloud, que emite e renova o certificado dele.
    Com a nuvem laranja a Cloudflare fica no meio e o certificado da Discloud pode falhar.
  - O domínio sem `www` fica **laranja** e aponta para `192.0.2.1` (IP reservado, que não
    leva a lugar nenhum): quem responde é a Cloudflare, que faz o redirecionamento e cuida do
    HTTPS. Os IPs do `www` são os mostrados em **See DNS** na Discloud.
- **Cloudflare → Regras → Regras de redirecionamento** (uma regra só):
  - Nome: `sem www para www`.
  - **Personalizar expressão do filtro**: Campo **Nome do host**, Operador **é igual a**,
    Valor `cinejales.com.br` (só o domínio). A expressão fica
    `(http.host eq "cinejales.com.br")`.
  - Então: Tipo **Dinâmico**, expressão
    `concat("https://www.cinejales.com.br", http.request.uri.path)`, código **301**,
    **Preservar string de consulta** marcado.
- **Cloudflare → SSL/TLS → Certificados de borda:** **Sempre usar HTTPS** ligado.
- Para conferir: `https://cinejales.com.br/qualquer/caminho?a=1` responde 301 para
  `https://www.cinejales.com.br/qualquer/caminho?a=1`, e `https://www.cinejales.com.br`
  responde 200. A delegação real do domínio aparece em
  `https://rdap.registro.br/domain/cinejales.com.br` (campo `nameservers`); o painel da
  Cloudflare pode dizer "Ativo" antes disso valer.
- Para desfazer: voltar os servidores DNS no Registro.br para os dele
  (`a.sec.dns.br`/`c.sec.dns.br`) e conferir se a zona de lá tem os registros certos.

**Fotos enviadas pelo painel:** ficam em `backend/uploads/`, no disco do app. Antes de
cadastrar conteúdo de verdade, testar se elas continuam lá depois de um novo deploy (enviar
uma foto, dar push, conferir). Se sumirem, mover os uploads para um armazenamento externo
(S3, Cloudflare R2).

## Contato do cliente

- Número de WhatsApp sempre no formato `55` + DDD + número, sem espaços, traços ou
  parênteses (é o formato exigido pelo link `https://wa.me/...`).
- Link do Instagram sempre completo (`https://www.instagram.com/usuario/`), nunca só o
  `@usuario`.
- Esses dados ficam só no arquivo de config centralizado (ver seção de estrutura de
  pastas), nunca duplicados/hardcoded em outros componentes.

## Convenções gerais de código

- Sem comentários explicando o óbvio; comentário só quando existe uma razão não óbvia
  (ex.: workaround, decisão que não se explica pelo próprio código).
- Sem abstrações prematuras: não criar serviço/helper genérico para um caso de uso
  único, só extrair quando o padrão se repetir de fato.
- Conteúdo textual da interface (labels, textos, mensagens) em **pt-BR**.
- Imagens reais (fotos de pessoas, ambiente, produtos) sempre com `alt` descritivo,
  `width`/`height` definidos e `loading="lazy"` quando fora da primeira dobra.
- Acessibilidade básica: `aria-label` em botões/ícones sem texto visível, foco visível
  em elementos interativos.
- Não deixar placeholders (ícones, textos "lorem ipsum", seções vazias) na versão que
  vai para produção; substituir por conteúdo real antes de considerar a página pronta.
- **Nunca usar travessão (—) em texto corrido** (código, comentários, conteúdo de UI,
  documentação). Preferir vírgula, dois-pontos, ponto e vírgula, ponto final ou
  reescrever a frase. Placeholders visuais isolados (ex.: `'—'` para "sem valor" numa
  célula de tabela) não são texto corrido e ficam de fora dessa regra.

## Controle de versão (.gitignore)

Um único `.gitignore` na raiz do repositório, enxuto e organizado por categoria, cobrindo
frontend e backend. Não copiar o modelo genérico gigante do GitHub (cheio de ferramentas que o
projeto não usa): cada linha precisa ter motivo de existir. O `.gitignore` que o Angular CLI
gera dentro de `frontend/` pode ficar, já que só cuida da própria pasta.

**Nunca vai para o Git:**

- Dependências e saídas de build: `node_modules/`, `dist/`, `out-tsc/`, `*.tsbuildinfo`,
  caches (`.angular/`, `.cache/`) e `coverage/`.
- Segredos: `.env` e qualquer `.env.*`, com exceção explícita de `!.env.example`.
- Código gerado a partir de outra fonte, que é recriado no install/build (ex.: cliente do Prisma
  em `backend/src/generated/`, recriado pelo `postinstall: prisma generate`). Se o projeto
  ignora um arquivo gerado, o script que o recria precisa rodar sozinho no `npm install`/build,
  senão o projeto não compila num clone novo.
- Dados de runtime: arquivos enviados pelo painel (`backend/uploads/`) ficam no servidor e
  entram no backup, não no repositório.
- Logs, arquivos de sistema operacional e de editor (`*.log`, `.DS_Store`, `Thumbs.db`,
  `.idea/`) e configurações locais de ferramentas de cada desenvolvedor
  (ex.: `.claude/settings.local.json`).
- Originais pesados de imagens (ver seção de WebP): ficam fora do projeto, só a versão
  otimizada é versionada.

**Sempre vai para o Git:**

- `package-lock.json` (garante as mesmas versões em todo ambiente) e as migrations do Prisma.
- `.env.example` com **todas** as variáveis que o projeto lê, valores de exemplo ou vazios e um
  comentário curto quando não for óbvio. Toda variável nova no código entra no `.env.example`
  no mesmo commit.
- Assets otimizados gerados por script (WebP em `public/`, ícones do PWA, `og:image`) e os
  arquivos de dados que esses scripts geram para o código (ex.: `logo-imagem.ts`), para o
  build funcionar sem rodar os scripts de novo.

Antes do primeiro commit (e sempre que mexer no `.gitignore`), conferir com
`git status --ignored` e `git add --dry-run .` que nenhum segredo, build ou upload entraria no
commit.

## Idioma

- Respostas ao usuário durante o desenvolvimento (chat/prompt) sempre em português.
- Mensagens de commit sempre em português, mesmo quando o código e os comentários
  técnicos estiverem em inglês.

## Nome do projeto

Sempre conferir a grafia correta do nome/marca com o cliente antes de espalhar pelo
código (título, meta tags, e-mails, textos de UI, nomes de arquivo de imagem, chaves de
`localStorage`, etc.). Grafias parecidas mas erradas (troca de letras, por exemplo) são
fáceis de reproduzir sem perceber porque o autocomplete/copiar-colar propaga o erro.
