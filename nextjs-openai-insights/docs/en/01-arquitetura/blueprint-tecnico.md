# External API Orchestration Engine - Architecture Blueprint

**Updated Version**: November/2025
**Philosophy**: Lean, intelligent, and highly scalable system without unnecessary layers. Focus on practical techniques that maximize capacity with minimal complexity.

---

## 1. Core Domain Model

### 1.1 Workspace (Work Context)

```
Workspace := {
  id: WorkspaceID,
  entities: Collection<Entity>,
  metadata: Metadata,
  state: WorkspaceState,
  version: Version,
  timestamps: Timestamps,
  appearance: AppearanceTokens | null  // Dynamic theme system
}

Entity := Tile | Contact | Note | Attachment | CustomEntity
WorkspaceState := Building | Ready | Stale | Archived
```

**Implemented features**:

- Unified state with source tracking (`server` | `localStorage` | `cache`)
- Timestamps for active generation detection (`generatedAt`)
- Dynamic appearance system with computed tokens

### 1.2 Entity (Data Unit)

```
Entity := {
  id: EntityID,
  type: EntityType,
  content: Content,
  history: ConversationHistory,  // Clamped, normalized
  source: DataSource,
  state: EntityState,
  metadata: EntityMetadata
}

Content := {
  primary: String,
  metadata: Map<String, Any>,
  attachments: Attachment[]
}

DataSource := {
  origin: ExternalAPI | UserInput | System,
  provider: String,
  model: ModelName,  // e.g., "gpt-5-mini", "gpt-4o-mini"
  generated_at: Timestamp,
  config_snapshot: Config,
  api_version: String  // "responses.create" | "chat.completions.create"
}
```

**Implemented optimizations**:

- Limited history (`MAX_HISTORY_LENGTH=12`) to reduce tokens
- Message normalization (guaranteed roles: `assistant` | `user` | `system`)
- Content clamping for previews (`clampTiles`, `maxChars=320`)

---

## 2. Request Engine

### 2.1 Request Lifecycle

```
RequestLifecycle :=
  Input → Validation → Preparation → Execution → Normalization → Persistence

Input := {
  payload: InputData,
  context: Context,
  requirements: Requirements,
  model_preference: ModelName | null
}

Validation := {
  schema_check(payload) → Valid | Invalid,  // Zod validation
  rate_limit_check(context) → Allowed | Blocked,
  quota_check(context) → Available | Exceeded,
  model_validation(model) → ValidModel | Fallback  // resolveModel()
}
```

**Implemented techniques**:

- Zod validation for runtime type-safety
- Model validation against `VALID_MODELS` array
- Automatic fallback to `DEFAULT_MODEL` with a warning

### 2.2 Request Preparation

```
PreparedRequest := {
  endpoint: URL,
  method: HTTPMethod,
  headers: Map<String, String>,
  body: RequestBody,
  timeout: Duration,
  retry_policy: RetryPolicy,
  api_type: APIType  // "responses.create" | "chat.completions.create"
}

RequestBody := transform(
  template: Template,
  variables: Map<String, Any>,
  normalization_rules: Rules,
  model: ModelName  // Determines API type
)

APIType := {
  gpt5: "responses.create",
  gpt4: "chat.completions.create"
}
```

**Intelligent adaptation**:

- Automatic API detection based on the model (`isGPT5Model()`)
- Conversion of messages to the correct format (`convertMessagesToInput()`)
- Dynamic parameters (`max_tokens` vs `max_completion_tokens` vs `max_output_tokens`)

### 2.3 Execution Strategies

```
ExecutionStrategy := Single | Batch | Stream

Batch := {
  size: Integer,  // BROWSER_TILE_BATCH_SIZE (configurable)
  mode: Sequential | Parallel,
  failure_tolerance: FailurePolicy
}

FailurePolicy := {
  stop_on_first_error: Boolean,
  max_failures: Integer,
  fallback: FallbackStrategy
}

FallbackStrategy := UseMock | UseCache | ReturnPartial | Fail

// Implemented: UseMock when MOCK_OPENAI_RESPONSES=true
```

**Optimizations**:

- Configurable batch via env var
- Mock mode for development/testing
- Retry with exponential backoff (2 attempts, 400ms delay)

---

## 3. Professional Response Normalization

### 3.1 Raw Response Processing

```
RawResponse := {
  status: StatusCode,
  headers: Map<String, String>,
  body: Any,
  latency: Duration,
  api_type: APIType
}

normalize(raw: RawResponse) → NormalizedResponse := {
  extract_content(raw, api_type),  // API-specific adapter
  validate_structure(content),
  apply_transformations(content),
  enrich_metadata(content, api_type)
}
```

### 3.2 Normalized Response Schema

```
NormalizedResponse := {
  success: Boolean,
  data: ResponseData | null,
  error: ErrorDetail | null,
  metadata: ResponseMetadata
}

ResponseData := {
  content: String | Object,
  format: ContentFormat,
  confidence: Float[0..1],
  tokens_used: TokenUsage | null
}

ErrorDetail := {
  code: ErrorCode,
  message: String,
  recoverable: Boolean,
  retry_after: Duration | null,
  context: Map<String, Any>
}

ResponseMetadata := {
  request_id: RequestID,
  provider: String,
  model: String | null,
  api_type: APIType,
  latency: Duration,
  timestamp: Timestamp
}
```

### 3.3 Content Format Adapters (Multi-API Support)

```
ContentFormat := Text | JSON | Markdown | HTML | Binary

Adapter := {
  source_format: Format,
  target_format: Format,
  transform: (input: Any, api_type: APIType) → Output
}

// Implemented: OpenAI Multi-API Adapter
OpenAIAdapter := {
  gpt5_responses: (response) → {
    // Try output_text first
    if response.output_text then return response.output_text,
    // Try output array
    if response.output then
      for item in response.output:
        if item.type == "message" and item.content then
          for content_item in item.content:
            if content_item.type == "output_text" then
              return content_item.text
    return ""
  },

  gpt4_chat: (response) → {
    if response.choices and response.choices[0] then
      return response.choices[0].message.content
    return ""
  },

  extract_usage: (response, api_type) → {
    if api_type == "gpt5" then
      return response.usage || response.metadata?.usage
    else
      return response.usage
  }
}
```

**Advanced techniques**:

- Robust extraction with multiple fallbacks
- Detailed logs for debugging response structure
- Structure validation before extraction

---

## 4. Session & State Management (Multi-Tier Storage)

### 4.1 Session Store (Server-Side)

```
Session := {
  id: SessionID,
  workspace: Workspace,
  ttl: Duration,  // 30 minutes
  expires_at: Timestamp,
  access_count: Integer,
  updated_at: Timestamp
}

SessionStore := {
  storage: Map<SessionID, CacheEntry>,  // In-memory global store
  create(workspace: Workspace, ttl: Duration) → SessionID,
  read(id: SessionID) → Session | Expired | NotFound,
  update(id: SessionID, workspace: Workspace) → Result,
  delete(id: SessionID) → Result,
  cleanup() → Integer,  // Auto-purge expired entries
  clone(snapshot: Workspace) → Workspace  // Deep clone to prevent mutations
}
```

**Lean implementation**:

- Global in-memory cache (`globalThis.__WORKSPACE_CACHE__`)
- 30-minute TTL with auto-purge before each read
- Deep cloning to prevent accidental mutations
- HTTP-only cookie for `sessionId` only (no sensitive data)

### 4.2 Multi-Tier Storage Strategy

```
StorageTier := {
  name: String,
  type: Memory | LocalStorage | RemoteDB,
  capacity: Bytes,
  ttl: Duration | Infinity,
  priority: Integer,
  sync_mode: SyncMode,
  persistence: PersistenceLevel
}

PersistenceLevel := Ephemeral | Session | Persistent

// Implemented: 2-Tier Strategy (current)
// Planned: 3-Tier Strategy (with MongoDB)
StorageStrategy := {
  tier1: {
    type: Memory,
    ttl: 30min,
    priority: 1,
    sync_mode: WriteThrough,
    persistence: Ephemeral
  },

  tier2: {
    type: LocalStorage,
    ttl: Infinity,  // LRU eviction instead
    priority: 2,
    sync_mode: WriteBack,
    max_entries: 5,  // LRU limit
    eviction: LRU,
    persistence: Session
  },

  // Planned: Tier 3 (MongoDB)
  tier3: {
    type: MongoDB,
    ttl: Infinity,  // No expiration (user data)
    priority: 3,
    sync_mode: WriteThrough,  // Immediate persistence
    persistence: Persistent,
    user_scoped: true,  // Isolated per user
    indexes: ["userId", "sessionId", "createdAt"]
  }
}

write(data: Data) → {
  // Primary: Server memory (immediate)
  tier1.write(data),

  // Secondary: Client localStorage (async, debounced)
  if client_available then
    debounce(tier2.write(data), delay=500ms)
}

read(id: ID) → {
  // Try server first (fresh data)
  result = tier1.read(id),
  if result != null then return result,

  // Fallback to client cache (stale but available)
  result = tier2.read(id),
  if result != null then
    mark_as_stale(result),
    return result,

  return NotFound
}
```

**Implemented optimizations**:

- **LRU in localStorage**: Keeps only the 5 most recent workspaces
- **Ordered index**: `insights_workspace_index` for quick access
- **Last session**: `insights_workspace_last` for quick opening
- **Automatic pruning**: Removes old entries when the limit is exceeded
- **Silent failures**: Quota errors ignored (graceful degradation)

### 4.3 State Synchronization & Unification

```
SyncEvent := Create | Update | Delete | Expire

// Implemented: Unified State with Source Tracking
WorkspaceState := {
  data: WorkspaceSnapshot | null,
  source: "server" | "localStorage" | "cache" | null,
  priority: Integer
}

sync(event: SyncEvent, entity: Entity) := {
  // Immediate server update
  update_memory(entity),

  // Debounced local persistence
  debounce(
    persist_local(entity),
    delay = 500ms
  ),

  // Background sync if network available
  if network_available then
    queue_remote_sync(entity)
}

// Implemented: Intelligent State Unification
unify_workspace_state(
  server_data: Workspace | null,
  local_data: Workspace | null,
  cached_data: Workspace[],
  viewing_session: SessionID | null
) → WorkspaceState := {

  // Priority 1: User manually selected session
  if viewing_session and user_selected then
    if server_data and server_data.sessionId == viewing_session then
      return { data: server_data, source: "server" }
    if local_data and local_data.sessionId == viewing_session then
      return { data: local_data, source: "localStorage" }
    cached = find_in_cache(cached_data, viewing_session)
    if cached then
      return { data: cached, source: "cache" }

  // Priority 2: Server data (most fresh)
  if server_data then
    return { data: server_data, source: "server" }

  // Priority 3: Local data (stale but available)
  if local_data then
    return { data: local_data, source: "localStorage" }

  // Priority 4: Cached data
  if cached_data.length > 0 then
    return { data: cached_data[0], source: "cache" }

  return { data: null, source: null }
}
```

**Advanced techniques**:

- **Source tracking**: Tracks the origin of data for debugging and decision-making
- **Preservation of manual selection**: Prevents auto-switching when the user selects a workspace
- **Ref for selection**: `userSelectedSessionRef` marks manual selections
- **Preservation of local state**: Maintains chat history even when the server updates

---

## 5. Resilience & Error Handling

### 5.1 Retry Mechanism (Exponential Backoff)

```
RetryPolicy := {
  max_attempts: Integer,  // 2 for chat, configurable for others
  backoff: ExponentialBackoff,
  retryable_conditions: Condition[]
}

ExponentialBackoff := {
  initial: Duration,  // 400ms for chat
  multiplier: Float,  // 1.5 for polling
  max: Duration,  // 10s for polling
  jitter: Boolean  // false (deterministic)
}

retry(operation: Operation, policy: RetryPolicy) := {
  attempts = 0,
  while attempts < policy.max_attempts {
    result = execute(operation),
    if result.success then return result,
    if not is_retryable(result.error) then return result,

    delay = calculate_backoff(attempts, policy.backoff),
    sleep(delay),
    attempts++
  }
  return failure(MaxRetriesExceeded)
}
```

**Specific implementation**:

- Chat: 2 attempts, 400ms fixed delay
- Polling: Exponential backoff 2s → 3s → 4.5s → ... → 10s (max)
- Max 30 polling attempts before stopping

### 5.2 Intelligent Polling

```
PollingStrategy := {
  enabled: Boolean,
  interval: Duration,  // Dynamic (exponential backoff)
  max_attempts: Integer,  // 30
  conditions: PollCondition[]
}

PollCondition := {
  has_tiles: Boolean,  // Stop if tiles found
  generated_recently: Boolean,  // generatedAt within 5min
  localStorage_timestamp: Timestamp | null,  // last-generation-time
  window: Duration  // 2 minutes for fresh workspaces
}

should_poll(workspace: Workspace, conditions: PollCondition) → Boolean := {
  // Stop immediately if tiles found
  if conditions.has_tiles then return false,

  // Check if recently generated
  if workspace.generatedAt then
    age = now() - workspace.generatedAt,
    if age < 5min then return true,

  // Check localStorage timestamp
  if conditions.localStorage_timestamp then
    age = now() - conditions.localStorage_timestamp,
    if age < 2min then return true,

  return false
}

poll_with_backoff(
  session_id: SessionID,
  strategy: PollingStrategy
) → Workspace | Timeout := {
  attempts = 0,
  interval = 2000,  // Start at 2s

  while attempts < strategy.max_attempts {
    result = fetch_workspace(session_id),

    if result.success and result.has_tiles then
      return result,

    if not should_poll(result, strategy.conditions) then
      return Timeout,

    // Exponential backoff
    interval = min(interval * 1.5, 10000),  // Max 10s
    sleep(interval),
    attempts++
  }

  return Timeout
}
```

**Optimizations**:

- Stops automatically when tiles are found
- Checks multiple conditions (workspace `generatedAt` + `localStorage` timestamp)
- Increased polling window for newly generated workspaces (2 minutes)
- Uses refs to avoid unnecessary re-renders

### 5.3 Circuit Breaker (Future Enhancement)

```
CircuitBreaker := {
  state: Closed | Open | HalfOpen,
  failure_count: Integer,
  success_count: Integer,
  threshold: Integer,
  timeout: Duration,
  last_failure: Timestamp
}

// Not yet implemented, but architecture supports it
```

---

## 6. Conversation History Management

### 6.1 History Structure

```
ConversationHistory := Message[]

Message := {
  id: MessageID,  // `${role}_${timestamp.toString(36)}`
  role: Role,  // Guaranteed: "assistant" | "user" | "system"
  content: Content,
  timestamp: Timestamp,  // ISO string
  metadata: MessageMetadata
}

Role := User | Assistant | System

MessageMetadata := {
  tokens: Integer | null,
  model: String | null,
  latency: Duration | null,
  edited: Boolean
}
```

**Normalization implemented**:

- Guaranteed roles (never `null` or invalid)
- Unique IDs based on timestamp
- ISO timestamps for consistency

### 6.2 History Policies

```
HistoryPolicy := {
  max_length: Integer,  // 12 for chat (MAX_HISTORY_LENGTH)
  retention: RetentionStrategy,
  summarization: SummarizationStrategy | null
}

RetentionStrategy := KeepRecent  // Implemented

apply_policy(history: Message[], policy: HistoryPolicy) → Message[] := {
  if length(history) <= policy.max_length then
    return history,

  // KeepRecent: keeps the last N messages
  return last_n(history, policy.max_length)
}

// Implemented: Clamp for previews
clamp_content(content: String, max_chars: Integer = 320) → String := {
  if content.length <= max_chars then
    return content
  return content.slice(0, max_chars) + "…"
}
```

**Optimizations**:

- Limited history reduces tokens and costs
- Content clamping for UI previews
- Normalization before sending to the API

---

## 7. Template & Variable Processing

### 7.1 Template Engine

```
Template := {
  id: TemplateID,  // e.g., "template_1"
  content: String,
  variables: Variable[],
  version: Version
}

Variable := {
  name: String,  // e.g., "{{company}}", "{{solution}}"
  type: VarType,
  required: Boolean,
  default: Any | null,
  validator: Validator | null
}

VarType := String | Number | Boolean | Array | Object

process_template(template: Template, context: Context) → String := {
  validate_variables(template.variables, context),
  replace_placeholders(template.content, context),
  apply_transformations(result)
}
```

**Implemented**:

- Templates with `{{variable}}` variables
- Processing with `processPromptVariables()`
- Validation of required variables

---

## 8. Dynamic Appearance System (Theme Tokens)

### 8.1 Appearance Tokens

```
AppearanceTokens := {
  baseColor: HexColor,  // User-selected or default
  surfaceColor: HexColor,  // Computed from baseColor
  sidebarColor: HexColor,  // Semi-transparent overlay
  sidebarBorderColor: HexColor,
  cardBorderColor: HexColor,
  headingColor: HexColor,  // Auto-contrast
  textColor: HexColor,  // Auto-contrast
  mutedTextColor: HexColor,  // Mixed
  actionColor: HexColor,
  overlayColor: RGBA
}

compute_appearance_tokens(baseColor: HexColor) → AppearanceTokens := {
  // Surface: baseColor adjusted for lightness
  surfaceColor = adjust_lightness(baseColor, +0.08),

  // Sidebar: gray tint with transparency effect
  sidebarColor = mix_colors(baseColor, "#808080", 0.3),

  // Text colors: automatic contrast based on luminance
  textColor = get_contrasting_text_color(surfaceColor),
  headingColor = get_contrasting_text_color(surfaceColor),

  // Muted: mix of text and surface
  mutedTextColor = mix_colors(textColor, surfaceColor, 0.55),

  // Borders: subtle darkening
  cardBorderColor = mix_colors(surfaceColor, "#000000", 0.08),
  sidebarBorderColor = mix_colors(sidebarColor, "#000000", 0.1),

  // Overlay: transparent black
  overlayColor = rgba("#000000", 0.08)
}
```

### 8.2 Contrast Calculation

```
get_contrasting_text_color(backgroundColor: HexColor) → HexColor := {
  luminance = calculate_luminance(backgroundColor),
  // WCAG contrast algorithm
  if luminance > 0.5 then
    return "#000000"  // Dark text on light background
  else
    return "#ffffff"  // Light text on dark background
}

calculate_luminance(hexColor: HexColor) → Float := {
  rgb = hex_to_rgb(hexColor),
  // Normalize RGB channels
  normalize = (channel) → {
    value = channel / 255,
    if value <= 0.03928 then
      return value / 12.92
    else
      return pow((value + 0.055) / 1.055, 2.4)
  },
  r = normalize(rgb.r),
  g = normalize(rgb.g),
  b = normalize(rgb.b),
  // Relative luminance formula
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
```

### 8.3 Color Persistence & Hydration

```
ColorPersistence := {
  storage_key: "ade-base-color",
  apply_before_hydration: Boolean,  // true
  priority: "localStorage" > "workspace" > "default"
}

apply_color_before_hydration() := {
  // Inline script in page.tsx (beforeInteractive)
  stored = localStorage.getItem("ade-base-color"),
  if stored and valid_hex(stored) then
    document.documentElement.style.setProperty("--ade-base-color", stored),
    document.body.style.backgroundColor = stored
}

hydrate_color(
  localStorage_color: HexColor | null,
  workspace_color: HexColor | null,
  default_color: HexColor
) → HexColor := {
  // Priority: localStorage > workspace > default
  if localStorage_color and valid_hex(localStorage_color) then
    return localStorage_color
  if workspace_color and valid_hex(workspace_color) then
    return workspace_color
  return default_color
}
```

**Advanced techniques**:

- **Pre-hydration application**: Inline script applies color before React hydrates
- **suppressHydrationWarning**: Prevents hydration errors in dynamic elements
- **isMounted state**: Ensures consistent server/client rendering
- **Hex validation**: Regex `/^#[0-9A-Fa-f]{6}$/` before applying

---

## 9. AI-Specific Adaptations (Multi-API Support)

### 9.1 AI Provider Interface

```
AIProvider := {
  name: "OpenAI",
  api_versions: ["responses.create", "chat.completions.create"],
  authenticate: () → Credentials,
  create_completion: (request: AIRequest) → AIResponse,
  detect_api_type: (model: ModelName) → APIType
}

AIRequest := {
  model: ModelName,
  messages: Message[] | null,  // For chat.completions
  input: Message[] | null,  // For responses.create
  max_tokens: Integer | null,  // For GPT-4
  max_completion_tokens: Integer | null,  // For GPT-5
  max_output_tokens: Integer | null,  // For gpt-4o-mini
  temperature: Float,
  parameters: Map<String, Any>
}

detect_api_type(model: ModelName) → APIType := {
  if model.startsWith("gpt-5") then
    return "responses.create"
  else
    return "chat.completions.create"
}

create_completion(request: AIRequest) → AIResponse := {
  api_type = detect_api_type(request.model),

  if api_type == "responses.create" then
    return client.responses.create({
      model: request.model,
      input: convert_messages_to_input(request.messages),
      text: { format: { type: "text" }, verbosity: "medium" },
      reasoning: { effort: "medium" },
      tools: [],
      store: false,
      max_completion_tokens: request.max_completion_tokens
    })
  else
    return client.chat.completions.create({
      model: request.model,
      messages: request.messages,
      max_tokens: request.max_tokens || request.max_output_tokens
    })
}
```

### 9.2 Model Configuration

```
ModelConfig := {
  provider: "OpenAI",
  model: ModelName,
  version: Version | null,
  capabilities: Capability[],
  limits: Limits,
  api_type: APIType
}

VALID_MODELS := [
  "gpt-5", "gpt-5-mini", "gpt-5-nano",  // responses.create
  "gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-4",  // chat.completions
  "gpt-3.5-turbo"  // chat.completions
]

DEFAULT_MODEL := "gpt-4o-mini"

resolve_model(preferred: String | null) → ModelName := {
  if not preferred then return DEFAULT_MODEL,
  candidate = preferred.trim(),
  if VALID_MODELS.includes(candidate) then
    return candidate
  else
    log_warning("Invalid model, falling back to default"),
    return DEFAULT_MODEL
}
```

**Validation implemented**:

- Array of valid models (`VALID_MODELS`)
- Runtime validation with fallback
- Warning logs for invalid models

---

## 10. Algorithmic Patterns

### 10.1 Request Orchestration Algorithm

```
orchestrate(input: InputData, config: Config) → Workspace := {
  // 1. Preparation
  session = create_session(),
  workspace = initialize_workspace(input),
  template = resolve_template(config.template_id),
  requests = prepare_requests(input, template, config),

  // 2. Execution (batch with configurable size)
  responses = execute_batch(
    requests,
    batch_size = config.BROWSER_TILE_BATCH_SIZE,
    strategy = Sequential,  // Or Parallel
    on_progress = update_workspace_state
  ),

  // 3. Normalization (multi-API aware)
  entities = normalize_responses(responses, api_types),

  // 4. Persistence (multi-tier)
  workspace.entities = entities,
  workspace.state = Ready,
  workspace.generatedAt = now(),
  persist_server(session, workspace),
  persist_client_async(session, workspace),

  // 5. Replication
  replicate_to_client(session.id, workspace),

  return workspace
}
```

### 10.2 Polling & Hydration Algorithm (Intelligent)

```
hydrate_workspace(session_id: SessionID) → Workspace := {
  // 1. Try server (fresh data)
  server_workspace = fetch_from_server(session_id),
  if server_workspace.success then
    sync_to_local(server_workspace),
    return { data: server_workspace, source: "server" },

  // 2. Fallback to local (stale but available)
  local_workspace = fetch_from_local(session_id),
  if local_workspace != null then
    start_background_sync(session_id),  // Try to refresh
    return { data: local_workspace, source: "localStorage" },

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

### 10.3 State Unification Algorithm

```
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
    // Auto-switch only if no manual selection
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

---

## 11. Scalability Techniques (Lean but Powerful)

### 11.1 Memory Efficiency

```
Techniques := {
  // Deep cloning only when necessary
  clone_on_write: true,
  clone_on_read: false,  // Only when mutation is possible

  // LRU eviction in localStorage
  lru_cache: {
    max_entries: 5,
    eviction: "oldest_first",
    index_tracking: true
  },

  // Automatic TTL on the server
  auto_purge: {
    on_read: true,  // Purge expired before reading
    on_write: false,
    background: false  // Not needed, on-demand purge is sufficient
  }
}
```

### 11.2 Network Efficiency

```
Techniques := {
  // Intelligent polling (only when necessary)
  conditional_polling: {
    check_generatedAt: true,
    check_localStorage_timestamp: true,
    window: "2min",
    stop_on_tiles: true
  },

  // Exponential backoff
  exponential_backoff: {
    initial: "2s",
    multiplier: 1.5,
    max: "10s",
    max_attempts: 30
  },

  // Debounced local writes
  debounce_local_writes: {
    delay: "500ms",
    immediate_server_write: true
  }
}
```

### 11.3 Rendering Efficiency

```
Techniques := {
  // Prevention of re-renders
  use_refs_for_polling: true,  // pollingAttemptsRef, lastPollingIntervalRef

  // Memoization of expensive calculations
  memoize_appearance_tokens: true,  // useMemo with correct dependencies

  // Hydration optimization
  suppress_hydration_warning: true,  // On dynamic elements
  is_mounted_state: true,  // For consistent conditional rendering

  // Pre-hydration color application
  inline_script_before_hydration: true
}
```

### 11.4 State Management Efficiency

```
Techniques := {
  // Intelligent unification (avoids duplication)
  unified_state: {
    single_source_of_truth: false,  // Multi-source with priorities
    source_tracking: true,
    priority_system: true
  },

  // Preservation of manual selection
  user_selection_preservation: {
    ref_tracking: true,  // userSelectedSessionRef
    prevent_auto_switch: true,
    clear_on_new_generation: true
  },

  // Immediate local updates
  optimistic_updates: {
    chat_history: true,  // Update local before server confirm
    color_changes: true  // Save to localStorage immediately
  }
}
```

---

## 12. Implementation Checklist

### Core Components ✅

- [x] Session store with TTL (30min, auto-purge)
- [x] Multi-tier storage strategy (Memory + LocalStorage LRU)
- [x] Request preparation engine (Zod validation, model resolution)
- [x] Response normalization layer (Multi-API adapters)
- [x] Retry mechanism with backoff (Exponential, configurable)
- [x] Conversation history manager (Clamp, normalize)
- [x] Template processor (Variable substitution)
- [x] Dynamic appearance system (Contrast auto-calculation)
- [x] Intelligent polling (Conditional, exponential backoff)
- [x] State unification (Multi-source with priorities)

### Observability ✅

- [x] Detailed logs (API calls, response structures, state changes)
- [x] Source tracking (Workspace origin: server/localStorage/cache)
- [x] Error tracking (Warnings for invalid models, fallbacks)
- [x] Latency monitoring (Timing logs in critical operations)

### Resilience ✅

- [x] Timeout handling (Max attempts, exponential backoff)
- [x] Rate limiting (Configurable via env vars)
- [x] Fallback strategies (Mock mode, local cache, default models)
- [x] Hydration error prevention (suppressHydrationWarning, isMounted)

### Integration ✅

- [x] Provider adapters (OpenAI multi-API: responses.create + chat.completions)
- [x] Content format converters (Text extraction from multiple structures)
- [x] Validation schemas (Zod for type-safety)
- [x] Model versioning support (VALID_MODELS array, resolveModel)

### Future Enhancements 🔮

- [ ] Circuit breaker (Architecture supports it)
- [ ] Metrics collection (Prometheus/StatsD)
- [ ] Health checks endpoint
- [ ] Queue management (For asynchronous operations)
- [ ] Background sync (Sync local → server when offline)
- [ ] MongoDB persistence (Tier 3 storage)
- [ ] Clerk authentication integration
- [ ] Stripe billing webhooks
- [ ] User-scoped workspace isolation
- [ ] Migration routine (localStorage → MongoDB)

---

## 13. Mathematical Properties

### Invariants

```
∀ session ∈ SessionStore:
  session.expires_at > now() ∨ session ∈ ExpiredSet

∀ entity ∈ Workspace:
  entity.state ∈ {Pending, Ready, Failed}

∀ request ∈ RequestBatch:
  sum(request.tokens) ≤ MaxTokensBudget

∀ workspace_state ∈ WorkspaceState:
  workspace_state.source ∈ {"server", "localStorage", "cache", null}

∀ color ∈ AppearanceTokens:
  contrast(textColor, backgroundColor) ≥ WCAG_AA_Minimum
```

### Throughput Formula

```
Throughput = (SuccessfulRequests / TotalTime) × ParallelismFactor

Where:
  ParallelismFactor = min(BatchSize, MaxConcurrency)
  BatchSize = BROWSER_TILE_BATCH_SIZE (configurable)
  MaxConcurrency = Limited by rate limits
```

### Reliability Metric

```
Reliability = (SuccessCount + RecoveredFailures) / TotalAttempts

Where:
  RecoveredFailures = failures successfully retried
  TotalAttempts = initial + retries
```

### Polling Efficiency

```
PollingEfficiency = (SuccessfulPolls / TotalPolls) × (1 - OverheadRatio)

Where:
  OverheadRatio = (PollingTime / TotalTime)
  SuccessfulPolls = polls that found tiles
  TotalPolls = all polling attempts

Optimal: Stop immediately when tiles found (OverheadRatio → 0)
```

---

## 15. Database Persistence Layer (MongoDB)

### 15.1 Data Models & Collections

```
MongoDBCollection := {
  name: CollectionName,
  schema: SchemaDefinition,
  indexes: IndexDefinition[],
  validation: ValidationRules
}

// Planned Collections
Collections := {
  users: {
    schema: {
      _id: ObjectId,
      clerkUserId: String,  // Clerk user ID (unique index)
      email: String,
      createdAt: Date,
      updatedAt: Date,
      plan: PlanType | null,
      stripeCustomerId: String | null,
      stripeSubscriptionId: String | null
    },
    indexes: [
      { clerkUserId: 1, unique: true },
      { email: 1 },
      { stripeCustomerId: 1 }
    ]
  },

  workspaces: {
    schema: {
      _id: ObjectId,
      userId: ObjectId,  // Reference to users
      sessionId: String,  // Unique per user
      company: CompanyData,
      generatedAt: Date | null,
      tilesToGenerate: Integer,
      appearance: AppearanceTokens | null,
      createdAt: Date,
      updatedAt: Date
    },
    indexes: [
      { userId: 1, sessionId: 1, unique: true },
      { userId: 1, createdAt: -1 },  // Recent first
      { generatedAt: 1 }  // For cleanup queries
    ]
  },

  tiles: {
    schema: {
      _id: ObjectId,
      workspaceId: ObjectId,  // Reference to workspaces
      tileId: String,  // Unique within workspace
      title: String,
      content: String,
      prompt: String,
      templateId: String,
      category: String,
      model: ModelName,
      orderIndex: Integer,
      history: ConversationHistory,
      totalTokens: Integer | null,
      attempts: Integer,
      createdAt: Date,
      updatedAt: Date
    },
    indexes: [
      { workspaceId: 1, tileId: 1, unique: true },
      { workspaceId: 1, orderIndex: 1 }
    ]
  },

  contacts: {
    schema: {
      _id: ObjectId,
      workspaceId: ObjectId,
      contactId: String,  // Unique within workspace
      name: String,
      role: String,
      company: String,
      email: String | null,
      linkedin: String | null,
      outreach: OutreachData,
      chatHistory: ConversationHistory,
      createdAt: Date,
      updatedAt: Date
    },
    indexes: [
      { workspaceId: 1, contactId: 1, unique: true }
    ]
  },

  notes: {
    schema: {
      _id: ObjectId,
      workspaceId: ObjectId,
      noteId: String,  // Unique within workspace
      title: String,
      content: String,
      createdAt: Date,
      updatedAt: Date
    },
    indexes: [
      { workspaceId: 1, noteId: 1, unique: true },
      { workspaceId: 1, updatedAt: -1 }
    ]
  },

  usageCounters: {
    schema: {
      _id: ObjectId,
      userId: ObjectId,  // Reference to users
      action: GuestAction,
      count: Integer,
      period: PeriodType,  // "day" | "month" | "lifetime"
      periodStart: Date,
      periodEnd: Date,
      createdAt: Date,
      updatedAt: Date
    },
    indexes: [
      { userId: 1, action: 1, period: 1, periodStart: 1, unique: true },
      { userId: 1, periodEnd: 1 }  // For cleanup
    ]
  }
}
```

### 15.2 Storage Migration Strategy

```
MigrationStrategy := {
  phase: MigrationPhase,
  fallback_enabled: Boolean,
  sync_mode: SyncMode
}

MigrationPhase := {
  Phase1_Prepare: {
    // Setup MongoDB connection, collections, indexes
    // APIs continue using Memory + LocalStorage
    // No user impact
  },

  Phase2_Hybrid: {
    // APIs write to both Memory and MongoDB
    // Read priority: Memory > MongoDB > LocalStorage
    // Fallback to LocalStorage if MongoDB unavailable
    write_strategy: "dual_write",
    read_strategy: "memory_first_with_fallback"
  },

  Phase3_Migrate: {
    // On login/upgrade: sync localStorage → MongoDB
    // Migrate all user workspaces
    // Mark as migrated in user document
    migration_routine: "on_auth_event"
  },

  Phase4_Complete: {
    // MongoDB becomes primary source
    // Memory cache still used for performance
    // LocalStorage becomes fallback only
    write_strategy: "mongodb_primary",
    read_strategy: "mongodb_first_with_cache"
  }
}

migrate_local_to_mongo(
  userId: UserID,
  localWorkspaces: Workspace[]
) → MigrationResult := {
  migrated_count = 0,
  errors = [],

  for workspace in localWorkspaces:
    try:
      // Check if already exists
      existing = mongo.workspaces.findOne({
        userId: userId,
        sessionId: workspace.sessionId
      })

      if existing then
        // Merge: keep most recent data
        if workspace.updatedAt > existing.updatedAt then
          mongo.workspaces.updateOne(
            { _id: existing._id },
            { $set: workspace }
          )
      else
        // Insert new
        mongo.workspaces.insertOne({
          ...workspace,
          userId: userId
        })

      migrated_count++
    catch error:
      errors.push({ workspace: workspace.sessionId, error })

  // Mark user as migrated
  mongo.users.updateOne(
    { _id: userId },
    { $set: { migratedAt: now() } }
  )

  return { migrated_count, errors }
}
```

### 15.3 Database Access Patterns

```
DatabaseAccessPattern := {
  read_pattern: ReadPattern,
  write_pattern: WritePattern,
  cache_strategy: CacheStrategy
}

ReadPattern := {
  // Priority: Memory > MongoDB > LocalStorage
  read_workspace(sessionId: SessionID, userId: UserID) → Workspace := {
    // Try memory cache first
    memory_workspace = memory_cache.get(sessionId),
    if memory_workspace and memory_workspace.userId == userId then
      return memory_workspace

    // Try MongoDB
    mongo_workspace = mongo.workspaces.findOne({
      userId: userId,
      sessionId: sessionId
    })
    if mongo_workspace then
      // Populate cache
      memory_cache.set(sessionId, mongo_workspace),
      return mongo_workspace

    // Fallback to localStorage (guest mode)
    if not userId then
      return localStorage.get(sessionId)

    return null
  }
}

WritePattern := {
  // Dual-write during migration, MongoDB-primary after
  write_workspace(workspace: Workspace, userId: UserID | null) → Result := {
    // Always update memory cache
    memory_cache.set(workspace.sessionId, workspace),

    if userId then
      // Authenticated: write to MongoDB
      mongo.workspaces.updateOne(
        { userId: userId, sessionId: workspace.sessionId },
        { $set: { ...workspace, updatedAt: now() } },
        { upsert: true }
      )
    else
      // Guest: write to localStorage
      localStorage.set(workspace.sessionId, workspace)

    return Success
  }
}

CacheStrategy := {
  // Memory cache for performance (30min TTL)
  // MongoDB for persistence (no TTL)
  // LocalStorage for offline support (LRU eviction)

  invalidate_cache(sessionId: SessionID) := {
    memory_cache.delete(sessionId),
    // MongoDB and localStorage remain (they are source of truth)
  }
}
```

### 15.4 Query Optimization

```
QueryOptimization := {
  indexes: IndexDefinition[],
  aggregation_pipelines: Pipeline[],
  connection_pooling: PoolConfig
}

// Critical Indexes
Indexes := [
  // User workspace lookup (most common)
  { userId: 1, sessionId: 1, unique: true },

  // Recent workspaces (dashboard list)
  { userId: 1, createdAt: -1 },

  // Tiles within workspace (ordered)
  { workspaceId: 1, orderIndex: 1 },

  // Usage counters (rate limiting)
  { userId: 1, action: 1, period: 1, periodStart: 1, unique: true }
]

// Connection Pooling
PoolConfig := {
  min_pool_size: 5,
  max_pool_size: 50,
  max_idle_time_ms: 30000,
  server_selection_timeout_ms: 5000
}
```

---

## 16. Authentication & Authorization (Clerk)

### 16.1 Authentication Flow

```
AuthFlow := {
  provider: "Clerk",
  integration: ClerkIntegration,
  session_management: SessionManagement
}

ClerkIntegration := {
  // Next.js App Router integration
  middleware: "middleware.ts",
  providers: "@clerk/nextjs",
  hooks: ["useUser", "useAuth"],
  proxy: "proxy.ts"  // For development
}

SessionManagement := {
  // Clerk handles session tokens
  token_storage: "httpOnly cookies",
  session_validation: "server-side",
  user_context: "Client + Server components"
}

authenticate_request(request: Request) → AuthResult := {
  // Clerk middleware validates session
  user = await clerk.getAuth(),

  if user then
    return {
      authenticated: true,
      userId: user.id,
      email: user.emailAddresses[0].emailAddress,
      metadata: user.publicMetadata
    }
  else
    return {
      authenticated: false,
      userId: null,
      guest_mode: true
    }
}
```

### 16.2 User Identity & Workspace Isolation

```
UserIdentity := {
  clerkUserId: String,  // Primary identifier
  email: String,
  metadata: UserMetadata,
  plan: PlanType | null
}

WorkspaceIsolation := {
  // All queries scoped by userId
  read_workspaces(userId: UserID) → Workspace[] := {
    return mongo.workspaces.find({ userId: userId })
      .sort({ createdAt: -1 })
      .toArray()
  },

  create_workspace(userId: UserID, workspace: Workspace) → Workspace := {
    // Ensure userId is set
    workspace.userId = userId,
    return mongo.workspaces.insertOne(workspace)
  },

  update_workspace(
    userId: UserID,
    sessionId: SessionID,
    updates: Partial<Workspace>
  ) → Workspace := {
    // Verify ownership
    existing = mongo.workspaces.findOne({
      userId: userId,
      sessionId: sessionId
    })
    if not existing then
      throw UnauthorizedError

    return mongo.workspaces.updateOne(
      { userId: userId, sessionId: sessionId },
      { $set: { ...updates, updatedAt: now() } }
    )
  }
}
```

### 16.3 Guest Mode → Authenticated Migration

```
GuestToAuthMigration := {
  trigger: AuthEvent,
  migration_routine: MigrationRoutine,
  data_preservation: DataPreservation
}

AuthEvent := {
  user_signs_up: Boolean,
  user_logs_in: Boolean,
  user_upgrades: Boolean  // From guest to paid
}

MigrationRoutine := {
  on_auth_event(userId: UserID) → MigrationResult := {
    // 1. Find all localStorage workspaces
    localWorkspaces = localStorage.list_all_workspaces(),

    // 2. Migrate to MongoDB
    result = migrate_local_to_mongo(userId, localWorkspaces),

    // 3. Update membership status
    update_membership_status(userId, "member"),

    // 4. Clear localStorage (optional, keep as backup)
    // localStorage.clear_workspaces(),  // Or keep for offline support

    return result
  }
}

DataPreservation := {
  // Preserve all user data during migration
  preserve_workspaces: true,
  preserve_tiles: true,
  preserve_contacts: true,
  preserve_notes: true,
  preserve_chat_history: true,
  merge_strategy: "keep_most_recent"  // If duplicates exist
}
```

---

## 17. Billing & Usage Limits (Stripe)

### 17.1 Plan Types & Limits

```
PlanType := "free" | "pro" | "enterprise"

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

### 17.2 Stripe Integration

```
StripeIntegration := {
  checkout: CheckoutFlow,
  webhooks: WebhookHandlers,
  subscription_management: SubscriptionManagement
}

CheckoutFlow := {
  // User clicks "Upgrade" → Redirect to Stripe Checkout
  initiate_checkout(userId: UserID, planId: PlanID) → CheckoutSession := {
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
  // Stripe → Our API (server-side)
  "checkout.session.completed": {
    handler: async (event) => {
      session = event.data.object,
      userId = get_user_by_stripe_customer(session.customer),

      // Update user plan
      await mongo.users.updateOne(
        { _id: userId },
        {
          $set: {
            plan: session.metadata.plan,
            stripeSubscriptionId: session.subscription,
            updatedAt: now()
          }
        }
      ),

      // Update membership context (invalidate cache)
      invalidate_user_cache(userId)
    }
  },

  "customer.subscription.updated": {
    handler: async (event) => {
      subscription = event.data.object,
      userId = get_user_by_stripe_subscription(subscription.id),

      // Update plan status
      await mongo.users.updateOne(
        { _id: userId },
        {
          $set: {
            plan: subscription.status === "active" ? subscription.metadata.plan : "free",
            updatedAt: now()
          }
        }
      )
    }
  },

  "customer.subscription.deleted": {
    handler: async (event) => {
      subscription = event.data.object,
      userId = get_user_by_stripe_subscription(subscription.id),

      // Downgrade to free
      await mongo.users.updateOne(
        { _id: userId },
        {
          $set: {
            plan: "free",
            stripeSubscriptionId: null,
            updatedAt: now()
          }
        }
      )
    }
  }
}
```

### 17.3 Usage Tracking & Enforcement

```
UsageTracking := {
  counter_type: CounterType,
  enforcement: EnforcementStrategy,
  reset_policy: ResetPolicy
}

CounterType := {
  // Per-action counters (tileChat, contactChat, etc.)
  action_counters: {
    storage: "usageCounters collection",
    period: "day" | "month" | "lifetime",
    reset_frequency: "daily" | "monthly" | "never"
  },

  // Per-resource limits (workspaces, tiles, contacts)
  resource_limits: {
    storage: "workspaces collection (count)",
    enforcement: "before_create",
    limit_source: "plan_limits"
  }
}

EnforcementStrategy := {
  check_limit_before_action(
    userId: UserID,
    action: GuestAction,
    plan: PlanType
  ) → LimitResult := {
    // Get plan limits
    limits = PLAN_LIMITS[plan],
    action_limit = limits.actions[action]

    if action_limit == Infinity then
      return { allowed: true, remaining: Infinity }

    // Get current usage
    usage = mongo.usageCounters.findOne({
      userId: userId,
      action: action,
      period: "day",
      periodStart: start_of_today()
    })

    current_count = usage?.count ?? 0
    remaining = Math.max(action_limit - current_count, 0)

    return {
      allowed: current_count < action_limit,
      used: current_count,
      remaining: remaining,
      limit: action_limit
    }
  },

  increment_usage(
    userId: UserID,
    action: GuestAction
  ) → Result := {
    // Atomic increment
    mongo.usageCounters.updateOne(
      {
        userId: userId,
        action: action,
        period: "day",
        periodStart: start_of_today()
      },
      {
        $inc: { count: 1 },
        $setOnInsert: {
          createdAt: now(),
          updatedAt: now()
        }
      },
      { upsert: true }
    )
  }
}

ResetPolicy := {
  // Daily reset (at midnight UTC)
  daily_reset := {
    schedule: "0 0 * * *",  // Cron
    action: async () => {
      // Create new counters for today
      // Old counters remain for analytics
    }
  },

  // Monthly reset (for monthly plans)
  monthly_reset := {
    schedule: "0 0 1 * *",
    action: async () => {
      // Reset monthly counters
    }
  }
}
```

### 17.4 Membership Context (Server-Side)

```
MembershipContext := {
  // Replaces client-side localStorage-based membership
  provider: "ServerSideMembershipProvider",
  data_source: "MongoDB",
  cache: "Memory cache (5min TTL)"
}

get_membership_status(userId: UserID) → MembershipStatus := {
  // Check cache first
  cached = membership_cache.get(userId),
  if cached and not expired(cached) then
    return cached

  // Query MongoDB
  user = mongo.users.findOne({ _id: userId }),
  if not user then
    return { plan: "free", limits: PLAN_LIMITS.free }

  plan = user.plan ?? "free",
  limits = PLAN_LIMITS[plan],

  status = {
    plan: plan,
    limits: limits,
    stripeCustomerId: user.stripeCustomerId,
    stripeSubscriptionId: user.stripeSubscriptionId
  }

  // Cache for 5 minutes
  membership_cache.set(userId, status, ttl: 5min),

  return status
}
```

---

## 18. API Migration Strategy

### 18.1 Dual-Write Pattern

```
DualWritePattern := {
  // During migration: write to both old and new systems
  write_workspace(workspace: Workspace, userId: UserID | null) → Result := {
    // Always write to memory cache (performance)
    memory_cache.set(workspace.sessionId, workspace),

    if userId then
      // Authenticated: write to MongoDB
      mongo.workspaces.updateOne(
        { userId: userId, sessionId: workspace.sessionId },
        { $set: workspace },
        { upsert: true }
      )
    else
      // Guest: write to localStorage (fallback)
      localStorage.set(workspace.sessionId, workspace)

    return Success
  }
}
```

### 18.2 Read Fallback Chain

```
ReadFallbackChain := {
  // Priority: Memory > MongoDB > LocalStorage
  read_workspace(sessionId: SessionID, userId: UserID | null) → Workspace := {
    // Tier 1: Memory cache (fastest)
    memory_workspace = memory_cache.get(sessionId),
    if memory_workspace then
      // Verify ownership if authenticated
      if userId and memory_workspace.userId != userId then
        return null  // Security: user can't access others' workspaces
      return memory_workspace

    // Tier 2: MongoDB (persistent, authenticated)
    if userId then
      mongo_workspace = mongo.workspaces.findOne({
        userId: userId,
        sessionId: sessionId
      })
      if mongo_workspace then
        // Populate cache
        memory_cache.set(sessionId, mongo_workspace),
        return mongo_workspace

    // Tier 3: LocalStorage (guest fallback)
    if not userId then
      return localStorage.get(sessionId)

    return null
  }
}
```

### 18.3 API Route Updates

```
APIRouteUpdates := {
  // All routes check authentication first
  middleware: async (request: Request) => {
    auth = await authenticate_request(request),
    request.auth = auth,  // Attach to request

    // Continue to route handler
  },

  // Route handlers use auth context
  handler: async (request: Request) => {
