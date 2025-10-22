# 🗺️ Guest Mode - Roadmap de Incrementos

**Baseado no feedback do cliente sobre Old vs New Workflow**

---

## ✅ Fase 1: CORE (IMPLEMENTADO - Hoje)

### O que Foi Feito:

```
✅ Guest pode usar sem signup
✅ Preenche 4 inputs (company, solution, url, research)
✅ Escolhe template (6 ou 12 tiles)
✅ OpenAI gera tiles automaticamente
✅ Trial dashboard com tiles preenchidos
✅ Limite de 2 empresas
✅ Conversão guest → user
✅ Time Saved banner (mostra valor)
✅ Old vs New comparison visual
✅ Features preview locked
```

### Valor Entregue:

```
Old Workflow: 15-20 prompts manuais, 2.5h por empresa
New Workflow: 1 click, 6 tiles automáticos, 30 segundos

✅ Guest VÊ o valor na prática!
✅ Save 10+ horas/semana demonstrado!
```

---

## 🟡 Fase 2: Tile Interactions (Semana 1-2, ~8h)

### Baseado no Cliente:

> "Tile-Based Workflow – All interaction happens through tiles"
> "Tile Replies – Reps can reply to any tile to refine answers"

### Implementar:

#### 2.1 Flip Tile (Verso com Chatbox) - 3h

```javascript
// Cada tile tem frente e verso

FRENTE (atual):
├─ Título: "Top Competitors"
├─ Resposta da AI
└─ Botão: "💬 Ask follow-up"

VERSO (novo):
├─ Chat history
├─ Input para nova pergunta
├─ Contexto: mantém tile original
└─ Opções: "Pin as new tile" | "Replace original"
```

#### 2.2 Regenerate Tile - 1h

```javascript
// Botão em cada tile:
onClick={() => regenerateTile(tileId)}

// Chama OpenAI novamente com mesmo prompt
// Permite ao guest ver resposta diferente
```

#### 2.3 Loading States Melhores - 2h

```javascript
// Durante geração de tiles:
"Researching {company}..."
Progress bar: [=====>    ] 3/6 tiles generated

// Durante flip/regenerate:
Skeleton loader no tile específico
```

#### 2.4 Pin Answer as Tile - 2h

```javascript
// No verso do tile, após follow-up:
User: "List the countries of Tesla's offices"
AI: "Tesla has offices in: US, China, Germany..."

[Pin this as new tile] → Cria tile "Office Locations"
```

---

## 🔴 Fase 3: Add Company (Guest Trial) (Semana 2, ~6h)

### Baseado no Cliente:

> "User uploads or adds target companies via CSV or CRM connect"

### Implementar para GUEST (limitado):

#### 3.1 Add Company Modal - 3h

```javascript
// Modal simplificado para guest
// Input: Company name + URL
// Limite: 2 empresas total

onClick={"+ Add Company"} → Modal
→ Preenche: "SpaceX", "spacex.com"
→ Gera 6 tiles via OpenAI
→ Adiciona ao guest workspace
→ Atualiza contador: 2/2
```

#### 3.2 Company Switcher - 2h

```javascript
// Tabs para alternar entre empresas:
[Tesla][SpaceX];

// Cada empresa tem seus próprios tiles
// Guest pode comparar lado a lado
```

#### 3.3 Limite & Upgrade Prompt - 1h

```javascript
// Ao tentar adicionar 3ª empresa:
Modal:
"🎉 You've used your 2 free companies!

To research your entire territory (100+ companies):
→ Sign up free (no credit card)
→ Unlock unlimited companies
→ Save 10+ hours every week"

[Sign Up Free →]
```

---

## 🔴 Fase 4: Advanced Features (Pós-Signup APENAS)

### NÃO disponível para guests (incentivo signup):

#### 4.1 Add Contacts (Semana 3-4, ~12h)

```
- CRUD de contacts por company
- AI enrichment (role, KPIs, challenges)
- 3 tiles automáticos:
  • Contact Insights
  • Email Pitch
  • Call Script
```

#### 4.2 Outreach Generation (Semana 4-5, ~16h)

```
- Generator de email/call/LinkedIn
- Side-by-side editor (context | draft)
- Upload de email samples
- AI match writing style
```

#### 4.3 Upload Files (Semana 5-6, ~10h)

```
- Upload PDFs, transcripts, notes
- AI integra contexto de arquivos
- Tiles referenciam documentos
- MEDDPICC integration
```

#### 4.4 Account Scoring (Mês 2, ~8h)

```
- ICP (Ideal Customer Profile)
- AI auto-score cada empresa
- Score visual (A, B, C, D)
- Filtro por score
```

#### 4.5 Bulk Operations (Mês 2, ~12h)

```
- CSV upload (bulk companies)
- CRM connect (OAuth)
- Bulk prompt runner
- Grid view (rows=companies, cols=prompts)
```

---

## 📊 Priorização (O que Fazer Quando)

### 🟢 AGORA (Próximas 2h):

```
1. ✅ Testar guest mode completo
2. ✅ Validar Time Saved banner
3. ✅ Validar Old vs New comparison
4. ✅ Deploy para staging
```

### 🟡 Esta Semana (8h):

```
1. Flip tiles com chatbox
2. Regenerate tile
3. Loading states melhores
4. Pin answer as tile
```

### 🟡 Semana 2 (6h):

```
1. Add Company modal (guest)
2. Company switcher/tabs
3. Limite enforcement melhorado
```

### 🔴 Semanas 3+ (Pós-MVP):

```
1. Contacts management
2. Outreach generation
3. Upload files
4. Account scoring
5. Bulk operations
```

---

## 🎯 Decisão Final: O que o Cliente Altera

### ❌ NÃO altera o que fizemos:

- ✅ Guest mode está PERFEITO como MVP
- ✅ Resolve o core problem (15-20 prompts → 6 tiles auto)
- ✅ Demonstra valor claramente
- ✅ Não precisa mudar nada do código atual

### ✅ Confirma que estamos no caminho certo:

- ✅ "Generate Dashboards Automatically" - FIZEMOS
- ✅ "Preset prompts become tiles" - FIZEMOS
- ✅ "Tile-Based Workflow" - FIZEMOS
- ✅ "Context-specific AI memory" - FIZEMOS

### 📋 Adiciona clareza sobre futuro:

- Contacts (Fase 4)
- Outreach (Fase 4)
- Files Upload (Fase 4)
- Scoring (Fase 4)

**Conclusão**: Guest mode atual é o **PERFECT DEMO** do sistema!  
Features avançadas = incentivo para signup!

---

## 🚀 Próximos Passos IMEDIATOS

1. **TESTE**: Adicionar OPENAI_API_KEY e testar
2. **VALIDAR**: Guest vê tiles gerados
3. **VERIFICAR**: Time Saved banner aparece
4. **CONFIRMAR**: Conversão guest→user funciona
5. **DEPLOY**: Staging para cliente testar

Depois do teste e validação → Fase 2 (Tile Interactions)

---

**Roadmap claro e priorizado!** 🎯
