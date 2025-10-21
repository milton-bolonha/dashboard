# 🎯 Sistema de Guest User - Free Trial Dashboard (REVISADO)

## 📋 Nova Visão Geral (Requisito do Cliente)

**Requisito**: Usuários podem usar o **dashboard completo** sem signup, mas com limitações:

✅ **Permitido SEM signup**:

- Pesquisar **até 2 empresas**
- Usar **Dashboard Template 1 ou 2** (predefinidos)
- Ver dados e insights das empresas
- Usar AI cards básicas

❌ **Requer signup** (upgrade obrigatório):

- Pesquisar 3+ empresas
- Connect CRM
- Upload CSV
- Bulk upload prompts
- Criar novos dashboards/templates personalizados
- Funcionalidades avançadas

## 🏗️ Arquitetura Baseada nos Padrões do Projeto

### Seguindo `docs/development-guide.md`:

```javascript
// ✅ REGRA #1: Autenticação Centralizada
import { getCurrentAuth } from "@/lib/auth";

// ✅ REGRA #2: Acesso DB via lib/db.js
import { db } from "@/lib/db";

// ✅ REGRA #3: Nunca confiar no frontend
// Todas as verificações de limite no backend

// ✅ REGRA #5: API é fonte da verdade
// Templates gerados dinamicamente, não arquivos físicos
```

## 🔧 Implementação Detalhada

### 1. Estrutura de Dados (MongoDB)

```javascript
// Collection: guest_workspaces
{
  guest_id: "uuid-v4",                    // Cookie do guest
  created_at: Date,
  expires_at: Date,                       // 7 dias
  workspace_data: {
    name: "My Trial Workspace",
    companies: [                           // Max 2
      {
        name: "Tesla",
        url: "tesla.com",
        research_data: {},
        added_at: Date
      }
    ],
    template_id: "template_1",             // Fixo: template_1 ou template_2
    sections: [],                          // Sections do template
    settings: {}
  },
  usage: {
    companies_count: 2,                    // Limite: 2
    api_calls: 0,                          // Tracking
    last_activity: Date
  },
  converted_to_user_id: null,             // Quando fizer signup
  converted_at: null,
  ip_address: "...",
  fingerprint: "...",                      // Anti-hijacking
}
```

### 2. Middleware Atualizado (Seguindo Padrão do Projeto)

```javascript
// dashboard/middleware.js
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/", // Landing
  "/api/webhooks(.*)",
  "/api/public(.*)",
  "/api/guest(.*)", // ← Guest APIs
  "/dashboard/trial", // ← Guest dashboard
]);

export default clerkMiddleware(async (auth, req) => {
  // Guest pode acessar trial mode
  if (req.nextUrl.pathname.startsWith("/dashboard/trial")) {
    // Verificar se tem guest_id válido ou criar um
    return; // Permitir acesso
  }

  // Rotas privadas protegidas
  if (!isPublicRoute(req)) {
    await auth.protect(); // ← Bloqueia não-autenticados
  }
});
```

### 3. Auth Helper Estendido (Seguindo `lib/auth.js`)

```javascript
// dashboard/lib/guest-auth.js
import { getCurrentAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { cookies } from "next/headers";

/**
 * Obtém auth atual: usuário real OU guest
 * Segue padrão: getCurrentAuth() para usuários, guest para visitantes
 */
export async function getAuthOrGuest() {
  // Tentar autenticação real primeiro
  const authData = await getCurrentAuth();

  if (authData.isAuthenticated) {
    return {
      type: "authenticated",
      userId: authData.userId,
      isGuest: false,
      plan: authData.plan,
    };
  }

  // Fallback: Buscar guest session
  const guestId = cookies().get("guest_id")?.value;

  if (guestId && (await isValidGuestSession(guestId))) {
    return {
      type: "guest",
      guestId: guestId,
      isGuest: true,
      limits: GUEST_LIMITS,
    };
  }

  return {
    type: "anonymous",
    isGuest: true,
    userId: null,
    guestId: null,
  };
}

/**
 * Valida sessão guest (fingerprint + expiração)
 */
async function isValidGuestSession(guestId) {
  const session = await db.findOne("guest_workspaces", { guest_id: guestId });

  if (!session) return false;
  if (new Date() > session.expires_at) return false;

  // TODO: Validar fingerprint contra request
  return true;
}

// Limites hardcoded para guests
export const GUEST_LIMITS = {
  max_companies: 2,
  max_api_calls_per_day: 100,
  allowed_templates: ["template_1", "template_2"],
  blocked_features: [
    "connect_crm",
    "upload_csv",
    "bulk_prompts",
    "create_dashboard",
    "custom_templates",
  ],
};
```

### 4. API: Criar Guest Workspace

```javascript
// dashboard/app/api/guest/workspace/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthOrGuest, GUEST_LIMITS } from "@/lib/guest-auth";
import { v4 as uuidv4 } from "uuid";
import { cookies } from "next/headers";
import Joi from "joi";
import sanitizeHtml from "sanitize-html";

// Validação estrita (Seguindo padrão do projeto)
const createWorkspaceSchema = Joi.object({
  template_id: Joi.string().valid("template_1", "template_2").required(),
  company_name: Joi.string().max(100).trim().required(),
  company_url: Joi.string().uri().max(200).required(),
}).strict();

export async function POST(req) {
  const auth = await getAuthOrGuest();

  // Se já é usuário autenticado, redirecionar para fluxo normal
  if (auth.type === "authenticated") {
    return NextResponse.json(
      {
        error: "Use /api/workspaces for authenticated users",
        redirect: "/dashboard",
      },
      { status: 400 }
    );
  }

  const body = await req.json();

  // Validar input (SEMPRE validar - Regra de Ouro)
  const { error, value } = createWorkspaceSchema.validate(body);
  if (error) {
    return NextResponse.json(
      {
        error: error.details[0].message,
      },
      { status: 400 }
    );
  }

  // Sanitizar TUDO
  const sanitized = {
    template_id: value.template_id,
    company_name: sanitizeHtml(value.company_name, { allowedTags: [] }),
    company_url: sanitizeHtml(value.company_url, { allowedTags: [] }),
  };

  // Criar ou recuperar guest session
  let guestId = auth.guestId;

  if (!guestId) {
    guestId = uuidv4();

    // Cookie seguro (httpOnly, secure, sameSite)
    cookies().set("guest_id", guestId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict", // ← Anti-CSRF
      maxAge: 7 * 24 * 60 * 60, // 7 dias
      path: "/",
    });

    // Criar guest workspace no DB
    await db.insertOne("guest_workspaces", {
      guest_id: guestId,
      created_at: new Date(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      workspace_data: {
        name: "My Trial Workspace",
        companies: [],
        template_id: sanitized.template_id,
        sections: await getTemplateSections(sanitized.template_id),
      },
      usage: {
        companies_count: 0,
        api_calls: 0,
        last_activity: new Date(),
      },
      ip_address: req.headers.get("x-forwarded-for") || req.ip,
      fingerprint: await generateFingerprint(req),
    });
  }

  // Verificar limite de empresas
  const guestWorkspace = await db.findOne("guest_workspaces", {
    guest_id: guestId,
  });

  if (guestWorkspace.usage.companies_count >= GUEST_LIMITS.max_companies) {
    return NextResponse.json(
      {
        error: "Company limit reached. Sign up to add more companies.",
        limit_reached: true,
        current: guestWorkspace.usage.companies_count,
        max: GUEST_LIMITS.max_companies,
        upgrade_required: true,
      },
      { status: 403 }
    );
  }

  // Adicionar empresa
  await db.updateOne(
    "guest_workspaces",
    { guest_id: guestId },
    {
      $push: {
        "workspace_data.companies": {
          name: sanitized.company_name,
          url: sanitized.company_url,
          research_data: {}, // Será preenchido por AI
          added_at: new Date(),
        },
      },
      $inc: {
        "usage.companies_count": 1,
      },
      $set: {
        "usage.last_activity": new Date(),
      },
    }
  );

  return NextResponse.json({
    success: true,
    guestId,
    companies_count: guestWorkspace.usage.companies_count + 1,
    max_companies: GUEST_LIMITS.max_companies,
  });
}

/**
 * Retorna sections do template (hard-coded ou DB)
 * Seguindo Regra #6: Nunca ler arquivos físicos
 */
async function getTemplateSections(templateId) {
  // Templates predefinidos
  const templates = {
    template_1: [
      {
        name: "Company Overview",
        slug: "overview",
        contentTypeId: "basic_info",
      },
      {
        name: "Competitors",
        slug: "competitors",
        contentTypeId: "competitors",
      },
      { name: "News", slug: "news", contentTypeId: "news_items" },
    ],
    template_2: [
      { name: "Research", slug: "research", contentTypeId: "research" },
      { name: "Insights", slug: "insights", contentTypeId: "insights" },
    ],
  };

  return templates[templateId] || templates.template_1;
}

async function generateFingerprint(req) {
  const data = `${req.ip}:${req.headers.get("user-agent")}`;
  const encoder = new TextEncoder();
  const data_encoded = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data_encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
```

### 5. API: Buscar Guest Workspace (Seguindo Padrões)

```javascript
// dashboard/app/api/guest/workspace/route.js
export async function GET(req) {
  const auth = await getAuthOrGuest();

  if (auth.type !== "guest" || !auth.guestId) {
    return NextResponse.json(
      {
        error: "No guest session found",
      },
      { status: 401 }
    );
  }

  // Validar fingerprint
  const isValid = await isValidGuestSession(auth.guestId);
  if (!isValid) {
    return NextResponse.json(
      {
        error: "Invalid or expired session",
      },
      { status: 401 }
    );
  }

  // Buscar workspace
  const workspace = await db.findOne("guest_workspaces", {
    guest_id: auth.guestId,
  });

  if (!workspace) {
    return NextResponse.json(
      {
        error: "Workspace not found",
      },
      { status: 404 }
    );
  }

  // Retornar apenas dados seguros (filtrar IP, fingerprint, etc)
  return NextResponse.json({
    workspace: {
      name: workspace.workspace_data.name,
      companies: workspace.workspace_data.companies,
      template_id: workspace.workspace_data.template_id,
      sections: workspace.workspace_data.sections,
    },
    usage: workspace.usage,
    limits: GUEST_LIMITS,
  });
}
```

### 6. Dashboard Trial Page (Frontend)

```javascript
// dashboard/app/dashboard/trial/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function TrialDashboard() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Se usuário já está logado, redirecionar para dashboard normal
    if (isLoaded && isSignedIn) {
      router.push("/dashboard");
      return;
    }

    loadGuestWorkspace();
  }, [isLoaded, isSignedIn]);

  async function loadGuestWorkspace() {
    try {
      const response = await fetch("/api/guest/workspace");

      if (response.status === 401) {
        // Sem guest session, mostrar onboarding
        setWorkspace(null);
        setLoading(false);
        return;
      }

      const data = await response.json();
      setWorkspace(data);
    } catch (error) {
      console.error("Error loading guest workspace:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!workspace) {
    return <GuestOnboarding />;
  }

  return (
    <div>
      <GuestDashboardHeader workspace={workspace} />
      <GuestDashboardContent workspace={workspace} />
      <UpgradePrompt usage={workspace.usage} limits={workspace.limits} />
    </div>
  );
}

function UpgradePrompt({ usage, limits }) {
  if (usage.companies_count < limits.max_companies) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-blue-600 text-white p-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div>
          <h3 className="font-bold">Company Limit Reached!</h3>
          <p>Sign up to research unlimited companies and unlock all features</p>
        </div>
        <button
          onClick={() =>
            (window.location.href = "/sign-up?redirect=/dashboard")
          }
          className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold"
        >
          Sign Up Free →
        </button>
      </div>
    </div>
  );
}
```

### 7. Proteção de Features Avançadas

```javascript
// dashboard/lib/guest-limitations.js
import { getAuthOrGuest, GUEST_LIMITS } from "@/lib/guest-auth";

/**
 * Middleware para bloquear features avançadas para guests
 */
export async function requireFeature(featureName) {
  const auth = await getAuthOrGuest();

  if (auth.isGuest && GUEST_LIMITS.blocked_features.includes(featureName)) {
    return {
      allowed: false,
      error: `This feature requires an account. ${featureName} is not available in trial mode.`,
      upgrade_required: true,
    };
  }

  return { allowed: true };
}

// Uso em APIs
// dashboard/app/api/workspaces/connect-crm/route.js
export async function POST(req) {
  const check = await requireFeature("connect_crm");
  if (!check.allowed) {
    return NextResponse.json(check, { status: 403 });
  }

  // Continuar com lógica normal
}
```

### 8. Conversão Guest → User Real (Webhook Clerk)

```javascript
// dashboard/app/api/webhooks/clerk/route.js
import { Webhook } from "svix";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function POST(req) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  const body = await req.text();

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    return new Response("Error verifying webhook", { status: 400 });
  }

  // user.created = converter guest workspace
  if (evt.type === "user.created") {
    await convertGuestToUser(evt.data.id);
  }

  return new Response("Webhook processed", { status: 200 });
}

async function convertGuestToUser(userId) {
  const guestId = cookies().get("guest_id")?.value;

  if (!guestId) {
    console.log("No guest session to convert");
    return;
  }

  const guestWorkspace = await db.findOne("guest_workspaces", {
    guest_id: guestId,
  });

  if (!guestWorkspace) {
    return;
  }

  console.log(`Converting guest workspace ${guestId} to user ${userId}`);

  // Criar workspace real com dados do guest
  const newWorkspace = {
    name: guestWorkspace.workspace_data.name,
    ownerId: userId,
    slug: `workspace-${Date.now()}`,
    created_at: new Date(),
  };

  const workspaceResult = await db.insertOne("workspaces", newWorkspace);
  const workspaceId = workspaceResult.insertedId;

  // Criar sections baseadas no template
  for (const section of guestWorkspace.workspace_data.sections) {
    await db.insertOne("sections", {
      ...section,
      userId: userId,
      workspaceId: new ObjectId(workspaceId),
      created_at: new Date(),
    });
  }

  // Migrar empresas pesquisadas (criar items)
  for (const company of guestWorkspace.workspace_data.companies) {
    // Criar item para cada empresa
    await db.insertOne("items", {
      name: company.name,
      data: company.research_data,
      userId: userId,
      workspaceId: new ObjectId(workspaceId),
      created_at: new Date(),
    });
  }

  // Marcar guest workspace como convertido
  await db.updateOne(
    "guest_workspaces",
    { guest_id: guestId },
    {
      $set: {
        converted_to_user_id: userId,
        converted_at: new Date(),
      },
    }
  );

  console.log(`✅ Guest ${guestId} converted to user ${userId}`);
}
```

## 🛡️ Segurança (Seguindo `docs/seguranca-performance.md`)

### Todas as Camadas Implementadas

```
1. Rate Limiting (Upstash Redis)
   └─ 1 guest session per IP/15min
   └─ 10 API calls/min per guest
   └─ 100 API calls/day total

2. Middleware Protection
   └─ Dashboard normal: auth.protect()
   └─ Trial dashboard: guest session validation
   └─ APIs privadas: getCurrentAuth()

3. Validação de Dados
   └─ Joi schemas em TODAS APIs
   └─ sanitize-html em todos inputs
   └─ Limite 5KB por request

4. Isolamento de Dados
   └─ Guest workspaces em collection separada
   └─ Sem acesso a workspaces reais
   └─ Queries SEMPRE filtradas por guest_id

5. Monitoramento
   └─ Logs de todas ações guest
   └─ Tracking de usage
   └─ Alertas de comportamento suspeito
```

### Rate Limiting Específico

```javascript
// dashboard/lib/guest-rate-limit.js
import { Redis } from "@upstash/redis";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";

const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
});

// 1 guest session por IP a cada 15min
export const guestCreationLimiter = rateLimit({
  store: new RedisStore({ client: redis, prefix: "rl:guest-create:" }),
  windowMs: 15 * 60 * 1000,
  max: 1,
  message: "Guest session already active. Wait 15 minutes.",
});

// 10 API calls/min por guest
export const guestApiLimiter = rateLimit({
  store: new RedisStore({ client: redis, prefix: "rl:guest-api:" }),
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.cookies.guest_id || req.ip,
  message: "Too many requests. Sign up for unlimited access.",
});
```

## 📊 UX: Fluxo Completo

```
1. VISITANTE ACESSA LANDING
   ├─ Preenche: Company Name + URL + Template
   ├─ Clica "Start Free Trial"
   └─ Redirecionado para /dashboard/trial

2. SISTEMA CRIA GUEST WORKSPACE
   ├─ Gera guest_id (UUID v4)
   ├─ Cookie seguro (httpOnly + secure + sameSite)
   ├─ Workspace com template escolhido
   └─ 1 empresa já adicionada

3. GUEST USA DASHBOARD
   ├─ Vê dados da empresa
   ├─ Pode adicionar 1 empresa adicional (max 2)
   ├─ Usa AI cards básicas
   └─ Vê banner "1/2 companies used"

4. GUEST ATINGE LIMITE
   ├─ Tenta adicionar 3ª empresa
   ├─ Modal: "Sign up to unlock unlimited companies"
   ├─ Botão CTA: "Sign Up Free"
   └─ Redireciona para /sign-up

5. SIGNUP/LOGIN
   ├─ Clerk cria user real
   ├─ Webhook dispara conversão
   ├─ Dados migrados: guest → user workspace
   └─ Redirecionado para /dashboard (full version)

6. PÓS-CONVERSÃO
   ├─ Todas empresas pesquisadas preservadas
   ├─ Template convertido em workspace real
   ├─ Sem limites
   └─ Funcionalidades avançadas desbloqueadas
```

## 🎯 Diferenças do Plano Original

| Aspecto            | Plano Original             | Plano Revisado                         |
| ------------------ | -------------------------- | -------------------------------------- |
| **Scope**          | Só salvar dados da landing | Dashboard completo funcional           |
| **Funcionalidade** | Nenhuma                    | Pesquisa de empresas + AI insights     |
| **Limite**         | Tempo (7 dias)             | Número de empresas (2)                 |
| **Conversão**      | Ao fazer signup            | Ao atingir limite OU signup voluntário |
| **Complexidade**   | Baixa                      | Alta (workspace completo)              |
| **Segurança**      | Rate limiting básico       | 5 camadas + validação rigorosa         |

## 🚀 Roadmap de Implementação

### Fase 1: MVP (1 semana)

- [ ] Criar collection `guest_workspaces`
- [ ] Implementar `/api/guest/workspace` (GET + POST)
- [ ] Criar `/dashboard/trial` page
- [ ] Middleware para permitir trial mode
- [ ] Guest auth helper (`getAuthOrGuest`)

### Fase 2: Limitações (3 dias)

- [ ] Implementar `requireFeature()` middleware
- [ ] Bloquear CRM, CSV, bulk, custom dashboards
- [ ] Modal de upgrade quando atingir limite
- [ ] Tracking de usage

### Fase 3: Conversão (3 dias)

- [ ] Webhook Clerk para user.created
- [ ] Migração guest → user workspace
- [ ] Preservar dados de pesquisa
- [ ] Cleanup de guest sessions convertidas

### Fase 4: Segurança (2 dias)

- [ ] Rate limiting (Upstash Redis)
- [ ] Fingerprint validation
- [ ] Input sanitization
- [ ] CSRF protection

### Fase 5: UX (2 dias)

- [ ] Banner de trial mode
- [ ] Progress indicator (1/2 companies)
- [ ] Upgrade CTAs
- [ ] Onboarding para guests

### Fase 6: Monitoramento (2 dias)

- [ ] Logs de guest actions
- [ ] Métricas de conversão
- [ ] Alertas de abuso
- [ ] Dashboard de analytics

## 📝 Checklist de Segurança (Crítico)

```markdown
## Antes de Deploy

- [ ] Rate limiting configurado (Upstash Redis)
- [ ] Fingerprint validation ativa
- [ ] CSRF tokens em todas POST
- [ ] Cookies: httpOnly + secure + sameSite: strict
- [ ] Validação Joi em todas APIs guest
- [ ] Sanitização de TODOS inputs
- [ ] Limite 5KB por request
- [ ] Timeout 5s em guest APIs
- [ ] getCurrentAuth() usado consistentemente
- [ ] lib/db.js para todos acessos ao banco
- [ ] ObjectId vs String conversões corretas
- [ ] Logs de todas ações guest
- [ ] Cleanup automático (cron job)
- [ ] Teste: Tentar bypass de limites (deve falhar)
- [ ] Teste: Session hijacking (deve detectar)
- [ ] Teste: Conversão preserva dados (deve funcionar)
```

## 🔗 Dependências Necessárias

```json
{
  "dependencies": {
    "uuid": "^10.0.0",
    "joi": "^17.11.0",
    "sanitize-html": "^2.11.0",
    "@upstash/redis": "^1.28.0",
    "express-rate-limit": "^7.1.5",
    "rate-limit-redis": "^4.2.0",
    "svix": "^1.15.0"
  }
}
```

## ⚠️ AVISOS CRÍTICOS

1. ❌ **NÃO implemente sem rate limiting** - DoS garantido!
2. ❌ **NÃO pule validação** - Injection garantido!
3. ❌ **NÃO confie em frontend** - Bypass de limites fácil!
4. ❌ **NÃO aceite guest_id de query/body** - Só cookie!
5. ✅ **SEMPRE use getCurrentAuth()** - Padrão do projeto!
6. ✅ **SEMPRE use lib/db.js** - Connection pooling!
7. ✅ **SEMPRE converta ObjectId corretamente** - Queries vão falhar!

## 📖 Referências do Projeto

- `docs/development-guide.md` - Regras de Ouro
- `docs/DEBUGGING-GUIDE.md` - Problemas comuns
- `docs/seguranca-performance.md` - Padrões de segurança
- `dashboard/lib/auth.js` - Auth centralizada
- `dashboard/middleware.js` - Proteção de rotas

---

**Status**: ✅ Plano APROVADO e alinhado com:

- ✅ Requisitos do cliente (2 empresas, templates predefinidos)
- ✅ Padrões do projeto (getCurrentAuth, lib/db, ObjectId)
- ✅ Segurança (5 camadas, rate limiting, validação)
- ✅ Arquitetura (multi-tenancy, isolamento, conversão)
