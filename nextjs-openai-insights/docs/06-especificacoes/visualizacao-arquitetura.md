# Prompt: Sistema de Visualização de Arquitetura (Dev Tool Style)

## Objetivo

Criar uma página pública que funciona como uma ferramenta de visualização da arquitetura do sistema, similar a um bundle analyzer ou React DevTools, mas focada em mostrar a estrutura de domínio visual e funções principais do sistema.

## Layout da Página

### Sidebar Direito (Navegação de Momentos)

- Lista vertical de "momentos" (páginas principais do sistema)
- Cada momento é um slide/página diferente
- Momentos disponíveis:
  1. **Home** (`/`)
  2. **Admin** (`/admin`)
- Ao clicar em um momento, o main muda para mostrar a estrutura daquela página
- Indicador visual do momento ativo

### Main (Área de Visualização)

#### Modo 1: Visualização Hierárquica (Tipo Emmet/Árvore)

Mostrar a estrutura de componentes em formato de árvore colapsável, similar a HTML/Emmet:

```
home
  ├─ header (LandingHeader)
  │   ├─ logo
  │   ├─ btn-login
  │   └─ btn-signup
  ├─ form (ClassicHeroForm)
  │   ├─ input-company-name
  │   ├─ input-website
  │   ├─ select-template
  │   ├─ btn-generate
  │   └─ ...
  └─ footer (LandingFooter)
```

**Características**:

- Cada nó pode ser expandido/colapsado
- Ao expandir, mostra sub-componentes
- Clicar em um componente mostra detalhes no painel lateral
- Formato visual tipo file explorer (VS Code style)

#### Modo 2: Visualização de Fluxos (Comercial/Resumido)

Mostrar funções principais e fluxos de dados de forma resumida:

```
📤 Criar Workspace
   ↓
   Usuário preenche form → POST /api/generate
   ↓
   Gera tiles com AI (GPT-5-nano ou GPT-5)
   ↓
   Redireciona para /admin
   ↓
   ✅ Workspace criado, tiles aparecem no grid
```

**Características**:

- Lista de ações principais
- Para cada ação: "Enviou → Como tratou → Resultado"
- Formato comercial, direto ao ponto
- Mostrar APIs chamadas
- Mostrar estados atualizados

## Estrutura Detalhada do Sistema

### MOMENTO 1: HOME (`/`)

**Componente Raiz**: `HomeContainer` (`src/containers/home/HomeContainer.tsx`)

**Estrutura Visual**:

```
home
  ├─ LandingHeader
  │   ├─ logo (Image)
  │   ├─ btn-login (SignInButton)
  │   └─ btn-signup (SignUpButton)
  │
  ├─ ClassicHeroForm
  │   ├─ input-company-name
  │   ├─ input-company-website
  │   ├─ input-solution
  │   ├─ input-research-target
  │   ├─ input-research-website
  │   ├─ select-template
  │   ├─ select-model (gpt-5-nano | gpt-5)
  │   ├─ select-prompt-agent
  │   ├─ select-response-length
  │   ├─ checkbox-prompt-variables[]
  │   ├─ textarea-bulk-prompts
  │   └─ btn-generate
  │
  └─ LandingFooter
```

**Fluxos Principais**:

1. **Criar Workspace**:

   ```
   📤 Usuário preenche form
      ↓
      Valida membership/limits
      ↓
      POST /api/generate
      Body: {
        salesRepCompany, salesRepWebsite, solution,
        targetCompany, targetWebsite, templateId,
        model, promptAgent, responseLength,
        promptVariables[], bulkPrompts[]
      }
      ↓
      API processa template → Gera 8 tiles com AI
      ↓
      Cria WorkspaceSnapshot → Salva em cookie
      ↓
      Redireciona para /admin
      ↓
      ✅ Tiles aparecem no grid após geração
   ```

2. **Templates Disponíveis**:
   - `template_1`: Sales Assistant (8 tiles padrão)
   - `template_2`: Research Assistant (8 tiles padrão)
   - Templates customizados (localStorage)

### MOMENTO 2: ADMIN (`/admin`)

**Componente Raiz**: `AdminContainer` (`src/containers/admin/AdminContainer.tsx`)

**Estrutura Visual**:

```
admin
  ├─ AdminShellAde
  │   ├─ sidebar (AdminSidebarAde)
  │   │   ├─ menu-header
  │   │   ├─ credit-links (coins display)
  │   │   ├─ companies-list
  │   │   │   └─ company-item[] (com dashboard count badge)
  │   │   ├─ contacts-section
  │   │   │   └─ btn-add-contact
  │   │   └─ bottom-links
  │   │
  │   ├─ header (AdminHeaderAde)
  │   │   ├─ workspace-name
  │   │   ├─ dashboard-selector (dropdown)
  │   │   ├─ btn-create-blank-dashboard
  │   │   ├─ btn-templates (abre DashboardConfigModal)
  │   │   ├─ btn-customize-background (color picker)
  │   │   ├─ btn-save-template
  │   │   ├─ btn-login
  │   │   └─ btn-signup
  │   │
  │   └─ main
  │       ├─ tiles-grid (TileGridAde)
  │       │   ├─ btn-add-prompt (abre AddPromptModal)
  │       │   └─ tile-card[]
  │       │       ├─ title
  │       │       ├─ content
  │       │       ├─ btn-drag (reorder)
  │       │       ├─ btn-regenerate
  │       │       └─ btn-delete
  │       │
  │       ├─ contacts-panel (ContactsPanelAde)
  │       │   ├─ btn-add-contact (abre AddContactModal)
  │       │   └─ contact-card[]
  │       │       ├─ name
  │       │       ├─ role
  │       │       ├─ btn-regenerate-outreach
  │       │       └─ btn-delete
  │       │
  │       ├─ notes-panel (NotesPanelAde)
  │       │   ├─ btn-add-note (revela form inline)
  │       │   ├─ form-note (quando add/edit)
  │       │   └─ note-card[]
  │       │       ├─ header (laranja) + title
  │       │       ├─ content (bg branco)
  │       │       ├─ btn-edit
  │       │       └─ btn-delete
  │       │
  │       └─ files-placeholder (FilesPlaceholderAde)
  │
  └─ modals[]
      ├─ AddPromptModal
      ├─ AddContactModal
      ├─ AddCompanyModal
      ├─ ContactDetailModal
      ├─ TileDetailModal
      ├─ CreateBlankDashboardModal
      ├─ DashboardConfigModal
      └─ TemplateEditorModal
```

**Fluxos Principais**:

1. **Criar Prompt Individual**:

   ```
   📤 Clica "Add Prompt"
      ↓
      Abre AddPromptModal
      ↓
      Preenche: title, prompt, Max Mode (opcional), requestSize
      ↓
      POST /api/workspace/tiles
      Body: { title, prompt, useMaxPrompt?, requestSize? }
      ↓
      API adiciona company context ao prompt (invisível ao user)
      API cria tile com orderIndex negativo (-1, -2...)
      API atualiza workspace.company.tiles
      ↓
      Dashboard atualizado diretamente (updateDashboard)
      Tile aparece primeiro no grid (orderIndex negativo)
      Workspace sincronizado via mutate()
      ↓
      ✅ Tile visível imediatamente
   ```

2. **Aplicar Template**:

   ```
   📤 Clica "Templates" → Seleciona template
      ↓
      POST /api/generate
      Body: { templateId, ... }
      ↓
      Cria novo dashboard com tiles do template
      ↓
      Ativa dashboard → Carrega tiles
      ↓
      ✅ Dashboard ativo com tiles do template
   ```

3. **Criar Blank Dashboard**:

   ```
   📤 Clica "Create Blank Dashboard"
      ↓
      Preenche nome → createDashboard()
      ↓
      Dashboard criado: { tiles: [], notes: [], contacts: [] }
      ↓
      Ativa dashboard → Carrega estado vazio
      ↓
      ✅ Dashboard vazio pronto para prompts individuais
   ```

4. **Trocar Dashboard**:

   ```
   📤 Seleciona dashboard no dropdown
      ↓
      handleSelectDashboard(dashboardId)
      ↓
      Carrega dashboard do localStorage
      ↓
      Atualiza currentDashboard
      ↓
      Carrega tiles/notes/contacts isolados
      Aplica cor de fundo do dashboard
      ↓
      ✅ Contexto completo trocado
   ```

5. **Customizar Background**:

   ```
   📤 Clica color picker → Seleciona cor
      ↓
      handleCustomizeBackground()
      ↓
      Salva em dashboard.appearance.baseColor
      Salva em localStorage (ade-base-color)
      Aplica em document.body.style.backgroundColor
      ↓
      ✅ Cor persistida e aplicada
   ```

6. **Regenerar Tile**:

   ```
   📤 Clica regenerate no tile
      ↓
      POST /api/workspace/tiles/[tileId]/regenerate
      ↓
      API gera novo conteúdo com mesmo prompt
      ↓
      Atualiza tile.content
      Mantém histórico
      ↓
      ✅ Tile atualizado
   ```

7. **Chat com Tile**:

   ```
   📤 Abre tile → Digita mensagem
      ↓
      POST /api/workspace/tiles/[tileId]/chat
      Body: { message, attachments? }
      ↓
      API adiciona ao tile.history
      Gera resposta com AI
      ↓
      Atualiza tile com novo histórico
      ↓
      ✅ Conversa persistida
   ```

8. **Adicionar Contact**:

   ```
   📤 Clica "Add Contact"
      ↓
      Abre AddContactModal
      ↓
      Preenche: name, role
      ↓
      POST /api/workspace/contacts
      Body: { name, role }
      ↓
      API cria contact
      ↓
      Dashboard atualizado (updateDashboard)
      Contact aparece no panel
      ↓
      ✅ Contact criado
   ```

9. **Regenerar Contact Outreach**:

   ```
   📤 Clica regenerate no contact
      ↓
      POST /api/workspace/contacts/[contactId]/regenerate
      ↓
      API gera: insights, email pitch, cold call script
      Usa GPT-5
      ↓
      Atualiza contact.outreach
      ↓
      ✅ Outreach regenerado
   ```

10. **Adicionar Note**:

    ```
    📤 Clica "Add Note" → Revela form inline
       ↓
       Preenche: title, content
       ↓
       POST /api/workspace/notes
       Body: { title, content }
       ↓
       API cria note
       ↓
       Dashboard atualizado (updateDashboard)
       Note aparece no panel
       ↓
       ✅ Note criado
    ```

11. **Editar Note**:

    ```
    📤 Clica edit → Preenche form
       ↓
       PATCH /api/workspace/notes/[noteId]
       Body: { title?, content? }
       ↓
       API atualiza note
       ↓
       Dashboard atualizado
       ✅ Note editado
    ```

12. **Deletar Note/Contact**:

    ```
    📤 Clica delete
       ↓
       DELETE /api/workspace/notes/[noteId]
       ou
       DELETE /api/workspace/contacts/[contactId]
       ↓
       API remove do workspace
       ↓
       Dashboard atualizado (remove do array)
       ✅ Item deletado
    ```

13. **Reordenar Tiles**:
    ```
    📤 Drag & drop tile
       ↓
       POST /api/workspace/reorder
       Body: { order: string[] } (array de tile IDs)
       ↓
       API atualiza orderIndex de todos os tiles
       ↓
       Dashboard atualizado
       ✅ Ordem persistida
    ```

## Arquitetura de Dados

### Workspace (Server-side Cookie)

```typescript
WorkspaceSnapshot {
  sessionId: string
  company: {
    name: string
    website?: string
    tiles: Tile[]
    notes: Note[]
    contacts: Contact[]
  }
  appearance?: {
    baseColor: string
  }
  generatedAt: string
}
```

### Company & Dashboard (Client-side localStorage)

```typescript
CompanyWithDashboards {
  id: string
  name: string
  dashboards: Dashboard[]
}

Dashboard {
  id: string
  name: string
  companyId: string
  templateId?: string
  tiles: Tile[]
  notes: Note[]
  contacts: Contact[]
  appearance?: {
    baseColor: string
  }
  contrastMode?: boolean
  isActive: boolean
}
```

## APIs Principais

### POST `/api/generate`

- Cria workspace completo com tiles de template
- Body: `{ salesRepCompany, salesRepWebsite, solution, targetCompany, targetWebsite, templateId, model?, promptAgent?, responseLength?, promptVariables?, bulkPrompts? }`
- Retorna: `WorkspaceSnapshot` completo

### POST `/api/workspace/tiles`

- Cria tile individual
- Body: `{ title, prompt, useMaxPrompt?, requestSize? }`
- Retorna: `{ tile: Tile, workspace: WorkspaceSnapshot }`
- Adiciona company context ao prompt (mas salva prompt original)

### POST `/api/workspace/tiles/[tileId]/chat`

- Chat com tile
- Body: `{ message, attachments? }`
- Retorna: Tile atualizado com histórico

### POST `/api/workspace/tiles/[tileId]/regenerate`

- Regenera conteúdo do tile
- Retorna: Tile atualizado

### POST `/api/workspace/notes`

- Cria note
- Body: `{ title, content }`
- Retorna: `{ success: true, notes: Note[] }`

### PATCH `/api/workspace/notes/[noteId]`

- Atualiza note
- Body: `{ title?, content? }`

### DELETE `/api/workspace/notes/[noteId]`

- Deleta note

### POST `/api/workspace/contacts`

- Cria contact
- Body: `{ name, role }`

### POST `/api/workspace/contacts/[contactId]/regenerate`

- Regenera outreach (insights, email, call script)
- Usa GPT-5

### POST `/api/workspace/reorder`

- Reordena tiles
- Body: `{ order: string[] }` (array de tile IDs)

## Requisitos da Interface

### Design

- **Estilo**: Dev tool / Bundle analyzer
- **Cores**: Usar cores do sistema (appearance tokens)
- **Tipografia**: Monospace para código, sans-serif para UI
- **Layout**: Clean, focado em informação

### Interatividade

1. **Sidebar Direito**:

   - Lista fixa de momentos (Home, Admin)
   - Indicador do momento ativo
   - Scroll se necessário

2. **Main - Modo Hierárquico**:

   - Árvore colapsável (tipo VS Code explorer)
   - Expandir/colapsar nós
   - Highlight ao passar mouse
   - Clicar em componente → mostra detalhes no painel lateral
   - Buscar componentes (filtro)

3. **Main - Modo Fluxos**:

   - Lista de ações principais
   - Cada ação expandível para ver fluxo completo
   - Formato visual: setas, boxes, código
   - Mostrar APIs, estados, resultados

4. **Alternância de Modos**:

   - Toggle entre "Estrutura" e "Fluxos"
   - Persistir preferência

5. **Painel de Detalhes** (lateral):
   - Mostra props do componente
   - Mostra arquivo fonte
   - Mostra dependências
   - Link para código

### Funcionalidades Extras

- Buscar por nome de componente
- Filtrar por tipo (componente, API, fluxo)
- Exportar visualização (SVG/PNG)
- Copiar estrutura como texto

## Exemplo de Visualização Esperada

### Modo Hierárquico:

```
📁 home
  ├─ 📄 LandingHeader
  │   ├─ 🖼️ logo
  │   ├─ 🔘 btn-login
  │   └─ 🔘 btn-signup
  ├─ 📄 ClassicHeroForm
  │   ├─ 📝 input-company-name
  │   ├─ 📝 input-company-website
  │   ├─ 📝 input-solution
  │   ├─ 📝 input-research-target
  │   ├─ 📝 input-research-website
  │   ├─ 📋 select-template
  │   ├─ 📋 select-model
  │   ├─ 📋 select-prompt-agent
  │   ├─ 📋 select-response-length
  │   ├─ ☑️ checkbox-prompt-variables[]
  │   ├─ 📝 textarea-bulk-prompts
  │   └─ 🔘 btn-generate
  └─ 📄 LandingFooter
```

### Modo Fluxos:

```
┌─────────────────────────────────────────┐
│ 📤 Criar Workspace                      │
├─────────────────────────────────────────┤
│ 1. Usuário preenche form                │
│ 2. Valida membership/limits             │
│ 3. POST /api/generate                   │
│    Body: { salesRepCompany, ... }       │
│ 4. API processa template                │
│ 5. Gera 8 tiles com AI                  │
│ 6. Cria WorkspaceSnapshot               │
│ 7. Salva em cookie                      │
│ 8. Redireciona para /admin              │
│                                         │
│ ✅ Resultado: Tiles aparecem no grid    │
└─────────────────────────────────────────┘
```

## Notas Técnicas

- **Framework**: Next.js 14+ (App Router)
- **Estilos**: Tailwind CSS
- **Dados**: Ler estrutura real do código (não mock)
- **Navegação**: Client-side routing entre momentos
- **Performance**: Lazy load de detalhes

## O que NÃO fazer

- ❌ Criar dashboard genérico de projetos
- ❌ Usar dados mock/fake
- ❌ Criar UI de admin genérica
- ❌ Ignorar a estrutura real do código

## O que fazer

- ✅ Ler estrutura real dos componentes
- ✅ Mostrar hierarquia real (HomeContainer → LandingHeader → ...)
- ✅ Mostrar fluxos reais (APIs reais, estados reais)
- ✅ Visualização tipo dev tool (VS Code explorer style)
- ✅ Focar em arquitetura e fluxos do sistema
