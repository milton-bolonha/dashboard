# 🎯 Guest Mode + AI Tiles - Como Funciona REALMENTE

## 📋 Baseado no Brief do Cliente

### O Sistema Real:

```
Guest preenche na landing:
├─ Company: "Tesla"
├─ Company URL: "tesla.com"
├─ Solution: "AI Sales Tools"
└─ Research: "Automotive Industry"

↓ Clica "Try Free"

Dashboard criado automaticamente com TILES:
├─ Tile "Competitors" → OpenAI pesquisa → Preenche automaticamente
├─ Tile "Funding" → OpenAI pesquisa → Preenche automaticamente
├─ Tile "Expansion" → OpenAI pesquisa → Preenche automaticamente
├─ Tile "Challenges" → OpenAI pesquisa → Preenche automaticamente
└─ Guest APENAS VÊ os resultados! Não digita nada!
```

## 🤖 Como a OpenAI Preenche os Tiles

### Exemplo: Tile "Competitors"

```javascript
// 1. Guest acabou de criar workspace para "Tesla"

// 2. Sistema cria tile "Competitors" com prompt:
const tilePrompt = "Who are the main competitors of {company_name}?";

// 3. Processa variáveis:
const processedPrompt = "Who are the main competitors of Tesla?";

// 4. Chama OpenAI:
const response = await openai.chat.completions.create({
  model: "gpt-4-turbo-preview",
  messages: [
    {
      role: "system",
      content: "You are a sales research assistant.
                User is a sales rep at XYZ Company
                They sell: AI Sales Tools
                They're researching: Automotive Industry"
    },
    {
      role: "user",
      content: "Who are the main competitors of Tesla?"
    }
  ],
});

// 5. OpenAI responde:
/*
"Tesla's main competitors include:

1. **BYD** - Chinese EV manufacturer, leading in China market
2. **Ford** - F-150 Lightning competing in pickup segment
3. **Rivian** - Adventure/luxury EV segment
4. **GM** - Chevrolet Bolt and upcoming models
5. **Volkswagen** - ID series expanding globally

Each competes on different segments and markets..."
*/

// 6. Sistema salva no tile e MOSTRA para o guest
// Guest vê resposta instantaneamente! ✨
```

## 🎨 Como o Tile Aparece para o Guest

```
┌────────────────────────────────────────────────┐
│ 🏢 Top Competitors                             │
│                                                │
│ Tesla's main competitors include:              │
│                                                │
│ 1. **BYD** - Chinese EV manufacturer, leading  │
│    in China market                             │
│                                                │
│ 2. **Ford** - F-150 Lightning competing in     │
│    pickup segment                              │
│                                                │
│ 3. **Rivian** - Adventure/luxury EV segment    │
│                                                │
│ ... (OpenAI gerou TUDO automaticamente!)       │
│                                                │
│ [💬 Ask follow-up question] [🔄 Regenerate]    │
└────────────────────────────────────────────────┘
```

## 🔑 Variável de Ambiente: OPENAI_API_KEY

### Adicione ao seu `.env.local`:

```bash
# dashboard/.env.local

# ✅ OpenAI API (OBRIGATÓRIO para AI tiles)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxx

# Como conseguir:
# 1. Acesse: https://platform.openai.com/api-keys
# 2. Create new secret key
# 3. Copie a chave (sk-proj-...)
# 4. Cole aqui
```

**Nome da variável**: `OPENAI_API_KEY`  
**Por quê?** Padrão oficial da OpenAI (todas libs reconhecem)

## 📊 Template 1 vs Template 2 - CORRIGIDO

### Template 1 - "Essential Research" (6 tiles)

```
TILES (OpenAI preenche automaticamente):
├─ 1. Company Overview (quem são, o que fazem)
├─ 2. Top Competitors (concorrentes principais)
├─ 3. Funding & Financials (investimentos, valuation)
├─ 4. Expansion & Growth (planos de crescimento)
├─ 5. Key Challenges (dificuldades, pain points)
└─ 6. Recent News (notícias últimos 30 dias)

Guest escolhe: Análise rápida e direta
```

### Template 2 - "Deep Research" (12 tiles)

```
TILES (OpenAI preenche automaticamente):

📌 Basic (3 tiles):
├─ 1. Company Profile (perfil detalhado)
├─ 2. Products & Services (catálogo completo)
└─ 3. Company Culture (valores, missão)

📊 Market (3 tiles):
├─ 4. Market Position (posicionamento)
├─ 5. Competitive Landscape (análise competitiva)
└─ 6. Market Trends (tendências da indústria)

💰 Financial (2 tiles):
├─ 7. Funding History (histórico completo)
└─ 8. Growth Metrics (métricas de crescimento)

🎯 Opportunities (2 tiles):
├─ 9. Pain Points (problemas identificados)
└─ 10. Sales Opportunities (onde podemos ajudar)

📰 Insights (2 tiles):
├─ 11. Recent News (últimos 60 dias)
└─ 12. Decision Makers (quem procurar)

Guest escolhe: Análise completa e profunda
```

## 🔧 Como o Sistema Funciona (Técnico)

### Fluxo Completo:

```javascript
// 1. Guest cria workspace
POST /api/guest/workspace
  ├─ Body: { template_id: 'template_1', context: {...} }
  ├─ Sistema cria guest workspace
  └─ Aplica template (6 tiles)

// 2. Para cada tile do template:
const template = getGuestTemplate('template_1');

for (const tile of template.tiles) {
  // 2.1 Processar variáveis do prompt
  const prompt = processPromptVariables(tile.prompt, context);
  // "Who are the main competitors of Tesla?"

  // 2.2 Chamar OpenAI
  const answer = await generateTileContent(prompt, context);

  // 2.3 Salvar tile com resposta
  await saveTileToGuestWorkspace(guestId, {
    tileId: tile.id,
    question: prompt,
    answer: answer,
    generatedAt: new Date(),
  });
}

// 3. Guest vê dashboard com TODOS os tiles preenchidos! ✨
```

### Código Real da Geração:

```javascript
// lib/ai-tile-generator.js
import OpenAI from "openai";
import { processPromptVariables } from "./guest-templates";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Gera conteúdo de um tile usando OpenAI
 */
export async function generateTileContent(tilePrompt, companyContext) {
  // Processar variáveis: {company_name} → "Tesla"
  const processedPrompt = processPromptVariables(tilePrompt, companyContext);

  console.log("🤖 Gerando tile:", processedPrompt);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are an expert sales research assistant.

Context:
- User is a sales rep at: ${companyContext.company}
- User's company website: ${companyContext.companyUrl}
- User sells: ${companyContext.solution}
- Research target: ${companyContext.research}

Provide detailed, actionable insights focused on sales opportunities.
Format answers in clear, concise markdown.`,
        },
        {
          role: "user",
          content: processedPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const answer = completion.choices[0].message.content;

    console.log("✅ Tile gerado com sucesso!");

    return answer;
  } catch (error) {
    console.error("❌ Erro ao gerar tile:", error);

    // Fallback para erro
    return `Error generating content: ${error.message}. Please try again.`;
  }
}

/**
 * Gera TODOS os tiles de um template automaticamente
 */
export async function generateAllTiles(template, companyContext, guestId) {
  console.log(
    `🚀 Gerando ${template.tiles.length} tiles para ${companyContext.company}...`
  );

  const results = [];

  for (const tile of template.tiles) {
    const answer = await generateTileContent(tile.prompt, companyContext);

    results.push({
      ...tile,
      answer: answer,
      generatedAt: new Date(),
    });

    // Delay para evitar rate limiting da OpenAI
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log("✅ Todos os tiles gerados!");

  return results;
}
```

## 🎯 Diferença Fundamental

### ❌ O que eu pensei (ERRADO):

```
Guest preenche formulários manualmente:
├─ Digita nome do concorrente 1
├─ Digita nome do concorrente 2
├─ Digita notícia 1
└─ Muito trabalho! ❌
```

### ✅ O que o Brief diz (CORRETO):

```
Guest só informa a empresa:
├─ Nome: "Tesla"
└─ URL: "tesla.com"

OpenAI faz TODO o trabalho:
├─ Pesquisa concorrentes automaticamente
├─ Busca funding automaticamente
├─ Encontra notícias automaticamente
└─ Preenche TUDO! Guest só VÊ! ✅
```

## 💰 Custo da OpenAI

### Por Guest:

```
Template 1 (6 tiles):
├─ 6 prompts x ~800 tokens = ~4.800 tokens output
├─ Custo com GPT-4-turbo: ~$0.015
└─ R$ 0,07 por guest

Template 2 (12 tiles):
├─ 12 prompts x ~800 tokens = ~9.600 tokens output
├─ Custo com GPT-4-turbo: ~$0.030
└─ R$ 0,15 por guest

✅ MUITO BARATO! Mesmo com 100 guests/dia = R$ 7-15/dia
```

## 🚀 Fluxo Corrigido

```
1. LANDING
   Guest preenche: Tesla, tesla.com, AI Sales, Automotive
   ↓

2. POST /api/guest/workspace
   ├─ Cria guest workspace
   ├─ Escolhe template (6 ou 12 tiles)
   ├─ Para cada tile:
   │  ├─ Chama OpenAI
   │  ├─ Salva resposta
   │  └─ Delay 500ms (evitar rate limit)
   ├─ Mostra loading: "Researching Tesla..."
   └─ Responde quando TODOS tiles estão prontos
   ↓

3. /dashboard/trial
   ✅ Dashboard COM TODOS OS TILES PREENCHIDOS!
   Guest só VÊ e NAVEGA!
   Não precisa digitar NADA!
   ↓

4. Guest explora tiles
   ├─ Clica tile "Competitors" → Vê análise completa
   ├─ Clica tile "Funding" → Vê histórico de investimentos
   ├─ Clica verso do tile → Faz pergunta follow-up
   └─ "Compare Tesla vs BYD pricing"
   ↓

5. Limite (2 empresas)
   Tenta adicionar 3ª empresa → Bloqueado
   Modal: "Sign up for unlimited companies and tiles"
```

## 🔑 Env Vars Necessárias

```bash
# dashboard/.env.local

# ✅ OpenAI (OBRIGATÓRIO)
OPENAI_API_KEY=sk-proj-...

# ✅ Clerk (já tem)
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
NEXT_PUBLIC_CLERK_FRONTEND_API=...

# ✅ MongoDB (já tem)
MONGODB_URI=...
MONGODB_DB=...

# ⏳ Redis (OPCIONAL - adicionar depois)
# REDIS_URL=...
# REDIS_TOKEN=...
```

---

## 📊 Resumo: O que mudou no plano?

| Conceito              | Antes (ERRADO)                     | Depois (CORRETO)            |
| --------------------- | ---------------------------------- | --------------------------- |
| **Template**          | Sections do CMS                    | Tiles de AI prompts         |
| **Competitors**       | Section para preencher manualmente | Tile que OpenAI preenche    |
| **News**              | Section para preencher manualmente | Tile que OpenAI preenche    |
| **Quem preenche**     | Guest digita                       | OpenAI gera automaticamente |
| **Trabalho do guest** | Muito                              | Nenhum! Só vê os resultados |

---

## ✅ Plano FINAL Corrigido

### Guest Mode agora é:

1. ✅ Guest preenche 4 campos (company, url, solution, research)
2. ✅ Escolhe template (6 ou 12 tiles)
3. ✅ Sistema cria workspace + gera TODOS os tiles via OpenAI
4. ✅ Guest VÊ dashboard completo (tudo preenchido!)
5. ✅ Guest explora, faz follow-ups
6. ✅ Limite 2 empresas → Signup
7. ✅ Conversão → workspace real + pipeline

**Nome da env var**: `OPENAI_API_KEY`  
**Onde conseguir**: https://platform.openai.com/api-keys  
**Custo**: ~R$ 0,07-0,15 por guest (barato!)

---

**Agora sim está correto!** Posso implementar? 🚀
