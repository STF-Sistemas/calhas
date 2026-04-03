---
trigger: always_on
---

# Padrões de Qualidade: Performance, Acessibilidade, SEO e Boas Práticas (Lighthouse)

Todas as telas e componentes desenvolvidos neste projeto DEVEM atender os seguintes critérios de qualidade, verificados pelo **Google Lighthouse**. A meta mínima é:

| Métrica | Meta |
|---|---|
| Performance | ≥ 90 |
| Acessibilidade | ≥ 95 |
| Best Practices | ≥ 90 |
| SEO | ≥ 90 |

---

## 1. Acessibilidade (Accessibility ≥ 95)

Todo elemento interativo e de conteúdo DEVE satisfazer as diretrizes WCAG 2.1 AA:

### 1.1 Atributos Obrigatórios
- **`aria-label`**: Todo `<button>`, `<a>`, componentes interativos do PrimeNG (como `p-button`, `p-speeddial`) e elemento interativo sem texto visível DEVE ter `aria-label` descritivo.
  ```html
  <!-- ✅ Correto -->
  <button pButton icon="pi pi-times" aria-label="Fechar diálogo"></button>
  <!-- ❌ Errado -->
  <button pButton icon="pi pi-times"></button>
  ```
- **`alt`**: Todo `<img>` DEVE ter atributo `alt` descritivo (nunca vazio, a não ser que seja decorativa e não transmita informação).
- **`id` único**: Todo campo de formulário DEVE ter `id` único na página.
- **`for`/`formControlName`**: Labels devem estar corretamente associados aos inputs.

### 1.2 Hierarquia de Headings
- Cada página deve ter exatamente **um `<h1>`** com o título principal.
- Subtítulos devem usar `<h2>`, `<h3>` em ordem hierárquica sem pular níveis.
- Nunca usar headings apenas por razões de estilo visual (use CSS para isso).

### 1.3 Contraste de Cores
- A razão de contraste entre texto e fundo DEVE ser **≥ 4.5:1** para texto normal e **≥ 3:1** para texto grande (≥ 18px bold ou ≥ 24px normal).
- Nunca use cinza claro sobre branco, ou texto amarelo sobre fundo claro.
- Verifique sempre usando a paleta de cores do tema PrimeNG configurado.

### 1.4 Foco e Navegação por Teclado
- Todos os elementos interativos DEVEM ser acessíveis via `Tab`.
- Nunca remova o outline de foco com `outline: none` sem substituir por uma alternativa visual clara.
- Modais DEVEM capturar o foco ao abrir (os diálogos do PrimeNG fazem isso automaticamente).

### 1.5 Atributos de Formulário
- Campos de senha DEVEM ter `type="password"`.
- Campos de e-mail DEVEM ter `type="email"`.
- Campos numéricos DEVEM ter `type="number"` ou `inputmode="numeric"`.
- Todo campo de input DEVE conter um label associado ou um `placeholder` descritivo que funcione como label para tecnologias assistivas.

### 1.6 Idioma da Página
- O atributo `lang="pt-BR"` DEVE estar presente na tag `<html>` do `index.html`.

---

## 2. SEO (SEO ≥ 90)

### 2.1 Meta Tags Obrigatórias no `index.html`
O arquivo `frontend/src/index.html` DEVE conter:
```html
<meta name="description" content="[Descrição específica da aplicação — mínimo 70, máximo 160 caracteres]">
<meta name="robots" content="index, follow">
<link rel="canonical" href="[URL canônica da página]">
```

### 2.2 Open Graph (Compartilhamento Social)
```html
<meta property="og:title" content="[Nome da aplicação]">
<meta property="og:description" content="[Descrição breve]">
<meta property="og:type" content="website">
<meta property="og:url" content="[URL]">
```

### 2.3 Title Tag
- Toda página (rota) DEVE ter um `<title>` significativo. Usar o `Title` service do Angular:
  ```typescript
  import { Title } from '@angular/platform-browser';
  // No ngOnInit:
  this.title.setTitle('Nome da Página | Dicionário Nzo Akieze');
  ```

### 2.4 Estrutura Semântica
- Usar elementos HTML semânticos: `<main>`, `<nav>`, `<header>`, `<footer>`, `<article>`, `<section>`.
- Nunca usar `<div>` ou `<span>` onde um elemento semântico seja mais adequado.
- Os conteúdos principais da página DEVEM estar dentro de uma tag `<main>`.

### 2.5 Robots e Links
- Links externos DEVEM ter `rel="noopener noreferrer"`.
- Links internos `[routerLink]` não precisam de `href` estático.

---

## 3. Best Practices (Best Practices ≥ 90)

### 3.1 Console Limpo
- É **PROIBIDO** deixar `console.log()` de debug em código de produção.
- Permitido apenas: `console.error()` em blocos `catch` com mensagens significativas.

### 3.2 HTTPS e Recursos Seguros
- Nunca referenciar recursos externos via `http://` (use sempre `https://`).
- Imagens, fontes e scripts externos DEVEM ser carregados via HTTPS.

### 3.3 Atributo `rel` em Links Externos
- Todo `<a target="_blank">` DEVE ter `rel="noopener noreferrer"`.

### 3.4 Uso de `defer` e Lazy Loading
- Imagens fora da área visível inicial (below the fold) DEVEM usar `loading="lazy"`.
  ```html
  <img src="..." alt="..." loading="lazy">
  ```
- Rotas Angular DEVEM usar `loadComponent` (lazy loading) — nunca importação estática no `app.routes.ts`.

### 3.5 Sem Erros no Console do Browser
- Toda tela implementada deve ser verificada. Não deve haver erros JavaScript no console do browser.

### 3.6 Metadados de Viewport
O `index.html` DEVE conter:
```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

---

## 4. Performance (Performance ≥ 90)

### 4.1 Lazy Loading de Módulos e Componentes
- Todas as rotas DEVEM usar `loadComponent()` com imports dinâmicos.
- Nunca importar componentes de página diretamente em módulos eager.

### 4.2 Imagens Otimizadas
- Imagens DEVEM ser servidas nos formatos modernos: **WebP** (preferencial) ou **AVIF**.
- Nunca usar imagens PNG/JPG raw acima de 200KB sem compressão.
- SEMPRE definir `width` e `height` em imagens para evitar Layout Shift (CLS).
  ```html
  <img src="logo.webp" alt="Logo" width="200" height="60" loading="lazy">
  ```

### 4.3 Evitar Render Blocking
- CSS crítico deve estar inline ou carregado no `<head>`.
- Scripts de terceiros NÃO críticos devem usar `defer` ou `async`.

### 4.4 State e Change Detection
- Componentes com listas grandes DEVEM usar `ChangeDetectionStrategy.OnPush`.
  ```typescript
  @Component({
      changeDetection: ChangeDetectionStrategy.OnPush,
      ...
  })
  ```
- Use `trackBy` em todo `*ngFor` sobre listas dinâmicas:
  ```html
  <div *ngFor="let item of items; trackBy: trackById">
  ```
  ```typescript
  trackById(index: number, item: any): number {
      return item.id;
  }
  ```

### 4.5 Subscriptions e Memory Leaks
- Todo `subscribe()` em componentes DEVE ser cancelado no `ngOnDestroy`.
- Padrão recomendado com `takeUntilDestroyed` (Angular 16+):
  ```typescript
  import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
  // ...
  this.service.getData().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(...);
  ```

---

## 5. Checklist Obrigatório ao Implementar uma Tela

Antes de considerar uma tela como concluída, verifique mentalmente:

- [ ] Há exatamente um `<h1>` na página?
- [ ] Todos os botões de ícone têm `aria-label`?
- [ ] Todas as imagens têm `alt` descritivo e dimensões definidas?
- [ ] O `<title>` da página é atualizado via `Title` service?
- [ ] Os controles de formulário têm `type` correto e `id` único?
- [ ] O contraste de cores é ≥ 4.5:1?
- [ ] Não há `console.log()` de debug?
- [ ] Listas com `*ngFor` usam `trackBy`?
- [ ] Subscriptions são canceladas (`takeUntilDestroyed` ou `OnDestroy`)?
- [ ] Rotas usam `loadComponent` (lazy loading)?
- [ ] Imagens abaixo do fold usam `loading="lazy"`?
- [ ] Não há erros no console do browser?
