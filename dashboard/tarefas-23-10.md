# 📋 Tarefas 23 de Outubro - AI Sales Assistant

**Data:** 23 de Outubro de 2025  
**Objetivo:** Completar sistema de templates e dashboards + novas funcionalidades

---

## 🎯 Status Atual vs. Meta do Dia

### ✅ **JÁ IMPLEMENTADO (Base Sólida)**

- ✅ **Sistema de Workspace Multi-tenant** (Clerk + MongoDB)
- ✅ **Sistema de Autenticação** (`getCurrentAuth()` centralizado)
- ✅ **Guest Workspace** (trial mode) com tiles funcionais
- ✅ **Sistema de Tiles** com AI generation (OpenAI)
- ✅ **UI Components** (Tile, LoadingTile, AddPromptTile, Modals)
- ✅ **DeckEngine** para jobs/bulk operations
- ✅ **Sistema de Companies** (add/view/select)
- ✅ **Sistema de Contacts** (add/view)
- ✅ **API Routes** (`/api/guest/*`)
- ✅ **Sistema de Notas** (cards laranjinhas)
- ✅ **Sistema de Files** (Cloudinary)
- ✅ **Sistema de Templates** (básico)

### ❌ **FALTANDO PARA HOJE**

---

## 🚀 **TAREFAS CRÍTICAS - 23/10**

### **1. Dashboard Templates System (PRIORIDADE ALTA)**

**Objetivo:** Sistema completo de templates de dashboard

#### **A. Header Dashboard Template Dropdown**

```javascript
// components/dashboard/DashboardHeader.jsx
- [ ] Dropdown com templates disponíveis
- [ ] Templates padrão (template_1, template_2)
- [ ] Templates do usuário (customizados)
- [ ] Opção "Create Blank Dashboard"
- [ ] Visualização dos prompts de cada template
- [ ] Aplicar template ao workspace atual
```

#### **B. Template Management**

```javascript
// lib/dashboard-templates.js
- [ ] CRUD completo de templates
- [ ] Preview de prompts antes de aplicar
- [ ] Clone de templates existentes
- [ ] Categorização de templates
- [ ] Variáveis dinâmicas ({{company_name}}, {{industry}})
```

#### **C. Template Preview Modal**

```javascript
// components/ui/TemplatePreviewModal.jsx
- [ ] Modal ou tooltipo viewer para visualizar prompts do template
- [ ] Lista de tiles que serão criados
- [ ] Preview do layout do dashboard
- [ ] Botão "Apply Template"
```

### **2. Dashboard Customization (PRIORIDADE ALTA)**

#### **A. Background Customization**

```javascript
// components/dashboard/BackgroundCustomizer.jsx
- [ ] Seletor de cores sólidas
- [ ] Galeria de backgrounds pré-definidos
- [ ] Upload de imagem personalizada
- [ ] Preview em tempo real
- [ ] Persistência no banco de dados
```

#### **B. Tile Management**

```javascript
// components/dashboard/TileManager.jsx
- [x] Drag-and-drop para reordenar tiles
- [ ] Resize tiles arrastando cantos
- [ ] Auto-ajuste de outros tiles
- [ ] Full-screen tile mode
- [ ] Save layout como template
```

### **3. Contact Outreach Tiles (PRIORIDADE ALTA)**

#### **A. Auto-Generation System**

```javascript
// lib/contact-outreach-generator.js
- [ ] Contact Insights Tile (role, KPIs, challenges)
- [ ] Email Pitch Tile (cold email personalizado)
- [ ] Cold Call Script Tile (script estruturado)
- [ ] Context awareness (company + contact data)
- [ ] Refinement e regeneration
- [ ] Save variants
```

#### **B. Outreach Tiles UI**

```javascript
// components/contacts/OutreachTiles.jsx
- [ ] 3 tiles automáticos por contato, row no main para tile de contato
- [ ] Regenerate individual tiles
- [ ] Edit e refine prompts
- [ ] Save como variants
- [ ] Export functionality
```

### **4. Mobile Responsiveness (PRIORIDADE ALTA)**

#### **A. Dashboard Mobile**

```javascript
// components/dashboard/DashboardMobile.jsx
- [ ] Layout responsivo para mobile
- [ ] Touch gestures para drag-and-drop
- [ ] Mobile-optimized tile sizes
- [ ] Swipe navigation
- [ ] Mobile-specific modals
```

#### **B. Template Selection Mobile**

```javascript
// components/dashboard/TemplateSelectorMobile.jsx
- [ ] Mobile-friendly template grid
- [ ] Touch-optimized preview
- [ ] Swipe between templates
- [ ] Mobile template creation flow
```

### **5. API Routes - Dashboard Templates (PRIORIDADE MÉDIA)**

```javascript
// Estrutura necessária:
app/api/dashboard-templates/
├── route.js (GET, POST)
├── [id]/route.js (GET, PUT, DELETE)
├── [id]/apply/route.js (POST - aplicar template)
├── [id]/clone/route.js (POST - clonar template)
└── preview/route.js (GET - preview sem aplicar)
```

### **6. API Routes - Contact Outreach (PRIORIDADE MÉDIA)**

```javascript
// Estrutura necessária:
app/api/contacts/
├── [id]/outreach/route.js (GET - buscar outreach tiles)
├── [id]/outreach/generate/route.js (POST - gerar tiles)
├── [id]/outreach/[tileId]/route.js (PUT, DELETE - editar tiles)
└── [id]/outreach/regenerate/route.js (POST - regenerar)
```

---

## 🔧 **TAREFAS TÉCNICAS DETALHADAS**

### **A. Dashboard Header Component**

```javascript
// components/dashboard/DashboardHeader.jsx
export function DashboardHeader({ currentTemplate, onTemplateChange }) {
  const [templates, setTemplates] = useState([]);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  return (
    <div className="dashboard-header">
      <div className="template-selector">
        <button onClick={() => setShowTemplateSelector(true)}>
          {currentTemplate?.name || "Select Template"} ▼
        </button>
      </div>

      <div className="dashboard-actions">
        <button>Create Blank</button>
        <button>Save as Template</button>
        <button>Clone Dashboard</button>
      </div>
    </div>
  );
}
```

### **B. Template Preview System**

```javascript
// components/ui/TemplatePreviewModal.jsx
export function TemplatePreviewModal({ template, isOpen, onClose, onApply }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="template-preview">
        <h3>{template.name}</h3>
        <p>{template.description}</p>

        <div className="tiles-preview">
          {template.tiles.map((tile) => (
            <div key={tile.id} className="tile-preview">
              <h4>{tile.title}</h4>
              <p>{tile.prompt}</p>
            </div>
          ))}
        </div>

        <div className="actions">
          <button onClick={onClose}>Cancel</button>
          <button onClick={() => onApply(template)}>Apply Template</button>
        </div>
      </div>
    </Modal>
  );
}
```

### **C. Contact Outreach Generator**

```javascript
// lib/contact-outreach-generator.js
export async function generateContactOutreach(contactId, companyData) {
  const contact = await getContact(contactId);
  const company = await getCompany(companyData.id);

  const outreachTiles = await Promise.all([
    generateContactInsights(contact, company),
    generateEmailPitch(contact, company),
    generateColdCallScript(contact, company),
  ]);

  return {
    contactInsights: outreachTiles[0],
    emailPitch: outreachTiles[1],
    coldCallScript: outreachTiles[2],
  };
}

async function generateContactInsights(contact, company) {
  const prompt = `
    Analyze this contact for outreach:
    Contact: ${contact.name} (${contact.role}) at ${company.name}
    Company: ${company.industry}
    
    Generate insights including:
    - Role summary and KPIs
    - Likely challenges and pain points
    - Triggers and motivations
    - Best approach for outreach
  `;

  return await generateTileWithOpenAI(prompt, "Contact Insights");
}
```

### **D. Background Customizer**

```javascript
// components/dashboard/BackgroundCustomizer.jsx
export function BackgroundCustomizer({
  currentBackground,
  onBackgroundChange,
}) {
  const [selectedType, setSelectedType] = useState("solid");
  const [selectedColor, setSelectedColor] = useState("#ffffff");
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <div className="background-customizer">
      <div className="background-types">
        <button
          className={selectedType === "solid" ? "active" : ""}
          onClick={() => setSelectedType("solid")}
        >
          Solid Color
        </button>
        <button
          className={selectedType === "preset" ? "active" : ""}
          onClick={() => setSelectedType("preset")}
        >
          Preset Images
        </button>
        <button
          className={selectedType === "upload" ? "active" : ""}
          onClick={() => setSelectedType("upload")}
        >
          Upload Image
        </button>
      </div>

      {selectedType === "solid" && (
        <ColorPicker value={selectedColor} onChange={setSelectedColor} />
      )}

      {selectedType === "preset" && (
        <PresetImageGallery onSelect={setSelectedImage} />
      )}

      {selectedType === "upload" && <ImageUpload onUpload={setSelectedImage} />}
    </div>
  );
}
```

---

## 📊 **CRITÉRIOS DE ACEITAÇÃO - 23/10**

### **Must Have:**

- [ ] ✅ Dashboard header com dropdown de templates
- [ ] ✅ Preview de templates antes de aplicar
- [ ] ✅ Background customization (cores + imagens)
- [ ] ✅ Drag-and-drop de tiles
- [ ] ✅ Contact outreach tiles automáticos
- [ ] ✅ Mobile responsiveness completa

### **Nice to Have:**

- [ ] ✅ Full-screen tile mode
- [ ] ✅ Template cloning
- [ ] ✅ Outreach tile variants
- [ ] ✅ Advanced background options

---

## 🚨 **BLOCKERS & DEPENDENCIES**

### **Dependências Externas:**

- [ ] Cloudinary para upload de backgrounds
- [ ] OpenAI para outreach generation
- [ ] MongoDB para persistência

### **Dependências Internas:**

- [ ] `lib/ai-tile-generator.js` (já existe)
- [ ] `components/ui/Modal.jsx` (já existe)
- [ ] `lib/cloudinary.js` (já existe)

---

## 📅 **CRONOGRAMA DO DIA**

### **Manhã (9h-12h):**

- [ ] Dashboard header com template dropdown
- [ ] Template preview modal
- [ ] Background customizer básico

### **Tarde (14h-17h):**

- [ ] Contact outreach tiles
- [ ] Drag-and-drop de tiles
- [ ] Mobile responsiveness

### **Noite (19h-21h):**

- [ ] Testing e polish
- [ ] Documentação
- [ ] Deploy

---

## 🎯 **META FINAL DO DIA**

**"Usuário pode selecionar templates de dashboard no header, customizar background, arrastar tiles, e cada contato gera automaticamente 3 tiles de outreach personalizados."**

**Resultado:** Sistema completo de dashboards com templates, customization e outreach automático.

---

## 📝 **NOTAS IMPORTANTES**

1. **Focar na UX**: Header dropdown deve ser intuitivo
2. **Mobile-first**: Responsividade é crítica
3. **Performance**: Outreach tiles devem ser rápidos
4. **Reutilizar**: Aproveitar componentes existentes

**Status:** 🟡 **EM ANDAMENTO** - Base sólida existe, focar em templates e outreach
