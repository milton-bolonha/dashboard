# 🎯 Fluxo de Criação de Tiles e Engenharia de Prompts

## 📋 Índice

1. [Arquitetura do Sistema](#arquitetura-do-sistema)
2. [Fluxo Completo de Criação](#fluxo-completo-de-criação)
3. [Engenharia de Prompts](#engenharia-de-prompts)
4. [Sistema de Tamanhos e Tokens](#sistema-de-tamanhos-e-tokens)
5. [Max Mode: GPT-5-nano vs GPT-5](#max-mode-gpt-5-nano-vs-gpt-5)
6. [Normatização de Configurações da API](#normatização-de-configurações-da-api)
7. [Estratégias de Qualidade](#estratégias-de-qualidade)
8. [Exemplos Práticos](#exemplos-práticos)

---

## 🏗️ Arquitetura do Sistema

### Componentes Principais

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ AddPrompt    │  │ Dashboard    │  │ TileGrid     │  │
│  │ Modal        │  │ ConfigModal  │  │              │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
└─────────┼──────────────────┼──────────────────┼──────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│                    API Routes                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ /api/        │  │ /api/        │  │ /api/        │  │
│  │ generate     │  │ workspace/   │  │ workspace/   │  │
│  │              │  │ tiles        │  │ tiles/[id]   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
└─────────┼──────────────────┼──────────────────┼──────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│              Tile Generation Engine                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │  generateTileContent()                            │  │
│  │  - Resolve model                                  │  │
│  │  - Build prompt                                   │  │
│  │  - Call OpenAI API                                │  │
│  │  - Process response                              │  │
│  │  - Retry logic                                   │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│              OpenAI API                                  │
│  - GPT-5-nano (default)                                 │
│  - GPT-5 (Max Mode)                                     │
│  - GPT-4o-mini (fallback)                              │
└─────────────────────────────────────────────────────────┘
```

### Fluxo de Dados

1. **Usuário cria prompt** → `AddPromptModal`
2. **Modal envia dados** → `AdminContainer.handleCreateCustomPrompt()`
3. **Container chama API** → `POST /api/workspace/tiles`
4. **API valida e processa** → `generateTileContent()`
5. **OpenAI gera resposta** → Retorna conteúdo
6. **API salva tile** → Atualiza workspace
7. **Frontend atualiza** → `mutate()` do SWR

---

## 🔄 Fluxo Completo de Criação

### 1. Criação via Modal (Custom Prompt)

```typescript
// 1. Usuário preenche formulário no AddPromptModal
{
  title: "Market Analysis",
  description: "Analyze the competitive landscape...",
  useMaxPrompt: false,
  requestSize: "medium"
}

// 2. AdminContainer recebe e valida
handleCreateCustomPrompt(promptData)

// 3. API recebe requisição
POST /api/workspace/tiles
{
  title: "Market Analysis",
  prompt: "Analyze the competitive landscape...",
  useMaxPrompt: false,
  requestSize: "medium"
}

// 4. API determina modelo e tokens
const selectedModel = useMaxPrompt ? "gpt-5" : "gpt-5-nano";
const maxTokens = getMaxTokensForSize(requestSize); // 800 para "medium"

// 5. Gera conteúdo
const result = await generateTileContent({
  prompt,
  title,
  model: selectedModel,
  maxTokens,
  ...
});

// 6. Salva no workspace
workspace.company.tiles.push(newTile);
```

### 2. Criação via Template

```typescript
// 1. Usuário seleciona template
templateId: "template_1" // Essential Research

// 2. API resolve template tiles
const template = GUEST_DASHBOARD_TEMPLATES[templateId];
const resolvedTiles = resolveTemplateTiles(template);

// 3. Para cada tile do template:
resolvedTiles.forEach(tile => {
  // Aplica configurações do template
  const model = tile.useMaxMode ? "gpt-5" : "gpt-5-nano";
  const maxTokens = getMaxTokensForRequestSize(tile.requestSize);
  
  // Gera conteúdo
  generateTileContent({ ...tile, model, maxTokens });
});
```

---

## 🎨 Engenharia de Prompts

### Princípios Fundamentais

#### 1. **Clareza e Especificidade**

❌ **Ruim:**
```
"Tell me about the company"
```

✅ **Bom:**
```
"Analyze [COMPANY_NAME]'s recent product launches and market positioning. 
Focus on: (1) Key features released in the last 6 months, 
(2) Competitive advantages mentioned in press releases, 
(3) Target customer segments based on messaging."
```

#### 2. **Estrutura com Variáveis**

```typescript
// Template com variáveis
const prompt = `
Analyze ${companyName}'s ${focusArea}.

Context:
- Sales rep company: ${salesRepCompany}
- Solution: ${solution}
- Target: ${targetCompany}

Provide insights on:
1. ${variable1}
2. ${variable2}
3. ${variable3}
`;
```

#### 3. **Instruções de Formato**

```typescript
// Para respostas sintéticas (Small)
const prompt = `
${basePrompt}

Respond with 2-3 short sentences that synthesize the key insights.
Focus on actionable information only.
`;

// Para respostas detalhadas (Large)
const prompt = `
${basePrompt}

Provide a comprehensive analysis with:
- Executive summary (2-3 sentences)
- Key findings (3-5 bullet points)
- Actionable recommendations (2-3 items)
- Supporting evidence (brief citations)
`;
```

### Processamento de Variáveis

```typescript
// src/lib/guest-templates.ts
function resolvePromptVariables(
  prompt: string,
  variables: Record<string, string>
): string {
  let resolved = prompt;
  
  // Substitui variáveis do tipo ${VAR_NAME}
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
    resolved = resolved.replace(regex, value);
  });
  
  return resolved;
}
```

### Exemplos de Prompts por Categoria

#### **Sales & Outreach**

```typescript
{
  title: "CEO Sales Email",
  prompt: `
Write a personalized sales email to ${contactName}, ${jobTitle} at ${companyName}.

Context:
- We're ${salesRepCompany}, offering ${solution}
- ${companyName} recently ${recentNews}
- ${contactName} is likely interested in ${painPoint}

Email should:
1. Open with specific reference to ${companyName}'s situation
2. Connect our solution to their needs
3. Include clear CTA for next steps
4. Keep tone professional but warm
`,
  category: "sales",
  requestSize: "medium", // Email completo precisa de mais tokens
  useMaxMode: true, // Qualidade é importante para sales
}
```

#### **Research & Analysis**

```typescript
{
  title: "Competitive Landscape",
  prompt: `
Analyze ${targetCompany}'s position in the ${industry} market.

Focus on:
- Top 3 competitors and their market share
- ${targetCompany}'s unique value propositions
- Recent market movements (funding, acquisitions, launches)
- Opportunities for ${salesRepCompany} to position ${solution}

Provide concise insights suitable for a sales conversation.
`,
  category: "research",
  requestSize: "small", // Respostas rápidas para sales
  useMaxMode: false, // GPT-5-nano suficiente para pesquisa
}
```

---

## 📊 Sistema de Tamanhos e Tokens

### Mapeamento Request Size → Max Tokens

| Request Size | Max Tokens | Caracteres Aprox. | Uso Recomendado |
|--------------|------------|-------------------|----------------|
| **Small**    | 400        | ~200-400         | Respostas rápidas, sínteses |
| **Medium**   | 800        | ~600-800         | Análises moderadas, emails |
| **Large**    | 1600       | ~1200-1600       | Relatórios completos |

### Implementação

```typescript
// src/app/api/workspace/tiles/route.ts
function getMaxTokensForSize(size: "small" | "medium" | "large"): number {
  switch (size) {
    case "small": return 400;
    case "medium": return 800;
    case "large": return 1600;
    default: return 400;
  }
}
```

### Quando Usar Cada Tamanho

#### **Small (400 tokens)**
- ✅ Respostas para conversas rápidas
- ✅ Sínteses executivas
- ✅ Bullet points de insights
- ✅ Quick wins para sales

#### **Medium (800 tokens)**
- ✅ Emails de outreach completos
- ✅ Análises de mercado moderadas
- ✅ Scripts de cold call
- ✅ Recomendações detalhadas

#### **Large (1600 tokens)**
- ✅ Relatórios completos
- ✅ Análises competitivas profundas
- ✅ Documentos de estratégia
- ✅ Propostas comerciais

---

## ⚡ Max Mode: GPT-5-nano vs GPT-5

### Comparação de Modelos

| Aspecto | GPT-5-nano (Default) | GPT-5 (Max Mode) |
|---------|---------------------|------------------|
| **Custo** | Baixo (~$0.01/1k tokens) | Alto (~$0.10/1k tokens) |
| **Velocidade** | Rápido (~1-2s) | Moderado (~3-5s) |
| **Qualidade** | Boa para sínteses | Excelente para análises |
| **Uso** | Respostas rápidas, pesquisa | Análises profundas, sales |

### Quando Usar Max Mode

#### ✅ **Use Max Mode (GPT-5) quando:**

1. **Qualidade é crítica**
   - Emails de outreach para prospects importantes
   - Análises competitivas para decisões estratégicas
   - Relatórios para stakeholders

2. **Complexidade alta**
   - Análises multi-fatoriais
   - Sínteses de múltiplas fontes
   - Recomendações estratégicas

3. **Large Request Size**
   - Respostas longas requerem melhor compreensão
   - GPT-5 mantém coerência em textos maiores

#### ❌ **Não use Max Mode quando:**

1. **Respostas rápidas**
   - Quick insights para conversas
   - Sínteses simples
   - Pesquisa básica

2. **Custo é preocupação**
   - Muitas requisições simultâneas
   - Uso em massa
   - Testes e protótipos

### Implementação

```typescript
// Determinação do modelo
const selectedModel = useMaxMode 
  ? "gpt-5"           // Max Mode: modelo mais poderoso
  : "gpt-5-nano";    // Default: modelo econômico

// Resolução do modelo (com fallback)
const resolvedModel = resolveModel(selectedModel);
// Se gpt-5 não disponível → gpt-4o
// Se gpt-5-nano não disponível → gpt-4o-mini
```

---

## 🔧 Normatização de Configurações da API

### Estratégia Atual

**Normatização por Request Size**: Cada tamanho tem configurações padronizadas.

```typescript
interface NormalizedConfig {
  small: {
    model: "gpt-5-nano";
    maxTokens: 400;
    temperature: 0.7;
  };
  medium: {
    model: "gpt-5-nano" | "gpt-5"; // Depende de useMaxMode
    maxTokens: 800;
    temperature: 0.7;
  };
  large: {
    model: "gpt-5"; // Sempre Max Mode
    maxTokens: 1600;
    temperature: 0.8; // Mais criatividade para textos longos
  };
}
```

### Estrutura Padronizada de Payload

```typescript
// Payload normalizado para todas as requisições
interface NormalizedTileRequest {
  prompt: string;
  title: string;
  model: string;              // Resolvido: gpt-5-nano ou gpt-5
  maxTokens: number;         // Baseado em requestSize
  temperature: number;       // Padronizado por size
  templateId?: string;
  templateTileId?: string;
  category?: string;
}
```

### Parâmetros Padronizados

```typescript
// src/lib/ai/tile-generation.ts
const DEFAULT_TEMPERATURE = 0.7;

// Por request size
const TEMPERATURE_BY_SIZE = {
  small: 0.7,   // Mais focado
  medium: 0.7,  // Balanceado
  large: 0.8,   // Mais criativo para textos longos
};
```

### Tratamento de Erros Padronizado

```typescript
// Retry logic padronizado
const MAX_GENERATION_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 300;

async function generateWithRetry(options: TileGenerationOptions) {
  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
    try {
      return await generateTileContent(options);
    } catch (error) {
      if (attempt === MAX_GENERATION_ATTEMPTS) throw error;
      await delay(RETRY_BASE_DELAY_MS * attempt);
    }
  }
}
```

---

## 🎯 Estratégias de Qualidade

### Filosofia: Frases Sintéticas, Não Bullets

**Antes (Bullets curtos):**
```
- Company raised $50M
- Launched new product
- Hired 20 people
```

**Agora (Frases sintéticas):**
```
Company raised $50M Series B, signaling strong growth trajectory. 
Recent product launch targets enterprise market, with 20 new hires 
focused on sales and engineering expansion.
```

### Por Request Size

#### **Small: Frases Curtas Sintéticas**

```typescript
const systemPrompt = `
You are a research analyst providing concise insights.

Guidelines:
- Respond with 2-3 short sentences that synthesize key information
- Focus on actionable insights, not just facts
- Avoid bullet points; use flowing prose
- Maximum 400 tokens
`;
```

**Exemplo de Resposta:**
```
Tesla's Q3 earnings exceeded expectations with record deliveries, 
driven by strong demand for Model Y. The company's expansion into 
energy storage presents new revenue opportunities beyond automotive.
```

#### **Medium: Frases Mais Detalhadas**

```typescript
const systemPrompt = `
You are a research analyst providing detailed insights.

Guidelines:
- Respond with 3-5 sentences that provide context and analysis
- Include specific examples and data points
- Connect insights to business implications
- Maximum 800 tokens
`;
```

**Exemplo de Resposta:**
```
Tesla's Q3 earnings exceeded expectations with record deliveries of 
435,000 vehicles, representing 27% year-over-year growth. The Model Y 
continues to dominate the electric SUV market, with strong demand 
driven by competitive pricing and Supercharger network expansion. 
Notably, Tesla's energy storage segment grew 40% quarter-over-quarter, 
signaling diversification beyond automotive. This expansion positions 
Tesla to capture value from both vehicle sales and grid-scale energy 
solutions, creating a more resilient revenue model.
```

#### **Large: Respostas Completas e Elaboradas**

```typescript
const systemPrompt = `
You are a senior research analyst providing comprehensive analysis.

Guidelines:
- Provide executive summary (2-3 sentences)
- Detailed analysis with multiple perspectives
- Include supporting evidence and context
- Actionable recommendations
- Maximum 1600 tokens
`;
```

**Exemplo de Resposta:**
```
Executive Summary:
Tesla's Q3 2024 performance demonstrates strong execution across 
automotive and energy segments, with record deliveries and expanding 
margins positioning the company for sustained growth.

Detailed Analysis:
Tesla delivered 435,000 vehicles in Q3, exceeding analyst expectations 
by 5% and representing 27% year-over-year growth. The Model Y continues 
to dominate the electric SUV market, accounting for 60% of total 
deliveries. Strong demand is driven by competitive pricing ($47,740 
starting price) and the expanding Supercharger network, which now 
includes 50,000+ stations globally.

The energy storage segment showed remarkable growth, with 40% 
quarter-over-quarter increase in deployments. Tesla's Megapack 
installations for grid-scale storage reached 3.9 GWh, driven by 
increasing demand for renewable energy integration. This diversification 
beyond automotive creates a more resilient revenue model, with energy 
storage now representing 8% of total revenue.

Market Implications:
Tesla's expansion into energy storage positions it to capture value 
from both vehicle sales and grid-scale solutions. The company's 
vertical integration strategy—from battery production to charging 
infrastructure—creates competitive moats that are difficult for 
competitors to replicate.

Recommendations:
1. Monitor Tesla's energy storage pipeline for partnership opportunities
2. Consider Tesla's Supercharger network expansion when planning 
   electric vehicle strategies
3. Track Model Y pricing trends for competitive positioning
```

### Remoção de Restrições de Bullets

**Antes:**
```typescript
// Prompts antigos forçavam bullets
const prompt = `
Provide insights in bullet format:
- Point 1
- Point 2
- Point 3
`;
```

**Agora:**
```typescript
// Prompts focam em síntese natural
const prompt = `
Provide insights that synthesize the key information. 
Use natural prose that flows well, focusing on actionable 
insights rather than lists.
`;
```

---

## 💡 Exemplos Práticos

### Exemplo 1: Tile de Pesquisa Rápida

```typescript
{
  title: "Quick Market Signals",
  prompt: `
Analyze ${companyName}'s recent market activity and provide 
2-3 sentences synthesizing the most important signals for 
sales outreach.
`,
  requestSize: "small",
  useMaxMode: false,
  expectedOutput: "2-3 frases sintéticas sobre sinais de mercado"
}
```

### Exemplo 2: Tile de Email de Outreach

```typescript
{
  title: "Personalized Outreach Email",
  prompt: `
Write a personalized sales email to ${contactName} at ${companyName}.
Connect our ${solution} to their recent ${recentNews}.
Keep tone professional but warm, with clear CTA.
`,
  requestSize: "medium",
  useMaxMode: true,
  expectedOutput: "Email completo de 3-4 parágrafos"
}
```

### Exemplo 3: Tile de Análise Competitiva

```typescript
{
  title: "Competitive Analysis",
  prompt: `
Provide comprehensive competitive analysis of ${targetCompany} 
in the ${industry} market. Include: market position, key 
competitors, unique value props, and opportunities for ${solution}.
`,
  requestSize: "large",
  useMaxMode: true,
  expectedOutput: "Análise completa com múltiplas seções"
}
```

---

## 📍 Arquivos de Referência

- **Templates**: `src/lib/guest-templates.ts`
- **Geração de Tiles**: `src/lib/ai/tile-generation.ts`
- **API Generate**: `src/app/api/generate/route.ts`
- **API Workspace Tiles**: `src/app/api/workspace/tiles/route.ts`
- **Configurações AI**: `src/lib/ai/settings.ts`
- **Modal Add Prompt**: `src/components/admin/ade/AddPromptModal.tsx`
- **Modal Config Templates**: `src/components/admin/ade/DashboardConfigModal.tsx`

---

## 🎓 Boas Práticas

1. **Sempre use variáveis** nos prompts para personalização
2. **Escolha o tamanho certo** baseado no uso (Small para quick insights, Large para análises)
3. **Use Max Mode apenas quando necessário** (qualidade crítica ou Large size)
4. **Foque em síntese**, não em bullets curtos
5. **Teste prompts** antes de adicionar a templates
6. **Monitore custos** especialmente com Max Mode ativado
7. **Documente templates customizados** para reutilização

---

**Última atualização**: 2024-11-13
**Versão**: 1.0

