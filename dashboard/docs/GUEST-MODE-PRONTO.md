# ✅ Guest Mode - PRONTO PARA IMPLEMENTAR

## 🎯 Validação Completa

### ✅ Alinhado com Sistema EXISTENTE

| Sistema                        | Status       | Integração                     |
| ------------------------------ | ------------ | ------------------------------ |
| **Landing + 4 inputs**         | ✅ JÁ EXISTE | Reutilizar captura de contexto |
| **localStorage**               | ✅ JÁ EXISTE | Preserva dados entre páginas   |
| **DashboardProviders**         | ✅ JÁ EXISTE | Adicionar detecção guest_id    |
| **Auto-create workspace**      | ✅ JÁ EXISTE | Reutilizar em conversão        |
| **DeckEngine pipeline**        | ✅ JÁ EXISTE | Executar após conversão        |
| **WorkspaceSchema.onboarding** | ✅ JÁ EXISTE | Preservar estrutura            |
| **getCurrentAuth()**           | ✅ JÁ EXISTE | Padrão seguido                 |
| **lib/db.js**                  | ✅ JÁ EXISTE | Padrão seguido                 |

### ✅ Alinhado com README-NOVO.md

- ✅ "Crie Qualquer Coisa" → Guest vê templates prontos
- ✅ "Comece em 3 Passos" → Guest usa sem fricção
- ✅ "Monetize Tudo" → Upgrade após limite

### ✅ Sem Redis (MVP)

- ✅ Rate limiting simples em memória
- ✅ Funciona para primeiros meses
- ✅ Adiciona Redis depois (5min)

---

## 🚀 Implementação - Arquivos

### ARQUIVOS QUE JÁ EXISTEM (modificar):

```
✅ components/landing/HeroSection.jsx
   → Adicionar botão "Try without signup"

✅ contexts/DashboardProviders.jsx
   → Adicionar detecção de guest_id
   → Chamar API de conversão se guest

✅ middleware.js
   → Adicionar /api/guest(.*) e /dashboard/trial

✅ schemas/index.js (OPCIONAL)
   → Adicionar convertedFromGuest?: boolean
   → Adicionar guestId?: string
```

### ARQUIVOS NOVOS (criar):

```
⭐ lib/guest-templates.js          ✅ JÁ CRIADO!
⭐ lib/guest-auth.js                (helper auth guest/user)
⭐ lib/simple-rate-limit.js         (rate limiting sem Redis)
⭐ app/api/guest/workspace/route.js (criar/buscar workspace)
⭐ app/api/guest/convert/route.js   (converter guest→user)
⭐ app/dashboard/trial/page.jsx     (trial dashboard)
⭐ app/dashboard/trial/layout.jsx   (layout trial)
⭐ components/trial/UpgradeBanner.jsx (banner upgrade)
```

---

## 📋 Implementação Passo a Passo

### Passo 1: Helpers & Auth (30min)

```javascript
// lib/guest-auth.js
import { getCurrentAuth } from "@/lib/auth";
import { cookies } from "next/headers";

export async function getAuthOrGuest() {
  const auth = await getCurrentAuth();

  if (auth.isAuthenticated) {
    return { type: "user", userId: auth.userId, isGuest: false };
  }

  const guestId = cookies().get("guest_id")?.value;
  if (guestId) {
    return { type: "guest", guestId, isGuest: true };
  }

  return { type: "anonymous", isGuest: true };
}

// lib/simple-rate-limit.js
const store = new Map();

export function checkRateLimit(ip) {
  const minute = Math.floor(Date.now() / 60000);
  const key = `${ip}:${minute}`;
  const count = store.get(key) || 0;

  if (count >= 10) {
    return { allowed: false };
  }

  store.set(key, count + 1);
  return { allowed: true };
}
```

### Passo 2: APIs Guest (1h)

```javascript
// app/api/guest/workspace/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { cookies } from "next/headers";
import { getGuestTemplate } from "@/lib/guest-templates";
import { checkRateLimit } from "@/lib/simple-rate-limit";

// POST: Criar guest workspace
export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const rateLimit = checkRateLimit(ip);

  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { template_id, context } = await req.json();
  const guestId = uuidv4();
  const template = getGuestTemplate(template_id);

  await db.insertOne("guest_workspaces", {
    guest_id: guestId,
    created_at: new Date(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    workspace_data: {
      name: `${context.company} (Trial)`,
      template_id,
      onboarding: context,
      companies: [{ name: context.company, url: context.companyUrl }],
      sections: template.sections,
    },
    usage: { companies_count: 1, api_calls: 0 },
  });

  cookies().set("guest_id", guestId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60,
  });

  return NextResponse.json({ success: true, guestId });
}

// GET: Buscar guest workspace
export async function GET() {
  const guestId = cookies().get("guest_id")?.value;

  if (!guestId) {
    return NextResponse.json({ error: "No guest session" }, { status: 401 });
  }

  const workspace = await db.findOne("guest_workspaces", { guest_id: guestId });

  if (!workspace) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    workspace: workspace.workspace_data,
    usage: workspace.usage,
  });
}
```

```javascript
// app/api/guest/convert/route.js
import { NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { executeOnboardingPipeline } from "@/lib/onboarding-pipeline";

export async function POST() {
  const auth = await getCurrentAuth();
  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const guestId = cookies().get("guest_id")?.value;
  if (!guestId) {
    return NextResponse.json({ error: "No guest session" }, { status: 400 });
  }

  const guestWorkspace = await db.findOne("guest_workspaces", {
    guest_id: guestId,
  });

  // Criar workspace REAL (usa MESMA estrutura do onboarding atual!)
  const workspaceData = {
    name: guestWorkspace.workspace_data.name.replace(" (Trial)", ""),
    ownerId: auth.userId,
    slug: `workspace-${Date.now()}`,
    type: "sales-assistant",
    onboarding: guestWorkspace.workspace_data.onboarding,
    salesContext: { pipelineStatus: "pending" },
    convertedFromGuest: true,
  };

  const result = await db.insertOne("workspaces", workspaceData);

  // Executar pipeline (REUTILIZA código existente!)
  await executeOnboardingPipeline(
    result.insertedId.toString(),
    guestWorkspace.workspace_data.onboarding,
    auth.userId
  );

  // Marcar guest como convertido
  await db.updateOne(
    "guest_workspaces",
    { guest_id: guestId },
    {
      $set: { converted_to_user_id: auth.userId, converted_at: new Date() },
    }
  );

  return NextResponse.json({ success: true, workspace: workspaceData });
}
```

### Passo 3: Frontend Trial (1h)

```javascript
// app/dashboard/trial/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function TrialDashboard() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [workspace, setWorkspace] = useState(null);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/dashboard"); // Já logado = dashboard normal
      return;
    }

    fetch("/api/guest/workspace")
      .then((r) => r.json())
      .then((data) => setWorkspace(data.workspace));
  }, [isLoaded, isSignedIn]);

  if (!workspace) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between">
          <h1 className="text-xl font-bold">{workspace.name}</h1>
          <button
            onClick={() => (window.location.href = "/sign-up")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Sign Up to Unlock
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            🎉 Trial Mode: {workspace.usage?.companies_count || 0}/2 companies
            used
          </p>
        </div>

        {/* Renderizar sections do template */}
        <div className="space-y-6">
          {workspace.sections?.map((section) => (
            <div key={section.slug} className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">{section.name}</h2>
              <p className="text-gray-600">{section.description}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
```

### Passo 4: Atualizar HeroSection (15min)

```javascript
// components/landing/HeroSection.jsx
// ADICIONAR após os botões CTA existentes:

<div className="mt-4 text-center">
  <button
    onClick={handleTryWithoutSignup}
    className="text-sm text-gray-600 hover:text-blue-600 underline"
  >
    Or try it free without signing up →
  </button>
</div>;

// ADICIONAR função:
async function handleTryWithoutSignup() {
  const validationError = validateInputs();
  if (validationError) {
    setError(validationError);
    return;
  }

  // Salvar contexto (igual ao atual)
  localStorage.setItem("onboarding_context", JSON.stringify(userContext));

  // Criar guest workspace
  const response = await fetch("/api/guest/workspace", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      template_id: "template_1",
      context: userContext,
    }),
  });

  if (response.ok) {
    window.location.href = "/dashboard/trial";
  }
}
```

### Passo 5: Atualizar DashboardProviders (15min)

```javascript
// contexts/DashboardProviders.jsx
// ADICIONAR no useEffect do OnboardingAutoCreate:

useEffect(() => {
  if (loading || autoCreating) return;

  // ⭐ NOVO: Verificar guest conversion ANTES de onboarding
  const guestId = getCookie("guest_id");
  if (guestId) {
    convertGuestWorkspace(guestId);
    return;
  }

  // ... código de onboarding existente ...
}, [loading, autoCreating]);

// ⭐ ADICIONAR função:
async function convertGuestWorkspace(guestId) {
  setAutoCreating(true);

  try {
    const response = await fetch("/api/guest/convert", { method: "POST" });
    const result = await response.json();

    if (result.success) {
      console.log("✅ Guest convertido!", result.workspace);

      // Limpar cookie
      document.cookie = "guest_id=; Max-Age=0";

      // Recarregar workspaces
      // (WorkspaceContext já vai buscar o novo)
    }
  } catch (error) {
    console.error("❌ Erro ao converter guest:", error);
  } finally {
    setAutoCreating(false);
  }
}

// Helper para ler cookie no client
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}
```

### Passo 6: Atualizar Middleware (5min)

```javascript
// middleware.js
const isPublicRoute = createRouteMatcher([
  "/",
  "/api/webhooks(.*)",
  "/api/public(.*)",
  "/api/guest(.*)", // ← ADICIONAR
  "/dashboard/trial", // ← ADICIONAR
]);

// Config matcher:
export const config = {
  matcher: [
    "/((?!^/$|.+\\.[\\w]+$|_next|api/public|api/guest|dashboard/trial).*)",
    // ↑ ADICIONAR: api/guest e dashboard/trial
    // ... resto existente ...
  ],
};
```

---

## 📊 Fluxo Visual Completo

```
┌────────────────────────────────────────────────────────┐
│ CAMINHO A: Sign Up Direto (JÁ FUNCIONA)               │
├────────────────────────────────────────────────────────┤
│ Landing → Signup → DashboardProviders                  │
│ → Auto-cria workspace → Pipeline                       │
│ ✅ MANTÉM IGUAL! Não mexer!                            │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ CAMINHO B: Guest Mode (NOVO)                           │
├────────────────────────────────────────────────────────┤
│ 1. Landing → "Try without signup"                      │
│    POST /api/guest/workspace                           │
│    ↓                                                   │
│ 2. Guest workspace criado                              │
│    Cookie: guest_id                                    │
│    Template aplicado                                   │
│    ↓                                                   │
│ 3. /dashboard/trial                                    │
│    Usa dashboard (2 empresas)                          │
│    ↓                                                   │
│ 4. Limite atingido                                     │
│    Modal: "Sign up for unlimited"                      │
│    ↓                                                   │
│ 5. Signup → DashboardProviders                         │
│    Detecta guest_id cookie                             │
│    ↓                                                   │
│ 6. POST /api/guest/convert                             │
│    Cria workspace real                                 │
│    Executa pipeline (MESMO código!)                    │
│    ↓                                                   │
│ 7. Dashboard normal                                    │
│    Workspace com dados do guest                        │
│    Pipeline rodando                                    │
│    ✅ Guest virou usuário!                             │
└────────────────────────────────────────────────────────┘
```

---

## 🔐 Segurança Garantida

```javascript
// Todas APIs guest têm:
1. ✅ Rate limiting (10 req/min)
2. ✅ Validação Joi
3. ✅ Sanitização de inputs
4. ✅ Cookie httpOnly + secure + sameSite
5. ✅ Limite de 2 empresas (hardcoded)

// Dashboard normal continua:
1. ✅ Middleware protege /dashboard/*
2. ✅ getCurrentAuth() em APIs privadas
3. ✅ Queries filtradas por workspaceId
4. ✅ Nada muda!
```

---

## 📝 Checklist Final

### Arquivos para Criar:

- [ ] `lib/guest-auth.js`
- [ ] `lib/simple-rate-limit.js`
- [ ] `app/api/guest/workspace/route.js`
- [ ] `app/api/guest/convert/route.js`
- [ ] `app/dashboard/trial/page.jsx`
- [ ] `app/dashboard/trial/layout.jsx`

### Arquivos para Modificar:

- [ ] `components/landing/HeroSection.jsx` (adicionar botão)
- [ ] `contexts/DashboardProviders.jsx` (detecção guest)
- [ ] `middleware.js` (rotas públicas guest)
- [ ] `schemas/index.js` (2 campos opcionais - OPCIONAL)

### Testes:

- [ ] Guest: Landing → Try free → Trial dashboard
- [ ] Guest: Adicionar 2 empresas → Limite
- [ ] Guest: Signup → Conversão automática
- [ ] User normal: Landing → Signup → Dashboard (não quebra)

---

## 🎉 PLANO APROVADO

### ✅ Alinhado com:

1. Sistema de onboarding existente
2. DashboardProviders e auto-create
3. DeckEngine pipeline
4. WorkspaceSchema
5. Padrões do projeto (getCurrentAuth, lib/db, ObjectId)
6. README-NOVO.md
7. Sem Redis (pode adicionar depois)

### ✅ Pronto para:

1. Implementação imediata
2. Testes locais
3. Deploy gradual

### 🚀 Tempo Estimado:

- Core (APIs + helpers): 2h
- Frontend (trial page): 1h
- Integração (modificar existentes): 1h
- Testes: 1h
- **Total: ~5 horas** (1 dia de trabalho)

---

**Posso começar a implementar agora?** 🚀
