# ❓ Respostas sobre Guest Mode

## 1. Por que 2 templates?

**Resposta**: Para o guest ESCOLHER quantos tiles de AI quer ver!

```
Template 1 = 6 tiles básicos (rápido, essencial)
Template 2 = 12 tiles completos (análise profunda)

É como Netflix:
├─ Plano Básico = menos conteúdo
└─ Plano Premium = mais conteúdo
```

**Na landing page**:

```jsx
<select>
  <option value="template_1">📊 Quick Research (6 AI tiles)</option>
  <option value="template_2">🔍 Deep Research (12 AI tiles)</option>
</select>
```

---

## 2. O que é "Competitors" e "News"?

**Resposta**: São **TILES de AI** (não sections manuais!)

### ❌ O que EU pensei (ERRADO):

```
Competitors = Section onde guest DIGITA concorrentes manualmente
News = Section onde guest DIGITA notícias manualmente
```

### ✅ O que o BRIEF diz (CORRETO):

```
Competitors = TILE onde OPENAI pesquisa e preenche AUTOMATICAMENTE
News = TILE onde OPENAI busca e preenche AUTOMATICAMENTE

Guest NÃO digita NADA!
Guest só VÊ os resultados!
```

### Exemplo Visual:

```
Guest preenche landing:
├─ Company: "Tesla"
└─ Clica "Try Free"

Dashboard carrega com 6 tiles JÁ PREENCHIDOS pela AI:

┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Overview    │  │ Competitors │  │ Funding     │
│             │  │             │  │             │
│ Tesla is... │  │ 1. BYD      │  │ Series A... │
│ (AI gerou!) │  │ 2. Ford     │  │ (AI gerou!) │
│             │  │ (AI gerou!) │  │             │
└─────────────┘  └─────────────┘  └─────────────┘

┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Expansion   │  │ Challenges  │  │ Recent News │
│             │  │             │  │             │
│ Expanding   │  │ Supply      │  │ 1. New      │
│ to China... │  │ chain...    │  │ Cybertruck  │
│ (AI gerou!) │  │ (AI gerou!) │  │ (AI gerou!) │
└─────────────┘  └─────────────┘  └─────────────┘

Guest NÃO digitou NADA disso!
OpenAI pesquisou e preencheu TUDO! ✨
```

---

## 3. Isso estava no nosso plano?

**Resposta**: SIM! Do **brief do cliente**:

> "Automatically generate a company dashboard with **preset AI prompt tiles**
> (e.g., **competitors, funding, expansion, challenges**)"

Os tiles Competitors, Funding, News, Challenges vêm do brief!

---

## 4. Usuário vai preencher os dados?

**Resposta**: ❌ **NÃO!** A **OpenAI preenche TUDO automaticamente!**

### Fluxo:

```
Guest faz:
├─ Preenche 4 campos na landing
└─ Clica "Try Free"

OpenAI faz (AUTOMATICAMENTE):
├─ Pesquisa competitors da empresa
├─ Busca funding & investimentos
├─ Encontra notícias recentes
├─ Analisa challenges
├─ Identifica opportunities
└─ Preenche TODOS os 6-12 tiles!

Guest faz:
└─ Só VÊ e NAVEGA! Não digita mais nada!
```

---

## 5. Como vai chamar a API do ChatGPT/OpenAI?

**Resposta**: Variável de ambiente `OPENAI_API_KEY`

### Adicione ao `.env.local`:

```bash
# dashboard/.env.local

# ✅ OpenAI API Key (para gerar tiles automaticamente)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Como conseguir:
# 1. Acesse: https://platform.openai.com/api-keys
# 2. Click "Create new secret key"
# 3. Nome: "DashMaster Sales Research"
# 4. Copie a chave (começa com sk-proj-...)
# 5. Cole aqui
```

### No código:

```javascript
// lib/ai-client.js
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // ← Lê automaticamente
});

// Uso:
const answer = await openai.chat.completions.create({
  model: "gpt-4-turbo-preview",
  messages: [
    { role: "system", content: "You are a sales research assistant..." },
    { role: "user", content: "Who are Tesla's competitors?" },
  ],
});
```

**Nome**: `OPENAI_API_KEY` (padrão da indústria)

---

## 📋 Resumo SUPER Simples

### Templates:

```
Template 1 = 6 AI tiles (rápido)
Template 2 = 12 AI tiles (completo)

Guest escolhe qual quer!
```

### Tiles:

```
Tile = Card com pergunta respondida pela AI

Exemplo de tiles:
├─ Competitors (AI lista concorrentes)
├─ Funding (AI busca investimentos)
├─ News (AI encontra notícias)
└─ Challenges (AI analisa problemas)

Guest NÃO preenche!
AI preenche AUTOMATICAMENTE!
```

### OpenAI:

```
Env var: OPENAI_API_KEY=sk-proj-...
Conseguir em: https://platform.openai.com/api-keys
Custo: R$ 0,07-0,15 por guest (barato!)
```

### Fluxo:

```
1. Guest: Preenche 4 campos + escolhe template
2. System: Cria workspace + gera 6-12 tiles via OpenAI
3. Guest: VÊ dashboard completo (tudo preenchido!)
4. Guest: Navega, explora, faz follow-ups
5. Limite: 2 empresas → Signup required
6. Conversão: Guest vira usuário real
```

---

**Agora ficou claro?**

- ✅ 2 templates = escolha de 6 ou 12 tiles
- ✅ Competitors/News = tiles de AI (não manual)
- ✅ OpenAI preenche TUDO
- ✅ Env var: `OPENAI_API_KEY`
- ✅ Guest só vê resultados!

**Posso implementar agora?** 🚀
