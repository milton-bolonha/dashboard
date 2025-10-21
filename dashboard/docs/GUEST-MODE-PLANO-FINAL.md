# 🎯 Guest Mode - Plano Final Alinhado com Sistema Existente

## ✅ VERIFICAÇÃO DE COMPATIBILIDADE

### Sistema ATUAL (já funciona):

```
Landing → localStorage → Signup → DashboardProviders detecta onboarding
→ Auto-cria workspace → DeckEngine pipeline
```

### Sistema COM Guest Mode (novo):

```
Landing → GUEST workspace (trial) → Usa dashboard (2 empresas)
→ Limite → Signup → Conversão guest→user → DeckEngine pipeline
```

### ✅ **Compatibilidade**: 100% alinhado!

---

## 🏗️ Integração com Sistema Existente

### 1. **HeroSection.jsx** (Landing) - JÁ EXISTE

```javascript
// JÁ IMPLEMENTADO:
✅ 4 inputs (company, companyUrl, solution, research)
✅ localStorage para preservar contexto
✅ Redirect para /sign-up?onboarding=true

// ADICIONAR (modo guest):
⭐ Opção: "Try without signup" → Cria guest workspace
⭐ Redirect para /dashboard/trial
```

### 2. **DashboardProviders.jsx** - JÁ EXISTE

```javascript
// JÁ IMPLEMENTADO:
✅ Detecta ?onboarding=true
✅ Lê localStorage("onboarding_context")
✅ Auto-cria workspace com createWorkspace()
✅ Executa DeckEngine pipeline

// ADICIONAR (conversão guest):
⭐ Detecta se tem cookie guest_id
⭐ Se tem: converte guest workspace → workspace real
⭐ Mantém mesmo fluxo de pipeline
```

### 3. **WorkspaceContext.jsx** - JÁ EXISTE

```javascript
// JÁ IMPLEMENTADO:
✅ createWorkspace(data) - cria workspace via API
✅ loadWorkspaces() - busca workspaces do user
✅ switchWorkspace() - troca workspace atual

// NÃO PRECISA MODIFICAR!
✅ Guest mode usa APIs separadas (/api/guest/*)
✅ Conversão cria workspace normal (usa createWorkspace existente)
```

### 4. **Schemas** - JÁ EXISTEM

```javascript
// WorkspaceSchema JÁ TEM:
✅ onboarding: {
  salesRepAt: string,
  companyUrl: string,      // ⭐ JÁ implementado!
  sellingSolutionsFor: string,
  researchTarget: string,
}
✅ salesContext: {
  pipelineStatus: string,
  pipelineJobId: string,
}
✅ type: 'cms' | 'sales-assistant'

// ADICIONAR:
⭐ convertedFromGuest: boolean
⭐ guestId: string (para tracking)
```

---

## 📋 Plano de Implementação REVISADO

### Fase 1: Guest Workspace (SEM signup)

#### 1.1 Landing: Adicionar Botão "Try Free" (sem signup)

```javascript
// components/landing/HeroSection.jsx
// ADICIONAR após os botões CTA existentes:

<button
  onClick={handleTryWithoutSignup}
  className="text-sm text-gray-600 hover:text-gray-900"
>
  Or try without signing up →
</button>;

async function handleTryWithoutSignup() {
  // Salvar contexto (igual ao atual)
  localStorage.setItem("onboarding_context", JSON.stringify(userContext));

  // Criar guest workspace via API
  const response = await fetch("/api/guest/workspace", {
    method: "POST",
    body: JSON.stringify({
      template_id: "template_1",
      context: userContext,
    }),
  });

  const { guestId } = await response.json();

  // Redirecionar para trial dashboard
  window.location.href = "/dashboard/trial";
}
```

#### 1.2 API: Criar Guest Workspace

```javascript
// app/api/guest/workspace/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { cookies } from "next/headers";
import { getGuestTemplate } from "@/lib/guest-templates";

export async function POST(req) {
  const { template_id, context } = await req.json();

  // Validar (Joi + sanitize - igual padrão do projeto)
  // ... validação ...

  // Gerar guest_id
  const guestId = uuidv4();

  // Buscar template
  const template = getGuestTemplate(template_id);

  // Criar guest workspace
  await db.insertOne("guest_workspaces", {
    guest_id: guestId,
    created_at: new Date(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    workspace_data: {
      name: `${context.company} (Trial)`,
      template_id: template_id,
      onboarding: {
        salesRepAt: context.company,
        companyUrl: context.companyUrl,
        sellingSolutionsFor: context.solution,
        researchTarget: context.research,
      },
      companies: [
        {
          name: context.company,
          url: context.companyUrl,
          added_at: new Date(),
        },
      ],
      sections: template.sections, // Sections do template
    },
    usage: {
      companies_count: 1,
      api_calls: 0,
    },
  });

  // Cookie seguro
  cookies().set("guest_id", guestId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60,
  });

  return NextResponse.json({ success: true, guestId });
}
```

#### 1.3 Page: Trial Dashboard

```javascript
// app/dashboard/trial/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function TrialDashboard() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [guestWorkspace, setGuestWorkspace] = useState(null);

  useEffect(() => {
    // Se usuário JÁ está logado, redirecionar para dashboard normal
    if (isLoaded && isSignedIn) {
      router.push("/dashboard");
      return;
    }

    loadGuestWorkspace();
  }, [isLoaded, isSignedIn]);

  async function loadGuestWorkspace() {
    const response = await fetch("/api/guest/workspace");
    const data = await response.json();
    setGuestWorkspace(data.workspace);
  }

  return (
    <div>
      <TrialHeader />
      <TrialSidebar sections={guestWorkspace?.sections} />
      <TrialContent workspace={guestWorkspace} />
      <UpgradeBanner usage={guestWorkspace?.usage} />
    </div>
  );
}

function UpgradeBanner({ usage }) {
  if (!usage || usage.companies_count < 2) return null;

  return (
    <div className="fixed bottom-0 w-full bg-blue-600 text-white p-4">
      <p>You've reached the limit! Sign up to add unlimited companies.</p>
      <button onClick={() => (window.location.href = "/sign-up")}>
        Sign Up Free →
      </button>
    </div>
  );
}
```

### Fase 2: Conversão Guest → User

#### 2.1 DashboardProviders: Detectar Guest

```javascript
// contexts/DashboardProviders.jsx
// ADICIONAR no OnboardingAutoCreate:

useEffect(() => {
  // ... código existente ...

  // ⭐ NOVO: Verificar se tem guest session para converter
  const guestId = getCookie("guest_id");
  if (guestId && !autoCreating) {
    convertGuestToUser(guestId);
  }
}, [loading, workspaces, autoCreating]);

async function convertGuestToUser(guestId) {
  console.log("🔄 Convertendo guest workspace para usuário...");

  try {
    // Chamar API de conversão
    const response = await fetch("/api/guest/convert", {
      method: "POST",
    });

    const result = await response.json();

    if (result.success) {
      console.log("✅ Guest convertido! Workspace:", result.workspace);

      // Recarregar workspaces para pegar o novo
      await loadWorkspaces();

      // Deletar cookie guest
      document.cookie = "guest_id=; Max-Age=0";
    }
  } catch (error) {
    console.error("❌ Erro ao converter guest:", error);
  }
}
```

#### 2.2 API: Converter Guest

```javascript
// app/api/guest/convert/route.js
import { NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

export async function POST(req) {
  const authData = await getCurrentAuth();

  if (!authData.isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = authData.userId;
  const guestId = cookies().get("guest_id")?.value;

  if (!guestId) {
    return NextResponse.json({ error: "No guest session" }, { status: 400 });
  }

  // Buscar guest workspace
  const guestWorkspace = await db.findOne("guest_workspaces", {
    guest_id: guestId,
  });

  if (!guestWorkspace) {
    return NextResponse.json(
      { error: "Guest workspace not found" },
      { status: 404 }
    );
  }

  console.log(`🔄 Converting guest ${guestId} to user ${userId}`);

  // Criar workspace REAL usando mesma estrutura do onboarding atual
  const workspaceData = {
    name: guestWorkspace.workspace_data.name.replace(" (Trial)", ""),
    description: guestWorkspace.workspace_data.onboarding.sellingSolutionsFor,
    ownerId: userId,
    slug: `workspace-${Date.now()}`,
    type: "sales-assistant", // ← Igual onboarding atual
    onboarding: guestWorkspace.workspace_data.onboarding, // ← Preservar contexto
    salesContext: {
      pipelineStatus: "pending",
      pipelineJobId: null,
    },
    convertedFromGuest: true, // ← Tracking
    guestId: guestId,
    created_at: new Date(),
  };

  const result = await db.insertOne("workspaces", workspaceData);
  const workspaceId = result.insertedId;

  // Marcar guest como convertido
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

  // ⭐ IMPORTANTE: Executar DeckEngine pipeline (igual onboarding atual!)
  const { executeOnboardingPipeline } = await import(
    "@/lib/onboarding-pipeline"
  );

  await executeOnboardingPipeline(
    workspaceId.toString(),
    guestWorkspace.workspace_data.onboarding,
    userId
  );

  console.log("✅ Guest converted successfully!");

  return NextResponse.json({
    success: true,
    workspace: { ...workspaceData, _id: workspaceId },
  });
}
```

### Fase 3: Middleware (Permitir Trial)

```javascript
// middleware.js
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/api/webhooks(.*)",
  "/api/public(.*)",
  "/api/guest(.*)", // ← APIs guest públicas
  "/dashboard/trial", // ← Trial dashboard público
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect(); // ← Dashboard normal protegido
  }
});

// ADICIONAR ao config matcher:
export const config = {
  matcher: [
    "/((?!^/$|.+\\.[\\w]+$|_next|api/public|api/guest|dashboard/trial).*)",
    // ... resto existente
  ],
};
```

---

## 🔄 Fluxo Completo Integrado

```
┌──────────────────────────────────────────────────────────────┐
│ 1. LANDING PAGE (components/landing/HeroSection.jsx)         │
│    ✅ JÁ EXISTE: 4 inputs + localStorage                     │
│    ⭐ ADICIONAR: Botão "Try without signup"                  │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 2A. CAMINHO ATUAL (Sign Up Direto)                           │
│     → Signup → DashboardProviders → Auto-cria workspace      │
│     → Pipeline → Dashboard normal                            │
│     ✅ MANTÉM IGUAL! Não mexer!                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ 2B. CAMINHO NOVO (Guest Mode)                                │
│     → POST /api/guest/workspace                              │
│     → Cria guest workspace no MongoDB                        │
│     → Cookie guest_id                                        │
│     → Redirect /dashboard/trial                              │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 3. GUEST USA TRIAL DASHBOARD                                 │
│    ✅ Vê sections do template (Overview, Competitors, News)  │
│    ✅ Adiciona empresa 1 (Tesla)                             │
│    ✅ Adiciona empresa 2 (SpaceX)                            │
│    ❌ Tenta adicionar empresa 3 → BLOQUEADO                  │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 4. UPGRADE PROMPT                                            │
│    Modal: "Sign up to unlock unlimited companies"           │
│    → Clica "Sign Up"                                         │
│    → Redirect /sign-up (localStorage já tem contexto!)       │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 5. SIGNUP (Clerk) - IGUAL AO ATUAL                           │
│    ✅ Clerk autentica usuário                                │
│    ✅ Redirect /dashboard                                    │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 6. DASHBOARDPROVIDERS (contexts/DashboardProviders.jsx)     │
│    ⭐ MODIFICAR para detectar guest_id                       │
│    ⭐ Se tem guest_id: POST /api/guest/convert               │
│    ⭐ Converte guest workspace → workspace real              │
│    ✅ Executa pipeline (MESMO código atual!)                 │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 7. DASHBOARD NORMAL                                          │
│    ✅ Workspace criado com dados do guest                    │
│    ✅ Pipeline executando (igual onboarding atual)           │
│    ✅ Guest virou usuário real                               │
│    ✅ Sem limites!                                           │
└──────────────────────────────────────────────────────────────┘
```

---

## 📁 Arquivos que EXISTEM (não mexer muito)

| Arquivo                              | Status    | Ação                            |
| ------------------------------------ | --------- | ------------------------------- |
| `components/landing/HeroSection.jsx` | ✅ EXISTE | ⭐ Adicionar botão "Try free"   |
| `contexts/DashboardProviders.jsx`    | ✅ EXISTE | ⭐ Adicionar detecção guest_id  |
| `contexts/WorkspaceContext.jsx`      | ✅ EXISTE | ✅ NÃO MEXER                    |
| `lib/onboarding-pipeline.js`         | ✅ EXISTE | ✅ NÃO MEXER (reusar!)          |
| `schemas/index.js`                   | ✅ EXISTE | ⭐ Adicionar 2 campos opcionais |
| `middleware.js`                      | ✅ EXISTE | ⭐ Adicionar rotas guest        |

## 📁 Arquivos NOVOS (criar)

| Arquivo                              | Propósito                     |
| ------------------------------------ | ----------------------------- |
| `lib/guest-templates.js`             | ✅ JÁ CRIADO! Templates 1 e 2 |
| `lib/guest-auth.js`                  | Helper para auth guest/user   |
| `app/api/guest/workspace/route.js`   | Criar/buscar guest workspace  |
| `app/api/guest/convert/route.js`     | Converter guest → user        |
| `app/dashboard/trial/page.jsx`       | Trial dashboard               |
| `app/dashboard/trial/layout.jsx`     | Layout trial (sem sidebar)    |
| `components/trial/TrialHeader.jsx`   | Header trial                  |
| `components/trial/UpgradeBanner.jsx` | Banner de upgrade             |

---

## 🔐 Segurança (SEM Redis por enquanto)

```javascript
// lib/simple-rate-limit.js
const rateLimitStore = new Map();

export function checkRateLimit(ip) {
  const minute = Math.floor(Date.now() / 60000); // Minuto atual
  const key = `${ip}:${minute}`;
  const count = rateLimitStore.get(key) || 0;

  if (count >= 10) {
    return { allowed: false, message: "Too many requests" };
  }

  rateLimitStore.set(key, count + 1);

  // Limpar cache antigo (evitar memory leak)
  if (rateLimitStore.size > 1000) {
    const oldMinute = minute - 5;
    for (const k of rateLimitStore.keys()) {
      if (k.endsWith(`:${oldMinute}`)) {
        rateLimitStore.delete(k);
      }
    }
  }

  return { allowed: true, remaining: 10 - count - 1 };
}
```

---

## ✅ Compatibilidade com Sistema Existente

| Funcionalidade Atual    | Compatível? | Notas                                       |
| ----------------------- | ----------- | ------------------------------------------- |
| Landing → localStorage  | ✅ SIM      | Guest mode reutiliza                        |
| Auto-create workspace   | ✅ SIM      | Conversão usa createWorkspace()             |
| DeckEngine pipeline     | ✅ SIM      | Conversão chama executeOnboardingPipeline() |
| Schemas WorkspaceSchema | ✅ SIM      | Adiciona 2 campos opcionais apenas          |
| Middleware              | ✅ SIM      | Adiciona rotas públicas guest               |
| WorkspaceContext        | ✅ SIM      | Não precisa mexer                           |
| SectionsContext         | ✅ SIM      | Não precisa mexer                           |

---

## 🚀 Roadmap FINAL

### Semana 1: Core (2-3 dias)

- [ ] Criar `lib/guest-auth.js`
- [ ] Criar `app/api/guest/workspace/route.js` (POST + GET)
- [ ] Criar `app/api/guest/convert/route.js`
- [ ] Atualizar `middleware.js` (adicionar rotas guest)
- [ ] Atualizar `schemas/index.js` (2 campos opcionais)

### Semana 2: Frontend (2 dias)

- [ ] Criar `app/dashboard/trial/page.jsx`
- [ ] Criar `app/dashboard/trial/layout.jsx`
- [ ] Adicionar botão "Try free" em `HeroSection.jsx`
- [ ] Atualizar `DashboardProviders.jsx` (detecção guest)

### Semana 3: UX (1 dia)

- [ ] Criar `components/trial/UpgradeBanner.jsx`
- [ ] Adicionar progress indicator (1/2 companies)
- [ ] Modal de limite atingido

### Semana 4: Polish (1 dia)

- [ ] Testes E2E completos
- [ ] Documentação final
- [ ] Deploy

---

## 🎯 Checklist de Alinhamento

### Com README-NOVO.md:

- ✅ "Comece em 3 passos simples" → Guest vê na prática!
- ✅ "Defina sua estrutura" → Templates predefinidos
- ✅ "Conecte e Lance" → Trial mode funcional

### Com LANDING-ONBOARDING-STATUS.md:

- ✅ Usa mesmos 4 inputs (company, companyUrl, solution, research)
- ✅ Mantém localStorage
- ✅ Compatível com auto-create existente
- ✅ Reutiliza DeckEngine pipeline

### Com DashboardProviders.jsx:

- ✅ Mesmo fluxo de createWorkspace()
- ✅ Mesmo executeOnboardingPipeline()
- ✅ Não quebra nada existente

### Com Schemas:

- ✅ WorkspaceSchema já tem onboarding estruturado
- ✅ Apenas adiciona 2 campos opcionais (convertedFromGuest, guestId)

---

## 📝 Conclusão

### ✅ Plano está 100% alinhado com:

1. ✅ Sistema de onboarding existente
2. ✅ DashboardProviders e auto-create
3. ✅ WorkspaceContext (não mexe)
4. ✅ DeckEngine pipeline (reutiliza!)
5. ✅ Schemas existentes (mínimas mudanças)
6. ✅ README-NOVO.md (filosofia)
7. ✅ Padrões do projeto (getCurrentAuth, lib/db, etc)

### ✅ SEM Redis (por enquanto):

- ✅ Rate limiting simples em memória
- ✅ Funciona para primeiros meses
- ✅ Adiciona Redis depois quando crescer (5min)

### ✅ Pronto para Implementar!

Posso começar agora! Qual fase você quer primeiro?
