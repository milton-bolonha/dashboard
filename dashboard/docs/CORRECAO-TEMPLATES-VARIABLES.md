# Correção de Variáveis nos Templates

## Problema Identificado

Os templates do Sales Assistant (`template_1` e `template_2`) estavam usando variáveis antigas do formato legado:

- `{target_company}` ❌
- `{target_url}` ❌
- `{user_solution}` ❌
- `{sales_rep_company}` ❌

Quando o sistema deveria usar o formato dinâmico novo:

- `{company.name}` ✅
- `{company.website}` ✅
- `{sellingSolutionsFor}` ✅
- `{salesRepAt}` ✅

## Solução Implementada

Atualizei todos os templates em `dashboard/lib/guest-templates.js` para usar o novo formato de variáveis.

### Mapeamento de Variáveis

| Antigo Formato        | Novo Formato            | Descrição                  |
| --------------------- | ----------------------- | -------------------------- |
| `{target_company}`    | `{company.name}`        | Nome da empresa pesquisada |
| `{target_url}`        | `{company.website}`     | Website da empresa         |
| `{user_solution}`     | `{sellingSolutionsFor}` | Solução vendida            |
| `{sales_rep_company}` | `{salesRepAt}`          | Empresa do vendedor        |
| `{sales_rep_website}` | `{companyWebsite}`      | Website do vendedor        |

### Exemplo de Correção

**Antes:**

```javascript
prompt: "How does {target_company} generate revenue?";
```

**Depois:**

```javascript
prompt: "How does {company.name} generate revenue? Explain their business model, revenue streams, and monetization strategies. IMPORTANT: Be concise. Maximum 2-3 short paragraphs.";
```

## Arquivos Modificados

1. **dashboard/lib/guest-templates.js**
   - template_1: 8 tiles corrigidos
   - template_2: 9 tiles corrigidos
   - Total: 17 prompts atualizados

## Contexto Gerado para Sales Assistant

Agora o `buildPromptContext` gera corretamente:

```javascript
{
  company: {
    name: "Tesla",
    website: "tesla.com"
  },
  salesRepAt: "Microsoft",
  companyWebsite: "microsoft.com",
  sellingSolutionsFor: "Cloud solutions"
}
```

E o `processPromptVariables` consegue mapear:

- `{company.name}` → "Tesla"
- `{company.website}` → "tesla.com"
- `{sellingSolutionsFor}` → "Cloud solutions"
- `{salesRepAt}` → "Microsoft"

## Resultado

Agora os prompts são enviados para a OpenAI com as variáveis corretamente substituídas, gerando tiles com conteúdo relevante ao invés de respostas genéricas sobre "{target_company}".

## Status

✅ Correções aplicadas
✅ Testado em template_1
✅ Testado em template_2
✅ Backward compatibility mantida
