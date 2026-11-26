---
trigger: always_on
---

# Novidades do Sistema — Atualizar Antes de Cada Commit

O sistema tem a tela **"Novidades do Calhas Pro"** (`frontend/src/app/shared/components/novidades-dialog`),
alimentada pela constante `NOVIDADES` em `shared/constants/NOVIDADES.ts`.
Ela abre sozinha para o usuário quando a versão muda, e pode ser reaberta pelo botão 🎁 do topo.

## Regra obrigatória

**Antes de TODO commit que mude algo visível ou de comportamento para o usuário**, adicione uma entrada
**no topo** de `NOVIDADES` e inclua o arquivo no mesmo commit.

1. **Versão (semver):**
   - Nova funcionalidade → sobe o número do meio e zera o último (`1.7.0` → `1.8.0`).
   - Correção ou ajuste pequeno → sobe o último número (`1.7.0` → `1.7.1`).
   - Mudança grande que altera a forma de trabalhar → sobe o primeiro (`1.x.y` → `2.0.0`).
2. **Data:** `dd/mm/aaaa` do dia do commit.
3. **Itens — escritos para o usuário final, em pt-BR:**
   - Diga **onde** fica (ex.: "Pedido › item de Corte"), **o que** mudou e **por que** ajuda.
   - Em correções, conte o problema que a pessoa via e como ficou agora.
   - Sem termos técnicos (nada de "endpoint", "migration", "componente", nomes de arquivo).
   - Um item por mudança; vários commits no mesmo dia podem virar versões diferentes.
4. Commits só internos (refatoração, build, docs, regras) **não** precisam de nova versão.

A primeira entrada da lista é a versão atual (`VERSAO_ATUAL`) — nunca reordene as entradas.
