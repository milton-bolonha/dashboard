# Context Rules - Regras de Inclusão de Contexto

## Padrões de Inclusão por Tipo de Arquivo

### Arquivos JavaScript/TypeScript

**Incluir sempre:**

- `.cursor/prompt_rules/code-clarity.mdc`
- `.cursor/prompt_rules/teias-framework.mdc`
- Complexidade cognitiva < 10 pontos por função

**Globs para contexto:**

```
src/**/*.ts
src/**/*.js
lib/**/*.ts
utils/**/*.js
```

### Arquivos React (JSX/TSX)

**Incluir sempre:**

- `.cursor/context/architecture.mdc` (Smart/Dumb pattern)
- `.cursor/prompt_rules/code-clarity.mdc`

**Priorizar:**

- Separação clara entre containers e apresentacional
- Props em português quando didático

### Arquivos de Pipeline/Workflow

**Incluir sempre:**

- `.cursor/prompt_rules/cards-pipeline.mdc`

**Detectar por conteúdo:**

- Palavras-chave: `pipeline`, `deck`, `card`, `workflow`, `step`
- Contexto: deckEngine, processamento sequencial

### Documentação (.md, .mdx)

**Incluir sempre:**

- `.cursor/prompt_rules/milton-voice.mdc`
- `livro/00-sumario.md` (referência)

**Tom:** Conversacional, didático, progressivo

### Configurações (JSON, YAML, TOML)

**Incluir sempre:**

- `.cursor/context/architecture.mdc`

**Para package.json especificamente:**

- `.cursor/prompt_rules/workspace-patterns.mdc`

### APIs e Backend

**Incluir sempre:**

- `.cursor/context/architecture.mdc` (DashMaster.PRO patterns)
- `.cursor/context/debugging-method.mdc`

**Detectar por:**

- Pasta `/api/`
- Imports: `Request`, `Response`, `NextApiRequest`
- Conteúdo: endpoints, middleware, handlers

## Regras de Prioridade

### Alta Prioridade (sempre incluir)

1. `.cursor/prompt_rules/milton-voice.mdc` - Tom e estilo
2. Arquivo específico do tipo de código sendo editado
3. Contexto de debugging se contém logs/errors

### Média Prioridade (incluir se relevante)

1. TE[i]As framework para análise de sistemas
2. Architecture patterns para componentes/módulos
3. Workspace patterns para configurações

### Baixa Prioridade (incluir se espaço permitir)

1. Glossário e referências do livro
2. Exemplos adicionais
3. Apêndices e checklists

## Exclusões Inteligentes

### Não incluir contexto de:

- **Cards/Decks** em arquivos simples de UI
- **Debugging** em arquivos de configuração
- **Architecture** em scripts utilitários simples
- **Workspace** em componentes específicos

### Reduzir contexto quando:

- Arquivo muito pequeno (< 50 linhas)
- Edição pontual (ex: correção de typo)
- Arquivo de configuração simples

## Contexto Dinâmico por Situação

### Criando Novo Arquivo

**Incluir:**

- Padrões arquiteturais relevantes
- Convenções de nomenclatura
- Estrutura recomendada

### Debugging/Correção

**Incluir:**

- `.cursor/context/debugging-method.mdc`
- Metodologia de investigação
- Logging patterns

### Refatoração

**Incluir:**

- `.cursor/prompt_rules/code-clarity.mdc`
- TE[i]As para análise estrutural
- Patterns de arquitetura

### Code Review

**Incluir:**

- Todos os padrões relevantes
- Checklist de qualidade
- Princípios de complexidade cognitiva

## Globs de Contexto Específico

### Frontend/UI

```
src/components/**/*
src/pages/**/*
src/app/**/*
```

**Contexto:** Smart/Dumb, clareza visual, responsividade

### Backend/API

```
src/api/**/*
pages/api/**/*
app/api/**/*
```

**Contexto:** DashMaster.PRO, validation, error handling

### Configuração

```
*.config.js
*.config.ts
package.json
tsconfig.json
```

**Contexto:** Workspace patterns, environment setup

### Testes

```
**/*.test.*
**/*.spec.*
__tests__/**/*
```

**Contexto:** Testing patterns, clarity, debugging

### Documentação

```
docs/**/*
*.md
README.*
```

**Contexto:** Milton's voice, educational tone, progression

## Regras de Performance

### Limites de Contexto

- Máximo 5 arquivos .mdc por request
- Priorizar por relevância específica
- Reduzir automaticamente se contexto muito grande

### Cache Inteligente

- Reutilizar contexto similar para arquivos do mesmo tipo
- Invalidar cache quando regras mudam
- Preload contexto comum durante navegação

_"Contexto inteligente gera código inteligente"_
