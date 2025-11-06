# 🔐 Documentação de Segurança - DashMaster.PRO

> **Última Atualização:** 05 de Novembro de 2025  
> **Versão:** 2.0  
> **Status:** Produção

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Autenticação e Autorização](#autenticação-e-autorização)
3. [Rotas e Middleware](#rotas-e-middleware)
4. [Guest Users e Sistema de Trial](#guest-users-e-sistema-de-trial)
5. [Tokens de Acesso Guest](#tokens-de-acesso-guest-detalhamento)
6. [Isolamento de Dados (Multi-Tenant)](#isolamento-de-dados-multi-tenant)
7. [Validação de Input](#validação-de-input)
8. [MongoDB Security](#mongodb-security)
9. [Netlify Functions Security](#netlify-functions-security)
10. [Frontend Security](#frontend-security)
11. [Backend Security](#backend-security)
12. [SSE (Server-Sent Events) Security](#sse-server-sent-events-security)
13. [Rate Limiting](#rate-limiting)
14. [Secrets Management](#secrets-management)
15. [Logging e Auditoria](#logging-e-auditoria)
16. [Checklist de Segurança](#checklist-de-segurança)
17. [Serviços Terceiros e Integrações](#serviços-terceiros-e-integrações)
18. [Vulnerabilidades Comuns e Mitigações](#vulnerabilidades-comuns-e-mitigações)
19. [Melhorias Futuras](#melhorias-futuras)
20. [Contatos de Segurança](#contatos-de-segurança)
21. [Referências](#referências)
22. [Resumo Arquitetural de Segurança](#resumo-arquitetural-de-segurança)

---

## 1. Visão Geral

### 1.1 Arquitetura de Segurança

O sistema implementa uma arquitetura de segurança em camadas:

```
┌─────────────────────────────────────────┐
│         Frontend (Next.js)               │
│  - Clerk Authentication (UI)            │
│  - Client-side validation                │
│  - XSS Protection                         │
└─────────────────┬───────────────────────┘
                  │ HTTPS
┌─────────────────▼───────────────────────┐
│      Middleware (Clerk)                 │
│  - Route protection                      │
│  - Public route whitelist                │
│  - JWT validation                        │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      API Routes (Next.js)                │
│  - Token validation (guest)             │
│  - User authentication (Clerk)            │
│  - Input validation (Joi)                │
│  - Data isolation                        │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      MongoDB Atlas                       │
│  - Connection pooling                    │
│  - Circuit breaker                        │
│  - Query isolation                        │
└──────────────────────────────────────────┘
```

### 1.2 Modelos de Acesso

O sistema suporta dois modelos de acesso:

1. **Usuário Autenticado (Clerk)**

   - Autenticação via Clerk
   - Workspaces isolados por `ownerId` ou `members.userId`
   - Acesso completo às funcionalidades
   - Sem limitações de uso (baseado no plano)

2. **Guest Mode (Trial)**
   - Acesso sem autenticação (trial gratuito)
   - Token de acesso único por job (SHA-256 hash)
   - Workspace isolado por `guest_id` (UUID v4)
   - Funcionalidades limitadas (ver seção 4.5)
   - Expiração automática (7 dias)
   - Rate limiting por IP e por `guest_id`
   - Quotas de recursos (companies, tiles, API calls)

---

## 2. Autenticação e Autorização

### 2.1 Clerk Authentication

**Localização:** `dashboard/middleware.js`, `dashboard/lib/auth.js`

**Implementação:**

- Usa `@clerk/nextjs/server` para validação de JWT
- Middleware roda em todas as rotas exceto arquivos estáticos
- Verifica assinatura JWT usando JWKS (JSON Web Key Set)
- Fallback para verificação manual usando `jose` library

**Configuração:**

```javascript
// middleware.js
const isPublicRoute = createRouteMatcher([
  "/",
  "/admin(.*)", // Guest admin
  "/api/guest(.*)", // Guest APIs
  "/api/prompt-jobs(.*)",
  // ...
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect(); // Requer autenticação Clerk
  }
});
```

**Variáveis de Ambiente:**

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Chave pública (frontend)
- `CLERK_SECRET_KEY` - Chave secreta (backend)

### 2.2 Verificação de Autenticação

**Função:** `getCurrentAuth()` em `dashboard/lib/auth.js`

**Processo:**

1. Tenta obter `userId` via `auth()` do Clerk
2. Se falhar, verifica JWT manualmente usando `jose`
3. Valida assinatura com JWKS do Clerk
4. Retorna `{ userId, isAuthenticated, session, claims }`

**Exemplo de Uso:**

```javascript
const authData = await getCurrentAuth();
if (!authData.isAuthenticated) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
const userId = authData.userId;
```

### 2.3 Clerk Metadata e Roles

**Localização:** `dashboard/lib/auth.js`, `dashboard/app/api/access-keys/activate/route.js`

**Implementação:**

- **Private Metadata:** Roles armazenados em `user.private_metadata.role` (Clerk)
- **Super Admin:** Role `"superadmin"` concede acesso total (bypassa todas as verificações)
- **Validação:** `AccessEngine` verifica `user.role === "superadmin"` antes de outras verificações

**Ativação de Super Admin:**

```javascript
// Sistema de chaves de ativação com segurança
- Chave armazenada como hash bcrypt em `_internal_setup`
- Validação de `intendedUserId` para prevenir uso indevido
- Expiração automática de chaves
- Chave removida após uso único
```

**Segurança:**

- ✅ Hash bcrypt (não reversível)
- ✅ Validação de usuário específico
- ✅ Expiração de chaves
- ✅ Uso único (chave removida após ativação)

### 2.4 Autorização por Workspace

**Verificação:** Sempre verificar `ownerId` ou `members.userId`

**Padrão:**

```javascript
const workspace = await db.findOne("workspaces", {
  _id: workspaceId,
  $or: [{ ownerId: userId }, { "members.userId": userId }],
});

if (!workspace) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

---

## 3. Rotas e Middleware

### 3.1 Rotas Públicas

**Definição:** `dashboard/middleware.js`

**Rotas Públicas:**

- `/` - Home page
- `/admin(.*)` - Admin dashboard (guest mode)
- `/api/guest(.*)` - APIs de guest (com token validation)
- `/api/prompt-jobs(.*)` - Criação de jobs (público)
- `/api/streams/jobs(.*)` - SSE streams (com token validation)
- `/api/health/mongodb` - Health check

**⚠️ IMPORTANTE:** Rotas públicas ainda podem exigir validação de token guest (ver seção 4).

### 3.2 Rotas Protegidas

Todas as outras rotas exigem autenticação Clerk:

- `/api/workspaces(.*)` - Gerenciamento de workspaces
- `/api/sections(.*)` - Gerenciamento de seções
- `/api/content-types(.*)` - Gerenciamento de tipos de conteúdo
- `/dashboard(.*)` - Dashboard autenticado

### 3.3 Netlify Functions

**Localização:** `dashboard/.netlify/functions/` ou `netlify/functions/`

**Comportamento:**

- Bypass do middleware Next.js (rota direta)
- Devem implementar validação própria
- Background functions não têm timeout de 26s

---

## 4. Guest Users e Sistema de Trial

### 4.1 Visão Geral do Sistema Guest

**Localização:** `dashboard/lib/guest-auth.js`, `dashboard/app/api/guest/*`

**Características:**

- **Acesso Anônimo:** Usuários podem usar o sistema sem criar conta
- **Isolamento Total:** Cada guest tem seu próprio workspace isolado
- **Trial Limitado:** Funcionalidades e recursos limitados para incentivar signup
- **Expiração Automática:** Workspaces guest expiram após 7 dias
- **Conversão:** Dados podem ser convertidos para workspace real após signup

### 4.2 Fluxo Home → Admin → Stream (Segurança)

**Fluxo Completo:**

```
1. HOME PAGE (/) - IAFormsContainer.jsx
   ├─ Usuário preenche formulário (company, website, solution)
   ├─ Validação client-side (Joi nos inputs)
   ├─ Submit → POST /api/prompt-jobs
   └─ Geração de IDs: guestId (UUID), jobId, token (SHA-256)

2. API /api/prompt-jobs
   ├─ Validação Joi do payload
   ├─ Geração de token seguro (crypto.randomBytes)
   ├─ Hash SHA-256 armazenado no job
   ├─ Criação de guest_workspace no MongoDB
   ├─ Criação de job com status QUEUED
   └─ Retorna: { jobId, guestId, token }

3. REDIRECIONAMENTO
   ├─ Frontend recebe IDs e token
   ├─ Redireciona para /admin?job_id=...&guest_id=...&token=...
   └─ Token enviado via query string (não armazenado)

4. ADMIN PAGE (/admin) - AdminDashboardContainer.jsx
   ├─ Lê job_id, guest_id, token da URL
   ├─ Carrega workspace via /api/guest/workspace?job_id=...&token=...
   ├─ Conecta ao SSE stream: /api/streams/jobs/[jobId]?guest_id=...&token=...
   └─ Validação de token em TODAS as requisições

5. SSE STREAM (/api/streams/jobs/[jobId])
   ├─ Valida jobId, guestId, token (query string)
   ├─ Verifica hash do token no job
   ├─ Verifica job pertence ao guestId
   ├─ Isola eventos por chave: guest:${guestId}:job:${jobId}
   └─ Keep-alive a cada 20s para manter conexão
```

**Segurança em Cada Etapa:**

- ✅ **Home:** Validação de inputs, sanitização
- ✅ **API:** Joi validation, token único, hash seguro
- ✅ **Admin:** Token obrigatório na URL, validação em todas as rotas
- ✅ **SSE:** Validação tripla (jobId + guestId + token), isolamento por chave

### 4.3 Isolamento de Guest Sessions

**Localização:** `dashboard/lib/guest-auth.js`

**Implementação:**

```javascript
// Validação de sessão guest
async function isValidGuestSession(guestId) {
  const session = await db.findOne("guest_workspaces", {
    guest_id: guestId,
  });

  if (!session) return false;

  // Verificar expiração
  if (new Date() > session.expires_at) {
    // Auto-delete expired sessions
    await db.deleteOne("guest_workspaces", { guest_id: guestId });
    return false;
  }

  return true;
}
```

**Isolamento Garantido:**

- ✅ Filtro obrigatório por `guest_id` em todas as queries
- ✅ Validação de `guestId` em todas as rotas `/api/guest/*`
- ✅ Verificação de `job.guestId === guestId` antes de qualquer operação
- ✅ Workspace isolado por `guest_id` único (UUID v4)
- ✅ Tiles filtrados por `jobId` (isolamento adicional)

### 4.4 Tokens de Acesso Guest

**Localização:** `dashboard/app/api/prompt-jobs/route.js`

**Processo:**

```javascript
const accessToken = crypto.randomBytes(24).toString("hex"); // 48 caracteres
const accessTokenHash = crypto
  .createHash("sha256")
  .update(accessToken)
  .digest("hex"); // Armazenado no DB
```

**Características:**

- 48 caracteres hexadecimais (192 bits de entropia)
- Hash SHA-256 armazenado no banco (nunca o token original)
- Único por job
- Não expira (mas pode ser invalidado)

### 4.5 Limitações de Uso para Guest Users

**Localização:** `dashboard/lib/guest-auth.js`, `dashboard/app/api/guest/templates/apply/route.js`

**Limites Implementados:**

```javascript
export const GUEST_LIMITS = {
  max_companies: 2, // Máximo de empresas por workspace
  max_api_calls_per_day: 100, // Limite diário de chamadas API
  allowed_templates: ["template_1", "template_2"], // Templates permitidos
  blocked_features: [
    "connect_crm", // Integração com CRM
    "upload_csv", // Upload em massa
    "bulk_prompts", // Prompts em lote
    "create_dashboard", // Criação de dashboards
    "custom_templates", // Templates customizados
    "add_team_members", // Adicionar membros à equipe
  ],
};
```

**Limites Dinâmicos (Workspace):**

```javascript
// Limites por workspace guest
limits: {
  max_companies: 3,              // Máximo de companies
  max_tiles_per_company: 10,     // Máximo de tiles por company
  max_templates: 5,              // Máximo de templates customizados
}

usage: {
  companies_count: 0,            // Contador atual
  companies_remaining: 3,        // Restante disponível
  total_tiles_generated: 0,      // Total de tiles gerados
  templates_created: 0,          // Templates criados
  last_activity: Date,            // Última atividade
}
```

**Validação de Limites:**

- ✅ Verificação antes de criar nova company (`/api/guest/add-company`)
- ✅ Verificação antes de aplicar template (`/api/guest/templates/apply`)
- ✅ Verificação antes de gerar tiles customizados
- ✅ Contadores incrementados automaticamente
- ✅ Retorno de erro 403 quando limite atingido

**Exemplo de Validação:**

```javascript
// Verificar limite de companies
if (
  guestWorkspace.usage.companies_count >= guestWorkspace.limits.max_companies
) {
  return NextResponse.json(
    {
      error: "Company limit reached",
      limit: guestWorkspace.limits.max_companies,
      current: guestWorkspace.usage.companies_count,
      remaining: guestWorkspace.usage.companies_remaining,
    },
    { status: 403 }
  );
}
```

### 4.6 Rate Limiting para Guest Users

**Localização:** `dashboard/lib/simple-rate-limit.js`, `dashboard/lib/rate-limiter.js`

**Limites Implementados:**

1. **Por IP (Geral):**

   - 10 requests por minuto por IP
   - Limpeza automática de entradas expiradas
   - Store em memória (não distribuído)

2. **Por Guest ID (Diário):**

   - 100 API calls por dia por `guest_id`
   - Reset automático a cada 24 horas
   - Validação em rotas críticas

3. **Por Tipo de Rota:**
   - Deploy: 5 por hora
   - Webhook: 30 por minuto
   - Public: 100 por minuto
   - General: 60 por minuto

**Implementação:**

```javascript
// Rate limit por IP
export function checkRateLimit(ip) {
  const minute = Math.floor(Date.now() / 60000);
  const key = `${ip}:${minute}`;
  const count = rateLimitStore.get(key) || 0;

  if (count >= 10) {
    return {
      allowed: false,
      limit: 10,
      current: count,
      message: "Too many requests. Please wait 1 minute and try again.",
    };
  }
  // ...
}

// Rate limit diário por guest_id
export async function checkDailyLimit(guestId, db) {
  const today = new Date().toISOString().split("T")[0];
  const key = `daily:${guestId}:${today}`;
  const count = rateLimitStore.get(key) || 0;

  const DAILY_LIMIT = 100;
  if (count >= DAILY_LIMIT) {
    return {
      allowed: false,
      limit: DAILY_LIMIT,
      current: count,
      message:
        "Daily limit reached. Sign up for unlimited access or try again tomorrow.",
    };
  }
  // ...
}
```

**Limitações Atuais:**

- ⚠️ Rate limiting não distribuído (apenas em memória)
- ⚠️ Não funciona com múltiplas instâncias (Netlify Functions)
- ⚠️ Limpeza automática mas pode acumular em picos de tráfego

**Recomendação:** Migrar para Redis quando houver >100 guests/dia

### 4.7 Expiração e Cleanup de Guest Workspaces

**Localização:** `dashboard/lib/guest-auth.js`, `dashboard/schemas/index.js`

**Expiração:**

- **TTL Padrão:** 7 dias (`expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)`)
- **Validação:** Verificada em `isValidGuestSession()`
- **Auto-delete:** Workspaces expirados são deletados automaticamente

**Cleanup:**

```javascript
// Validação verifica expiração
if (new Date() > session.expires_at) {
  await db.deleteOne("guest_workspaces", { guest_id: guestId });
  return false;
}
```

**Segurança:**

- ✅ Workspaces expirados não são acessíveis
- ✅ Auto-delete previne acúmulo de dados
- ✅ Validação em todas as rotas guest
- ⚠️ Cleanup não está agendado (depende de acesso)

### 4.8 Feature Blocking para Guests

**Localização:** `dashboard/lib/guest-auth.js`

**Implementação:**

```javascript
export function canAccessFeature(auth, featureName) {
  // Usuário autenticado = acesso total
  if (auth.type === "user") {
    return { allowed: true };
  }

  // Guest = checar limites
  if (auth.isGuest && GUEST_LIMITS.blocked_features.includes(featureName)) {
    return {
      allowed: false,
      error: `This feature requires an account. "${featureName}" is not available in trial mode.`,
      upgrade_required: true,
    };
  }

  return { allowed: true };
}
```

**Features Bloqueadas:**

- `connect_crm` - Integração com CRM
- `upload_csv` - Upload em massa
- `bulk_prompts` - Prompts em lote
- `create_dashboard` - Criação de dashboards
- `custom_templates` - Templates customizados
- `add_team_members` - Adicionar membros à equipe

**Validação:**

- ✅ Verificação em rotas que acessam features bloqueadas
- ✅ Mensagem de erro clara com upgrade_required
- ✅ Frontend pode mostrar modal de upgrade

### 4.9 Segurança de Cookies Guest

**Localização:** `dashboard/app/api/guest/workspace/route.js` (cookies)

**Implementação:**

- **Cookie Name:** `guest_id`
- **Valor:** UUID v4 (ex: `guest_3793e739-4eb2-41e6-a6b2-ff329806c56d`)
- **Uso:** Identificação de sessão guest (quando não há job_id)

**Segurança:**

- ✅ Cookie não contém dados sensíveis (apenas ID)
- ✅ Validação sempre verifica existência no banco
- ✅ Não usado como único método de autenticação (sempre com token quando há job)
- ⚠️ Cookie não é httpOnly (pode ser acessado via JavaScript)

**Recomendação:** Considerar tornar cookie httpOnly para maior segurança

### 4.10 Segurança de Limitações de Uso

**Localização:** `dashboard/app/api/guest/add-company/route.js`, `dashboard/app/api/guest/templates/apply/route.js`

**Validação de Limites Antes de Operações:**

**1. Limite de Companies:**

```javascript
// Verificar limite antes de adicionar company
if (workspace.usage.companies_count >= workspace.limits.max_companies) {
  return NextResponse.json(
    {
      error: "Company limit reached",
      limit: workspace.limits.max_companies,
      current: workspace.usage.companies_count,
      remaining:
        workspace.limits.max_companies - workspace.usage.companies_count,
    },
    { status: 403 }
  );
}

// Incrementar contador após operação bem-sucedida
await db.updateOne(
  "guest_workspaces",
  { guest_id: guestId },
  {
    $set: {
      "usage.companies_count": workspace.usage.companies_count + 1,
      "usage.companies_remaining":
        workspace.limits.max_companies - (workspace.usage.companies_count + 1),
      "usage.last_activity": new Date(),
    },
  }
);
```

**2. Limite de Tiles por Company:**

- Máximo de 10 tiles por company (configurável)
- Validação antes de gerar tile customizado
- Contador `total_tiles_generated` incrementado automaticamente

**3. Limite de Templates:**

- Máximo de 5 templates customizados por workspace
- Validação antes de salvar template
- Contador `templates_created` incrementado

**Segurança das Limitações:**

- ✅ **Validação Server-Side:** Limites sempre verificados no backend
- ✅ **Incremento Atômico:** Contadores incrementados em operações atômicas
- ✅ **Mensagens Claras:** Erros 403 com detalhes de limite atingido
- ✅ **Impossível Bypass:** Frontend não pode ignorar limites
- ✅ **Auditoria:** `last_activity` atualizado em cada operação

**Proteção Contra Bypass:**

- Limites verificados em TODAS as rotas que criam recursos
- Validação antes de qualquer operação de escrita
- Contadores incrementados atomicamente (não pode haver race condition)
- Frontend apenas exibe mensagens, não controla limites

### 4.11 Monitoramento de Uso de Guests

**Localização:** `dashboard/app/api/guest/workspace/route.js`

**Métricas Rastreadas:**

```javascript
usage: {
  companies_count: 0,            // Número atual de companies
  companies_remaining: 3,        // Restante disponível
  total_tiles_generated: 0,      // Total de tiles gerados (histórico)
  templates_created: 0,          // Templates customizados criados
  last_activity: Date,            // Última atividade (usado para expiração)
}
```

**Atualização Automática:**

- ✅ Contadores incrementados em cada operação
- ✅ `last_activity` atualizado automaticamente
- ✅ Cálculo de `remaining` sempre atualizado
- ✅ Validação antes de qualquer operação

**Segurança:**

- ✅ Métricas não podem ser manipuladas pelo frontend
- ✅ Incremento atômico previne race conditions
- ✅ Validação server-side sempre verifica limites
- ✅ Histórico de uso preservado para auditoria

### 4.12 Conversão Guest → User

**Localização:** `dashboard/app/api/guest/convert/route.js`

**Processo:**

1. Usuário faz signup/login via Clerk
2. Frontend chama `POST /api/guest/convert`
3. Backend valida autenticação (deve estar logado)
4. Busca workspace guest pelo `guest_id` do cookie
5. Cria workspace real com dados do guest
6. Migra todos os dados (companies, tiles, templates)
7. Deleta workspace guest (ou marca como convertido)

**Segurança:**

- ✅ Requer autenticação Clerk (não pode ser guest)
- ✅ Validação de `guest_id` antes de converter
- ✅ Isolamento total (dados não acessíveis por outros guests)
- ✅ Migração atômica (tudo ou nada)

---

## 5. Tokens de Acesso Guest (Detalhamento)

### 5.1 Validação de Tokens

**Localização:** Todas as rotas `/api/guest/*` e `/api/streams/jobs/*`

**Processo:**

```javascript
// 1. Extrair token da query string
const token = searchParams.get("token");

// 2. Buscar job no banco
const job = await getJob(jobId);

// 3. Verificar guestId
if (job.guestId !== guestId) {
  return NextResponse.json({ error: "Guest ID mismatch" }, { status: 403 });
}

// 4. Verificar hash do token
const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
if (job.accessTokenHash !== tokenHash) {
  return NextResponse.json({ error: "Invalid token" }, { status: 403 });
}
```

**Rotas que Validam Token:**

- `/api/guest/workspace` - GET/PUT (quando `job_id` presente)
- `/api/guest/tiles` - POST/DELETE
- `/api/guest/notes` - GET/POST/PUT/DELETE
- `/api/guest/files` - GET/POST/DELETE
- `/api/guest/templates` - GET/POST
- `/api/guest/generate-custom-tile` - POST
- `/api/guest/reorder-tiles` - POST
- `/api/streams/jobs/[jobId]` - GET (SSE)

### 5.2 Segurança de Tokens

**✅ Implementado:**

- Tokens nunca armazenados em texto plano (apenas hash)
- Validação obrigatória em todas as rotas guest
- Verificação de `guestId` para prevenir acesso cruzado
- Tokens únicos por job (não reutilizáveis)

**⚠️ Considerações:**

- Tokens não expiram (mas podem ser invalidados deletando o job)
- Tokens enviados via query string (visíveis em logs)
- Considerar adicionar expiração opcional no futuro

---

## 6. Isolamento de Dados (Multi-Tenant)

### 6.1 Isolamento de Workspaces

**Usuários Autenticados:**

```javascript
// Sempre filtrar por ownerId ou members
const workspace = await db.findOne("workspaces", {
  $or: [{ ownerId: userId }, { "members.userId": userId }],
});
```

**Guest Users:**

```javascript
// Sempre filtrar por guest_id
const workspace = await db.findOne("guest_workspaces", {
  guest_id: guestId,
});
```

### 6.2 Isolamento de Jobs

**Verificação Dupla:**

```javascript
// 1. Verificar job existe
const job = await getJob(jobId);

// 2. Verificar job pertence ao guest/user
if (job.guestId !== guestId) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

### 6.3 Isolamento de Tiles

**Filtragem por Job:**

```javascript
// Tiles sempre filtrados por jobId
const tiles =
  workspace.workspace_data.companies
    .find((c) => c.name === companyName)
    ?.tiles.filter((t) => t.jobId === jobId) || [];
```

### 6.4 Isolamento de Entidades

**Padrão:**

```javascript
// Sempre verificar entidade pertence ao workspace correto
const company = workspace.workspace_data.companies.find(
  (c) => c.id === companyId || c.name === companyName
);

if (!company) {
  return NextResponse.json({ error: "Company not found" }, { status: 404 });
}
```

---

## 7. Validação de Input

### 7.1 Validação com Joi

**Localização:** Todas as rotas API

**Padrão:**

```javascript
import Joi from "joi";

const schema = Joi.object({
  templateId: Joi.string().required(),
  model: Joi.string().optional().default("o4-mini"),
  context: Joi.object({
    themeId: Joi.string().optional(),
    target: Joi.string().required().min(1),
    targetWebsite: Joi.string().uri().optional().allow(""),
  })
    .required()
    .unknown(true), // unknown(true) permite campos extras
});

const { error, value } = schema.validate(body);
if (error) {
  return NextResponse.json(
    { error: error.details[0].message },
    { status: 400 }
  );
}
```

### 7.2 Sanitização

**HTML Content:**

- Notas e conteúdo sanitizados com whitelist HTML
- Biblioteca: `sanitize-html` ou similar

**URLs:**

- Validação com `Joi.string().uri()`
- Protocolo adicionado automaticamente se ausente (`https://`)

**Strings:**

- `.trim()` aplicado em todos os inputs
- `.max(length)` para limitar tamanho

### 7.3 Validação de Tipos

**MongoDB ObjectIds:**

```javascript
import { ObjectId } from "mongodb";

try {
  const objectId = new ObjectId(resourceId);
  // Usar objectId na query
} catch (e) {
  return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
}
```

---

## 8. MongoDB Security

### 8.1 Conexão Segura

**Localização:** `dashboard/lib/db.js`

**Configuração:**

```javascript
const uri = process.env.MONGODB_URI; // MongoDB Atlas URI
// Formato: mongodb+srv://user:password@cluster.mongodb.net/database

const options = {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  retryWrites: true,
  retryReads: true,
};
```

**Segurança:**

- ✅ URI nunca exposta no código (apenas env vars)
- ✅ Conexão via TLS/SSL (MongoDB Atlas)
- ✅ Autenticação via username/password
- ✅ IP Whitelist configurado no MongoDB Atlas

### 8.2 Circuit Breaker

**Implementação:** `withMongoConnection`, `withMongoErrorHandler`

**Comportamento:**

- Após N falhas, abre circuito (retorna 503)
- Timeout de 15s para reabrir circuito
- Retry com backoff exponencial

**Uso:**

```javascript
await withMongoConnection(
  async () => {
    // Operação MongoDB
  },
  {
    label: "operation-name",
    retries: 3,
    metadata: {
      /* contexto */
    },
  }
);
```

### 8.3 Query Isolation

**Sempre usar filtros explícitos:**

```javascript
// ✅ CORRETO: Filtrar por userId
await db.find("workspaces", { ownerId: userId });

// ❌ ERRADO: Buscar sem filtro
await db.find("workspaces", {});
```

### 8.4 Prevenção de Injection

**MongoDB Driver:**

- Usa queries parametrizadas automaticamente
- `ObjectId` validação antes de usar em queries
- Evitar concatenação de strings em queries

**Exemplo Seguro:**

```javascript
// ✅ CORRETO
await db.findOne("workspaces", { _id: new ObjectId(workspaceId) });

// ❌ ERRADO (se workspaceId vier do usuário sem validação)
await db.findOne("workspaces", { _id: workspaceId });
```

---

## 9. Netlify Functions Security

### 9.1 Background Functions

**Localização:** `netlify/functions/process-job-background.js`

**Características:**

- Não têm timeout de 26s (podem rodar até 15 minutos)
- Executam em ambiente isolado
- Não expõem diretamente via HTTP (chamadas internas)

**Segurança:**

- Validar `jobId` antes de processar
- Verificar permissões do job
- Logs detalhados para auditoria

### 9.2 Standard Functions

**Timeout:** 26 segundos (padrão Netlify)

**Limitações:**

- Não devem fazer operações longas
- Usar background functions para jobs > 26s
- Implementar circuit breaker para MongoDB

### 9.3 Environment Variables

**Netlify Dashboard:**

- Variáveis secretas configuradas no Netlify Dashboard
- Não expostas no código do cliente
- Acessíveis apenas em server-side

### 9.4 NetlifyDB (Planejado)

**Status:** ⏳ Próximo passo arquitetural

**Separação de Responsabilidades:**

- **MongoDB Atlas:** Dados críticos e persistentes

  - Workspaces e usuários autenticados
  - Jobs e histórico de execuções
  - Tiles persistidos e metadata
  - Dados de billing e transações
  - Logs de auditoria

- **NetlifyDB (Futuro):** Dados de cache e sessão
  - Cache de templates e themes
  - Sessões temporárias de guest
  - Dados de workspace em memória (não críticos)
  - Cache de métricas e analytics

**Benefícios de Segurança:**

- Redução de carga no MongoDB (menos conexões)
- Isolamento de dados críticos vs temporários
- Melhor performance (NetlifyDB é mais rápido para leitura)
- Redução de custos (menos operações no MongoDB)

---

## 10. Frontend Security

### 10.1 XSS Prevention

**React:**

- Escapamento automático de conteúdo
- `dangerouslySetInnerHTML` apenas quando necessário
- Sanitização de HTML antes de renderizar

**Exemplo:**

```jsx
// ✅ CORRETO
<div>{userInput}</div>

// ⚠️ CUIDADO (sanitizar antes)
<div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
```

### 10.2 Secrets no Frontend

**❌ NUNCA:**

- Expor chaves secretas no código frontend
- Enviar tokens sensíveis em URLs públicas
- Armazenar tokens em localStorage sem criptografia

**✅ CORRETO:**

- Usar apenas chaves públicas (`NEXT_PUBLIC_*`)
- Tokens enviados via headers ou query params com validação
- Tokens armazenados em cookies httpOnly quando possível

### 10.3 CORS

**Next.js:**

- CORS configurado via middleware
- APIs públicas permitem origem específica
- Headers de segurança configurados

### 10.4 Content Security Policy

**Recomendado:**

- Configurar CSP headers no Netlify
- Restringir fontes de scripts e styles
- Prevenir XSS e clickjacking

---

## 11. Backend Security

### 11.1 Headers de Segurança

**Recomendado adicionar:**

```javascript
// Em todas as respostas
headers: {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000',
  'Content-Security-Policy': "default-src 'self'",
}
```

### 11.2 Error Handling

**Padrão:**

```javascript
try {
  // Operação
} catch (error) {
  // ❌ NUNCA expor detalhes do erro ao cliente
  console.error("[Internal] Erro detalhado:", error);

  // ✅ Retornar mensagem genérica
  return NextResponse.json({ error: "An error occurred" }, { status: 500 });
}
```

### 11.3 Logging Seguro

**❌ NUNCA logar:**

- Tokens ou senhas
- Dados sensíveis de usuários
- Stack traces completos em produção

**✅ CORRETO:**

```javascript
console.log("[API] Operação realizada:", {
  userId: userId, // OK
  workspaceId: workspaceId, // OK
  // token: token, // ❌ NUNCA
});
```

---

## 12. SSE (Server-Sent Events) Security

### 12.1 Autenticação SSE

**Localização:** `dashboard/app/api/streams/jobs/[jobId]/route.js`

**Processo:**

1. Validar `jobId`, `guestId`, `token` na query string
2. Verificar job existe e pertence ao guest
3. Verificar hash do token
4. Criar conexão SSE com chave única: `guest:${guestId}:job:${jobId}`

### 12.2 Isolamento de Eventos

**SSE Manager:**

- Eventos isolados por chave (`guest:${guestId}:job:${jobId}`)
- Cada conexão recebe apenas eventos do seu job
- Buffer de eventos para conexões tardias

**Segurança:**

- Chave única previne acesso cruzado
- Validação de token antes de criar conexão
- Conexões fechadas após conclusão do job

### 12.3 Keep-Alive

**Implementação:**

- Keep-alive a cada 20 segundos
- Previne timeout de conexões longas
- Comentários SSE (`: connected\n\n`) para manter conexão viva

---

## 13. Rate Limiting

### 13.1 Implementação Atual

**Localização:** `dashboard/lib/rate-limiter.js`, `dashboard/lib/simple-rate-limit.js`

**Status:** ⚠️ Parcialmente implementado

**Recomendações:**

- Implementar rate limiting em todas as rotas públicas
- Limitar por IP ou por `guestId`/`userId`
- Usar Redis ou similar para distribuição

### 13.2 Rotas que Precisam Rate Limit

**Prioridade Alta:**

- `/api/prompt-jobs` - Criação de jobs (guest e user)
- `/api/guest/*` - Todas as rotas guest
  - `/api/guest/add-company` - Limite de companies
  - `/api/guest/generate-custom-tile` - Limite de tiles
  - `/api/guest/templates/apply` - Limite de templates
  - `/api/guest/upload` - Limite de arquivos
- `/api/streams/jobs/*` - SSE connections
- `/api/guest/workspace` - GET/PUT (carregamento de dados)

**Limites Implementados:**

- ✅ **Por IP:** 10 requests/minuto (geral)
- ✅ **Por Guest ID:** 100 API calls/dia (rotas guest)
- ✅ **Por Job:** 1 job ativo por vez (implicito)
- ✅ **Por Company:** Máximo de tiles por company (10)

**Limites Sugeridos (Futuro):**

- 10 jobs por minuto por IP
- 100 requests por minuto por `guestId` (atual: 100/dia)
- 5 conexões SSE simultâneas por `guestId`
- 5 uploads por minuto por guest
- 10 custom tiles por dia por guest

---

## 14. Secrets Management

### 14.1 Environment Variables (Dotenv)

**Localização:** `.env.local` (local), Netlify Dashboard (produção)

**Camada de Segurança:**

- Next.js carrega `.env.local` automaticamente (não commita no git)
- Variáveis `NEXT_PUBLIC_*` são expostas no frontend (usar apenas chaves públicas)
- Variáveis sem prefixo são server-side apenas (nunca expostas)
- Validação no startup garante que variáveis críticas existem

**Variáveis Críticas:**

```bash
# Clerk (Autenticação)
CLERK_SECRET_KEY=sk_...                    # Server-side apenas
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...  # Frontend (pública)
DEV_USER_ID=...                            # Opcional (dev mode)

# MongoDB (Database)
MONGODB_URI=mongodb+srv://...              # Server-side apenas
MONGODB_CONNECT_RETRIES=3                  # Configuração de conexão
MONGODB_CIRCUIT_BREAKER_TIMEOUT_MS=15000   # Circuit breaker

# OpenAI (IA)
OPENAI_API_KEY=sk-...                      # Server-side apenas

# Stripe (Pagamentos)
STRIPE_SECRET_KEY=sk_...                   # Server-side apenas
STRIPE_WEBHOOK_SECRET=whsec_...           # Validação de webhooks
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_... # Frontend (pública)

# Cloudinary (Storage)
CLOUDINARY_CLOUD_NAME=...                  # Server-side apenas
CLOUDINARY_API_KEY=...                     # Server-side apenas
CLOUDINARY_API_SECRET=...                  # Server-side apenas

# GitHub/Netlify (Deploy)
GITHUB_TOKEN=ghp_...                       # Server-side apenas
NETLIFY_TOKEN=...                          # Server-side apenas

# Internal (APIs Internas)
INTERNAL_API_KEY=...                       # Server-side apenas
ADMIN_EXPORT_KEY=...                       # Server-side apenas
```

### 14.2 Rotação de Secrets

**Recomendações:**

- Rotar chaves a cada 90 dias
- Usar diferentes chaves para dev/staging/prod
- Nunca commitar secrets no git
- Usar `.gitignore` para `.env.local`

### 14.3 Validação de Secrets

**Startup:**

```javascript
// Validar variáveis críticas no startup
const requiredEnvVars = [
  "MONGODB_URI",
  "CLERK_SECRET_KEY",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`FATAL: ${envVar} não está definido`);
  }
}
```

---

## 15. Logging e Auditoria

### 15.1 Logs de Segurança

**Eventos a Logar:**

- Tentativas de autenticação falhadas
- Acesso negado (403)
- Tentativas de acesso a recursos não autorizados
- Erros de validação de token
- Tentativas de SQL injection ou XSS

**Formato:**

```javascript
console.log("[SECURITY] Acesso negado:", {
  timestamp: new Date().toISOString(),
  ip: req.headers.get("x-forwarded-for"),
  userId: userId || "guest",
  resource: resourcePath,
  reason: reason,
});
```

### 15.2 Logs de Auditoria

**Operações Críticas:**

- Criação de workspace
- Criação de job
- Modificação de tiles
- Acesso a dados sensíveis

**Armazenamento:**

- Considerar collection dedicada para auditoria
- Logs não devem conter dados sensíveis
- Retenção de logs por período definido

---

## 16. Checklist de Segurança

### 16.1 Autenticação

- [x] Clerk middleware configurado
- [x] Rotas públicas definidas
- [x] Validação de token guest implementada
- [x] Verificação de `guestId` em todas as rotas guest
- [x] Hash de tokens (SHA-256) armazenado

### 16.2 Autorização

- [x] Isolamento de workspaces por `ownerId`
- [x] Isolamento de guest workspaces por `guest_id`
- [x] Verificação de permissões em operações críticas
- [x] Validação de `jobId` e `guestId` em SSE

### 16.3 Validação

- [x] Joi validation em todas as rotas
- [x] Sanitização de HTML
- [x] Validação de URLs
- [x] Validação de ObjectIds

### 16.4 MongoDB

- [x] Conexão segura (TLS/SSL)
- [x] Circuit breaker implementado
- [x] Query isolation (filtros por userId/guestId)
- [x] Prevenção de injection (queries parametrizadas)

### 16.5 Frontend

- [x] XSS prevention (React escaping)
- [x] Secrets não expostos no código
- [ ] CSP headers configurados (recomendado)
- [ ] Rate limiting visual (recomendado)

### 16.6 Backend

- [x] Error handling seguro
- [x] Logging seguro (sem secrets)
- [ ] Headers de segurança (recomendado)
- [ ] Rate limiting implementado (parcial)

### 16.7 SSE

- [x] Autenticação antes de criar conexão
- [x] Isolamento de eventos por chave
- [x] Keep-alive implementado
- [x] Validação de token em cada conexão

### 16.8 Secrets

- [x] Environment variables para secrets
- [x] `.gitignore` para `.env.local`
- [x] Validação de env vars no startup
- [x] Dotenv como camada de segurança (Next.js)
- [x] Separação entre `NEXT_PUBLIC_*` e variáveis server-side
- [ ] Rotação de secrets (processo manual)

### 16.9 Serviços Terceiros

### 16.10 Guest Users

- [x] Sistema de trial completo implementado
- [x] Isolamento por `guest_id` em todas as rotas
- [x] Tokens únicos por job (SHA-256 hash)
- [x] Limites de uso implementados (companies, tiles, API calls)
- [x] Rate limiting por IP e por `guest_id`
- [x] Expiração automática de workspaces (7 dias)
- [x] Feature blocking para features avançadas
- [x] Validação de limites antes de operações
- [x] Conversão guest → user segura
- [ ] Cleanup agendado de workspaces expirados (recomendado)
- [ ] Rate limiting distribuído (Redis) para guests

- [x] OpenAI API key protegida (server-side apenas)
- [x] Cloudinary credentials protegidas (server-side apenas)
- [x] Stripe webhook secret validation
- [x] Clerk secret key protegida
- [x] GitHub/Netlify tokens protegidos (deploys)
- [ ] Rate limiting por serviço terceiro (parcial)

---

## 17. Serviços Terceiros e Integrações

### 17.1 OpenAI API

**Localização:** `dashboard/lib/ai/provider.js`

**Segurança:**

- ✅ API key armazenada em `process.env.OPENAI_API_KEY` (server-side)
- ✅ Nunca exposta no frontend ou logs
- ✅ Rate limiting implementado (1 request/segundo)
- ✅ Retry com backoff exponencial
- ✅ Validação de modelo antes de chamar API

**Limitações:**

- Max tokens configurado por modelo
- Timeout de 60s por requisição
- Retry automático até 3 tentativas

### 17.2 Cloudinary

**Localização:** `dashboard/lib/cloudinary.js`, `dashboard/app/api/guest/upload/route.js`

**Segurança:**

- ✅ Credentials em `process.env.CLOUDINARY_*` (server-side)
- ✅ Validação de token antes de upload
- ✅ Validação de tipo de arquivo (base64)
- ✅ Organização por workspace/company (isolamento)
- ✅ Uploads vinculados a `jobId` e `guestId`

**Limitações:**

- Tamanho máximo de arquivo (configurado no Cloudinary)
- Tipos de arquivo permitidos (whitelist)
- Rate limiting do Cloudinary (respeitado)

### 17.3 Stripe

**Localização:** Rotas de billing e webhooks

**Segurança:**

- ✅ Secret key em `process.env.STRIPE_SECRET_KEY` (server-side)
- ✅ Webhook secret validation (`STRIPE_WEBHOOK_SECRET`)
- ✅ Verificação de assinatura em todos os webhooks
- ✅ Pagamentos processados server-side apenas

**Webhook Security:**

```javascript
// Validação de webhook signature
const signature = req.headers["stripe-signature"];
const event = stripe.webhooks.constructEvent(
  req.body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

### 17.4 GitHub e Netlify (Deploy)

**Localização:** `dashboard/lib/deployment/`

**Segurança:**

- ✅ Tokens armazenados em env vars (server-side)
- ✅ Validação de permissões antes de deploy
- ✅ Webhook signature validation (Netlify)
- ✅ Rate limiting para deploys (5 por hora)

**Limitações:**

- GitHub token precisa de permissões específicas
- Netlify token com escopo limitado
- Deploys validados por workspace ownership

### 17.5 API Keys Internas

**Localização:** `dashboard/lib/api-key-auth.js`

**Implementação:**

- Hash SHA-256 armazenado no banco (nunca o token original)
- Validação via header `Authorization: Bearer <token>`
- Keys associadas a workspaces
- Status ativo/inativo configurável

**Uso:**

```javascript
// Validação em rotas protegidas
const { key, error } = await requireApiKey(request);
if (error) {
  return NextResponse.json({ error }, { status: 401 });
}
```

### 17.6 Webhooks Security

**Localização:** `dashboard/app/api/deploy/webhook/route.js`

**Validação:**

- Verificação de signature (Stripe, Netlify)
- Headers de segurança (`X-Webhook-Signature`)
- Validação de payload antes de processar
- Rate limiting por IP de origem

**Padrão:**

```javascript
// Validar signature antes de processar
const signature = req.headers.get("x-webhook-signature");
const isValid = validateSignature(payload, signature, secret);
if (!isValid) {
  return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
}
```

---

## 18. Melhorias Futuras

### 16.1 Prioridade Alta

1. **Rate Limiting Completo**

   - Implementar em todas as rotas públicas
   - Usar Redis para distribuição
   - Limites por IP e por usuário

2. **CSP Headers**

   - Configurar Content Security Policy
   - Prevenir XSS e clickjacking
   - Configurar no Netlify

3. **Expiração de Tokens Guest**
   - Adicionar campo `expiresAt` em jobs
   - Invalidar tokens expirados
   - Limitar tempo de vida de tokens

### 16.2 Prioridade Média

4. **Auditoria Completa**

   - Collection dedicada para logs de auditoria
   - Dashboard de monitoramento
   - Alertas para atividades suspeitas

5. **2FA (Two-Factor Authentication)**

   - Implementar via Clerk
   - Obrigatório para admin
   - Opcional para usuários

6. **WAF (Web Application Firewall)**
   - Configurar no Netlify
   - Proteção contra DDoS
   - Filtros de requisições maliciosas

### 16.3 Prioridade Baixa

7. **Encryption at Rest**

   - Criptografar dados sensíveis no MongoDB
   - Chaves de criptografia rotacionadas

8. **Penetration Testing**
   - Testes periódicos de segurança
   - Relatórios de vulnerabilidades
   - Correção de issues encontrados

---

## 20. Contatos de Segurança

**Em caso de vulnerabilidade identificada:**

1. **Não** reportar em issues públicos
2. Contatar time de desenvolvimento diretamente
3. Fornecer detalhes da vulnerabilidade
4. Aguardar correção antes de divulgar

---

## 21. Referências

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [Clerk Security](https://clerk.com/docs/security)
- [MongoDB Security](https://www.mongodb.com/docs/manual/security/)
- [Netlify Security](https://docs.netlify.com/security/overview/)

---

---

## 22. Resumo Arquitetural de Segurança

### 22.1 Camadas de Proteção

1. **Frontend (Next.js)**

   - React XSS protection automático
   - Client/Server Components isolados
   - Environment variables separadas (`NEXT_PUBLIC_*`)

2. **Middleware (Clerk)**

   - JWT validation via JWKS
   - Route protection automático
   - Public route whitelist

3. **API Routes (Next.js)**

   - Token validation (guest)
   - Clerk authentication (users)
   - Joi input validation
   - Multi-tenant isolation

4. **Database (MongoDB)**

   - TLS/SSL connection
   - Query parametrization
   - Circuit breaker
   - IP whitelist

5. **Services (Third-party)**
   - API keys server-side apenas
   - Webhook signature validation
   - Rate limiting por serviço

### 22.2 Fluxo de Autenticação

**Guest Mode Completo:**

```
Home (/)
  → Preenche formulário (validação client-side)
  → POST /api/prompt-jobs (validação Joi, gera token SHA-256)
  → Retorna { jobId, guestId, token }
  → Redireciona para /admin?job_id=...&guest_id=...&token=...

Admin (/admin)
  → Lê parâmetros da URL
  → GET /api/guest/workspace?job_id=...&token=... (valida token)
  → GET /api/streams/jobs/[jobId]?guest_id=...&token=... (valida token)
  → SSE conectado, eventos isolados por chave única
  → Tiles gerados e persistidos no backend
  → Frontend recebe atualizações em tempo real
```

**Limitações Aplicadas:**

- Rate limiting por IP (10/min) e por guest_id (100/dia)
- Limite de companies (max 2-3)
- Limite de tiles por company (max 10)
- Feature blocking (features avançadas bloqueadas)
- Expiração automática (7 dias)

**Guest Mode:**

```
Home → POST /api/prompt-jobs → Gera token (SHA-256) → Salva hash no DB
Admin → GET /api/streams/jobs?token=... → Valida hash → SSE conectado
```

**Authenticated Mode:**

```
Login → Clerk JWT → Middleware valida → getCurrentAuth() → userId
API Route → Verifica ownerId/members → Access Engine → Permissão
```

### 22.3 Isolamento de Dados

**Guest Users Específico:**

- Workspace isolado por `guest_id` único (UUID v4)
- Jobs isolados por `jobId` + `guestId` + `token`
- Tiles filtrados por `jobId` (isolamento adicional)
- SSE isolado por chave: `guest:${guestId}:job:${jobId}`
- Validação tripla em todas as rotas: jobId + guestId + token
- Expiração automática após 7 dias
- Auto-delete de workspaces expirados

**Por Workspace:**

- Filtro obrigatório: `ownerId` ou `members.userId`
- Acesso negado se não for owner/member

**Por Guest:**

- Filtro obrigatório: `guest_id`
- Token validation por job
- Isolamento por `jobId` em tiles

**Por Job:**

- Tiles filtrados por `jobId`
- SSE isolado por chave única
- Tokens únicos e não reutilizáveis

---

**Documento mantido por:** Time de Desenvolvimento  
**Revisões:** A cada mudança significativa de segurança  
**Próxima Revisão:** Quando houver mudanças arquiteturais ou migração para NetlifyDB
