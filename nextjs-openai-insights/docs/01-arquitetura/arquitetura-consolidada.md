# 📚 Arquitetura Consolidada · nextjs-openai-insights

**Versão**: Novembro/2025  
**Filosofia**: Sistema enxuto, inteligente e escalável. Separação clara entre Produto (o que o usuário vê), Plataforma (o que sustenta tecnicamente) e SaaS (regras de negócio e monetização).

---

## 🎯 Visão Geral: Três Domínios Conceituais

Em qualquer aplicação moderna, tudo que você constrói pode ser organizado em três camadas: **Produto**, **Plataforma** e **SaaS**. O Produto é o que o usuário vê; a Plataforma é o que sustenta o funcionamento técnico; o SaaS é o que define as regras de negócio, limites, planos e monetização. Quando você separa essas camadas, você ganha clareza, escala, menos bugs e mais velocidade para ajustar tanto o código quanto o modelo de negócio.

Além disso, o sistema tem duas áreas principais de produto: **Home** (landing que coleta dados e gera workspace) e **Admin** (dashboard onde o usuário trabalha com os insights gerados). Tudo que é compartilhado entre essas áreas vive em **Shared**.

---

## 📊 Matriz de Organização

| Domínio Conceitual | Home                                          | Admin                                      | Shared                                  |
| ------------------ | --------------------------------------------- | ------------------------------------------ | --------------------------------------- |
| **PRODUTO**        | LandingHeader, ClassicHeroForm, LandingFooter | AdminShellAde, TileGridAde, Modais, Panels | Design System, Tokens, Componentes UI   |
| **PLATAFORMA**     | POST /api/generate                            | APIs workspace/\*, SWR, Polling            | Session Store, Storage Tiers, AI Engine |
| **SAAS**           | Validação de limites                          | Quotas, Planos, Billing                    | Membership Context, Usage Tracking      |

---

## 📑 Índice

### 🎨 PRODUTO

- [🏠 PRODUTO · HOME](#-produto--home)
  - [Componentes Visuais](#componentes-visuais)
  - [Fluxos de Interação](#fluxos-de-interação)
  - [Estados e Feedback Visual](#estados-e-feedback-visual)
  - [Características Críticas](#características-críticas-1)
- [🎛️ PRODUTO · ADMIN](#️-produto--admin)
  - [Estrutura Visual](#estrutura-visual)
  - [Fluxos Principais de Interação](#fluxos-principais-de-interação)
  - [Características Críticas](#características-críticas-2)
- [🔗 PRODUTO · SHARED](#-produto--shared)
  - [Design System](#design-system)
  - [Componentes Compartilhados](#componentes-compartilhados)
  - [Características Críticas](#características-críticas-3)

### ⚙️ PLATAFORMA

- [🏠 PLATAFORMA · HOME](#-plataforma--home)
  - [API Principal](#api-principal)
- [🎛️ PLATAFORMA · ADMIN](#️-plataforma--admin)
  - [APIs Principais](#apis-principais)
  - [Data Fetching](#data-fetching)
  - [Características Técnicas Críticas](#características-técnicas-críticas)
- [🔗 PLATAFORMA · SHARED](#-plataforma--shared)
  - [Session & State Management](#session--state-management)
  - [AI Engine (Tile Generation)](#ai-engine-tile-generation)
  - [Resilience & Error Handling](#resilience--error-handling)
  - [Conversation History Management](#conversation-history-management)
  - [Template & Variable Processing](#template--variable-processing)
  - [Dynamic Appearance System](#dynamic-appearance-system)
  - [Características Técnicas Avançadas](#características-técnicas-avançadas)

### 💰 SAAS

- [🏠 SAAS · HOME](#-saas--home)
  - [Validação de Limites](#validação-de-limites)
  - [Regras de Negócio](#regras-de-negócio)
- [🎛️ SAAS · ADMIN](#️-saas--admin)
  - [Planos & Tiers](#planos--tiers)
  - [Usage Tracking & Enforcement](#usage-tracking--enforcement)
  - [Regras de Acesso por Plano](#regras-de-acesso-por-plano)
- [🔗 SAAS · SHARED](#-saas--shared)
  - [Membership Context (Server-Side)](#membership-context-server-side)
  - [Billing & Usage Limits (Stripe) - Planejado](#billing--usage-limits-stripe---planejado)
  - [Características Críticas de SaaS](#características-críticas-de-saas)

### 🔧 ORQUESTRADORES E BIBLIOTECAS

- [Orquestradores Principais](#orquestradores-principais)
  - [1. Request Orchestration Engine](#1-request-orchestration-engine)
  - [2. State Unification Algorithm](#2-state-unification-algorithm)
  - [3. Polling & Hydration Algorithm](#3-polling--hydration-algorithm)
- [Bibliotecas Terceiras Principais](#bibliotecas-terceiras-principais)
  - [Frontend](#frontend)
  - [Backend](#backend)
  - [Planejado](#planejado)

### 🎯 PRINCÍPIOS E ROADMAP

- [🎯 PRINCÍPIOS DE DESIGN](#-princípios-de-design)
  - [Enxutamento (Lean Architecture)](#enxutamento-lean-architecture)
  - [Inteligência (Smart Decisions)](#inteligência-smart-decisions)
  - [Escalabilidade (Scalable Foundation)](#escalabilidade-scalable-foundation)
  - [Resilência (Resilient System)](#resilência-resilient-system)
- [📈 ROADMAP FUTURO](#-roadmap-futuro)
- [📚 REFERÊNCIAS CRUZADAS](#-referências-cruzadas)

---

# 🎨 PRODUTO

A camada de Produto é tudo que o usuário vê, toca e interage. São as telas, botões, fluxos, gráficos, mensagens e animações — o lado visual e experiencial da aplicação. O Produto é responsável por guiar o usuário, tornar tudo intuitivo e fornecer feedback claro.

## 🏠 PRODUTO · HOME

A Home é uma landing page que serve para coletar dados do usuário e gerar um workspace inicial. É o ponto de entrada do sistema.

### Componentes Visuais

| Item                     | Componente        | Explicação                                                               |
| ------------------------ | ----------------- | ------------------------------------------------------------------------ |
| **Header**               | `LandingHeader`   | Logo, botões de login/signup                                             |
| **Formulário Principal** | `ClassicHeroForm` | Coleta: company, website, solution, research target, template, modelo AI |
| **Footer**               | `LandingFooter`   | Links e informações legais                                               |

### Fluxos de Interação

#### 1. Criar Workspace

```
📤 Usuário preenche ClassicHeroForm
   ↓
   Valida membership/limits (SaaS)
   ↓
   POST /api/generate (Plataforma)
   Body: {
     salesRepCompany, salesRepWebsite, solution,
     targetCompany, targetWebsite, templateId,
     model, promptAgent, responseLength,
     promptVariables[], bulkPrompts[]
   }
   ↓
   API processa template → Gera 8 tiles com AI
   ↓
   Cria WorkspaceSnapshot → Salva em cookie
   ↓
   Redireciona para /admin
   ↓
   ✅ Tiles aparecem no grid após geração
```

### Estados e Feedback Visual

- **Loading**: Toast de progresso durante geração
- **Sucesso**: Redirecionamento automático para `/admin`
- **Erro**: Toast destrutivo com mensagem clara
- **Validação**: Campos obrigatórios destacados (não crítico, apenas UX)

### Características Críticas

| Item                             | Por que é crítico                                                       |
| -------------------------------- | ----------------------------------------------------------------------- |
| **Estados de erro profundos**    | O usuário precisa entender quando a API falhou, quando o plano bloqueou |
| **Mensagens de erro humanas**    | "Algo deu errado" é inútil. Erros inteligíveis aumentam conversão       |
| **Design Tokens / Theme System** | Padronização de tipografia, cores, espaçamentos mantém consistência     |
| **Offline & Retry UI**           | Quando uma ação falha por rede, a interface deve oferecer retry         |

---

## 🎛️ PRODUTO · ADMIN

O Admin é o dashboard onde o usuário trabalha com os insights gerados. É aqui que acontece toda a interação produtiva.

### Estrutura Visual

```
admin
  ├─ AdminShellAde
  │   ├─ sidebar (AdminSidebarAde)
  │   │   ├─ menu-header
  │   │   ├─ credit-links (coins display)
  │   │   ├─ companies-list
  │   │   │   └─ company-item[] (com dashboard count badge)
  │   │   ├─ contacts-section
  │   │   │   └─ btn-add-contact
  │   │   └─ bottom-links
  │   │
  │   ├─ header (AdminHeaderAde)
  │   │   ├─ workspace-name
  │   │   ├─ dashboard-selector (dropdown)
  │   │   ├─ btn-create-blank-dashboard
  │   │   ├─ btn-templates (abre DashboardConfigModal)
  │   │   ├─ btn-customize-background (color picker)
  │   │   ├─ btn-save-template
  │   │   ├─ btn-login
  │   │   └─ btn-signup
  │   │
  │   └─ main
  │       ├─ tiles-grid (TileGridAde)
  │       │   ├─ btn-add-prompt (abre AddPromptModal)
  │       │   └─ tile-card[]
  │       │       ├─ title
  │       │       ├─ content
  │       │       ├─ btn-drag (reorder)
  │       │       ├─ btn-regenerate
  │       │       └─ btn-delete
  │       │
  │       ├─ contacts-panel (ContactsPanelAde)
  │       │   ├─ btn-add-contact (abre AddContactModal)
  │       │   └─ contact-card[]
  │       │
  │       ├─ notes-panel (NotesPanelAde)
  │       │   ├─ btn-add-note (revela form inline)
  │       │   └─ note-card[]
  │       │
  │       └─ files-placeholder (FilesPlaceholderAde)
  │
  └─ modals[]
      ├─ AddPromptModal
      ├─ AddContactModal
      ├─ ContactDetailModal
      ├─ TileDetailModal
      ├─ CreateBlankDashboardModal
      ├─ DashboardConfigModal
      └─ TemplateEditorModal
```

### Fluxos Principais de Interação

#### 1. Criar Prompt Individual

```
📤 Clica "Add Prompt"
   ↓
   Abre AddPromptModal
   ↓
   Preenche: title, prompt, Max Mode (opcional), requestSize
   ↓
   POST /api/workspace/tiles (Plataforma)
   ↓
   API adiciona company context ao prompt (invisível ao user)
   API cria tile com orderIndex negativo (-1, -2...)
   ↓
   Dashboard atualizado diretamente (updateDashboard)
   Tile aparece primeiro no grid
   Workspace sincronizado via mutate()
   ↓
   ✅ Tile visível imediatamente
```

#### 2. Chat com Tile

```
📤 Abre tile → Digita mensagem
   ↓
   POST /api/workspace/tiles/[tileId]/chat
   Body: { message, attachments? }
   ↓
   API adiciona ao tile.history
   Gera resposta com AI (GPT-5 ou GPT-4)
   ↓
   Atualiza tile com novo histórico
   ↓
   ✅ Conversa persistida
```

#### 3. Customizar Background

```
📤 Clica color picker → Seleciona cor
   ↓
   handleCustomizeBackground()
   ↓
   Salva em dashboard.appearance.baseColor
   Salva em localStorage (ade-base-color)
   Aplica em document.body.style.backgroundColor
   ↓
   ✅ Cor persistida e aplicada
```

### Características Críticas

| Item                            | Por que é crítico                                                         |
| ------------------------------- | ------------------------------------------------------------------------- |
| **Acessibilidade real (A11y)**  | Aria labels, navegação por teclado, contraste — 90% dos produtos ignoram  |
| **Estados vazios inteligentes** | Quando não há dados, o app deve ensinar o que fazer, não parecer quebrado |
| **Microinterações**             | Pequenas animações, feedbacks sutis — aumentam a sensação de qualidade    |
| **UI Resiliente**               | Placeholder quando API demora, auto-reconnect, avisos de rede lenta       |
| **Progressive Disclosure**      | Mostrar só o que importa no momento certo                                 |

---

## 🔗 PRODUTO · SHARED

Tudo que é compartilhado entre Home e Admin vive aqui.

### Design System

- **Componentes Base**: Botões, inputs, modais, cards, tooltips
- **Design Tokens**: Cores, tipografia, espaçamentos, sombras
- **Tema Dinâmico**: Sistema de cores com contraste automático (`ade-theme.ts`)

### Componentes Compartilhados

| Componente        | Uso                                                |
| ----------------- | -------------------------------------------------- |
| `ToastProvider`   | Feedback visual para ações (auto-dismiss 5s)       |
| `EmptyStateAde`   | Estados vazios consistentes                        |
| `TileDetailModal` | Modal de chat compartilhado entre tiles e contatos |

### Características Críticas

- **Design System escalável**: Botões, modais, cartões, inputs, guidelines
- **Internacionalização (i18n)**: Troca de idioma, formatação de moeda, datas
- **Estado Global e Sincronização**: Como UI reage quando múltiplas abas mudam o mesmo dado

---

# ⚙️ PLATAFORMA

A camada de Plataforma é o coração técnico do sistema. Aqui vivem o backend, o banco de dados, autenticação real, autorizações, APIs, filas, serviços de processamento, cache, modelagem de dados e integrações técnicas.

## 🏠 PLATAFORMA · HOME

### API Principal

#### POST `/api/generate`

**Responsabilidade**: Criar workspace completo com tiles de template

**Fluxo Técnico**:

```typescript
1. Valida payload com Zod
2. Resolve template (getGuestTemplate)
3. Substitui variáveis (processPromptVariables)
4. Para cada tile:
   - Se MOCK_OPENAI_RESPONSES=true → generateMockTileContent
   - Caso contrário → generateTileContent (batch configurável)
   - Limita tokens (getMaxTokensForTile)
   - Modelos GPT-5 usam responses.create()
   - Modelos GPT-4 usam chat.completions.create()
5. Monta WorkspaceSnapshot
6. Persiste no cache global (writeWorkspace)
7. Retorna JSON { success, sessionId, workspace }
```

**Características Técnicas**:

- **Validação**: Zod para type-safety em runtime
- **Batch Processing**: Configurável via `BROWSER_TILE_BATCH_SIZE`
- **Multi-API Support**: Adaptação automática baseada em modelo
- **Mock Mode**: Para desenvolvimento/testes (`MOCK_OPENAI_RESPONSES`)

---

## 🎛️ PLATAFORMA · ADMIN

### APIs Principais

| Ação                   | Endpoint                                              | Observações                                                             |
| ---------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------- |
| Reordenar tiles        | `POST /api/workspace/reorder`                         | Recebe `order: string[]`; bloqueia se workspace não for o mais recente  |
| Criar tile customizado | `POST /api/workspace/tiles`                           | Valida com Zod, gera conteúdo via `generateTileContent`                 |
| Regenerar tile         | `POST /api/workspace/tiles/[tileId]/regenerate`       | Preserva `history` recente                                              |
| Chat tile              | `POST /api/workspace/tiles/[tileId]/chat`             | Suporte GPT-5: `responses.create()`, GPT-4: `chat.completions.create()` |
| Criar contato          | `POST /api/workspace/contacts`                        | Gera outreach inicial                                                   |
| Regenerar contato      | `POST /api/workspace/contacts/[contactId]/regenerate` | Atualiza `contact.outreach`                                             |
| Chat contato           | `POST /api/workspace/contacts/[contactId]/chat`       | Mesma lógica de chat dos tiles                                          |
| Criar nota             | `POST /api/workspace/notes`                           | Cria nova nota                                                          |
| Editar nota            | `PATCH /api/workspace/notes/[noteId]`                 | Atualiza conteúdo                                                       |
| Reset geral            | `DELETE /api/workspace`                               | Limpa snapshot atual, cookie e localStorage                             |

### Data Fetching

- **Streaming Primário**: `/api/generate/stream` com Server-Sent Events (SSE)
- **Estado Local**: Controle independente de geração (resiliente a falhas de cookies)
- **Polling Fallback**: SWR `/api/workspace` com backoff exponencial (2s → 10s)
- **Fallback Hierárquico**: Server → localStorage → Estado local → Polling

### Características Técnicas Críticas

| Item                               | Por que é crítico                                                    |
| ---------------------------------- | -------------------------------------------------------------------- |
| **Idempotência**                   | Evita que ações sejam duplicadas (ex.: pagamento enviado duas vezes) |
| **Versionamento de API**           | Impede que mudanças quebrem versões antigas do app                   |
| **Indexação e Query Optimization** | 90% dos problemas de performance vêm daqui                           |
| **Circuit Breakers / Rate Limits** | Protege o sistema contra abuso, bots e overload                      |
| **Health-checks e Heartbeats**     | Monitoram a saúde do sistema                                         |

---

## 🔗 PLATAFORMA · SHARED

### Session & State Management

#### Multi-Tier Storage Strategy

```
Tier 1: Memory Cache (Server-side)
  - TTL: 30 minutos
  - Priority: 1 (mais rápido)
  - Sync: WriteThrough (imediato)
  - Persistence: Ephemeral

Tier 2: LocalStorage (Client-side)
  - TTL: Infinity (LRU eviction)
  - Priority: 2
  - Sync: WriteBack (debounced 500ms)
  - Max entries: 5 (LRU limit)
  - Persistence: Session

Tier 3: MongoDB (Planejado)
  - TTL: Infinity
  - Priority: 3
  - Sync: WriteThrough
  - User-scoped: true
  - Persistence: Persistent
```

#### Session Store (Server-Side)

```typescript
Session := {
  id: SessionID,
  workspace: Workspace,
  ttl: Duration,  // 30 minutes
  expires_at: Timestamp,
  access_count: Integer,
  updated_at: Timestamp
}

// Implementação enxuta:
- Cache em memória global (globalThis.__WORKSPACE_CACHE__)
- TTL de 30 minutos com auto-purge antes de cada leitura
- Deep cloning para prevenir mutações acidentais
- Cookie HTTP-only apenas para sessionId
```

### AI Engine (Tile Generation)

#### Request Lifecycle

```
Input → Validation → Preparation → Execution → Normalization → Persistence
```

#### Multi-API Support

```typescript
// Detecção automática de API baseada no modelo
detect_api_type(model: ModelName) → APIType := {
  if model.startsWith("gpt-5") then
    return "responses.create"
  else
    return "chat.completions.create"
}

// GPT-5: responses.create()
{
  model: "gpt-5-nano",
  input: convert_messages_to_input(messages),
  text: { format: { type: "text" }, verbosity: "medium" },
  reasoning: { effort: "medium" },
  max_completion_tokens: 800
}

// GPT-4: chat.completions.create()
{
  model: "gpt-4o-mini",
  messages: messages,
  max_output_tokens: 800
}
```

#### Response Normalization

```typescript
// Extração robusta com múltiplos fallbacks
extractAssistantContent(response, apiType) := {
  if apiType == "gpt5" then
    // Try output_text first
    if response.output_text then return response.output_text
    // Try output array
    if response.output then
      for item in response.output:
        if item.type == "message" and item.content then
          for content_item in item.content:
            if content_item.type == "output_text" then
              return content_item.text
  else
    if response.choices and response.choices[0] then
      return response.choices[0].message.content
  return ""
}
```

### Resilience & Error Handling

#### Retry Mechanism (Exponential Backoff)

```typescript
RetryPolicy := {
  max_attempts: Integer,  // 2 for chat
  backoff: ExponentialBackoff,
  retryable_conditions: Condition[]
}

// Chat: 2 tentativas, 400ms delay fixo
// Polling: Backoff exponencial 2s → 3s → 4.5s → ... → 10s (máx)
// Max 30 tentativas de polling antes de parar
```

#### Intelligent Polling

```typescript
should_poll(workspace, conditions) → Boolean := {
  // Stop immediately if tiles found
  if conditions.has_tiles then return false

  // Check if recently generated
  if workspace.generatedAt then
    age = now() - workspace.generatedAt
    if age < 5min then return true

  // Check localStorage timestamp
  if conditions.localStorage_timestamp then
    age = now() - conditions.localStorage_timestamp
    if age < 2min then return true

  return false
}
```

### Conversation History Management

```typescript
HistoryPolicy := {
  max_length: 12,  // MAX_HISTORY_LENGTH
  retention: "KeepRecent",
  summarization: null
}

// Normalização implementada:
- Roles garantidos (nunca null ou inválido)
- IDs únicos baseados em timestamp
- Timestamps ISO para consistência
- Clamp de conteúdo para previews (maxChars=320)
```

### Template & Variable Processing

```typescript
// Templates com variáveis {{variable}}
processPromptVariables(
  prompt: string,
  variables: Record<string, string>
): string {
  let resolved = prompt
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\$\\{${key}\\}`, 'g')
    resolved = resolved.replace(regex, value)
  })
  return resolved
}
```

### Dynamic Appearance System

```typescript
AppearanceTokens := {
  baseColor: HexColor,  // User-selected
  surfaceColor: HexColor,  // Computed from baseColor
  sidebarColor: HexColor,  // Semi-transparent overlay
  textColor: HexColor,  // Auto-contrast (WCAG)
  headingColor: HexColor,  // Auto-contrast
  mutedTextColor: HexColor,  // Mixed
  cardBorderColor: HexColor,
  sidebarBorderColor: HexColor
}

// Cálculo de contraste automático
get_contrasting_text_color(backgroundColor) → HexColor := {
  luminance = calculate_luminance(backgroundColor)
  if luminance > 0.5 then
    return "#000000"  // Dark text on light
  else
    return "#ffffff"  // Light text on dark
}
```

### Características Técnicas Avançadas

| Item                     | Implementação                                                  |
| ------------------------ | -------------------------------------------------------------- |
| **Segurança avançada**   | Audit Trail detalhado, sessões revogáveis, rotação de tokens   |
| **Filas distribuídas**   | Orquestradores (Temporal, BullMQ), regras de retry exponencial |
| **Modelagem de Eventos** | Event Bus, store de eventos (event sourcing simplificado)      |
| **Feature flag técnica** | Mecanismo técnico para feature flags                           |
| **Infra como Código**    | Terraform, CloudFormation, deploy auditável                    |

---

# 💰 SAAS

A camada de SaaS é onde mora o modelo de negócio e as regras de operação do serviço. Aqui você define planos (Free, Pro, Team), limites (quantas tarefas, quantos exports, quantos membros), políticas de cobrança, pagamentos, trials, permissões por plano e upgrades.

## 🏠 SAAS · HOME

### Validação de Limites

Antes de gerar workspace, o sistema valida:

- **Membership Status**: Verifica plano do usuário (free/pro/enterprise)
- **Quotas**: Limite de workspaces criados (ex.: 3 no Free)
- **Rate Limiting**: Previne abuso e spam

### Regras de Negócio

```typescript
// Exemplo de validação antes de POST /api/generate
check_limit_before_action(userId, action: "createWorkspace", plan) → {
  limits = PLAN_LIMITS[plan]
  action_limit = limits.actions.createWorkspace

  if action_limit == Infinity then
    return { allowed: true }

  // Get current usage
  usage = get_usage_count(userId, action, "day")

  return {
    allowed: usage < action_limit,
    used: usage,
    remaining: Math.max(action_limit - usage, 0),
    limit: action_limit
  }
}
```

---

## 🎛️ SAAS · ADMIN

### Planos & Tiers

```typescript
PlanLimits := {
  free: {
    max_workspaces: 3,
    max_tiles_per_workspace: 10,
    max_contacts: 5,
    max_notes: 10,
    actions: {
      tileChat: 5,
      contactChat: 5,
      regenerate: 5,
      createContact: 5,
      createWorkspace: 3
    },
    features: ["basic_templates", "basic_chat"]
  },

  pro: {
    max_workspaces: -1,  // Unlimited
    max_tiles_per_workspace: -1,
    max_contacts: -1,
    max_notes: -1,
    actions: {
      tileChat: Infinity,
      contactChat: Infinity,
      regenerate: Infinity,
      createContact: Infinity,
      createWorkspace: Infinity
    },
    features: ["all_templates", "unlimited_chat", "custom_templates", "bulk_upload"]
  },

  enterprise: {
    // Same as pro + additional features
    features: ["all_pro_features", "team_collaboration", "api_access", "priority_support"]
  }
}
```

### Usage Tracking & Enforcement

```typescript
// Contadores por ação (tileChat, contactChat, etc.)
usageCounters := {
  userId: ObjectId,
  action: GuestAction,
  count: Integer,
  period: "day" | "month" | "lifetime",
  periodStart: Date,
  periodEnd: Date
}

// Incremento atômico
increment_usage(userId, action) := {
  mongo.usageCounters.updateOne(
    {
      userId: userId,
      action: action,
      period: "day",
      periodStart: start_of_today()
    },
    {
      $inc: { count: 1 },
      $setOnInsert: { createdAt: now(), updatedAt: now() }
    },
    { upsert: true }
  )
}
```

### Regras de Acesso por Plano

- **Free**: Templates básicos, chat limitado, sem customização avançada
- **Pro**: Todos os templates, chat ilimitado, customização completa
- **Enterprise**: Tudo do Pro + colaboração em equipe, API access, suporte prioritário

---

## 🔗 SAAS · SHARED

### Membership Context (Server-Side)

```typescript
get_membership_status(userId) → MembershipStatus := {
  // Check cache first (5min TTL)
  cached = membership_cache.get(userId)
  if cached and not expired(cached) then
    return cached

  // Query MongoDB
  user = mongo.users.findOne({ _id: userId })
  if not user then
    return { plan: "free", limits: PLAN_LIMITS.free }

  plan = user.plan ?? "free"
  limits = PLAN_LIMITS[plan]

  status = {
    plan: plan,
    limits: limits,
    stripeCustomerId: user.stripeCustomerId,
    stripeSubscriptionId: user.stripeSubscriptionId
  }

  // Cache for 5 minutes
  membership_cache.set(userId, status, ttl: 5min)
  return status
}
```

### Billing & Usage Limits (Stripe) - Planejado

#### Stripe Integration

```typescript
CheckoutFlow := {
  // User clicks "Upgrade" → Redirect to Stripe Checkout
  initiate_checkout(userId, planId) → {
    session = stripe.checkout.sessions.create({
      customer: get_or_create_stripe_customer(userId),
      mode: "subscription",
      line_items: [{ price: planId, quantity: 1 }],
      success_url: `${APP_URL}/admin?checkout=success`,
      cancel_url: `${APP_URL}/admin?upgrade=cancelled`
    })
    return session.url
  }
}

WebhookHandlers := {
  "checkout.session.completed": {
    // Update user plan
    // Invalidate cache
  },
  "customer.subscription.updated": {
    // Update plan status
  },
  "customer.subscription.deleted": {
    // Downgrade to free
  }
}
```

### Características Críticas de SaaS

| Item                             | Por que é crítico                                                 |
| -------------------------------- | ----------------------------------------------------------------- |
| **Lifecycle de Assinatura**      | Ativação, expiração, reativação, churn involuntário               |
| **Soft vs Hard Limit**           | Definição clara do que bloqueia e do que apenas avisa             |
| **Feature Flags por plano**      | Permite liberar funcionalidades gradualmente                      |
| **Métricas de uso confiáveis**   | Contar tarefas, créditos e ações de verdade — sem fraude          |
| **Webhooks de billing**          | Renovação, falha, cancelamento, downgrade — tudo dispara eventos  |
| **Regras de fairness**           | Trials diferentes, upgrade imediato, downgrade só no fim do ciclo |
| **Prorrogações e grace periods** | Mantém usuário ativo mesmo com falha temporária no cartão         |
| **Auditoria de consumo**         | Segurança jurídica e confiança em limites e cobranças             |

---

# 🔧 ORQUESTRADORES MAIORES E BIBLIOTECAS TERCEIRAS

## Orquestradores Principais

### 1. Request Orchestration Engine

```typescript
orchestrate(input: InputData, config: Config) → Workspace := {
  // 1. Preparation
  session = create_session()
  workspace = initialize_workspace(input)
  template = resolve_template(config.template_id)
  requests = prepare_requests(input, template, config)

  // 2. Execution (batch with configurable size)
  responses = execute_batch(
    requests,
    batch_size = config.BROWSER_TILE_BATCH_SIZE,
    strategy = Sequential,
    on_progress = update_workspace_state
  )

  // 3. Normalization (multi-API aware)
  entities = normalize_responses(responses, api_types)

  // 4. Persistence (multi-tier)
  workspace.entities = entities
  workspace.state = Ready
  workspace.generatedAt = now()
  persist_server(session, workspace)
  persist_client_async(session, workspace)

  // 5. Replication
  replicate_to_client(session.id, workspace)

  return workspace
}
```

### 2. State Unification Algorithm

```typescript
unify_state(
  server_data: Workspace | null,
  local_data: Workspace | null,
  cached_workspaces: Workspace[],
  viewing_session: SessionID | null,
  user_selected: Boolean
) → WorkspaceState := {

  // Priority 1: User manually selected (preserve their choice)
  if viewing_session and user_selected then
    if server_data?.sessionId == viewing_session then
      return { data: server_data, source: "server" }
    if local_data?.sessionId == viewing_session then
      return { data: local_data, source: "localStorage" }
    cached = cached_workspaces.find(w => w.sessionId == viewing_session)
    if cached then
      return { data: cached, source: "cache" }

  // Priority 2: Server data (most fresh)
  if server_data then
    if not user_selected then
      return { data: server_data, source: "server" }

  // Priority 3: Local data (preserve if user selected)
  if local_data then
    if user_selected or viewing_session == local_data.sessionId then
      return { data: local_data, source: "localStorage" }

  // Priority 4: Cached data
  if cached_workspaces.length > 0 then
    return { data: cached_workspaces[0], source: "cache" }

  return { data: null, source: null }
}
```

### 3. Polling & Hydration Algorithm

```typescript
hydrate_workspace(session_id: SessionID) → Workspace := {
  // 1. Try server (fresh data)
  server_workspace = fetch_from_server(session_id)
  if server_workspace.success then
    sync_to_local(server_workspace)
    return { data: server_workspace, source: "server" }

  // 2. Fallback to local (stale but available)
  local_workspace = fetch_from_local(session_id)
  if local_workspace != null then
    start_background_sync(session_id)
    return { data: local_workspace, source: "localStorage" }

  // 3. Polling for new workspace (if recently generated)
  if should_poll(session_id) then
    return poll_until_ready(
      session_id,
      interval = exponential_backoff(2s, 10s),
      max_attempts = 30,
      timeout = 120s,
      conditions = {
        has_tiles: false,
        generated_recently: true,
        localStorage_timestamp: get_last_generation_time()
      }
    )

  return { data: null, source: null }
}
```

---

## Bibliotecas Terceiras Principais

### Frontend

| Biblioteca        | Uso                            | Versão |
| ----------------- | ------------------------------ | ------ |
| **Next.js**       | Framework React com App Router | 14+    |
| **React**         | Biblioteca UI                  | 18+    |
| **SWR**           | Data fetching e cache          | Latest |
| **Tailwind CSS**  | Estilização utilitária         | Latest |
| **Zod**           | Validação de schemas           | Latest |
| **framer-motion** | Animações (local)              | Latest |

### Backend

| Biblioteca             | Uso                        | Versão |
| ---------------------- | -------------------------- | ------ |
| **OpenAI SDK**         | Integração com GPT-5/GPT-4 | Latest |
| **Next.js API Routes** | Endpoints server-side      | 14+    |

### Planejado

| Biblioteca  | Uso                   | Status       |
| ----------- | --------------------- | ------------ |
| **Clerk**   | Autenticação          | 🔄 Planejado |
| **Stripe**  | Pagamentos e billing  | 🔄 Planejado |
| **MongoDB** | Persistência de dados | 🔄 Planejado |
| **Prisma**  | ORM para MongoDB      | 🔄 Planejado |

---

# 🎯 PRINCÍPIOS DE DESIGN

## Enxutamento (Lean Architecture)

- **2-Tier Storage**: Memória + LocalStorage (sem camadas desnecessárias)
- **On-demand Purge**: Limpeza apenas quando necessário (não background jobs)
- **Refs para Polling**: Evita re-renders desnecessários
- **Memoization Seletiva**: Apenas cálculos caros (appearance tokens)

## Inteligência (Smart Decisions)

- **Polling Condicional**: Só quando há geração ativa detectada
- **Unificação de Estado**: Prioridades explícitas, source tracking
- **Preservação de Seleção**: Respeita escolha manual do usuário
- **Multi-API Support**: Adaptação automática baseada em modelo

## Escalabilidade (Scalable Foundation)

- **LRU Cache**: Limite de 5 workspaces (evita crescimento infinito)
- **TTL Automático**: Expiração de 30min (libera memória)
- **Deep Cloning**: Previne mutações acidentais (thread-safe)
- **Debounced Writes**: Reduz I/O no localStorage

## Resilência (Resilient System)

- **Retry com Backoff**: Recuperação automática de falhas temporárias
- **Fallback Strategies**: Mock, cache local, modelos padrão
- **Hydration Safety**: Prevenção de erros SSR/CSR
- **Silent Failures**: Degradação graciosa (quota errors ignorados)

---

# 📈 ROADMAP E STATUS ATUAL

> 📊 **Para detalhes completos do status de implementação**, consulte [`status-implementacao.md`](./status-implementacao.md).

## Phase 1: Preparation ✅

- [x] Next.js 16 migration
- [x] Turbopack configuration
- [x] Middleware/proxy setup

## Phase 2: MongoDB Persistence 🔄 **PARCIALMENTE IMPLEMENTADO**

- [x] Define data models (users, workspaces, tiles, contacts, notes, usageCounters) ✅
- [x] Setup MongoDB connection and indexes ✅
- [x] Implement dual-write pattern (Memory + MongoDB) ✅
- [x] Create migration routine (localStorage → MongoDB on auth) ✅
- [x] Update APIs to use MongoDB with fallback ✅
- [ ] **Pendente**: Integração completa em todas as rotas (algumas ainda usam apenas memory/localStorage)
- [ ] **Pendente**: Testes de migração em produção

**Status**: MongoDB está implementado e funcionando, mas nem todas as APIs estão usando. Sistema funciona em modo híbrido (Memory + LocalStorage para guests, MongoDB para membros autenticados).

## Phase 3: Clerk Authentication 🔄 **PREPARADO MAS NÃO IMPLEMENTADO**

- [x] Estrutura preparada (`src/lib/auth/get-auth.ts`) ✅
- [ ] Configure Clerk providers and middleware ❌
- [ ] Replace fake membership with Clerk userId ❌
- [ ] Implement user-scoped workspace isolation ❌
- [ ] Update UI to show authenticated user ❌
- [ ] Handle guest → authenticated migration ❌

**Status**: Código preparado para Clerk, mas autenticação ainda retorna `null` (guest mode). Ver `src/lib/auth/get-auth.ts` para detalhes.

## Phase 4: Stripe Billing 🔄 **PARCIALMENTE IMPLEMENTADO**

- [x] Webhook endpoint criado (`/api/webhooks/stripe`) ✅
- [x] Estrutura de migração guest → member ✅
- [ ] **Pendente**: Validar assinatura Stripe (webhook signature validation)
- [ ] **Pendente**: Integrate Stripe Checkout flow (UI)
- [ ] **Pendente**: Implement plan-based limits server-side (free/pro/enterprise)
- [ ] **Pendente**: Server-side usage tracking and enforcement completo
- [ ] **Pendente**: Update MembershipProvider to read from backend

**Status**: Webhook existe e processa eventos, mas validação de assinatura está comentada (TODO). Migração de dados funciona. Falta integração completa de checkout e limites server-side.

## Phase 5: Testing & Validation 🔄 **EM ANDAMENTO**

- [x] Estrutura de testes criada (`src/lib/test/`) ✅
- [x] Testes de segurança (`security-sanitizer.ts`) ✅
- [x] Testes de fluxos reais (`real-flows.ts`) ✅
- [ ] E2E tests for auth flow (guest → upgrade → login) ❌
- [ ] Migration tests (localStorage → MongoDB) ❌
- [ ] Load testing (MongoDB queries, indexes) ❌
- [ ] Security testing (workspace isolation, rate limiting) ❌

**Status**: Infraestrutura de testes existe, mas testes automatizados completos ainda não foram implementados.

---

# 📚 REFERÊNCIAS CRUZADAS

Todos os documentos estão organizados em `docs/` por domínios. Veja [`../README.md`](../README.md) para o índice completo.

**Documentação Principal**:

- [`../README.md`](../README.md) — Índice principal da documentação
- [`../02-guias-operacionais/fluxo-operacional.md`](../02-guias-operacionais/fluxo-operacional.md) — Fluxo operacional atualizado (Nov/2025)
- [`../02-guias-operacionais/fluxo-tiles.md`](../02-guias-operacionais/fluxo-tiles.md) — Fluxo de criação de tiles e engenharia de prompts
- [`../02-guias-operacionais/guia-admin.md`](../02-guias-operacionais/guia-admin.md) — Anatomia detalhada dos temas (Ade, Classic, Dash)
- [`blueprint-tecnico.md`](./blueprint-tecnico.md) — Blueprint completo de arquitetura
- [`status-implementacao.md`](./status-implementacao.md) — Status real das implementações
- [`../06-especificacoes/visualizacao-arquitetura.md`](../06-especificacoes/visualizacao-arquitetura.md) — Sistema de visualização de arquitetura
- [`../04-checklist-planos/checklist-admin.md`](../04-checklist-planos/checklist-admin.md) — Checklist do Admin
- [`../04-checklist-planos/plano-finalizacao.md`](../04-checklist-planos/plano-finalizacao.md) — Plano de finalização

**Raiz do Projeto**:

- `../../README.md` — Visão macro, setup e lista de endpoints (raiz)

---

**Última atualização**: Novembro/2025  
**Status**: Arquitetura implementada e em produção  
**Próximos passos**: MongoDB persistence, Clerk authentication, Stripe billing integration

🚀 Pronto! Esse é o textão consolidado da arquitetura do sistema, organizado por Produto/Plataforma/SaaS e Home/Admin/Shared, com todos os orquestradores e bibliotecas terceiras mapeados!
