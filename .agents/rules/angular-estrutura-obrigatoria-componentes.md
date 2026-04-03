---
trigger: always_on
---

# Padrões Obrigatórios: Angular e Arquitetura UI

Ao atuar neste projeto, siga rigorosamente as seguintes regras para garantir consistência visual, técnica e segurança:

## 1. Estrutura de Componentes Angular
Todos os componentes devem ser criados com separação total de responsabilidades. É terminantemente PROIBIDO o uso de código "inline" (CSS ou HTML).
- **Arquivos Obrigatórios:** Cada componente DEVE consistir em 3 arquivos: [.ts](file:///d:/Pingo/calhas/frontend/src/app/shared/components/example.ts) (lógica), [.html](file:///d:/Pingo/calhas/frontend/src/app/shared/components/example.html) (template) e [.scss](file:///d:/Pingo/calhas/frontend/src/app/shared/components/example.scss) (estilos).
- **Configuração do @Component:** O decorador no arquivo TypeScript deve conter apenas as referências externas usando `templateUrl` e `styleUrls` (em um array).
- **Pré-processador:** O padrão obrigatório para estilos é SCSS.

## 2. Uso Mandatório de PrimeNG
Para garantir uma experiência premium e consistente (Design System):
- **Componentes de UI:** É OBRIGATÓRIO o uso de componentes do **PrimeNG** para todos os elementos de interface, a menos que o PrimeNG não forneça uma solução nativa.
    - **Botões:** Usar `p-button`, `p-splitbutton`, `p-speeddial`, etc.
    - **Formulários:** Usar `p-inputtext`, `p-dropdown`, `p-checkbox`, `p-calendar`, `p-inputnumber`.
    - **Containers:** Usar `p-card`, `p-toolbar`, `p-tabview`, `p-panel`.
    - **Feedback:** Usar `p-progressspinner`, `p-progressbar`, `MessageService` (Toast/Messages).
- **Acessibilidade:** Utilize sempre os atributos de acessibilidade fornecidos pelo PrimeNG:
    - Todo botão sem texto visível DEVE ter `aria-label` descritivo.
    - Todo campo de input DEVE ter label associado ou `aria-labelledby`.
    - Inputs DEVEM ter `type` correto: `type="email"`, `type="password"`, `type="number"`.
    - Todo `<img>` DEVE ter `alt` descritivo. Nunca omitir.

## 3. Uso Obrigatório de Wrapper para Modais
Para manter a consistência visual e funcional de todos os diálogos:
- **Componente Base:** Todo e qualquer modal deve utilizar o componente `app-dialog-wrapper` (`DialogWrapperComponent`) em seu template HTML.
- **Estrutura:** Insira o conteúdo específico dentro das tags do wrapper, configurando `title`, `isLoadingData`, `hasFooter` e os eventos de salvamento/fechamento conforme a necessidade. No PrimeNG, isso será integrado com `DynamicDialog` ou `p-dialog`.

## 4. Localização de Interfaces e Tipos (ver rule `pasta-shared-compartilhada.md`)
Para garantir a consistência entre Frontend e Backend:
- **Diretório Único:** Crie todas as interfaces (contratos de API, modelos de dados, DTOs) obrigatoriamente na pasta raiz `shared/interfaces` do monorepo (`d:/Pingo/calhas/shared/interfaces`).
- **Nomenclatura:** Utilize o prefixo "I" (ex: `ICalha.ts`) e exporte no `index.ts` barrel da subpasta.
- **Importação Obrigatória:** Use **sempre** o alias `#shared/interfaces` — nunca caminhos relativos que saiam do projeto:
  ```typescript
  // ✅ CORRETO
  import { ICalha } from '#shared/interfaces';
  import { StatusPedido } from '#shared/enums';
  // ❌ PROIBIDO
  import { ICalha } from '../../shared/interfaces';
  ```
- **Regra completa:** Consulte `pasta-shared-compartilhada.md` para estrutura detalhada, configuração de tsconfig, enums, types e constants.

## 5. Uso Obrigatório de Data-Table para Listagens
Para manter a consistência visual, funcionalidades de filtro e paginação em todas as listagens:
- **Componente Base:** Toda e qualquer listagem (tabela) deve obrigatoriamente utilizar o componente `app-data-table` (`DataTableComponent`).
- **Implementação:** É PROIBIDO construir tabelas usando diretamente `p-table` nos componentes de página. Utilize as propriedades `data`, `columns` and `actions` do `app-data-table` para configurar a listagem.

## 6. Qualidade Lighthouse (obrigatório — ver rule específica)
Toda tela implementada DEVE satisfazer os critérios da rule `qualidade-lighthouse-performance-seo-acessibilidade.md`:
- **Performance ≥ 90**: lazy loading de rotas (`loadComponent`), `trackBy` em `*ngFor` ou `@for`, `OnPush` onde aplicável, sem `console.log()` de debug.
- **Acessibilidade ≥ 95**: `aria-label` em todos os ícones interativos, `<h1>` único por página, contraste ≥ 4.5:1, `lang="pt-BR"` no HTML.
- **Best Practices ≥ 90**: sem erros no console, recursos externos via HTTPS, `loading="lazy"` em imagens abaixo do fold, links externos com `rel="noopener noreferrer"`.
- **SEO ≥ 90**: `Title` service atualizado em toda rota, meta description no `index.html`, estrutura semântica (`<main>`, `<header>`, `<nav>`, `<section>`).

## 7. Checklist de Conclusão de Tela
Antes de declarar uma tela como concluída, verifique mentalmente:
- [ ] Há exatamente um `<h1>` na página?
- [ ] Todos os botões de ícone têm `aria-label`?
- [ ] Todas as imagens têm `alt` e dimensões (`width`/`height`)?
- [ ] O `<title>` é atualizado via `Title` service?
- [ ] Campos de formulário têm `type` correto e `id` único?
- [ ] Não há `console.log()` de debug?
- [ ] Listas dinâmicas usam `trackBy` (se usando `*ngFor`) ou sintaxe moderna `@for`.
- [ ] Subscriptions canceladas com `takeUntilDestroyed` ou `OnDestroy`?
- [ ] Rotas carregadas com `loadComponent` (lazy)?
- [ ] Conteúdo principal dentro de `<main>`?
- [ ] Não há erros no console do browser?

## 8. Controle de Visibilidade Condicional — `@if` vs `[hidden]`
Para exibir/ocultar elementos condicionalmente, utilize **sempre a sintaxe de fluxo de controle moderna** do Angular 17+. É PROIBIDO o uso de `*ngIf` (sintaxe legada).

### 8.1 Regra de Escolha

| Situação | Usar | Motivo |
|---|---|---|
| Elemento alternado raramente (ex: estados de carregamento, permissões) | `@if` / `@else` | Remove do DOM — sem custo de memória ou ciclo de vida |
| Elemento alternado com altíssima frequência (ex: animações em tempo real) | `[hidden]` | Mantém no DOM — evita recriação constante |

### 8.2 Sintaxe Obrigatória
```html
<!-- ✅ Correto — sintaxe moderna Angular 17+ -->
@if (condicao) {
  <elemento-a></elemento-a>
} @else {
  <elemento-b></elemento-b>
}

<!-- ❌ PROIBIDO — sintaxe legada -->
<elemento-a *ngIf="condicao"></elemento-a>

<!-- ✅ Correto — ng-container agrupa sem gerar DOM real -->
@if (isSaving) {
  <p-progressSpinner styleClass="w-2rem h-2rem" strokeWidth="4"></p-progressSpinner>
} @else {
  <ng-container>
    <i class="pi pi-save"></i>
    Salvar
  </ng-container>
}

<!-- ❌ Causa warning NG8011 — dois nós raiz no @else -->
} @else {
  <i class="pi pi-save"></i>
  Salvar
}