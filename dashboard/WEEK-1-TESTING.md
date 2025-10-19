# 🧪 Week 1 - Guia de Testes

## ✅ O que foi implementado

### 1. **Validação de Workspaces**

- ✅ `lib/workspace-validation.js` - Previne nomes duplicados
- ✅ Validação case-insensitive
- ✅ Sugestões automáticas para nomes duplicados

### 2. **Schema Extensions**

- ✅ Campo `type` (cms | sales-assistant)
- ✅ Campo `onboarding` (contexto capturado)
- ✅ Campo `salesContext` (pipeline status)
- ✅ Campo `credits` (AI operations)

### 3. **POST /api/workspaces**

- ✅ Validação de nome duplicado
- ✅ Detecção automática de contexto de onboarding
- ✅ Auto-classificação de workspace type
- ✅ Inicialização de campos onboarding/salesContext/credits
- ✅ Trigger do DeckEngine pipeline

### 4. **Landing ↔ Dashboard Flow**

- ✅ Query params (`/?rep=X&solution=Y&target=Z`)
- ✅ Auto-preenchimento de inputs
- ✅ localStorage para preservar contexto
- ✅ Redirect para sign-up com `?onboarding=true`
- ✅ Auto-criação de workspace após login

### 5. **DeckEngine Pipeline**

- ✅ `lib/deck-engine-setup.js` - Singleton
- ✅ `lib/onboarding-pipeline.js` - Executor
- ✅ Deck `onboarding-pipeline` com 3 cards:
  - `workspace-setup` - Atualizar progresso
  - `setup-dashboard` - Criar dashboard inicial
  - `notify-user` - Console log (email futuramente)
- ✅ Hooks onVictory/onDefeat
- ✅ Tracking via matchId

### 6. **UI - Duplicate Detection**

- ✅ `WorkspaceDuplicateModal` component
- ✅ 3 opções: Switch | Add Company | Cancel
- ✅ Integrado no `CreateWorkspaceScreen`

---

## 🧪 Cenários de Teste

### 📌 Cenário 1: Landing → Sign Up → Auto-Create

**Fluxo:**

1. User acessa landing (`/`)
2. Preenche 3 inputs:
   - I am a sales rep at: **"Acme Corp"**
   - I am selling solutions for: **"HR software"**
   - I want to conduct research on: **"Healthcare industry"**
3. Clica em **"Connect CRM"** ou **"Upload CSV"**
4. Sistema salva contexto em localStorage
5. Redireciona para `/sign-up?redirect=/dashboard&onboarding=true`
6. User completa sign up
7. É redirecionado para `/dashboard?onboarding=true`
8. DashboardProviders detecta flag + localStorage
9. Auto-cria workspace "Acme Corp" com metadata
10. Limpa localStorage e remove query param
11. DeckEngine pipeline é iniciado

**✅ Sucesso esperado:**

- Workspace criado com nome "Acme Corp"
- `type: "sales-assistant"`
- `onboarding.salesRepAt: "Acme Corp"`
- `onboarding.sellingSolutionsFor: "HR software"`
- `onboarding.researchTarget: "Healthcare industry"`
- `onboarding.source: "landing"`
- `salesContext.pipelineStatus: "running"` → "completed"
- Console logs do DeckEngine:
  ```
  🎮 Inicializando DeckEngine...
  ✅ DeckEngine inicializado com sucesso!
  🚀 Iniciando onboarding pipeline...
  ✅ Onboarding pipeline enfileirado: [matchId]
  📝 Setting up workspace context...
  ✅ Workspace context updated
  📊 Creating Getting Started dashboard...
  ✅ Dashboard setup completed
  📧 Sending welcome notification...
  ✅ Onboarding completed for workspace: [id]
  ✅ Onboarding pipeline VICTORY for workspace: [id]
  ```

---

### 📌 Cenário 2: Query Params → Pre-fill

**Fluxo:**

1. User acessa URL com query params:
   ```
   https://localhost:3000/?rep=Tesla&solution=Solar%20panels&target=Residential%20market
   ```
2. Inputs são auto-preenchidos:
   - "Tesla"
   - "Solar panels"
   - "Residential market"
3. User pode editar ou clicar direto em CTA

**✅ Sucesso esperado:**

- Inputs preenchidos automaticamente
- Console: `✅ Query params detectados e inputs preenchidos`

---

### 📌 Cenário 3: Workspace Duplicado → Modal

**Fluxo (A - Client Side):**

1. User já tem workspace "Microsoft"
2. User tenta criar novo workspace "Microsoft" via `CreateWorkspaceScreen`
3. Validação client-side detecta duplicação
4. Modal aparece com 3 opções
5. User escolhe **"Ir para esse workspace"**
6. Sistema faz `switchWorkspace()` e redireciona

**✅ Sucesso esperado:**

- Modal exibido
- Opção "Switch" funcional
- Opção "Add company" desabilitada (Week 3)
- Opção "Cancel" fecha modal

**Fluxo (B - Server Side):**

1. User bypassa validação client-side (API call direto)
2. POST /api/workspaces recebe nome duplicado
3. `validateWorkspaceName()` detecta duplicação
4. Retorna erro 400 com:
   ```json
   {
     "error": "You already have a workspace with this name",
     "suggestion": "Microsoft (2025)",
     "existingId": "507f1f77bcf86cd799439011"
   }
   ```

**✅ Sucesso esperado:**

- Request bloqueado
- Erro retornado com suggestion
- Workspace NÃO criado

---

### 📌 Cenário 4: CMS Workspace (Sem Onboarding)

**Fluxo:**

1. User cria workspace sem metadata de onboarding
2. POST /api/workspaces recebe apenas:
   ```json
   {
     "name": "My Blog",
     "description": "Personal blog"
   }
   ```
3. Sistema detecta `hasOnboardingContext = false`
4. Workspace criado com `type: "cms"`
5. Pipeline NÃO é iniciado

**✅ Sucesso esperado:**

- `type: "cms"`
- Campos `onboarding`, `salesContext`, `credits` não inicializados
- Console: workspace criado normalmente (sem pipeline)

---

## 🔍 Verificações no MongoDB

Após cada teste, verificar no MongoDB:

```javascript
// 1. Buscar workspace criado
db.workspaces.findOne({ name: "Acme Corp" })

// Campos esperados:
{
  _id: ObjectId(...),
  name: "Acme Corp",
  type: "sales-assistant",
  ownerId: "user_...",

  onboarding: {
    salesRepAt: "Acme Corp",
    sellingSolutionsFor: "HR software",
    researchTarget: "Healthcare industry",
    source: "landing",
    completedSteps: ["workspace-created", "context-saved", "dashboard-created"],
    currentStep: "completed",
    capturedAt: ISODate(...)
  },

  salesContext: {
    solution: "HR software",
    pipelineStatus: "completed",
    pipelineJobId: "match-...",
    pipelineStartedAt: ISODate(...),
    pipelineCompletedAt: ISODate(...)
  },

  credits: {
    plan: "free",
    quota: 1000,
    consumed: 0,
    resetsAt: ISODate(...) // +30 days
  }
}
```

---

## 🐛 Possíveis Problemas

### 1. **DeckEngine não inicializa**

- **Sintoma:** Erro ao chamar `getDeckEngine()`
- **Causa:** Problema no import do `deckEngine/index.js`
- **Fix:** Verificar path do import em `deck-engine-setup.js`

### 2. **Pipeline não executa**

- **Sintoma:** `pipelineStatus` fica em "pending"
- **Causa:** Deck não está registrado ou engine não inicializado
- **Fix:** Verificar console logs do DeckEngine

### 3. **Auto-create loop**

- **Sintoma:** Workspace criado múltiplas vezes
- **Causa:** localStorage não limpo ou flag não removida
- **Fix:** Verificar `OnboardingAutoCreate` em `DashboardProviders.jsx`

### 4. **Modal não aparece**

- **Sintoma:** Workspace duplicado criado sem aviso
- **Causa:** Validação client-side não funcionando
- **Fix:** Verificar `workspaces` no `WorkspaceContext`

---

## 🚀 Próximos Passos (Week 2-3)

- [ ] AI Context Analysis (LLM para inferir industry/targetMarket)
- [ ] Template Seeding (criar templates sugeridos)
- [ ] CRM Integration (OAuth flow)
- [ ] CSV Upload & Parsing
- [ ] Companies Collection & CRUD APIs
- [ ] Bulk Research Deck

---

## 📊 Status de Desenvolvimento

| Feature                | Status | Notes                             |
| ---------------------- | ------ | --------------------------------- |
| Validação de workspace | ✅     | Server + Client                   |
| Schema extensions      | ✅     | Onboarding, credits, salesContext |
| POST /api/workspaces   | ✅     | Valida + pipeline                 |
| Query params           | ✅     | Auto-fill inputs                  |
| localStorage           | ✅     | Preserva contexto                 |
| Auto-create            | ✅     | Após sign up                      |
| DeckEngine setup       | ✅     | Singleton funcional               |
| Onboarding pipeline    | ✅     | 3 cards básicos                   |
| Duplicate modal        | ✅     | Switch/Cancel funcionais          |
| Add Company            | 🚧     | Aguardando Week 3                 |
| AI Analysis            | 🚧     | Aguardando Week 2                 |
| CRM/CSV                | 🚧     | Aguardando Week 3                 |

---

## 💡 Comandos Úteis

```bash
# Iniciar dev server
cd dashboard
npm run dev

# Ver logs do DeckEngine
# (acompanhar console do terminal)

# Limpar localStorage (navegador)
localStorage.clear()

# Deletar workspace de teste (MongoDB)
db.workspaces.deleteOne({ name: "Acme Corp" })

# Ver todos workspaces de teste
db.workspaces.find({ type: "sales-assistant" })
```

---

**🎉 Week 1 COMPLETO! Todos os 9 pontos implementados e funcionais!**
