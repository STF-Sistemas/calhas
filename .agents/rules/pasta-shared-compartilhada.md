---
trigger: always_on
---

# Pasta Shared Compartilhada — Padrões Obrigatórios

Esta rule define a estrutura, localização e padrões de importação da pasta `shared/`, que é compartilhada entre os projetos **frontend** (Angular) e **backend** (Node/Express/Prisma). Toda regra aqui descrita deve ser seguida rigorosamente em qualquer implementação.

---

## 1. Estrutura Obrigatória da Pasta `shared/`

A pasta `shared/` fica na **raiz do monorepo** (`d:/Pingo/calhas/shared`) e é compartilhada por frontend e backend. Nunca duplique tipos, interfaces ou enums nos projetos individuais — a fonte da verdade é sempre a pasta `shared/`.

```
calhas/
├── shared/
│   ├── interfaces/       ← Contratos de API, DTOs, modelos de dados
│   │   └── index.ts      ← Re-exporta tudo (barrel file)
│   ├── enums/            ← Enumerações compartilhadas
│   │   └── index.ts      ← Re-exporta tudo (barrel file)
│   ├── types/            ← Tipos utilitários compartilhados
│   │   └── index.ts
│   ├── constants/        ← Constantes de negócio compartilhadas
│   │   └── index.ts
│   └── index.ts          ← Barrel raiz: re-exporta todos os sub-módulos
├── frontend/
└── backend/
```

### 1.1 Criação de subpastas

- Se uma subpasta ainda não existir, crie-a junto com seu `index.ts` (barrel).
- Nunca crie arquivos avulsos na raiz de `shared/` — use sempre as subpastas corretas.

---

## 2. Padrões de Nomenclatura

| Tipo de artefato | Prefixo | Exemplo |
|---|---|---|
| Interface | `I` | `ICalha.ts`, `IUsuario.ts` |
| Enum | prefixo E, PascalCase | `EStatusPedido.ts`, `ETipoCalha.ts` |
| Type alias | `T` | `TApiResponse.ts` |
| Constante | SCREAMING_SNAKE_CASE no nome da const | `API_ROUTES.ts` |

### 2.1 Regra de Numeração de Enums
Todos os enums compartilhados DEVEM utilizar numeração sequencial começando de 1 (ou seguindo a ordem lógica definida na tarefa).
Exemplo:
```typescript
export enum EStatusGeral {
  Ativo = 1,
  Inativo = 2,
}
```

> **NUNCA** use nomes genéricos como `types.ts`, `models.ts`, `data.ts` na raiz de shared.

---

## 3. Padrões de Importação com Path Alias — `#shared/*`

Tanto no **frontend** quanto no **backend**, o alias `#shared` deve ser configurado para apontar para a pasta `shared/` da raiz do monorepo. As importações DEVEM sempre usar o alias, nunca caminhos relativos que saiam do projeto (`../../shared/...`).

### 3.1 Sintaxe obrigatória de importação

```typescript
// ✅ CORRETO — usar sempre o alias
import { ICalha } from '#shared/interfaces';
import { StatusPedido } from '#shared/enums';
import { TApiResponse } from '#shared/types';
import { API_ROUTES } from '#shared/constants';

// ❌ PROIBIDO — caminho relativo saindo do projeto
import { ICalha } from '../../shared/interfaces';
import { ICalha } from '../../../shared/interfaces/ICalha';
```

### 3.2 Importação granular vs barrel

- **Prefira sempre importar do barrel** (`#shared/interfaces`, `#shared/enums`) e não do arquivo individual.
- Importe do arquivo individual apenas quando o barrel gerar problemas de dependência circular.

```typescript
// ✅ Preferido — via barrel
import { ICalha, IUsuario } from '#shared/interfaces';

// ✅ Aceitável — arquivo individual (somente se necessário)
import { ICalha } from '#shared/interfaces/ICalha';
```

---

## 4. Configuração do Alias `#shared` — Backend (Node/TypeScript)

No arquivo `backend/tsconfig.json`, adicione/mantenha os paths:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "#shared/*": ["../shared/*"]
    }
  }
}
```

Se o backend usar **ts-node** ou **tsx** diretamente, garanta que o `tsconfig-paths` ou plugin equivalente esteja configurado para resolver os paths em runtime.

Se o backend usar **Node.js com importações nativas** (ESM com `"type": "module"`), adicione no `package.json` do backend:

```json
{
  "imports": {
    "#shared/*": "../shared/*.js"
  }
}
```

---

## 5. Configuração do Alias `#shared` — Frontend (Angular)

No arquivo `frontend/tsconfig.json`, adicione/mantenha os paths:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "#shared/*": ["../shared/*"]
    }
  }
}
```

> O Angular CLI resolve automaticamente os paths do `tsconfig.json` — nenhuma configuração de webpack adicional é necessária.

---

## 6. Barrel Files (`index.ts`) — Padrão Obrigatório

Cada subpasta de `shared/` DEVE ter um `index.ts` que re-exporta tudo:

```typescript
// shared/interfaces/index.ts
export * from './ICalha';
export * from './IUsuario';
export * from './IPedido';
```

```typescript
// shared/enums/index.ts
export * from './StatusPedido';
export * from './TipoCalha';
```

```typescript
// shared/index.ts  ← barrel raiz (opcional, mas recomendado)
export * from './interfaces';
export * from './enums';
export * from './types';
export * from './constants';
```

---

## 7. Regras de Conteúdo — O que PODE e o que NÃO PODE estar em `shared/`

### ✅ PODE estar em `shared/`
- Interfaces de entidades (`ICalha`, `IUsuario`, `IPedido`)
- DTOs de request/response da API (`ICreateCalhaDto`, `ICalhaResponse`)
- Enums de domínio (`StatusPedido`, `TipoCalha`, `PerfilUsuario`)
- Types utilitários genéricos (`TApiResponse<T>`, `TPaginatedResult<T>`)
- Constantes de negócio compartilhadas (códigos de status, rotas da API)

### ❌ NÃO PODE estar em `shared/`
- Lógica de negócio (funções, classes com comportamento)
- Componentes Angular
- Services do Angular ou do Node
- Código que dependa de APIs de browser (`window`, `document`) ou de Node (`fs`, `path`)
- Schemas do Prisma ou decoradores ORM
- Arquivos de configuração de framework

---

## 8. Checklist ao Criar ou Modificar Artefatos em `shared/`

Antes de considerar o artefato como concluído:

- [ ] O arquivo está na subpasta correta (`interfaces/`, `enums/`, `types/`, `constants/`)?
- [ ] O nome segue a nomenclatura obrigatória (prefixo `I`, `T`, enum PascalCase)?
- [ ] O arquivo foi exportado no `index.ts` da subpasta?
- [ ] A importação nos arquivos consumidores usa o alias `#shared/...`?
- [ ] O `tsconfig.json` do frontend e/ou backend contém o path `#shared/*` mapeado corretamente?
- [ ] Não há lógica de negócio, serviços ou código framework-específico em `shared/`?
- [ ] Não há importações relativas saindo do projeto (`../../shared/...`)?

---

## 9. Referência Rápida de Aliases

| Alias | Resolve para | Uso |
|---|---|---|
| `#shared/interfaces` | `shared/interfaces/index.ts` | Interfaces e DTOs |
| `#shared/enums` | `shared/enums/index.ts` | Enumerações |
| `#shared/types` | `shared/types/index.ts` | Types genéricos |
| `#shared/constants` | `shared/constants/index.ts` | Constantes de negócio |