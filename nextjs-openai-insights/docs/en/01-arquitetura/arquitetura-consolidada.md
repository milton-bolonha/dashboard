# 📚 Consolidated Architecture · nextjs-openai-insights

**Version**: November/2025
**Philosophy**: Lean, intelligent, and scalable system. Clear separation between Product (what the user sees), Platform (what technically supports it), and SaaS (business rules and monetization).

---

## 🎯 Overview: Three Conceptual Domains

In any modern application, everything you build can be organized into three layers: **Product**, **Platform**, and **SaaS**. The Product is what the user sees; the Platform is what sustains the technical operation; the SaaS is what defines the business rules, limits, plans, and monetization. When you separate these layers, you gain clarity, scale, fewer bugs, and more speed to adjust both the code and the business model.

In addition, the system has two main product areas: **Home** (landing page that collects data and generates a workspace) and **Admin** (dashboard where the user works with the generated insights). Everything shared between these areas lives in **Shared**.

---

## 📊 Organization Matrix

| Conceptual Domain | Home | Admin | Shared |
| --- | --- | --- | --- |
| **PRODUCT** | LandingHeader, ClassicHeroForm, LandingFooter | AdminShellAde, TileGridAde, Modals, Panels | Design System, Tokens, UI Components |
| **PLATFORM** | POST /api/generate | APIs workspace/\*, SWR, Polling | Session Store, Storage Tiers, AI Engine |
| **SAAS** | Limit validation | Quotas, Plans, Billing | Membership Context, Usage Tracking |

---

## 📑 Index

### 🎨 PRODUCT

- [🏠 PRODUCT · HOME](#-product--home)
  - [Visual Components](#visual-components)
  - [Interaction Flows](#interaction-flows)
  - [States and Visual Feedback](#states-and-visual-feedback)
  - [Critical Features](#critical-features-1)
- [🎛️ PRODUCT · ADMIN](#️-product--admin)
  - [Visual Structure](#visual-structure)
  - [Main Interaction Flows](#main-interaction-flows)
  - [Critical Features](#critical-features-2)
- [🔗 PRODUCT · SHARED](#-product--shared)
  - [Design System](#design-system)
  - [Shared Components](#shared-components)
  - [Critical Features](#critical-features-3)

### ⚙️ PLATFORM

- [🏠 PLATFORM · HOME](#-platform--home)
  - [Main API](#main-api)
- [🎛️ PLATFORM · ADMIN](#️-platform--admin)
  - [Main APIs](#main-apis)
  - [Data Fetching](#data-fetching)
  - [Critical Technical Features](#critical-technical-features)
- [🔗 PLATFORM · SHARED](#-platform--shared)
  - [Session & State Management](#session--state-management)
  - [AI Engine (Tile Generation)](#ai-engine-tile-generation)
  - [Resilience & Error Handling](#resilience--error-handling)
  - [Conversation History Management](#conversation-history-management)
  - [Template & Variable Processing](#template--variable-processing)
  - [Dynamic Appearance System](#dynamic-appearance-system)
  - [Advanced Technical Features](#advanced-technical-features)

### 💰 SAAS

- [🏠 SAAS · HOME](#-saas--home)
  - [Limit Validation](#limit-validation)
  - [Business Rules](#business-rules)
- [🎛️ SAAS · ADMIN](#️-saas--admin)
  - [Plans & Tiers](#plans--tiers)
  - [Usage Tracking & Enforcement](#usage-tracking--enforcement)
  - [Plan-Based Access Rules](#plan-based-access-rules)
- [🔗 SAAS · SHARED](#-saas--shared)
  - [Membership Context (Server-Side)](#membership-context-server-side)
  - [Billing & Usage Limits (Stripe) - Planned](#billing--usage-limits-stripe---planned)
  - [Critical SaaS Features](#critical-saas-features)

### 🔧 ORCHESTRATORS AND LIBRARIES

- [Main Orchestrators](#main-orchestrators)
  - [1. Request Orchestration Engine](#1-request-orchestration-engine)
  - [2. State Unification Algorithm](#2-state-unification-algorithm)
  - [3. Polling & Hydration Algorithm](#3-polling--hydration-algorithm)
- [Main Third-Party Libraries](#main-third-party-libraries)
  - [Frontend](#frontend)
  - [Backend](#backend)
  - [Planned](#planned)

### 🎯 PRINCIPLES AND ROADMAP

- [🎯 DESIGN PRINCIPLES](#-design-principles)
  - [Leanness (Lean Architecture)](#leanness-lean-architecture)
  - [Intelligence (Smart Decisions)](#intelligence-smart-decisions)
  - [Scalability (Scalable Foundation)](#scalability-scalable-foundation)
  - [Resilience (Resilient System)](#resilience-resilient-system)
- [📈 FUTURE ROADMAP](#-future-roadmap)
- [📚 CROSS-REFERENCES](#-cross-references)

---

# 🎨 PRODUCT

The Product layer is everything the user sees, touches, and interacts with. It's the screens, buttons, flows, graphics, messages, and animations — the visual and experiential side of the application. The Product is responsible for guiding the user, making everything intuitive, and providing clear feedback.

## 🏠 PRODUCT · HOME

The Home is a landing page that serves to collect user data and generate an initial workspace. It is the system's entry point.

### Visual Components

| Item | Component | Explanation |
| --- | --- | --- |
| **Header** | `LandingHeader` | Logo, login/signup buttons |
| **Main Form** | `ClassicHeroForm` | Collects: company, website, solution, research target, template, AI model |
| **Footer** | `LandingFooter` | Links and legal information |

### Interaction Flows

#### 1. Create Workspace

```
📤 User fills out ClassicHeroForm
   ↓
   Validates membership/limits (SaaS)
   ↓
   POST /api/generate (Platform)
   Body: {
     salesRepCompany, salesRepWebsite, solution,
     targetCompany, targetWebsite, templateId,
     model, promptAgent, responseLength,
     promptVariables[], bulkPrompts[]
   }
   ↓
   API processes template → Generates 8 tiles with AI
   ↓
   Creates WorkspaceSnapshot → Saves in cookie
   ↓
   Redirects to /admin
   ↓
   ✅ Tiles appear in the grid after generation
```

### States and Visual Feedback

- **Loading**: Progress toast during generation
- **Success**: Automatic redirection to `/admin`
- **Error**: Destructive toast with a clear message
- **Validation**: Required fields highlighted (not critical, just UX)

### Critical Features

| Item | Why it's critical |
| --- | --- |
| **Deep error states** | The user needs to understand when the API failed, when the plan blocked them |
| **Human error messages** | "Something went wrong" is useless. Intelligible errors increase conversion |
| **Design Tokens / Theme System** | Standardization of typography, colors, spacing maintains consistency |
| **Offline & Retry UI** | When an action fails due to network issues, the interface should offer a retry |

---

## 🎛️ PRODUCT · ADMIN

The Admin is the dashboard where the user works with the generated insights. This is where all productive interaction happens.

### Visual Structure

```
admin
  ├─ AdminShellAde
  │   ├─ sidebar (AdminSidebarAde)
  │   │   ├─ menu-header
  │   │   ├─ credit-links (coins display)
  │   │   ├─ companies-list
  │   │   │   └─ company-item[] (with dashboard count badge)
  │   │   ├─ contacts-section
  │   │   │   └─ btn-add-contact
  │   │   └─ bottom-links
  │   │
  │   ├─ header (AdminHeaderAde)
  │   │   ├─ workspace-name
  │   │   ├─ dashboard-selector (dropdown)
  │   │   ├─ btn-create-blank-dashboard
  │   │   ├─ btn-templates (opens DashboardConfigModal)
  │   │   ├─ btn-customize-background (color picker)
  │   │   ├─ btn-save-template
  │   │   ├─ btn-login
  │   │   └─ btn-signup
  │   │
  │   └─ main
  │       ├─ tiles-grid (TileGridAde)
  │       │   ├─ btn-add-prompt (opens AddPromptModal)
  │       │   └─ tile-card[]
  │       │       ├─ title
  │       │       ├─ content
  │       │       ├─ btn-drag (reorder)
  │       │       ├─ btn-regenerate
  │       │       └─ btn-delete
  │       │
  │       ├─ contacts-panel (ContactsPanelAde)
  │       │   ├─ btn-add-contact (opens AddContactModal)
  │       │   └─ contact-card[]
  │       │
  │       ├─ notes-panel (NotesPanelAde)
  │       │   ├─ btn-add-note (reveals form inline)
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

### Main Interaction Flows

#### 1. Create Individual Prompt

```
📤 Clicks "Add Prompt"
   ↓
   Opens AddPromptModal
   ↓
   Fills in: title, prompt, Max Mode (optional), requestSize
   ↓
   POST /api/workspace/tiles (Platform)
   ↓
   API adds company context to the prompt (invisible to the user)
   API creates a tile with a negative orderIndex (-1, -2...)
   ↓
   Dashboard updated directly (updateDashboard)
   Tile appears first in the grid
   Workspace synchronized via mutate()
   ↓
   ✅ Tile visible immediately
```

#### 2. Chat with Tile

```
📤 Opens tile → Types message
   ↓
   POST /api/workspace/tiles/[tileId]/chat
   Body: { message, attachments? }
   ↓
   API adds to tile.history
   Generates response with AI (GPT-5 or GPT-4)
   ↓
   Updates tile with new history
   ↓
   ✅ Conversation persisted
```

#### 3. Customize Background

```
📤 Clicks color picker → Selects color
   ↓
   handleCustomizeBackground()
   ↓
   Saves in dashboard.appearance.baseColor
   Saves in localStorage (ade-base-color)
   Applies to document.body.style.backgroundColor
   ↓
   ✅ Color persisted and applied
```

### Critical Features

| Item | Why it's critical |
| --- | --- |
| **Real Accessibility (A11y)** | Aria labels, keyboard navigation, contrast — 90% of products ignore this |
| **Intelligent empty states** | When there is no data, the app should teach what to do, not look broken |
| **Microinteractions** | Small animations, subtle feedback — increase the feeling of quality |
| **Resilient UI** | Placeholder when the API is slow, auto-reconnect, slow network warnings |
| **Progressive Disclosure** | Show only what matters at the right time |

---

## 🔗 PRODUCT · SHARED

Everything shared between Home and Admin lives here.

### Design System

- **Base Components**: Buttons, inputs, modals, cards, tooltips
- **Design Tokens**: Colors, typography, spacing, shadows
- **Dynamic Theme**: Color system with automatic contrast (`ade-theme.ts`)

### Shared Components

| Component | Usage |
| --- | --- |
| `ToastProvider` | Visual feedback for actions (auto-dismiss 5s) |
| `EmptyStateAde` | Consistent empty states |
| `TileDetailModal` | Shared chat modal between tiles and contacts |

### Critical Features

- **Scalable Design System**: Buttons, modals, cards, inputs, guidelines
- **Internationalization (i18n)**: Language switching, currency formatting, dates
- **Global State and Synchronization**: How the UI reacts when multiple tabs change the same data

---

# ⚙️ PLATFORM

The Platform layer is the technical heart of the system. This is where the backend, database, real authentication, authorizations, APIs, queues, processing services, cache, data modeling, and technical integrations live.

## 🏠 PLATFORM · HOME

### Main API

#### POST `/api/generate`

**Responsibility**: Create a complete workspace with template tiles

**Technical Flow**:

```typescript
1. Validates payload with Zod
2. Resolves template (getGuestTemplate)
3. Replaces variables (processPromptVariables)
4. For each tile:
   - If MOCK_OPENAI_RESPONSES=true → generateMockTileContent
   - Otherwise → generateTileContent (configurable batch)
   - Limits tokens (getMaxTokensForTile)
   - GPT-5 models use responses.create()
   - GPT-4 models use chat.completions.create()
5. Assembles WorkspaceSnapshot
6. Persists in the global cache (writeWorkspace)
7. Returns JSON { success, sessionId, workspace }
```

**Technical Features**:

- **Validation**: Zod for runtime type-safety
- **Batch Processing**: Configurable via `BROWSER_TILE_BATCH_SIZE`
- **Multi-API Support**: Automatic adaptation based on the model
- **Mock Mode**: For development/testing (`MOCK_OPENAI_RESPONSES`)

---

## 🎛️ PLATFORM · ADMIN

### Main APIs

| Action | Endpoint | Notes |
| --- | --- | --- |
| Reorder tiles | `POST /api/workspace/reorder` | Receives `order: string[]`; blocks if the workspace is not the most recent |
| Create custom tile | `POST /api/workspace/tiles` | Validates with Zod, generates content via `generateTileContent` |
| Regenerate tile | `POST /api/workspace/tiles/[tileId]/regenerate` | Preserves recent `history` |
| Chat tile | `POST /api/workspace/tiles/[tileId]/chat` | GPT-5 support: `responses.create()`, GPT-4: `chat.completions.create()` |
| Create contact | `POST /api/workspace/contacts` | Generates initial outreach |
| Regenerate contact | `POST /api/workspace/contacts/[contactId]/regenerate` | Updates `contact.outreach` |
| Chat contact | `POST /api/workspace/contacts/[contactId]/chat` | Same chat logic as tiles |
| Create note | `POST /api/workspace/notes` | Creates a new note |
| Edit note | `PATCH /api/workspace/notes/[noteId]` | Updates content |
| General reset | `DELETE /api/workspace` | Clears the current snapshot, cookie, and localStorage |

### Data Fetching

- **Primary Streaming**: `/api/generate/stream` with Server-Sent Events (SSE)
- **Local State**: Independent generation control (resilient to cookie failures)
- **Polling Fallback**: SWR `/api/workspace` with exponential backoff (2s → 10s)
- **Hierarchical Fallback**: Server → localStorage → Local State → Polling

### Critical Technical Features

| Item | Why it's critical |
| --- | --- |
| **Idempotency** | Prevents actions from being duplicated (e.g., payment sent twice) |
| **API Versioning** | Prevents changes from breaking older versions of the app |
| **Indexing and Query Optimization** | 90% of performance problems come from here |
| **Circuit Breakers / Rate Limits** | Protects the system against abuse, bots, and overload |
| **Health-checks and Heartbeats** | Monitor the health of the system |

---

## 🔗 PLATFORM · SHARED

### Session & State Management

#### Multi-Tier Storage Strategy

```
Tier 1: Memory Cache (Server-side)
  - TTL: 30 minutes
  - Priority: 1 (fastest)
  - Sync: WriteThrough (immediate)
  - Persistence: Ephemeral

Tier 2: LocalStorage (Client-side)
  - TTL: Infinity (LRU eviction)
  - Priority: 2
  - Sync: WriteBack (debounced 500ms)
  - Max entries: 5 (LRU limit)
  - Persistence: Session

Tier 3: MongoDB (Planned)
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

// Lean implementation:
- Global memory cache (globalThis.__WORKSPACE_CACHE__)
- 30-minute TTL with auto-purge before each read
- Deep cloning to prevent accidental mutations
- HTTP-only cookie for sessionId only
```

### AI Engine (Tile Generation)

#### Request Lifecycle

```
Input → Validation → Preparation → Execution → Normalization → Persistence
```

#### Multi-API Support

```typescript
// Automatic API detection based on the model
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
// Robust extraction with multiple fallbacks
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

// Chat: 2 attempts, 400ms fixed delay
// Polling: Exponential backoff 2s → 3s → 4.5s → ... → 10s (max)
// Max 30 polling attempts before stopping
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

// Normalization implemented:
- Guaranteed roles (never null or invalid)
- Unique IDs based on timestamp
- ISO timestamps for consistency
- Content clamping for previews (maxChars=320)
```

### Template & Variable Processing

```typescript
// Templates with {{variable}} variables
processPromptVariables(
  prompt: string,
  variables: Record<string, string>
): string {
  let resolved = prompt
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\$\{${key}\}`, 'g')
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

// Automatic contrast calculation
get_contrasting_text_color(backgroundColor) → HexColor := {
  luminance = calculate_luminance(backgroundColor)
  if luminance > 0.5 then
    return "#000000"  // Dark text on light
  else
    return "#ffffff"  // Light text on dark
}
```

### Advanced Technical Features

| Item | Implementation |
| --- | --- |
| **Advanced security** | Detailed Audit Trail, revocable sessions, token rotation |
| **Distributed queues** | Orchestrators (Temporal, BullMQ), exponential retry rules |
| **Event Modeling** | Event Bus, event store (simplified event sourcing) |
| **Technical feature flag** | Technical mechanism for feature flags |
| **Infra as Code** | Terraform, CloudFormation, auditable deploy |

---

# 💰 SAAS

The SaaS layer is where the business model and the service's operating rules reside. Here you define plans (Free, Pro, Team), limits (how many tasks, how many exports, how many members), billing policies, payments, trials, plan-based permissions, and upgrades.

## 🏠 SAAS · HOME

### Limit Validation

Before generating a workspace, the system validates:

- **Membership Status**: Checks the user's plan (free/pro/enterprise)
- **Quotas**: Limit of created workspaces (e.g., 3 in Free)
- **Rate Limiting**: Prevents abuse and spam

### Business Rules

```typescript
// Example of validation before POST /api/generate
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

### Plans & Tiers

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
// Counters per action (tileChat, contactChat, etc.)
usageCounters := {
  userId: ObjectId,
  action: GuestAction,
  count: Integer,
  period: "day" | "month" | "lifetime",
  periodStart: Date,
  periodEnd: Date
}

// Atomic increment
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

### Plan-Based Access Rules

- **Free**: Basic templates, limited chat, no advanced customization
- **Pro**: All templates, unlimited chat, full customization
- **Enterprise**: Everything from Pro + team collaboration, API access, priority support

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

### Billing & Usage Limits (Stripe) - Planned

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

### Critical SaaS Features

| Item | Why it's critical |
| --- | --- |
| **Subscription Lifecycle** | Activation, expiration, reactivation, involuntary churn |
| **Soft vs Hard Limit** | Clear definition of what blocks and what just warns |
| **Plan-based Feature Flags** | Allows for gradual feature release |
| **Reliable usage metrics** | Count tasks, credits, and actions for real — no fraud |
| **Billing webhooks** | Renewal, failure, cancellation, downgrade — everything triggers events |
| **Fairness rules** | Different trials, immediate upgrade, downgrade only at the end of the cycle |
| **Prorations and grace periods** | Keeps the user active even with a temporary card failure |
| **Consumption audit** | Legal security and trust in limits and charges |

---

# 🔧 MAJOR ORCHESTRATORS AND THIRD-PARTY LIBRARIES

## Main Orchestrators

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

## Main Third-Party Libraries

### Frontend

| Library | Usage | Version |
| --- | --- | --- |
| **Next.js** | React Framework with App Router | 14+ |
| **React** | UI Library | 18+ |
| **SWR** | Data fetching and cache | Latest |
| **Tailwind CSS** | Utility-first styling | Latest |
| **Zod** | Schema validation | Latest |
| **framer-motion** | Animations (local) | Latest |

### Backend

| Library | Usage | Version |
| --- | --- | --- |
| **OpenAI SDK** | Integration with GPT-5/GPT-4 | Latest |
| **Next.js API Routes** | Server-side endpoints | 14+ |

### Planned

| Library | Usage | Status |
| --- | --- | --- |
| **Clerk** | Authentication | 🔄 Planned |
| **Stripe** | Payments and billing | 🔄 Planned |
| **MongoDB** | Data persistence | 🔄 Planned |
| **Prisma** | ORM for MongoDB | 🔄 Planned |

---

# 🎯 DESIGN PRINCIPLES

## Leanness (Lean Architecture)

- **2-Tier Storage**: Memory + LocalStorage (no unnecessary layers)
- **On-demand Purge**: Cleanup only when necessary (no background jobs)
- **Refs for Polling**: Avoids unnecessary re-renders
- **Selective Memoization**: Only expensive calculations (appearance tokens)

## Intelligence (Smart Decisions)

- **Conditional Polling**: Only when active generation is detected
- **State Unification**: Explicit priorities, source tracking
- **Selection Preservation**: Respects the user's manual choice
- **Multi-API Support**: Automatic adaptation based on the model

## Scalability (Scalable Foundation)

- **LRU Cache**: Limit of 5 workspaces (avoids infinite growth)
- **Automatic TTL**: 30min expiration (releases memory)
- **Deep Cloning**: Prevents accidental mutations (thread-safe)
- **Debounced Writes**: Reduces I/O on localStorage

## Resilience (Resilient System)

- **Retry with Backoff**: Automatic recovery from temporary failures
- **Fallback Strategies**: Mock, local cache, default models
- **Hydration Safety**: Prevention of SSR/CSR errors
- **Silent Failures**: Graceful degradation (quota errors ignored)

---

# 📈 ROADMAP AND CURRENT STATUS

> 📊 **For full implementation status details**, see [`implementation-status.md`](./implementation-status.md).

## Phase 1: Preparation ✅

- [x] Next.js 16 migration
- [x] Turbopack configuration
- [x] Middleware/proxy setup

## Phase 2: MongoDB Persistence 🔄 **PARTIALLY IMPLEMENTED**

- [x] Define data models (users, workspaces, tiles, contacts, notes, usageCounters) ✅
- [x] Setup MongoDB connection and indexes ✅
- [x] Implement dual-write pattern (Memory + MongoDB) ✅
- [x] Create migration routine (localStorage → MongoDB on auth) ✅
- [x] Update APIs to use MongoDB with fallback ✅
- [ ] **Pending**: Full integration in all routes (some still use only memory/localStorage)
- [ ] **Pending**: Production migration tests

**Status**: MongoDB is implemented and working, but not all APIs are using it. The system works in hybrid mode (Memory + LocalStorage for guests, MongoDB for authenticated members).

## Phase 3: Clerk Authentication 🔄 **PREPARED BUT NOT IMPLEMENTED**

- [x] Prepared structure (`src/lib/auth/get-auth.ts`) ✅
- [ ] Configure Clerk providers and middleware ❌
- [ ] Replace fake membership with Clerk userId ❌
- [ ] Implement user-scoped workspace isolation ❌
- [ ] Update UI to show authenticated user ❌
- [ ] Handle guest → authenticated migration ❌

**Status**: Code prepared for Clerk, but authentication still returns `null` (guest mode). See `src/lib/auth/get-auth.ts` for details.

## Phase 4: Stripe Billing 🔄 **PARTIALLY IMPLEMENTED**

- [x] Webhook endpoint created (`/api/webhooks/stripe`) ✅
- [x] Guest → member migration structure ✅
- [ ] **Pending**: Validate Stripe signature (webhook signature validation)
- [ ] **Pending**: Integrate Stripe Checkout flow (UI)
- [ ] **Pending**: Implement plan-based limits server-side (free/pro/enterprise)
- [ ] **Pending**: Complete server-side usage tracking and enforcement
- [ ] **Pending**: Update MembershipProvider to read from the backend

**Status**: Webhook exists and processes events, but signature validation is commented out (TODO). Data migration works. Full checkout and server-side limits integration is missing.

## Phase 5: Testing & Validation 🔄 **IN PROGRESS**

- [x] Test structure created (`src/lib/test/`) ✅
- [x] Security tests (`security-sanitizer.ts`) ✅
- [x] Real flow tests (`real-flows.ts`) ✅
- [ ] E2E tests for auth flow (guest → upgrade → login) ❌
- [ ] Migration tests (localStorage → MongoDB) ❌
- [ ] Load testing (MongoDB queries, indexes) ❌
- [ ] Security testing (workspace isolation, rate limiting) ❌

**Status**: Test infrastructure exists, but full automated tests have not yet been implemented.

---

# 📚 CROSS-REFERENCES

All documents are organized in `docs/` by domains. See [`../README.md`](../README.md) for the full index.

**Main Documentation**:

- [`../README.md`](../README.md) — Main documentation index
- [`../02-operational-guides/operational-flow.md`](../02-operational-guides/operational-flow.md) — Updated operational flow (Nov/2025)
- [`../02-operational-guides/tile-flow.md`](../02-operational-guides/tile-flow.md) — Tile creation and prompt engineering flow
- [`../02-operational-guides/admin-guide.md`](../02-operational-guides/admin-guide.md) — Detailed anatomy of themes (Ade, Classic, Dash)
- [`technical-blueprint.md`](./technical-blueprint.md) — Complete architecture blueprint
- [`implementation-status.md`](./implementation-status.md) — Real status of implementations
- [`../06-specifications/architecture-visualization.md`](../06-specifications/architecture-visualization.md) — Architecture visualization system
- [`../04-checklist-plans/admin-checklist.md`](../04-checklist-plans/admin-checklist.md) — Admin Checklist
- [`../04-checklist-plans/finalization-plan.md`](../04-checklist-plans/finalization-plan.md) — Finalization Plan

**Project Root**:

- `../../README.md` — Macro view, setup, and list of endpoints (root)

---

**Last updated**: November/2025
**Status**: Architecture implemented and in production
**Next steps**: MongoDB persistence, Clerk authentication, Stripe billing integration

🚀 Done! This is the consolidated text of the system's architecture, organized by Product/Platform/SaaS and Home/Admin/Shared, with all orchestrators and third-party libraries mapped!
