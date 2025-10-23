# 🎯 Plano Detalhado - Dashboard Templates System

**Data:** 23 de Outubro de 2025  
**Objetivo:** Sistema completo de dashboard templates  
**Status:** 🟡 **EM PLANEJAMENTO**

---

## 🎯 **VISÃO GERAL DO SISTEMA**

### **O que o usuário quer:**

1. **Salvar organização atual** como template customizado
2. **Aplicar template** ao criar nova company
3. **Gerenciar templates** (criar, editar, deletar)
4. **Templates padrão** (template_1, template_2) + **customizados**

### **Fluxo do usuário:**

```
1. Usuário organiza tiles no dashboard
2. Clica "Save as Template"
3. Dá nome ao template
4. Template fica disponível na lista
5. Ao criar nova company, pode escolher template
6. Tiles são gerados baseado no template selecionado
```

---

## 🏗️ **ARQUITETURA TÉCNICA**

### **1. Database Schema**

```javascript
// Adicionar ao GuestWorkspaceSchema
dashboardTemplates: [
  {
    id: String, // UUID único
    name: String, // Nome do template
    description: String, // Descrição opcional
    isDefault: Boolean, // true para template_1, template_2
    isCustom: Boolean, // true para templates do usuário
    tiles: [
      {
        id: String, // ID do tile
        title: String, // Título do tile
        prompt: String, // Prompt original
        category: String, // Categoria
        order: Number, // Ordem no dashboard
        defaultSize: {
          // Tamanho padrão
          w: Number,
          h: Number,
        },
        isCustom: Boolean, // true se foi criado pelo usuário
      },
    ],
    createdAt: Date,
    updatedAt: Date,
    createdBy: String, // guest_id ou user_id
  },
];
```

### **2. API Routes Structure**

```
app/api/guest/templates/
├── route.js                    # GET (list), POST (create)
├── [id]/route.js              # GET (detail), PUT (update), DELETE
├── apply/route.js             # POST (aplicar template)
└── default/route.js           # GET (templates padrão)
```

### **3. UI Components Structure**

```
components/ui/templates/
├── TemplateManager.jsx         # Lista e gerencia templates
├── TemplateSelector.jsx        # Seleciona template ao criar company
├── TemplateEditor.jsx          # Edita template existente
├── TemplatePreview.jsx         # Preview do template
└── SaveTemplateModal.jsx      # Modal para salvar template
```

---

## 🔧 **IMPLEMENTAÇÃO DETALHADA**

### **1. Database Schema (lib/schemas/templates.js)**

```javascript
export const DashboardTemplateSchema = {
  name: "dashboard_templates",
  fields: {
    id: { type: "string", required: true },
    name: { type: "string", required: true },
    description: { type: "string" },
    isDefault: { type: "boolean", default: false },
    isCustom: { type: "boolean", default: true },
    tiles: [
      {
        id: { type: "string", required: true },
        title: { type: "string", required: true },
        prompt: { type: "string", required: true },
        category: { type: "string", required: true },
        order: { type: "number", required: true },
        defaultSize: {
          w: { type: "number", default: 4 },
          h: { type: "number", default: 2 },
        },
        isCustom: { type: "boolean", default: false },
      },
    ],
    createdAt: { type: "date", required: true },
    updatedAt: { type: "date", required: true },
    createdBy: { type: "string", required: true },
  },
  indexes: [
    { fields: { createdBy: 1, name: 1 }, unique: true },
    { fields: { isDefault: 1 } },
    { fields: { isCustom: 1 } },
  ],
};
```

### **2. API Routes**

#### **2.1. GET /api/guest/templates**

```javascript
// Lista todos os templates disponíveis
export async function GET() {
  const cookieStore = await cookies();
  const guestId = cookieStore.get("guest_id")?.value;

  if (!guestId) {
    return NextResponse.json({ error: "No guest session" }, { status: 401 });
  }

  // Buscar templates padrão + customizados do usuário
  const defaultTemplates = await getDefaultTemplates();
  const customTemplates = await db.find("dashboard_templates", {
    createdBy: guestId,
    isCustom: true,
  });

  return NextResponse.json({
    templates: [...defaultTemplates, ...customTemplates],
  });
}
```

#### **2.2. POST /api/guest/templates**

```javascript
// Cria novo template customizado
export async function POST(req) {
  const body = await req.json();
  const { name, description, tiles } = body;

  const template = {
    id: uuidv4(),
    name,
    description,
    isDefault: false,
    isCustom: true,
    tiles,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: guestId,
  };

  await db.insertOne("dashboard_templates", template);
  return NextResponse.json({ success: true, template });
}
```

#### **2.3. POST /api/guest/templates/apply**

```javascript
// Aplica template ao criar nova company
export async function POST(req) {
  const body = await req.json();
  const { templateId, companyName, companyUrl } = body;

  // Buscar template
  const template = await db.findOne("dashboard_templates", { id: templateId });

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  // Aplicar template à nova company
  await applyTemplateToCompany(guestId, template, companyName, companyUrl);

  return NextResponse.json({ success: true });
}
```

### **3. UI Components**

#### **3.1. TemplateManager.jsx**

```javascript
export default function TemplateManager({
  templates,
  onSelect,
  onEdit,
  onDelete,
}) {
  return (
    <div className="template-manager">
      <div className="header">
        <h3>Dashboard Templates</h3>
        <button onClick={() => setShowCreateModal(true)}>
          Create New Template
        </button>
      </div>

      <div className="templates-grid">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onSelect={() => onSelect(template)}
            onEdit={() => onEdit(template)}
            onDelete={() => onDelete(template)}
          />
        ))}
      </div>
    </div>
  );
}
```

#### **3.2. TemplateSelector.jsx**

```javascript
export default function TemplateSelector({ onSelect, onCancel }) {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const response = await fetch("/api/guest/templates");
    const data = await response.json();
    setTemplates(data.templates);
  };

  return (
    <div className="template-selector">
      <h3>Choose a Template</h3>

      <div className="templates-list">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`template-option ${
              selectedTemplate?.id === template.id ? "selected" : ""
            }`}
            onClick={() => setSelectedTemplate(template)}
          >
            <div className="template-info">
              <h4>{template.name}</h4>
              <p>{template.description}</p>
              <span className="tiles-count">{template.tiles.length} tiles</span>
            </div>
          </div>
        ))}
      </div>

      <div className="actions">
        <button onClick={onCancel}>Cancel</button>
        <button
          onClick={() => onSelect(selectedTemplate)}
          disabled={!selectedTemplate}
        >
          Apply Template
        </button>
      </div>
    </div>
  );
}
```

#### **3.3. SaveTemplateModal.jsx**

```javascript
export default function SaveTemplateModal({
  isOpen,
  onClose,
  onSave,
  currentTiles,
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSave = async () => {
    if (!name.trim()) return;

    const template = {
      name: name.trim(),
      description: description.trim(),
      tiles: currentTiles.map((tile) => ({
        id: tile.id,
        title: tile.title,
        prompt: tile.question,
        category: tile.category,
        order: tile.order,
        defaultSize: tile.defaultSize,
        isCustom: tile.isCustom || false,
      })),
    };

    await onSave(template);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="save-template-modal">
        <h3>Save as Template</h3>

        <div className="form">
          <label>
            Template Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter template name"
            />
          </label>

          <label>
            Description (optional)
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this template"
            />
          </label>
        </div>

        <div className="actions">
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleSave} disabled={!name.trim()}>
            Save Template
          </button>
        </div>
      </div>
    </Modal>
  );
}
```

---

## 🔄 **FLUXO DE IMPLEMENTAÇÃO**

### **Fase 1: Database & API (2h)**

1. Criar schema para templates
2. Implementar API routes básicas
3. Testar CRUD operations

### **Fase 2: UI Components (3h)**

1. TemplateManager component
2. TemplateSelector component
3. SaveTemplateModal component
4. Integration com trial page

### **Fase 3: Integration (2h)**

1. Integrar com AddCompanyModal
2. Integrar com trial dashboard
3. Testar fluxo completo

### **Fase 4: Testing & Polish (1h)**

1. Testar todos os cenários
2. Error handling
3. UI/UX improvements

---

## 🎯 **CRITÉRIOS DE ACEITAÇÃO**

### **Must Have:**

- [ ] ✅ Salvar dashboard atual como template
- [ ] ✅ Aplicar template ao criar nova company
- [ ] ✅ Listar templates disponíveis
- [ ] ✅ Gerenciar templates customizados
- [ ] ✅ Templates padrão funcionando

### **Nice to Have:**

- [ ] ✅ Preview de templates
- [ ] ✅ Editar templates existentes
- [ ] ✅ Deletar templates
- [ ] ✅ Categorias de templates
- [ ] ✅ Compartilhar templates

---

## 🚨 **POTENCIAIS PROBLEMAS**

### **1. Performance**

- **Problema:** Muitos templates podem impactar performance
- **Solução:** Pagination e lazy loading

### **2. Data Consistency**

- **Problema:** Templates podem ficar desatualizados
- **Solução:** Versioning e validation

### **3. User Experience**

- **Problema:** Interface pode ficar confusa
- **Solução:** Clear labeling e intuitive flow

---

## 📝 **NOTAS DE IMPLEMENTAÇÃO**

1. **Manter compatibilidade** com sistema atual
2. **Templates padrão** devem ser sempre disponíveis
3. **Custom templates** são específicos do usuário
4. **Error handling** robusto para todos os cenários
5. **UI/UX** deve ser intuitiva e clara

**Status:** 🟡 **EM PLANEJAMENTO** - Pronto para implementação
