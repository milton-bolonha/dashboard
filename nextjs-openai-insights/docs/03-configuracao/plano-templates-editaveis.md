# 📋 Plano: Sistema de Templates Editáveis

## 🎯 Objetivo

Repensar o sistema de templates para permitir que usuários editem os prompts individuais de cada template, criando templates customizados mais flexíveis e úteis.

## 🔍 Análise do Estado Atual

### O que já existe:
1. **Templates Padrão** (`GUEST_DASHBOARD_TEMPLATES`):
   - Templates pré-definidos em `src/lib/guest-templates.ts`
   - Cada template tem múltiplos tiles com prompts fixos
   - Configurações globais: `useMaxMode`, `requestSize`

2. **Templates Customizados** (`CustomTemplate`):
   - Usuários podem salvar templates do dashboard atual
   - Persistidos em `localStorage` via `templates-store.ts`
   - Estrutura básica: `id`, `name`, `description`, `tiles[]`

3. **DashboardConfigModal**:
   - Modal para gerenciar templates
   - Layout em 2 colunas (criar | listar/editar)
   - Permite editar `useMaxMode` e `requestSize` de templates padrão
   - Permite criar/deletar templates customizados

### Limitações Atuais:
- ❌ Não é possível editar os prompts individuais dos tiles de um template
- ❌ Templates padrão são "read-only" (só configs globais)
- ❌ Não há visualização detalhada dos prompts antes de aplicar
- ❌ Não há sistema de "duplicar e editar" templates padrão
- ❌ Não há editor inline para prompts dentro do modal

## 🚀 Proposta de Melhoria

### 1. Estrutura de Dados Expandida

**Atualizar `CustomTemplate` e criar `EditableTemplate`:**

```typescript
interface EditableTemplateTile {
  id: string;
  title: string;
  prompt: string; // ✅ EDITÁVEL
  category: string;
  orderIndex: number;
  useMaxMode?: boolean; // ✅ EDITÁVEL por tile
  requestSize?: "small" | "medium" | "large"; // ✅ EDITÁVEL por tile
  agentId?: PromptAgentId; // ✅ NOVO: agente por tile
}

interface EditableTemplate {
  id: string;
  name: string;
  description: string;
  tiles: EditableTemplateTile[];
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean; // Templates padrão podem ser "duplicados"
  sourceTemplateId?: string; // Se foi duplicado de um padrão
}
```

### 2. Novo Modal: Template Editor

**Criar `TemplateEditorModal.tsx`:**

**Funcionalidades:**
- Visualizar todos os tiles do template em lista
- Editar prompt de cada tile inline (textarea expansível)
- Editar configurações por tile (Max Mode, Request Size, Agent)
- Adicionar/remover/reordenar tiles
- Preview do template antes de salvar
- Duplicar template padrão para edição

**Layout:**
```
┌─────────────────────────────────────────┐
│ Template Editor: "Essential Research"  │
├─────────────────────────────────────────┤
│ [Tiles List]                            │
│ ┌─────────────────────────────────────┐ │
│ │ 📊 Market Analysis                  │ │
│ │ Prompt: [textarea expandible]      │ │
│ │ Max Mode: ☐  Size: [Small ▼]      │ │
│ │ [Save] [Delete]                    │ │
│ └─────────────────────────────────────┘ │
│ [+ Add Tile]                            │
│                                         │
│ [Cancel] [Save Template]               │
└─────────────────────────────────────────┘
```

### 3. Fluxo de Uso Proposto

**Cenário 1: Editar Template Customizado Existente**
1. Abrir `DashboardConfigModal`
2. Clicar em "Edit" no template customizado
3. Abrir `TemplateEditorModal` com dados do template
4. Editar prompts/configurações
5. Salvar → atualiza template existente

**Cenário 2: Duplicar e Editar Template Padrão**
1. Abrir `DashboardConfigModal`
2. Clicar em "Duplicate" no template padrão
3. Abrir `TemplateEditorModal` com cópia do template padrão
4. Editar prompts/configurações
5. Salvar → cria novo template customizado

**Cenário 3: Criar Template do Zero**
1. Abrir `DashboardConfigModal`
2. Clicar em "Create New Template"
3. Abrir `TemplateEditorModal` vazio
4. Adicionar tiles e configurar prompts
5. Salvar → cria novo template customizado

### 4. Melhorias no DashboardConfigModal

**Adicionar ações por template:**
- **Templates Padrão:**
  - [Apply] - Aplicar ao dashboard atual
  - [Duplicate & Edit] - Duplicar e abrir editor
  - [View Details] - Ver prompts sem editar

- **Templates Customizados:**
  - [Apply] - Aplicar ao dashboard atual
  - [Edit] - Abrir editor
  - [Duplicate] - Criar cópia
  - [Delete] - Deletar

**Layout melhorado:**
```
┌──────────────────────┬──────────────────────┐
│ Create New Template  │ Your Templates        │
├──────────────────────┼──────────────────────┤
│ [Form básico]        │ ┌──────────────────┐ │
│                      │ │ Essential Research│ │
│                      │ │ [Apply] [Edit]   │ │
│                      │ └──────────────────┘ │
│                      │ ┌──────────────────┐ │
│                      │ │ Deep Dive (padrão)│ │
│                      │ │ [Apply] [Duplicate]│
│                      │ └──────────────────┘ │
└──────────────────────┴──────────────────────┘
```

### 5. Componentes Necessários

**Novos componentes:**
1. `TemplateEditorModal.tsx` - Editor principal de templates
2. `TemplateTileEditor.tsx` - Editor individual de tile (reutilizável)
3. `TemplatePreview.tsx` - Preview do template antes de aplicar
4. `PromptEditor.tsx` - Editor de prompt com syntax highlighting (opcional)

**Componentes a modificar:**
1. `DashboardConfigModal.tsx` - Adicionar ações de editar/duplicar
2. `templates-store.ts` - Adicionar funções para editar templates
3. `dashboard-template.ts` - Expandir interfaces

### 6. Persistência

**Armazenamento:**
- Templates customizados editados → `localStorage` (como hoje)
- Templates padrão duplicados → salvos como customizados
- Histórico de versões (opcional futuro)

**Estrutura no localStorage:**
```json
{
  "custom_templates": [
    {
      "id": "template_123",
      "name": "My Custom Research",
      "tiles": [
        {
          "id": "tile_1",
          "title": "Market Analysis",
          "prompt": "Analise o mercado...", // ✅ EDITADO
          "useMaxMode": true,
          "requestSize": "large"
        }
      ]
    }
  ]
}
```

## 📝 Tarefas de Implementação

### Fase 1: Fundação
- [ ] Expandir interfaces `EditableTemplate` e `EditableTemplateTile`
- [ ] Atualizar `templates-store.ts` com funções de edição
- [ ] Criar `TemplateTileEditor` component básico

### Fase 2: Editor Principal
- [ ] Criar `TemplateEditorModal` com lista de tiles
- [ ] Implementar edição inline de prompts
- [ ] Implementar edição de configurações por tile
- [ ] Adicionar/remover/reordenar tiles

### Fase 3: Integração
- [ ] Adicionar botões "Edit" e "Duplicate" no `DashboardConfigModal`
- [ ] Conectar fluxo de edição
- [ ] Testar persistência e carregamento

### Fase 4: Melhorias UX
- [ ] Adicionar preview do template
- [ ] Validação de prompts vazios
- [ ] Confirmação antes de deletar tiles
- [ ] Feedback visual de salvamento

## 🎨 Considerações de UX

1. **Editor de Prompt:**
   - Textarea expansível (auto-grow)
   - Contador de caracteres
   - Placeholder com exemplo
   - Suporte a variáveis (ex: `{companyName}`)

2. **Feedback Visual:**
   - Indicador de "não salvo" (asterisco ou badge)
   - Loading state ao salvar
   - Toast de confirmação

3. **Navegação:**
   - Breadcrumb: Templates > Editor > [Template Name]
   - Botão "Back" para voltar à lista
   - Atalho de teclado (Ctrl+S para salvar)

## 🔮 Melhorias Futuras (Fora do Escopo Inicial)

- Histórico de versões de templates
- Compartilhamento de templates entre usuários
- Templates públicos/comunidade
- Import/Export de templates (JSON)
- Categorização de templates
- Busca/filtro de templates
- Templates com variáveis dinâmicas avançadas

## 📊 Priorização

**Alta Prioridade:**
1. Editar prompts de templates customizados existentes
2. Duplicar templates padrão para edição
3. Editor básico funcional

**Média Prioridade:**
4. Editar configurações por tile (Max Mode, Size)
5. Adicionar/remover tiles
6. Preview antes de aplicar

**Baixa Prioridade:**
7. Reordenar tiles
8. Validações avançadas
9. Histórico de versões

---

**Nota:** Este plano é uma proposta inicial. Pode ser ajustado conforme feedback e necessidades do projeto.

