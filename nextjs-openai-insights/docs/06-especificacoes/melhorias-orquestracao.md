# Melhorias de Orquestração e Segurança

**Data:** 2025-11-23  
**Status:** ✅ Implementado

---

## 🎯 Objetivos

1. ✅ Centralizar orquestração de dados
2. ✅ Melhorar segurança do Stripe (dev-safe)
3. ✅ Padronizar fluxo de dados entre camadas

---

## 📦 Novo Componente: Data Orchestrator

### **Arquivo:** `src/lib/orchestration/data-orchestrator.ts`

Centralizador de todas as operações de dados da aplicação.

### **Responsabilidades:**

1. **Gerenciamento Multi-Camada**
   - localStorage (client-side)
   - Memory Cache (server-side, 30min TTL)
   - MongoDB (server-side, members only)

2. **Seleção Automática de Storage**
   ```typescript
   // Guest → localStorage only
   // Member (client) → localStorage
   // Member (server) → Memory Cache + MongoDB
   ```

3. **Sincronização Consistente**
   - Garante que dados sejam salvos em todas as camadas apropriadas
   - Retorna status de sucesso por camada
   - Logs detalhados de cada operação

### **API Principal:**

```typescript
// Load workspace (tenta todas as camadas)
const workspace = await loadWorkspaceOrchestrated({
  userId: "user_123" | null,
  sessionId: "session_456",
  isClient: true | false
});

// Save workspace (salva em camadas apropriadas)
const result = await saveWorkspaceOrchestrated(workspace, context);
// result.synced = ["localStorage", "memoryCache", "mongodb"]

// Update específico (tiles, notes, contacts)
await updateTilesOrchestrated(sessionId, tiles, context);
await updateNotesOrchestrated(sessionId, notes, context);
await updateContactsOrchestrated(sessionId, contacts, context);

// Migração guest → member
await migrateGuestToMemberOrchestrated(guestSessionId, newUserId);

// Health check
const health = await checkStorageHealth(context);
// { localStorage: true, memoryCache: true, mongodb: false }
```

### **Benefícios:**

✅ **Single Source of Truth** - Uma API para todas as operações  
✅ **Tipo-Safe** - TypeScript completo  
✅ **Logging Centralizado** - Fácil debug  
✅ **Error Handling** - Retorna erros por camada  
✅ **Flexível** - Funciona em client e server  

---

## 🔐 Melhorias de Segurança - Stripe Webhook

### **Arquivo:** `src/app/api/webhooks/stripe/route.ts`

### **Mudanças:**

#### **1. Logging de Segurança Aprimorado**

```typescript
console.log("[Stripe Webhook] 🔐 Security check", {
  environment: process.env.NODE_ENV,
  hasSecret: hasWebhookSecret,
  hasSignature: !!signature,
  timestamp: new Date().toISOString(),
});
```

#### **2. Avisos Claros em Dev Mode**

```typescript
if (isDevelopment && !hasWebhookSecret) {
  console.warn("[Stripe Webhook] ⚠️ DEVELOPMENT MODE: Skipping signature validation");
  console.warn("[Stripe Webhook] ⚠️ This is INSECURE and should NEVER be used in production");
  console.warn("[Stripe Webhook] ⚠️ Set STRIPE_WEBHOOK_SECRET before deploying to production");
}
```

#### **3. Marcador de Dev Mode**

```typescript
// Adiciona flag para identificar eventos não-validados
(event as any).__DEV_MODE_UNVALIDATED__ = true;
```

#### **4. Validação Explícita em Produção**

```typescript
if (!process.env.STRIPE_WEBHOOK_SECRET) {
  console.error("[Stripe Webhook] ❌ STRIPE_WEBHOOK_SECRET not configured");
  return NextResponse.json(
    { error: "Webhook secret not configured" },
    { status: 500 }
  );
}
```

#### **5. Confirmação de Validação**

```typescript
event = stripe.webhooks.constructEvent(body, signature, secret);
console.log("[Stripe Webhook] ✅ Signature validated successfully");
```

### **Comportamento:**

| Ambiente | STRIPE_WEBHOOK_SECRET | Comportamento |
|----------|----------------------|---------------|
| **Development** | ❌ Não configurado | ⚠️ Aceita sem validar (com avisos) |
| **Development** | ✅ Configurado | ✅ Valida assinatura |
| **Production** | ❌ Não configurado | ❌ Retorna erro 500 |
| **Production** | ✅ Configurado | ✅ Valida assinatura |

### **Segurança:**

✅ **Dev-Safe** - Permite desenvolvimento local sem secret  
✅ **Prod-Safe** - Força validação em produção  
✅ **Auditável** - Logs completos de segurança  
✅ **Transparente** - Avisos claros sobre modo inseguro  

---

## 🔄 Fluxo de Dados Melhorado

### **Antes:**

```
Client → localStorage
       → fetch /api/workspace
       → Server Memory Cache
       → MongoDB (se member)
```

Problema: Lógica distribuída em múltiplos arquivos

### **Depois:**

```
Client/Server → DataOrchestrator
              → Seleciona camadas automaticamente
              → Sincroniza consistentemente
              → Retorna status detalhado
```

Benefício: Lógica centralizada, fácil manutenção

---

## 📊 Exemplo de Uso

### **Em uma API Route:**

```typescript
import { loadWorkspaceOrchestrated, saveWorkspaceOrchestrated } from "@/lib/orchestration/data-orchestrator";
import { getAuth } from "@/lib/auth/get-auth";

export async function GET(request: Request) {
  const { userId } = await getAuth();
  const sessionId = request.headers.get("x-session-id");

  // Load com orquestração automática
  const workspace = await loadWorkspaceOrchestrated({
    userId,
    sessionId,
    isClient: false, // server-side
  });

  return Response.json(workspace);
}

export async function POST(request: Request) {
  const { userId } = await getAuth();
  const workspace = await request.json();

  // Save com sincronização multi-camada
  const result = await saveWorkspaceOrchestrated(workspace, {
    userId,
    sessionId: workspace.sessionId,
    isClient: false,
  });

  console.log("Synced to:", result.synced); // ["memoryCache", "mongodb"]

  return Response.json({ success: result.success, synced: result.synced });
}
```

### **No Client (React):**

```typescript
import { loadWorkspaceOrchestrated } from "@/lib/orchestration/data-orchestrator";

function useWorkspace(sessionId: string) {
  const [workspace, setWorkspace] = useState(null);

  useEffect(() => {
    // Load do localStorage (client-side)
    const data = await loadWorkspaceOrchestrated({
      userId: null, // guest
      sessionId,
      isClient: true,
    });
    setWorkspace(data);
  }, [sessionId]);

  return workspace;
}
```

---

## ✅ Checklist de Implementação

### **Concluído:**

- [x] Criar `data-orchestrator.ts`
- [x] Implementar `loadWorkspaceOrchestrated()`
- [x] Implementar `saveWorkspaceOrchestrated()`
- [x] Implementar `updateTilesOrchestrated()`
- [x] Implementar `updateNotesOrchestrated()`
- [x] Implementar `updateContactsOrchestrated()`
- [x] Implementar `migrateGuestToMemberOrchestrated()`
- [x] Implementar `checkStorageHealth()`
- [x] Melhorar logging de segurança do Stripe
- [x] Adicionar avisos de dev-mode
- [x] Adicionar validação explícita em produção

### **Próximos Passos (Opcional):**

- [ ] Migrar rotas existentes para usar `data-orchestrator`
- [ ] Adicionar testes unitários para orquestrador
- [ ] Adicionar retry logic para MongoDB
- [ ] Implementar queue de sincronização offline
- [ ] Adicionar métricas de performance

---

## 🎯 Impacto

### **Antes:**

- ❌ Lógica de dados espalhada em 5+ arquivos
- ❌ Difícil rastrear onde dados são salvos
- ❌ Inconsistências entre camadas
- ❌ Stripe webhook sem logging adequado

### **Depois:**

- ✅ Lógica centralizada em 1 arquivo
- ✅ API clara e tipo-safe
- ✅ Sincronização consistente
- ✅ Logging completo de segurança
- ✅ Dev-friendly, prod-safe

---

## 📚 Referências

- [`data-orchestrator.ts`](file:///c:/Users/milto/Documents/dash/nextjs-openai-insights/src/lib/orchestration/data-orchestrator.ts) - Orquestrador centralizado
- [`route.ts (Stripe)`](file:///c:/Users/milto/Documents/dash/nextjs-openai-insights/src/app/api/webhooks/stripe/route.ts) - Webhook melhorado
- [`orquestracao-estados-dados.md`](file:///c:/Users/milto/Documents/dash/nextjs-openai-insights/docs/06-especificacoes/orquestracao-estados-dados.md) - Documentação original

---

**Última Atualização:** 2025-11-23  
**Autor:** Antigravity AI  
**Status:** ✅ Pronto para uso
