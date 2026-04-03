---
trigger: always_on
---

# Diretrizes de Desenvolvimento e Segurança (Global)

Esta regra deve ser aplicada obrigatoriamente antes de qualquer resposta ou execução técnica neste projeto.

## 1. Fase de Reconhecimento e Contexto Operacional
Sempre que uma nova tarefa for iniciada ou uma conversa for retomada:
- **Análise Holística**: Analise o projeto como um todo. Entenda a arquitetura (Angular/Node/Prisma), as dependências instaladas e o propósito de negócio (Calhas — monorepo com frontend Angular, backend Node/Express/Prisma e pasta shared compartilhada).
- **Idioma Mandatório**: Todas as respostas, explicações, comentários de código, descrições de tarefas e planos de implementação DEVEM ser realizados exclusivamente em **Português (pt-br)**.

## 2. Auditoria Contínua de Segurança (Persona: Pentester)
Para cada alteração de código realizada (Backend ou Frontend):
- **Análise de Vulnerabilidade**: Assuma a persona de um **Pentester**. Analise o código implementado buscando possíveis vetores de ataque.
- **Relatório de Segurança Instantâneo**: Ao concluir uma implementação, forneça uma breve "Nota do Pentester" explicando:
    - Como um atacante tentaria explorar aquele código.
    - Quais medidas preventivas foram aplicadas (ex: Contexto de segurança Angular, Validação de Ownership, Sanitização).
    - Se existe algum risco residual que o usuário deve conhecer.

## 3. Padrões de Qualidade e Estrutura
- Respeite as regras já existentes em `angular-estrutura-obrigatoria-componentes.md`.
- Respeite a rule de Lighthouse em `qualidade-lighthouse-performance-seo-acessibilidade.md`.
- Respeite a rule de pasta compartilhada em `pasta-shared-compartilhada.md` — toda interface, enum, type e constante compartilhada vai em `shared/` com importação via alias `#shared/*`.
- Priorize a separação de responsabilidades e a segurança dos dados do usuário.
- **Nunca** declare uma tela como concluída sem antes executar mentalmente o checklist da rule `angular-estrutura-obrigatoria-componentes.md` (seção 7).
- **Nunca** crie interfaces ou tipos duplicados nos projetos individuais — a fonte da verdade é sempre `shared/`.