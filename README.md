# Calhas — Sistema de Gestão de Pedidos

Sistema web completo para gestão de pedidos, clientes, produtos e serviços voltado a empresas do segmento de calhas e coberturas.

---

## Visão Geral

Aplicação full-stack em monorepo com três pacotes principais:

| Pacote | Tecnologia | Porta |
|---|---|---|
| `backend/` | Node.js + Express + Prisma | 3004 |
| `frontend/` | Angular 21 + PrimeNG | 4204 |
| `shared/` | TypeScript (interfaces e enums) | — |

O `shared/` é consumido tanto pelo backend quanto pelo frontend, garantindo tipagem consistente em toda a aplicação.

---

## Stack Tecnológico

**Backend**
- Node.js com Express 4
- TypeScript 5.7
- Prisma ORM 5.22 (PostgreSQL)
- JWT (jsonwebtoken 9) + bcrypt 5
- http-status-codes

**Frontend**
- Angular 21 (standalone components)
- PrimeNG 21 + Aura Theme
- Reactive Forms
- RxJS 7.8
- ngx-mask

**Banco de Dados**
- PostgreSQL com três schemas: `util`, `conf`, `calhas`

---

## Estrutura do Projeto

```
calhas/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Modelos do banco de dados
│   │   └── seed.ts             # Dados iniciais
│   └── src/
│       ├── app.ts              # Entry point / servidor Express
│       ├── config/             # Configuração do Prisma
│       ├── middlewares/        # Auth, erro
│       └── modules/            # Módulos da API
│           ├── auth/
│           ├── cep/
│           ├── cidades/
│           ├── clientes/
│           ├── chapas/
│           ├── dashboard/
│           ├── desenhos/
│           ├── empresas/
│           ├── pedidos/
│           ├── produtos/
│           ├── servicos/
│           └── usuarios/
│
├── frontend/
│   └── src/app/
│       ├── core/               # Services, Guards, Interceptors
│       ├── layout/             # Shell (menu + topbar)
│       ├── pages/              # Telas da aplicação
│       │   ├── dashboard/
│       │   ├── clientes/
│       │   ├── chapas/
│       │   ├── desenhos/
│       │   ├── empresas/
│       │   ├── pedidos/        # Inclui desenho-medida/
│       │   ├── produtos/
│       │   ├── servicos/
│       │   └── usuarios/
│       └── shared/             # Componentes e diretivas reutilizáveis
│           ├── components/     # data-table, dialog-wrapper
│           └── directives/     # currency-mask
│
└── shared/
    ├── enums/                  # EStatusPedido, ETipoItemPedido, etc.
    ├── functions/              # Funções utilitárias (formatação)
    ├── interfaces/             # Contratos de dados
    └── types/                  # TApiResponse
```

---

## Banco de Dados

### Schema `util`
| Tabela | Descrição |
|---|---|
| `Tipo` | Tabela de lookup de tipos |

### Schema `conf`
| Tabela | Descrição |
|---|---|
| `Usuario` | Usuários do sistema com perfis (SuperAdmin, Admin, Usuário) |

### Schema `calhas`
| Tabela | Descrição |
|---|---|
| `Empresa` | Multi-tenancy — cada empresa tem seus próprios dados |
| `Cidade` | Cidades para endereçamento |
| `Cliente` | Clientes da empresa |
| `Produto` | Produtos do catálogo |
| `Chapa` | Chapas (material) com seus cortes |
| `Corte` | Cortes específicos de cada chapa |
| `Servico` | Serviços prestados |
| `Desenho` | Perfis de corte desenhados (canvas 2D com pontos) |
| `Pedido` | Pedidos de venda/fabricação |
| `PedidoItem` | Itens do pedido (produto, corte ou serviço) |

### Multi-tenancy
Todos os recursos são isolados por `cod_empresa`. O JWT carrega o `cod_empresa` do usuário logado, e o backend filtra automaticamente todos os dados por empresa.

### Soft Delete
Todas as entidades possuem o campo `excluido: boolean`. Exclusões são lógicas (nunca físicas).

---

## Módulos da API

| Endpoint | Descrição |
|---|---|
| `POST /api/auth/login` | Autenticação, retorna JWT |
| `GET/POST/PUT/DELETE /api/clientes` | CRUD de clientes |
| `GET/POST/PUT/DELETE /api/produtos` | CRUD de produtos |
| `GET/POST/PUT/DELETE /api/chapas` | CRUD de chapas + cortes |
| `GET/POST/PUT/DELETE /api/servicos` | CRUD de serviços |
| `GET/POST/PUT/DELETE /api/pedidos` | CRUD de pedidos + itens |
| `GET/POST/PUT/DELETE /api/desenhos` | CRUD de desenhos (perfis) |
| `GET /api/dashboard` | Estatísticas do mês atual |
| `GET /api/cep/:cep` | Consulta de CEP (ViaCEP) |
| `GET /api/cidades` | Listagem de cidades |
| `GET /health` | Healthcheck |

---

## Enums Compartilhados

```typescript
// Status dos pedidos
EStatusPedido { Aberto = 6, EmProducao = 7, Concluido = 8, Cancelado = 9 }

// Tipo do item do pedido
ETipoItemPedido { Produto = 10, Corte = 11, Servico = 12 }

// Status geral (produtos, serviços, chapas)
EStatusGeral { Ativo = 1, Inativo = 2 }

// Perfil de usuário
EPerfilUsuario { SuperAdmin = 3, Admin = 4, Usuario = 5 }
```

---

## Funcionalidades

- **Autenticação** com JWT, redirecionamento automático para login ao expirar (interceptor 401)
- **Dashboard** com métricas reais: pedidos do mês, receita, clientes ativos, status dos pedidos
- **Gestão de Clientes** com busca de CEP automática, máscara de CPF/CNPJ e telefone
- **Catálogo de Produtos** com valor unitário e controle de status
- **Chapas e Cortes** — cadastro de chapas com múltiplos cortes por dimensão e valor
- **Serviços** — serviços diretos com valor
- **Desenhos** — editor 2D em canvas (polyline) para definir perfis de corte
- **Pedidos** com três tipos de item:
  - *Produto*: seleção do catálogo
  - *Corte*: seleção de chapa → desenho → medidas → detecção automática do corte por soma ±1cm
  - *Serviço Direto*: seleção de serviço
- **Impressão em PDF** — geração de PDF do pedido via `window.print()` com layout formatado
- **Cálculo automático** de totais: material + 100% serviço de fabricação + serviços diretos

---

## Como Executar

### Pré-requisitos
- Node.js 18+
- PostgreSQL 13+ rodando em `localhost:5432`
- Banco de dados `calhas` criado

### 1. Configurar variáveis de ambiente

```bash
cp backend/.env.example backend/.env
```

Edite `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/calhas"
JWT_SECRET="troque_por_um_segredo_forte"
JWT_EXPIRES_IN="8h"
PORT=3004
```

### 2. Instalar dependências

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 3. Banco de dados

```bash
cd backend

# Aplicar migrações
npm run prisma:migrate

# (Opcional) Popular dados iniciais
npm run prisma:seed

# (Opcional) Interface visual do banco
npm run prisma:studio
```

### 4. Iniciar em desenvolvimento

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm start
```

Acesse: **http://localhost:4204**

### 5. Build para produção

```bash
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run build
```

---

## Aliases TypeScript

Ambos `backend` e `frontend` utilizam path aliases para imports limpos:

| Alias | Resolve para |
|---|---|
| `#shared/*` | `../shared/*` |
| `#core/*` | `src/app/core/*` (frontend) |
| `#config/*` | `src/config/*` (backend) |
| `#middlewares/*` | `src/middlewares/*` (backend) |
| `#shared-frontend/components/*` | `src/app/shared/components/*` |
| `#shared-frontend/directives/*` | `src/app/shared/directives/*` |

---

## Rotas do Frontend

| Rota | Componente | Guard |
|---|---|---|
| `/login` | LoginComponent | — |
| `/dashboard` | DashboardComponent | authGuard |
| `/clientes` | ClientesComponent | authGuard |
| `/produtos` | ProdutosComponent | authGuard |
| `/chapas` | ChapasComponent | authGuard |
| `/servicos` | ServicosComponent | authGuard |
| `/pedidos` | PedidosComponent | authGuard |
| `/desenhos` | DesenhosComponent | authGuard |
| `/usuarios` | UsuariosComponent | authGuard |
| `/empresas` | EmpresasComponent | authGuard + adminGuard |
