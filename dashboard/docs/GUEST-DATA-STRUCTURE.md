# 📊 Guest Mode - Estrutura de Dados CORRETA

## ✅ Contexto do Onboarding (4 inputs)

### Ordem CORRETA dos Inputs (conforme pedido):

```
1. company     = Empresa do VENDEDOR (ex: "Acme Corp")
2. solution    = O que o vendedor VENDE (ex: "AI Sales Tools")
3. companyUrl  = URL da empresa A PESQUISAR (ex: "tesla.com") ← MUDOU!
4. research    = Empresa a pesquisar + foco (ex: "Tesla")
```

### Placeholders CORRETOS:

```javascript
Input 1: "I am a sales rep at"             → Vendedor digita: "Acme Corp"
Input 2: "I am selling solutions for"      → Vendedor digita: "AI Sales Tools"
Input 3: "Company to research (URL)"       → Vendedor digita: "tesla.com" ← CORRIGIDO!
Input 4: "I want to conduct research on"   → Vendedor digita: "Tesla"
```

## 📋 Estrutura MongoDB: guest_workspaces

```javascript
{
  guest_id: "uuid-v4-abc-123",
  created_at: Date,
  expires_at: Date,

  workspace_data: {
    name: "Tesla Research (Trial)", // Nome da empresa PESQUISADA
    template_id: "template_1",

    // Contexto capturado do onboarding
    onboarding: {
      salesRepAt: "Acme Corp",           // Empresa do VENDEDOR
      sellingSolutionsFor: "AI Sales Tools", // O que VENDE
      researchTarget: "Tesla",           // Empresa a PESQUISAR
      targetCompanyUrl: "tesla.com",     // URL da empresa PESQUISADA ← CORRETO!
    },

    // Empresas pesquisadas (máximo 2 no guest mode)
    companies: [
      {
        name: "Tesla",              // Primeira empresa pesquisada
        url: "tesla.com",           // URL da empresa pesquisada
        added_at: Date,
        tiles: [                    // Tiles gerados pela AI
          {
            id: "company_overview",
            title: "Company Overview",
            question: "Overview of Tesla (tesla.com)...",
            answer: "Tesla is an electric vehicle...", // OpenAI gerou
            generatedAt: Date,
          },
          {
            id: "competitors",
            title: "Top Competitors",
            question: "Who are Tesla's competitors?",
            answer: "1. BYD - Chinese EV...",  // OpenAI gerou
            generatedAt: Date,
          },
          // ... mais 4 tiles
        ],
      },
      // Pode adicionar 1 empresa adicional (total 2)
      {
        name: "SpaceX",
        url: "spacex.com",
        tiles: [ /* 6 tiles gerados para SpaceX */ ],
      },
    ],
  },

  usage: {
    companies_count: 2,  // Limite: 2 empresas
    tiles_generated: 12, // 6 tiles x 2 empresas
    api_calls: 12,       // Cada tile = 1 call OpenAI
  },

  converted_to_user_id: null,
  converted_at: null,
}
```

## 🔄 Mapeamento de Variáveis

```javascript
// Do Onboarding → Para os Prompts

context.company      → {sales_rep_company}  // "Acme Corp"
context.solution     → {user_solution}      // "AI Sales Tools"
context.research     → {target_company}     // "Tesla"
context.companyUrl   → {target_url}         // "tesla.com" ← EMPRESA PESQUISADA!
```

### Exemplo de Prompt Processado:

```javascript
// Prompt do template:
"What are the main challenges facing {target_company}?
As someone from {sales_rep_company} selling {user_solution},
what problems could we help solve?"

// Após processar variáveis:
"What are the main challenges facing Tesla?
As someone from Acme Corp selling AI Sales Tools,
what problems could we help solve?"

// OpenAI responde com contexto completo! ✅
```

---

## ✅ Estrutura CORRETA Validada

- ✅ URL é da empresa PESQUISADA (não do vendedor)
- ✅ Guest pode pesquisar múltiplas empresas (Tesla, SpaceX, etc)
- ✅ Cada empresa tem seus próprios tiles
- ✅ Limite: 2 empresas no modo guest
- ✅ Variáveis dos prompts corretas
