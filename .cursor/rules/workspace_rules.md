# Workspace Rules - Regras Específicas do npm Workspace

## Estrutura do Workspace

```
dev-workspace/
├── package.json              # Root package - configurações compartilhadas
├── ai/                       # Workspace: AI tools e automação
├── dashboard/                # Workspace: Next.js backend universal
├── gatsby-landing/           # Workspace: Landing page estática
├── content/                  # Configurações centralizadas
├── deckEngine/              # Engine de pipelines (futuro workspace)
└── .cursor/                 # Configurações do Cursor AI
```

## Padrões por Workspace

### Root Package (dev-workspace)

**Responsabilidades:**

- Scripts delegadores para workspaces
- Dependencies compartilhadas
- Configuração ESM e monorepo

**Padrões obrigatórios:**

```json
{
  "private": true,
  "type": "module",
  "workspaces": ["ai", "dashboard", "gatsby-landing"]
}
```

**Scripts seguem padrão:** `workspace:ação`

### AI Workspace

**Contexto específico:**

- `.cursor/prompt_rules/teias-framework.mdc`
- `.cursor/prompt_rules/cards-pipeline.mdc`

**Responsabilidades:**

- Ferramentas de automação
- Integração com APIs de AI
- Health checks e monitoring

**Scripts padrão:**

- `ai:setup` - Configuração inicial
- `ai:health` - Verificação de saúde
- `ai:status` - Status dos serviços

### Dashboard Workspace

**Contexto específico:**

- `.cursor/context/architecture.mdc` (DashMaster.PRO)
- `.cursor/prompt_rules/code-clarity.mdc`

**Responsabilidades:**

- Backend universal (Next.js App Router)
- API routes centralizadas
- Dashboard administrativo
- Integração com Clerk, Stripe, MongoDB

**Scripts padrão:**

- `dash:dev` - Desenvolvimento
- `dash:build` - Build produção
- `dash:start` - Start produção
- `dash:superadmin` - Setup admin

### Gatsby Landing Workspace

**Contexto específico:**

- `.cursor/context/architecture.mdc` (JAMstack)
- Smart/Dumb components para UI

**Responsabilidades:**

- Landing page estática
- SEO otimizado
- Performance máxima
- Deploy Netlify

**Scripts padrão:**

- `landing:dev` - Desenvolvimento
- `landing:build` - Build estático
- `landing:start` - Preview local

## Dependencies Management

### Root Level (Compartilhadas)

```json
{
  "dependencies": {
    "@netlify/functions": "^2.0.0",
    "dotenv": "^16.4.0",
    "stripe": "^12.14.0",
    "uuid": "^9.0.0"
  }
}
```

### Workspace Específico

Cada workspace tem suas próprias dependencies no package.json local.

## Regras de Scripts

### Nomenclatura Obrigatória

- `workspace:ação` (ex: `dash:dev`, `ai:setup`)
- Delegação via `npm --workspace=nome run comando`
- Consistência entre workspaces similares

### Scripts Root vs Workspace

**Root delega:**

```json
{
  "scripts": {
    "dash:dev": "npm --workspace=dashboard run dev",
    "test": "npm --workspace=dashboard run test"
  }
}
```

**Workspace implementa:**

```json
{
  "scripts": {
    "dev": "next dev",
    "test": "jest"
  }
}
```

## Content/ - Configuração Centralizada

### Estrutura Obrigatória

```
content/
├── config.yml              # Config principal
└── settings/
    ├── ai.json             # Config AI workspace
    ├── business.json       # Regras de negócio
    ├── integrations.json   # APIs externas
    └── theme.json          # Temas e cores
```

### Acesso nos Workspaces

Todos os workspaces devem acessar configs via pasta `content/` relativa.

## Environment Variables

### Hierarquia

1. **Root .env** - Variáveis compartilhadas
2. **Workspace .env.local** - Específicas do workspace
3. **Deploy configs** - Netlify, Vercel específicos

### Padrões de Nomeação

```bash
# Compartilhadas (root)
DATABASE_URL=
STRIPE_SECRET_KEY=

# Específicas por workspace
DASHBOARD_PORT=3000
AI_OPENAI_KEY=
LANDING_ANALYTICS_ID=
```

## Integração com deckEngine

### Status Atual

deckEngine está na pasta raiz, mas será migrado para workspace próprio.

### Contexto para deckEngine

Quando editando arquivos em `deckEngine/`:

- `.cursor/prompt_rules/cards-pipeline.mdc`
- `.cursor/prompt_rules/teias-framework.mdc`

### Padrões de Pipeline

- Cards como unidades atômicas
- Decks como fluxos organizados
- Logs estruturados para debugging

## Rules per File Type

### package.json files

**Context:**

- `.cursor/prompt_rules/workspace-patterns.mdc`

**Rules:**

- Manter padrão de scripts `workspace:ação`
- Dependencies: root para compartilhadas, local para específicas
- Version pinning para stability

### Config files in content/

**Context:**

- `.cursor/context/architecture.mdc`

**Rules:**

- Hierarquia clara e comentários
- Validação de schemas quando possível
- Ambientes diferentes por arquivo

### API routes (dashboard workspace)

**Context:**

- `.cursor/context/architecture.mdc`
- `.cursor/context/debugging-method.mdc`

**Rules:**

- Padrão DashMaster.PRO
- Validation middleware sempre
- Error handling robusto

## Cross-Workspace Communication

### Shared Types

Tipos compartilhados devem ficar em pasta `types/` no root.

### Shared Utils

Utilities compartilhadas em pasta `utils/` no root.

### Data Flow

```
Landing → (form submit) → Dashboard API → AI Processing → Response
```

## Monitoring & Health

### Health Check Script

Cada workspace deve ter health check que verifica:

- Dependencies instaladas
- Environment variables necessárias
- Serviços externos acessíveis
- Build funcionando

### Status Script

Script `ai:status` deve mostrar status de todos os workspaces.

_"Workspace organizado é projeto que escala"_
