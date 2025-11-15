# 📋 Configuração de Templates Padrões

## 🎯 Onde Estão os Templates?

Os templates padrões estão definidos em: **`src/lib/guest-templates.ts`**

Arquivo: `nextjs-openai-insights/src/lib/guest-templates.ts`

## 📝 Templates Disponíveis

### Template 1: Essential Research
- **ID**: `template_1`
- **Nome**: "Essential Research"
- **Configuração Atual**:
  - `useMaxMode`: `false` (usa GPT-5-nano)
  - `requestSize`: `"small"` (400 tokens)

### Template 2: Deep Dive Research
- **ID**: `template_2`
- **Nome**: "Deep Dive Research"
- **Configuração Atual**:
  - `useMaxMode`: `true` (usa GPT-5)
  - `requestSize`: `"medium"` (800 tokens)

## 🔧 Como Ajustar Configurações dos Templates

### Opção 1: Editar Diretamente no Código

Edite o arquivo `src/lib/guest-templates.ts`:

```typescript
export const GUEST_DASHBOARD_TEMPLATES: GuestTemplatesMap = {
  template_1: {
    id: "template_1",
    name: "Essential Research",
    description: "Eight high-signal tiles for accelerated research.",
    icon: "📊",
    defaults: {
      agentId: "ade_research_analyst",
      responseLength: "medium",
      variables: ["includeRevenueSignals", "includeProductLaunches"],
      useMaxMode: false,        // ← Ajuste aqui: true = GPT-5, false = GPT-5-nano
      requestSize: "small",     // ← Ajuste aqui: "small" | "medium" | "large"
    },
    tiles: [
      // ... tiles ...
    ],
  },
  template_2: {
    // ... mesma estrutura ...
    defaults: {
      useMaxMode: true,         // ← Ajuste aqui
      requestSize: "medium",    // ← Ajuste aqui
    },
  },
};
```

### Opção 2: Usar a Interface do DashboardConfigModal

1. Abra o admin dashboard
2. Clique em "Templates" no header
3. Clique em "Manage Templates"
4. Clique no botão de editar (ícone de lápis) no template desejado
5. Ajuste:
   - **Max Mode**: Toggle para ativar/desativar GPT-5
   - **Request Size**: Selecione Small/Medium/Large
6. ⚠️ **IMPORTANTE**: As mudanças são apenas em memória. Para persistir, você precisa editar o arquivo `src/lib/guest-templates.ts` manualmente.

## 📊 Mapeamento de Configurações

### Request Size → Max Tokens
- **Small**: 400 tokens (~200-400 caracteres)
- **Medium**: 800 tokens (~600-800 caracteres)
- **Large**: 1600 tokens (~1200-1600 caracteres)

### Max Mode → Modelo
- **Max Mode = false**: Usa `gpt-5-nano` (padrão, mais barato)
- **Max Mode = true**: Usa `gpt-5` (mais caro, melhor qualidade)

## 🎨 Configuração por Tile Individual

Você também pode configurar cada tile individualmente dentro do template:

```typescript
tiles: [
  {
    id: "sales_email",
    title: "CEO Sales Email",
    prompt: "...",
    category: "sales",
    orderIndex: 7,
    order: 8,
    defaultSize: { w: 4, h: 2 },
    agentId: "ade_sales_coach",
    preferredLength: "long",
    useMaxMode: true,        // ← Override do template padrão
    requestSize: "large",    // ← Override do template padrão
  },
]
```

## 🔄 Como Funciona a Resolução

1. **Template Defaults**: Configuração padrão do template
2. **Tile Override**: Cada tile pode sobrescrever as configurações do template
3. **Runtime Options**: Opções passadas na chamada da API podem sobrescrever tudo

**Ordem de precedência** (maior para menor):
1. Runtime options (passadas na API)
2. Tile-specific config (`useMaxMode`, `requestSize` no tile)
3. Template defaults (`defaults.useMaxMode`, `defaults.requestSize`)

## 📍 Localização dos Arquivos

- **Templates**: `nextjs-openai-insights/src/lib/guest-templates.ts`
- **API Generate**: `nextjs-openai-insights/src/app/api/generate/route.ts`
- **API Workspace Tiles**: `nextjs-openai-insights/src/app/api/workspace/tiles/route.ts`
- **Modal de Configuração**: `nextjs-openai-insights/src/components/admin/ade/DashboardConfigModal.tsx`

## ⚠️ Notas Importantes

1. **Modelo Padrão**: Mudado de `gpt-5-mini` para `gpt-5-nano`
2. **Persistência**: Mudanças no DashboardConfigModal são apenas em memória. Para persistir, edite o arquivo `guest-templates.ts`
3. **Large Size**: Requer Max Mode ativado (GPT-5)
4. **Custos**: GPT-5 é ~10x mais caro que GPT-5-nano

