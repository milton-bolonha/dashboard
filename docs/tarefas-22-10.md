# 📋 Tarefas Semana 1 - AI Sales Assistant Plugin

**Data:** 22 de Outubro de 2025  
**Objetivo:** Completar V0.1 do plugin AI Sales Assistant

---

## 🎯 Status Atual vs. Meta da Semana 1

### ✅ **JÁ IMPLEMENTADO (Base Sólida)**

- ✅ **Sistema de Workspace Multi-tenant** (Clerk + MongoDB)
- ✅ **Sistema de Autenticação** (`getCurrentAuth()` centralizado)
- ✅ **Guest Workspace** (trial mode) com tiles funcionais
- ✅ **Sistema de Tiles** com AI generation (OpenAI)
- ✅ **UI Components** (Tile, LoadingTile, AddPromptTile, Modals)
- ✅ **DeckEngine** para jobs/bulk operations
- ✅ **Sistema de Companies** (add/view/select)
- ✅ **Sistema de Contacts** (add/view)
- ✅ **API Routes** (`/api/guest/*`)

### ❌ **FALTANDO PARA SEMANA 1**

---

## 🚀 **TAREFAS CRÍTICAS - SEMANA 1**

### **1. Data Models & Schemas (PRIORIDADE ALTA)**

**Arquivo:** `schemas/sales-assistant.js`

```javascript
// Modelos necessários:
- [ ] TemplateSchema (prompts reutilizáveis)
- [ ] DashboardSchema (layout + tiles)
- [ ] TileSchema (resultado de execução)
- [ ] OutreachSchema (email/call scripts)
- [ ] CreditsSchema (billing por workspace)
```

### **3. API Routes - Sales Assistant (PRIORIDADE ALTA)**

**Estrutura:** `app/api/sales-assistant/*`

```javascript
// Rotas necessárias:
- [ ] GET/POST/PUT/DELETE /api/sales-assistant/templates
- [ ] GET/POST /api/sales-assistant/companies
- [ ] GET/POST /api/sales-assistant/dashboards
- [ ] POST /api/sales-assistant/tiles/run (single execution)
- [ ] GET /api/sales-assistant/credits
- [ ] POST /api/sales-assistant/credits/debit
```

### **4. Migração do Guest System (PRIORIDADE MÉDIA)**

**Objetivo:** Converter guest workspace para sistema multi-tenant real

```javascript
// Tarefas:
- [ ] Migrar `/api/guest/*` para `/api/sales-assistant/*`
- [ ] Adicionar `x-workspace-id` header em todas as rotas
- [ ] Implementar RBAC (owner/admin/member)
- [ ] Converter trial page para workspace real
```

### **5. Templates System (PRIORIDADE MÉDIA)**

**Arquivo:** `lib/sales-assistant/templates.js`

```javascript
// Funcionalidades:
- [ ] CRUD de templates de prompts
- [ ] Variables system ({{company_name}}, {{industry}})
- [ ] Template categories/tags
- [ ] Bulk template execution
```

### **6. Credits & Billing (PRIORIDADE BAIXA)**

**Arquivo:** `lib/sales-assistant/credits.js`

```javascript
// Sistema básico:
- [ ] Credit tracking por workspace
- [ ] Token counting e billing
- [ ] Usage limits enforcement
- [ ] Stripe integration (futuro)
```

---

## 🔧 **TAREFAS TÉCNICAS DETALHADAS**

### **A. API Routes Structure**

```
app/api/sales-assistant/
├── templates/
│   ├── route.js (GET, POST)
│   └── [id]/route.js (GET, PUT, DELETE)
├── companies/
│   ├── route.js (GET, POST)
│   └── [id]/route.js (GET, PUT, DELETE)
├── dashboards/
│   ├── route.js (GET, POST)
│   └── [id]/route.js (GET, PUT, DELETE)
├── tiles/
│   ├── run/route.js (POST - single execution)
│   └── bulk/route.js (POST - bulk via DeckEngine)
├── credits/
│   ├── route.js (GET)
│   └── debit/route.js (POST)
└── contacts/
    ├── route.js (GET, POST)
    └── [id]/route.js (GET, PUT, DELETE)
```

### **C. UI Components Migration**

```javascript
// Mover componentes do trial para sales-assistant:
- [ ] TileGrid → components/sales-assistant/TileGrid
- [ ] CompanyList → components/sales-assistant/CompanyList
- [ ] ContactList → components/sales-assistant/ContactList
- [ ] TemplateManager → components/sales-assistant/TemplateManager
- [ ] DashboardView → components/sales-assistant/DashboardView
```

---

## 📊 **CRITÉRIOS DE ACEITAÇÃO - SEMANA 1**

### **V0.1 Must Have:**

- [ ] ✅ Templates CRUD (create/edit/delete prompts)
- [ ] ✅ Companies CRUD (add/view companies)
- [ ] ✅ Single tile execution (1 prompt → 1 company → 1 result)
- [ ] ✅ Basic dashboard view (tiles grid)
- [ ] ✅ Multi-tenant isolation (x-workspace-id)

### **V0.1 Nice to Have:**

- [ ] ✅ Bulk operations (múltiplas companies)
- [ ] ✅ Credits system básico
- [ ] ✅ Template variables ({{company_name}})
- [ ] ✅ Dashboard templates (save/load layouts)

---

## 🚨 **BLOCKERS & DEPENDENCIES**

### **Dependências Externas:**

- [ ] MongoDB connection (já configurado)
- [ ] Clerk authentication (já configurado)
- [ ] OpenAI API key (já configurado)
- [ ] DeckEngine (já configurado)

### **Dependências Internas:**

- [ ] `lib/db.js` (já existe)
- [ ] `lib/auth.js` (já existe)
- [ ] `lib/ai-tile-generator.js` (já existe)
- [ ] `components/ui/*` (já existem)

---

## 📅 **CRONOGRAMA SUGERIDO**

### **Dia 1-2: Foundation**

- [ ] Data models & schemas
- [ ] Basic API routes structure

### **Dia 3-4: Core Features**

- [ ] Templates CRUD
- [ ] Companies/Dashboards CRUD
- [ ] Single tile execution

### **Dia 5: Integration**

- [ ] Migrate guest system
- [ ] UI components migration

### **Dia 6-7: Testing & Polish**

- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Documentation

---

## 🎯 **META FINAL SEMANA 1**

**"Usuário pode criar workspace, adicionar companies, criar templates de prompts, executar pesquisa em 1 company e ver resultado como tile no dashboard."**

**Resultado:** V0.1 funcional do AI Sales Assistant Plugin, pronto para expansão na Semana 2 (bulk operations, contacts, outreach).

---

## 📝 **NOTAS IMPORTANTES**

1. **Reutilizar máximo possível** do sistema atual (guest workspace, tiles, AI generation)
2. **Manter compatibilidade** com sistema existente durante migração
3. **Focar em single execution** primeiro, bulk operations na Semana 2
4. **Documentar tudo** para facilitar Semana 2

**Status:** 🟡 **EM ANDAMENTO** - Base sólida existe, falta estruturação do plugin
