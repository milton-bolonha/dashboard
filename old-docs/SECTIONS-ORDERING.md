# 🔢 **Sistema de Ordenação de Sections**

## 🎯 **Funcionalidade Implementada**

Sistema completo de ordenação de sections com drag & drop para definir a ordem no menu lateral do dashboard.

---

## 📋 **O que foi Implementado**

### **1. 📊 Schema Atualizado**

```javascript
// schemas/index.js - SectionSchema
order: { type: "number", default: 0 }, // ← NOVO: Ordem no menu
```

### **2. 🎨 Interface Drag & Drop**

- ✅ **Componente genérico:** `DragDropTable` reutilizável
- ✅ **Modo reordenação:** Toggle na tabela de sections
- ✅ **Feedback visual:** Arrastar, hover, animações
- ✅ **Auto-save:** Salva automaticamente ao soltar

### **3. 🔄 API de Reordenação**

```javascript
// PUT /api/sections/reorder
{
  sections: [
    { _id: "abc123", order: 0 },
    { _id: "def456", order: 1 },
    // ...
  ],
  workspaceId: "workspace123"
}
```

### **4. 📱 Menu Ordenado**

- ✅ **Sidebar atualizado:** Usa campo `order` das sections
- ✅ **Ordenação automática:** Menor número = mais acima
- ✅ **Atualização em tempo real:** Menu reflete mudanças instantaneamente

---

## 🚀 **Como Usar**

### **1. Ordenar Sections via Interface:**

1. **Acessar:** `/dashboard/sections`
2. **Ativar modo reordenação:** Clique "Reordenar Menu"
3. **Arrastar sections:** Use os ícones ⋮⋮ para arrastar
4. **Salvar:** Mudanças são salvas automaticamente
5. **Finalizar:** Clique "Finalizar" para sair do modo

### **2. Definir Ordem Manualmente:**

1. **Editar section:** Clique "Editar" em qualquer section
2. **Campo "Ordem no Menu":** Digite número (0, 1, 2, etc.)
3. **Salvar:** Menor número aparece mais acima no menu

### **3. Via API:**

```javascript
// Reordenar programaticamente
const response = await fetch("/api/sections/reorder", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    sections: [
      { _id: "section1", order: 0 }, // Primeiro
      { _id: "section2", order: 1 }, // Segundo
      { _id: "section3", order: 2 }, // Terceiro
    ],
    workspaceId: "workspace123",
  }),
});
```

---

## 🎨 **Interface do Usuário**

### **Modo Normal:**

```
┌─────────────────────────────────────────────┐
│ Sections (3)                [Reordenar Menu]│
│ Gerencie suas áreas de conteúdo             │
├─────────────────────────────────────────────┤
│ #  │ Nome      │ Slug     │ Content Type    │
│ 1  │ Blog      │ /blog    │ [Artigo]        │
│ 2  │ Produtos  │ /items   │ [Produto]       │
│ 3  │ Sobre     │ /about   │ [Página]        │
└─────────────────────────────────────────────┘
```

### **Modo Reordenação:**

```
┌─────────────────────────────────────────────┐
│ Sections (3)                    [Finalizar] │
│ Arraste as sections para reordenar o menu   │
├─────────────────────────────────────────────┤
│ ⋮⋮ │ ① Blog      │ /blog    │ [Artigo]     │
│ ⋮⋮ │ ② Produtos  │ /items   │ [Produto]    │ ← Arrastável
│ ⋮⋮ │ ③ Sobre     │ /about   │ [Página]     │
├─────────────────────────────────────────────┤
│        💾 Salvando nova ordem...             │
└─────────────────────────────────────────────┘
```

### **Menu Lateral (Resultado):**

```
🏠 Dashboard
📄 Blog      ← ordem: 0 (primeiro)
🛍️ Produtos  ← ordem: 1 (segundo)
ℹ️ Sobre     ← ordem: 2 (terceiro)
⚙️ Content Creator
```

---

## 🛠️ **Componentes Criados**

### **1. DragDropTable.jsx**

```javascript
// Componente genérico reutilizável
<DragDropTable
  items={sections}
  onReorder={handleReorder}
  renderRow={renderSectionRow}
  dragHandle={true}
/>
```

**Funcionalidades:**

- ✅ **Drag & Drop nativo** HTML5
- ✅ **Feedback visual** durante arraste
- ✅ **Callbacks customizáveis** para reordenação
- ✅ **Acessibilidade** com títulos e ARIA

### **2. API /sections/reorder**

```javascript
// Endpoint seguro para reordenação
PUT /api/sections/reorder
- Autenticação via Clerk
- Validação de dados
- Update em batch no MongoDB
- Response com confirmação
```

### **3. ModernSectionsTable.jsx Atualizada**

```javascript
// Tabela com modo reordenação
- Toggle para ativar/desativar drag & drop
- Coluna # com número da ordem
- Feedback visual durante reordenação
- Instruções contextuais
```

---

## ⚡ **Comportamento Técnico**

### **1. Ordenação Padrão:**

```javascript
// Sections sem ordem definida = 0
const orderedSections = sections.sort(
  (a, b) => (a.order || 0) - (b.order || 0)
);
```

### **2. Reordenação Drag & Drop:**

```javascript
// Atualiza ordem baseada na nova posição
const reorderedItems = newItems.map((item, index) => ({
  ...item,
  order: index, // Nova ordem = índice na lista
}));
```

### **3. Persistência:**

```javascript
// Update em batch no MongoDB
const updatePromises = sections.map((section, index) => {
  return db.update(
    "sections",
    { _id: section._id },
    { order: index, updatedAt: new Date() }
  );
});
```

### **4. Atualização do Menu:**

```javascript
// Sidebar usa React.useMemo para performance
const orderedSections = React.useMemo(() => {
  return [...sections].sort((a, b) => (a.order || 0) - (b.order || 0));
}, [sections]);
```

---

## 🎯 **Casos de Uso**

### **Blog + E-commerce:**

1. **Blog** (ordem: 0) - Primeiro no menu
2. **Produtos** (ordem: 1) - Segundo
3. **Categorias** (ordem: 2) - Terceiro
4. **Sobre** (ordem: 3) - Último

### **Site Corporativo:**

1. **Home** (ordem: 0)
2. **Serviços** (ordem: 1)
3. **Portfolio** (ordem: 2)
4. **Equipe** (ordem: 3)
5. **Contato** (ordem: 4)

### **Dashboard Interno:**

1. **Relatórios** (ordem: 0) - Mais importante
2. **Vendas** (ordem: 1)
3. **Clientes** (ordem: 2)
4. **Configurações** (ordem: 3) - Menos usado

---

## 🔧 **Personalização e Extensão**

### **1. Ordenação por Grupos:**

```javascript
// Futuro: Organizar sections em grupos
{
  order: 10,
  group: "content",    // Grupo de conteúdo
  groupOrder: 1        // Ordem dentro do grupo
}
```

### **2. Ordenação por Usuário:**

```javascript
// Futuro: Ordem personalizada por usuário
{
  order: 5,
  userOrder: {
    "user123": 2,      // User específico vê em posição diferente
    "user456": 8
  }
}
```

### **3. Ordenação Condicional:**

```javascript
// Futuro: Ordem baseada em contexto
{
  order: 3,
  conditions: {
    mobile: 1,         // No mobile, mostrar primeiro
    desktop: 3         // No desktop, terceiro
  }
}
```

---

## ✅ **Testando a Funcionalidade**

### **1. Teste Manual:**

1. ✅ Criar 3+ sections
2. ✅ Ativar modo reordenação
3. ✅ Arrastar sections para nova ordem
4. ✅ Verificar menu lateral atualizado
5. ✅ Finalizar modo reordenação
6. ✅ Confirmar persistência (recarregar página)

### **2. Teste de API:**

```bash
# Teste direto da API
curl -X PUT http://localhost:3000/api/sections/reorder \
  -H "Content-Type: application/json" \
  -d '{
    "sections": [
      {"_id": "abc123", "order": 0},
      {"_id": "def456", "order": 1}
    ],
    "workspaceId": "workspace123"
  }'
```

### **3. Teste de Performance:**

```javascript
// Com 50+ sections, a ordenação deve ser instantânea
console.time("Section Reorder");
// ... reordenar sections ...
console.timeEnd("Section Reorder"); // < 100ms esperado
```

---

## 🚀 **Benefícios Alcançados**

### **🎯 UX Melhorada:**

- ✅ **Controle total** sobre organização do menu
- ✅ **Interface intuitiva** com drag & drop
- ✅ **Feedback visual** durante operações
- ✅ **Sem quebras** - funciona com sections existentes

### **⚡ Performance:**

- ✅ **Ordenação eficiente** com useMemo
- ✅ **Update em batch** no banco de dados
- ✅ **Atualização local** antes da API (otimistic updates)

### **🔧 Manutenibilidade:**

- ✅ **Componente reutilizável** DragDropTable
- ✅ **API padronizada** para reordenação
- ✅ **Schema extensível** para futuras funcionalidades

---

## 🎉 **Pronto para Uso!**

A funcionalidade de ordenação está **100% implementada** e funcional:

1. **✅ Schema atualizado** com campo `order`
2. **✅ Interface drag & drop** moderna e intuitiva
3. **✅ API segura** para persistência
4. **✅ Menu ordenado** automaticamente
5. **✅ Compatibilidade** com sections existentes

**Agora você tem controle total sobre a organização do menu!** 🎯
