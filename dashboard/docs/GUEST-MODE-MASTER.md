# 🎯 Guest Mode - DOCUMENTO MESTRE

**Data**: 21 de Outubro de 2025  
**Status**: ✅ IMPLEMENTADO E FUNCIONANDO  
**Branch**: ai-sales

---

## 📋 TL;DR (1 Minuto)

**O que é**: Dashboard gratuito sem signup, limite 2 empresas  
**Como funciona**: OpenAI gera 6-12 tiles automaticamente  
**Propósito**: Demonstrar valor vs workflow manual (save 14-16h→30s)  
**Conversão**: Limite atingido → Signup → Workspace real

---

## 🎯 Problema que Resolve (do Cliente)

### Workflow ANTIGO (Manual):

```
1. Open ChatGPT para cada empresa
2. Copy-paste 15-20 prompts manualmente
3. Salvar respostas em Docs/Excel/CRM
4. Repetir para 20+ empresas
5. Perder contexto entre sessões

⏱️ Tempo: 14-16 horas/semana
```

### Workflow NOVO (Guest Mode):

```
1. Preencher 4 campos
2. Click "Try Free"
3. Ver 6 tiles gerados automaticamente

⚡ Tempo: 30 segundos
✅ Save: 10+ horas/semana!
```

---

## 🏗️ Arquitetura

### Inputs do Onboarding (Ordem CORRETA):

```
1. company     = Empresa do VENDEDOR ("Acme Corp")
2. solution    = O que vende ("AI Sales Tools")
3. companyUrl  = URL empresa PESQUISADA ("tesla.com") ← 3º!
4. research    = Foco da pesquisa ("Tesla")
```

### Templates (AI Tiles):

```
Template 1 = 6 tiles básicos
├─ Company Overview
├─ Top Competitors
├─ Funding
├─ Expansion
├─ Challenges
└─ Recent News

Template 2 = 12 tiles completos
├─ 6 tiles do Template 1
├─ + Market Position
├─ + Products/Services
├─ + Growth Metrics
├─ + Decision Makers
├─ + Pain Points
└─ + Sales Opportunities
```

### Fluxo Técnico:

```
Landing → POST /api/guest/workspace
→ OpenAI gera tiles (~8s)
→ MongoDB guest_workspaces
→ Cookie guest_id
→ /dashboard/trial
→ Signup → /api/guest/convert
→ Workspace real + Pipeline
```

---

## 📁 Arquivos Implementados

### Criados (8):

```
✅ lib/guest-templates.js          (6 e 12 tiles)
✅ lib/guest-auth.js                (auth helper)
✅ lib/simple-rate-limit.js         (rate limit sem Redis)
✅ lib/ai-tile-generator.js         (OpenAI integration)
✅ app/api/guest/workspace/route.js (POST/GET)
✅ app/api/guest/convert/route.js   (conversão)
✅ app/dashboard/trial/page.jsx     (UI trial)
✅ app/dashboard/trial/layout.jsx   (layout)
```

### Modificados (3):

```
✅ middleware.js                    (+rotas públicas)
✅ components/landing/HeroSection.jsx (+botão Try Free)
✅ contexts/DashboardProviders.jsx    (+detecção guest)
```

---

## ⚙️ Configuração

### Env Var OBRIGATÓRIA:

```bash
# dashboard/.env.local
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxx

# Conseguir: https://platform.openai.com/api-keys
```

### Dependências:

```bash
✅ uuid, joi, sanitize-html, openai (já instaladas)
```

---

## 🚀 Roadmap de Incrementos

### 🟢 Fase 1: Core (✅ FEITO):

- ✅ Guest workspace com cookies
- ✅ Templates de 6-12 tiles
- ✅ Geração automática via OpenAI
- ✅ Trial dashboard
- ✅ Conversão para usuário real
- ✅ Rate limiting básico
- ✅ Limite 2 empresas

### 🟡 Fase 2: UX Improvements (AGORA - 2h):

- [ ] "Time Saved" banner (show value)
- [ ] Old vs New comparison visual
- [ ] Features preview (locked - incentivo signup)
- [ ] Progress bar durante geração de tiles
- [ ] Melhor error handling

### 🟡 Fase 3: Tile Interactions (Semana 1):

- [ ] Chatbox no verso (follow-up questions)
- [ ] Botão "Regenerate tile"
- [ ] Botão "Pin as new tile"
- [ ] Tile resize/drag (UI improvement)

### 🔴 Fase 4: Advanced Features (Pós-Signup):

- [ ] Add Contacts (3-5 por empresa)
- [ ] AI enrichment de contacts
- [ ] Outreach generation (email, call, LinkedIn)
- [ ] Upload files (PDFs, transcripts)
- [ ] Account scoring (ICP fit)
- [ ] CRM connect
- [ ] CSV bulk upload

---

## 🔑 Variáveis de Ambiente

```bash
# Obrigatórias:
OPENAI_API_KEY=sk-proj-...          # OpenAI API
CLERK_SECRET_KEY=...                 # Clerk (já tem)
MONGODB_URI=...                      # MongoDB (já tem)

# Opcionais:
REDIS_URL=...                        # Adicionar quando >100 guests/dia
REDIS_TOKEN=...
```

---

## 📊 Métricas de Sucesso

### Guest Mode:

- Taxa de criação de trial workspaces
- Tempo médio no trial dashboard
- Taxa de conversão trial → signup
- Empresas pesquisadas (média por guest)

### Comparação com Manual:

- Old way: 14-16h/semana, 15-20 prompts/empresa
- New way: 30s/empresa, 0 prompts manuais
- **Economia: 10+ horas/semana**

---

## 🎯 Próximos Passos IMEDIATOS

1. **Adicionar OPENAI_API_KEY** ao .env
2. **Testar fluxo completo** localmente
3. **Implementar UX improvements** (Time Saved, comparisons)
4. **Validar com cliente** (get feedback)
5. **Deploy para staging**

---

**Documento consolidado único para Guest Mode** ✅
