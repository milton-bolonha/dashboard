# Prompt: Melhorias para Super Monitor

## Contexto

Você recebeu um código React de um "Super Monitor" que visualiza a arquitetura de um sistema. O código atual tem:

- Pipeline visual funcional ✅
- Métricas globais ✅
- Modal de detalhes ✅
- Abas no painel inferior ✅

Mas está **FALTANDO** funcionalidades críticas mencionadas no prompt original.

## Tarefas de Melhoria

### 1. ADICIONAR Sidebar Direito para Momentos

**O que fazer**:

- Criar um sidebar direito (não esquerdo) com lista de "momentos"
- Momentos: `Home` e `Admin`
- Ao clicar em um momento, o main muda para mostrar aquela estrutura
- Indicador visual do momento ativo

**Código atual**:

```javascript
// TEM: Sidebar esquerdo com filtros
<Sidebar filters={filters} setFilters={setFilters} />
```

**Código esperado**:

```javascript
// ADICIONAR: Sidebar direito para momentos
<MomentsSidebar
  moments={["Home", "Admin"]}
  activeMoment={activeMoment}
  onSelectMoment={setActiveMoment}
/>
```

### 2. IMPLEMENTAR ArchitectureTree Completo

**O que fazer**:

- Substituir o placeholder vazio por uma árvore colapsável real
- Formato tipo VS Code explorer (file tree)
- Mostrar estrutura: `home > header > logo + btn-login + btn-signup`
- Permitir expandir/colapsar nós
- Clicar em componente mostra detalhes no painel lateral

**Código atual**:

```javascript
const ArchitectureTree = ({ architectureData }) => {
  return (
    <div>Visualizador da Estrutura (Contexto: {architectureData.name})</div>
  );
};
```

**Código esperado**:

```javascript
const ArchitectureTree = ({ architectureData, onNodeClick }) => {
  const [expandedNodes, setExpandedNodes] = useState(new Set(["root"]));

  const toggleNode = (nodeId) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const renderNode = (node, level = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);

    return (
      <div key={node.id} className="select-none">
        <div
          className="flex items-center py-1 px-2 hover:bg-gray-800 cursor-pointer"
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            if (hasChildren) toggleNode(node.id);
            if (onNodeClick) onNodeClick(node);
          }}
        >
          {hasChildren && (
            <ChevronRight
              className={`w-4 h-4 mr-1 transition-transform ${
                isExpanded ? "rotate-90" : ""
              }`}
            />
          )}
          {!hasChildren && <div className="w-4 h-4 mr-1" />}
          <FileCode className="w-4 h-4 mr-2 text-blue-400" />
          <span className="text-sm text-gray-300">{node.name}</span>
          {node.type && (
            <span className="ml-2 text-xs text-gray-500">({node.type})</span>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div>
            {node.children.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4">
      {renderNode({
        id: "root",
        name: architectureData.name,
        children: architectureData.children,
      })}
    </div>
  );
};
```

### 3. COMPLETAR Estrutura de Dados da Arquitetura

**O que fazer**:

- Preencher `SYSTEM_ARCHITECTURE` com estrutura completa baseada no prompt-fluxo.md
- Incluir todos os componentes, seus filhos, tipos, arquivos
- Estrutura deve ser hierárquica e completa

**Estrutura esperada**:

```javascript
const SYSTEM_ARCHITECTURE = {
  home: {
    name: "Home",
    path: "/",
    component: "HomeContainer",
    file: "src/containers/home/HomeContainer.tsx",
    children: [
      {
        id: "header",
        name: "LandingHeader",
        type: "component",
        file: "src/components/landing/LandingHeader.tsx",
        children: [
          {
            id: "logo",
            name: "logo",
            type: "element",
            component: "Image",
            props: {},
          },
          {
            id: "btn-login",
            name: "btn-login",
            type: "element",
            component: "SignInButton",
            props: {},
          },
          {
            id: "btn-signup",
            name: "btn-signup",
            type: "element",
            component: "SignUpButton",
            props: {},
          },
        ],
      },
      {
        id: "form",
        name: "ClassicHeroForm",
        type: "component",
        file: "src/components/landing/ClassicHeroForm.tsx",
        children: [
          {
            id: "input-company-name",
            name: "input-company-name",
            type: "input",
            props: { placeholder: "Company name" },
          },
          {
            id: "input-website",
            name: "input-website",
            type: "input",
            props: { placeholder: "Website URL" },
          },
          {
            id: "select-template",
            name: "select-template",
            type: "select",
            props: { options: ["template_1", "template_2"] },
          },
          {
            id: "btn-generate",
            name: "btn-generate",
            type: "button",
            props: { onClick: "handleSubmit" },
          },
          // ... todos os campos do form
        ],
      },
      {
        id: "footer",
        name: "LandingFooter",
        type: "component",
        file: "src/components/landing/LandingFooter.tsx",
        children: [],
      },
    ],
  },
  admin: {
    name: "Admin",
    path: "/admin",
    component: "AdminContainer",
    file: "src/containers/admin/AdminContainer.tsx",
    children: [
      {
        id: "shell",
        name: "AdminShellAde",
        type: "layout",
        file: "src/components/admin/ade/AdminShellAde.tsx",
        children: [
          {
            id: "sidebar",
            name: "AdminSidebarAde",
            type: "component",
            file: "src/components/admin/ade/AdminSidebarAde.tsx",
            children: [
              { id: "menu-header", name: "menu-header", type: "section" },
              {
                id: "credit-links",
                name: "credit-links",
                type: "section",
                children: [
                  {
                    id: "coins-display",
                    name: "coins-display",
                    type: "element",
                  },
                ],
              },
              {
                id: "companies-list",
                name: "companies-list",
                type: "section",
                children: [
                  {
                    id: "company-item",
                    name: "company-item",
                    type: "component",
                    props: { badge: "dashboard-count" },
                  },
                ],
              },
              {
                id: "contacts-section",
                name: "contacts-section",
                type: "section",
                children: [
                  {
                    id: "btn-add-contact",
                    name: "btn-add-contact",
                    type: "button",
                  },
                ],
              },
              { id: "bottom-links", name: "bottom-links", type: "section" },
            ],
          },
          {
            id: "header",
            name: "AdminHeaderAde",
            type: "component",
            file: "src/components/admin/ade/AdminHeaderAde.tsx",
            children: [
              { id: "workspace-name", name: "workspace-name", type: "text" },
              {
                id: "dashboard-selector",
                name: "dashboard-selector",
                type: "dropdown",
              },
              {
                id: "btn-create-blank-dashboard",
                name: "btn-create-blank-dashboard",
                type: "button",
              },
              { id: "btn-templates", name: "btn-templates", type: "button" },
              {
                id: "btn-customize-background",
                name: "btn-customize-background",
                type: "button",
              },
              {
                id: "btn-save-template",
                name: "btn-save-template",
                type: "button",
              },
              { id: "btn-login", name: "btn-login", type: "button" },
              { id: "btn-signup", name: "btn-signup", type: "button" },
            ],
          },
          {
            id: "main",
            name: "main",
            type: "section",
            children: [
              {
                id: "tiles-grid",
                name: "TileGridAde",
                type: "component",
                file: "src/containers/admin/ade/TileGridAde.tsx",
                children: [
                  {
                    id: "btn-add-prompt",
                    name: "btn-add-prompt",
                    type: "button",
                  },
                  {
                    id: "tile-card",
                    name: "tile-card",
                    type: "component",
                    props: { repeat: true },
                    children: [
                      { id: "tile-title", name: "title", type: "text" },
                      { id: "tile-content", name: "content", type: "text" },
                      { id: "btn-drag", name: "btn-drag", type: "button" },
                      {
                        id: "btn-regenerate",
                        name: "btn-regenerate",
                        type: "button",
                      },
                      { id: "btn-delete", name: "btn-delete", type: "button" },
                    ],
                  },
                ],
              },
              {
                id: "contacts-panel",
                name: "ContactsPanelAde",
                type: "component",
                file: "src/containers/admin/ade/ContactsPanelAde.tsx",
                children: [
                  {
                    id: "btn-add-contact",
                    name: "btn-add-contact",
                    type: "button",
                  },
                  {
                    id: "contact-card",
                    name: "contact-card",
                    type: "component",
                    props: { repeat: true },
                    children: [
                      { id: "contact-name", name: "name", type: "text" },
                      { id: "contact-role", name: "role", type: "text" },
                      {
                        id: "btn-regenerate-outreach",
                        name: "btn-regenerate-outreach",
                        type: "button",
                      },
                      { id: "btn-delete", name: "btn-delete", type: "button" },
                    ],
                  },
                ],
              },
              {
                id: "notes-panel",
                name: "NotesPanelAde",
                type: "component",
                file: "src/containers/admin/ade/NotesPanelAde.tsx",
                children: [
                  { id: "btn-add-note", name: "btn-add-note", type: "button" },
                  {
                    id: "form-note",
                    name: "form-note",
                    type: "form",
                    props: { inline: true },
                  },
                  {
                    id: "note-card",
                    name: "note-card",
                    type: "component",
                    props: { repeat: true },
                    children: [
                      {
                        id: "note-header",
                        name: "header",
                        type: "section",
                        props: { color: "orange" },
                      },
                      { id: "note-title", name: "title", type: "text" },
                      {
                        id: "note-content",
                        name: "content",
                        type: "text",
                        props: { bg: "white" },
                      },
                      { id: "btn-edit", name: "btn-edit", type: "button" },
                      { id: "btn-delete", name: "btn-delete", type: "button" },
                    ],
                  },
                ],
              },
              {
                id: "files-placeholder",
                name: "FilesPlaceholderAde",
                type: "component",
                file: "src/containers/admin/ade/FilesPlaceholderAde.tsx",
                children: [],
              },
            ],
          },
        ],
      },
      {
        id: "modals",
        name: "modals",
        type: "section",
        children: [
          { id: "AddPromptModal", name: "AddPromptModal", type: "modal" },
          { id: "AddContactModal", name: "AddContactModal", type: "modal" },
          { id: "AddCompanyModal", name: "AddCompanyModal", type: "modal" },
          {
            id: "ContactDetailModal",
            name: "ContactDetailModal",
            type: "modal",
          },
          { id: "TileDetailModal", name: "TileDetailModal", type: "modal" },
          {
            id: "CreateBlankDashboardModal",
            name: "CreateBlankDashboardModal",
            type: "modal",
          },
          {
            id: "DashboardConfigModal",
            name: "DashboardConfigModal",
            type: "modal",
          },
          {
            id: "TemplateEditorModal",
            name: "TemplateEditorModal",
            type: "modal",
          },
        ],
      },
    ],
  },
};
```

### 4. CRIAR Modo de Visualização de Fluxos Comerciais

**O que fazer**:

- Criar componente `FlowView` que mostra fluxos de forma comercial
- Formato: "Enviou → Como tratou → Resultado"
- Lista de ações principais do sistema
- Cada ação expandível para ver fluxo completo

**Código esperado**:

```javascript
const FlowView = ({ flows }) => {
  const [expandedFlow, setExpandedFlow] = useState(null);

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-bold text-white mb-4">Fluxos Principais</h2>
      {flows.map((flow) => (
        <div
          key={flow.id}
          className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
        >
          <button
            onClick={() =>
              setExpandedFlow(expandedFlow === flow.id ? null : flow.id)
            }
            className="w-full p-4 flex items-center justify-between hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{flow.icon}</span>
              <span className="text-lg font-semibold text-white">
                {flow.title}
              </span>
            </div>
            <ChevronRight
              className={`w-5 h-5 text-gray-400 transition-transform ${
                expandedFlow === flow.id ? "rotate-90" : ""
              }`}
            />
          </button>

          {expandedFlow === flow.id && (
            <div className="p-4 border-t border-gray-700 space-y-3">
              {flow.steps.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-300 mb-1">
                      {step.label}
                    </div>
                    {step.details && (
                      <div className="text-xs text-gray-500 font-mono bg-gray-900/50 p-2 rounded">
                        {step.details}
                      </div>
                    )}
                  </div>
                  {index < flow.steps.length - 1 && (
                    <ArrowDown className="w-4 h-4 text-gray-600 flex-shrink-0" />
                  )}
                </div>
              ))}
              <div className="mt-4 p-3 bg-green-900/30 border border-green-700 rounded">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-sm font-semibold text-green-400">
                    {flow.result}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Dados de fluxos baseados no prompt-fluxo.md
const FLOWS_DATA = [
  {
    id: "create-workspace",
    title: "Criar Workspace",
    icon: "📤",
    steps: [
      { label: "Usuário preenche form", details: "ClassicHeroForm" },
      { label: "Valida membership/limits", details: "useMembership hook" },
      {
        label: "POST /api/generate",
        details: "Body: { salesRepCompany, targetCompany, templateId, ... }",
      },
      {
        label: "API processa template",
        details: "Gera 8 tiles com prompts do template",
      },
      { label: "Gera tiles com AI", details: "GPT-5-nano ou GPT-5 (Max Mode)" },
      { label: "Cria WorkspaceSnapshot", details: "Salva em cookie" },
      { label: "Redireciona para /admin", details: 'router.push("/admin")' },
    ],
    result: "Tiles aparecem no grid após geração",
  },
  {
    id: "create-prompt",
    title: "Criar Prompt Individual",
    icon: "➕",
    steps: [
      { label: 'Clica "Add Prompt"', details: "Abre AddPromptModal" },
      { label: "Preenche: title, prompt, Max Mode", details: "Form no modal" },
      {
        label: "POST /api/workspace/tiles",
        details: "Body: { title, prompt, useMaxPrompt?, requestSize? }",
      },
      { label: "API adiciona company context", details: "Invisível ao user" },
      {
        label: "API cria tile com orderIndex negativo",
        details: "orderIndex: -1, -2...",
      },
      {
        label: "Dashboard atualizado diretamente",
        details: "updateDashboard()",
      },
      { label: "Workspace sincronizado", details: "mutate()" },
    ],
    result: "Tile aparece primeiro no grid",
  },
  // ... mais fluxos do prompt-fluxo.md
];
```

### 5. ADICIONAR Toggle entre Modos de Visualização

**O que fazer**:

- Adicionar toggle no header para alternar entre "Estrutura" e "Fluxos"
- Quando "Estrutura": mostra ArchitectureTree
- Quando "Fluxos": mostra FlowView
- Persistir preferência em localStorage

**Código esperado**:

```javascript
const [viewMode, setViewMode] = useState("structure"); // 'structure' | 'flows'

// No header
<div className="flex items-center gap-2">
  <button
    onClick={() => setViewMode("structure")}
    className={`px-4 py-2 rounded-lg ${
      viewMode === "structure"
        ? "bg-blue-600 text-white"
        : "bg-gray-700 text-gray-300"
    }`}
  >
    Estrutura
  </button>
  <button
    onClick={() => setViewMode("flows")}
    className={`px-4 py-2 rounded-lg ${
      viewMode === "flows"
        ? "bg-blue-600 text-white"
        : "bg-gray-700 text-gray-300"
    }`}
  >
    Fluxos
  </button>
</div>;

// No main
{
  viewMode === "structure" ? (
    <ArchitectureTree
      architectureData={currentArchitectureData}
      onNodeClick={handleNodeClick}
    />
  ) : (
    <FlowView flows={FLOWS_DATA} />
  );
}
```

### 6. ADICIONAR Painel de Detalhes Lateral

**O que fazer**:

- Quando clicar em componente na árvore, mostra detalhes no painel lateral
- Mostrar: props, arquivo fonte, dependências, links

**Código esperado**:

```javascript
const [selectedNode, setSelectedNode] = useState(null);

const NodeDetailsPanel = ({ node }) => {
  if (!node) return null;

  return (
    <div className="w-80 bg-gray-800 border-l border-gray-700 p-4 overflow-y-auto">
      <h3 className="text-lg font-bold text-white mb-4">{node.name}</h3>

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-400 mb-2">Tipo</h4>
          <span className="text-sm text-gray-300">{node.type}</span>
        </div>

        {node.file && (
          <div>
            <h4 className="text-sm font-semibold text-gray-400 mb-2">
              Arquivo
            </h4>
            <code className="text-xs text-blue-400">{node.file}</code>
          </div>
        )}

        {node.props && Object.keys(node.props).length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-400 mb-2">Props</h4>
            <pre className="text-xs text-gray-300 bg-gray-900 p-2 rounded">
              {JSON.stringify(node.props, null, 2)}
            </pre>
          </div>
        )}

        {node.file && (
          <a
            href={`https://github.com/.../${node.file}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:underline"
          >
            Ver código fonte →
          </a>
        )}
      </div>
    </div>
  );
};
```

## Layout Final Esperado

```
┌─────────────────────────────────────────────────────────────┐
│ Header: Métricas Globais + Toggle (Estrutura | Fluxos)    │
├──────────┬───────────────────────────────┬──────────────────┤
│          │                               │                  │
│ Sidebar  │ Main (Alterna entre):         │ Sidebar Direito  │
│ Esquerdo │                               │ (Momentos)       │
│ Filtros  │ - ArchitectureTree OU        │ - Home           │
│          │ - FlowView                    │ - Admin          │
│          │                               │                  │
│          │                               │                  │
│          ├───────────────────────────────┤                  │
│          │ TabbedPanel (Logs/Traces/etc) │                  │
└──────────┴───────────────────────────────┴──────────────────┘
```

## Checklist de Implementação

- [ ] Criar `MomentsSidebar` (sidebar direito)
- [ ] Implementar `ArchitectureTree` completo (não placeholder)
- [ ] Completar `SYSTEM_ARCHITECTURE` com estrutura real
- [ ] Criar `FlowView` componente
- [ ] Adicionar dados `FLOWS_DATA` baseados no prompt-fluxo.md
- [ ] Adicionar toggle entre modos no header
- [ ] Criar `NodeDetailsPanel` (painel lateral)
- [ ] Integrar tudo no componente principal
- [ ] Testar navegação entre momentos
- [ ] Testar expandir/colapsar árvore
- [ ] Testar toggle entre modos

## Notas Importantes

1. **Manter o que já funciona**: Pipeline visual, métricas, modal de detalhes
2. **Adicionar sem quebrar**: Novas funcionalidades devem coexistir
3. **Dados mock são OK**: Não precisa ler código real, mas estrutura deve ser completa
4. **Foco em UX**: Visualização deve ser clara e navegável
5. **Performance**: Lazy load de detalhes se necessário
