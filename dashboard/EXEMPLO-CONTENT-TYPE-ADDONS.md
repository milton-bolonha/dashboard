# 🎯 **EXEMPLO: Content Type com Addons → Items Dinâmicos**

## 🏗️ **COMO FUNCIONA AGORA:**

```mermaid
Content Type → Addons → Section → Items (formulário dinâmico)
```

---

## 📝 **1. CRIANDO UM CONTENT TYPE COM ADDONS**

### **Exemplo: "Blog Post"**

**Acesse:** `http://localhost:3000/dashboard/content-types`

**Clique:** "Novo Content Type"

**Configure:**

```yaml
Nome: Blog Post
Slug: blog-post (auto-gerado)
Descrição: Artigos do blog com campos customizados

Addons (Campos):
  1. Campo: "Subtítulo"
     Tipo: textInput
     Obrigatório: ✓

  2. Campo: "Conteúdo Principal"
     Tipo: textarea
     Obrigatório: ✓

  3. Campo: "Imagem de Capa"
     Tipo: imageUpload
     Obrigatório: ❌

  4. Campo: "Tags"
     Tipo: textInput
     Obrigatório: ❌

✓ Criar uma Section no menu: ATIVADO
```

---

## 🎨 **2. RESULTADO DO FORMULÁRIO DINÂMICO**

Quando criar um item na section "Blog Post", o formulário será:

### **Campos Padrão (sempre presentes):**

- ✅ **Título do Item** (obrigatório)
- ✅ **Status** (draft/published/archived)

### **Campos Customizados (dos addons):**

- ✅ **Subtítulo** (textInput, obrigatório)
- ✅ **Conteúdo Principal** (textarea, obrigatório)
- ✅ **Imagem de Capa** (imageUpload, opcional)
- ✅ **Tags** (textInput, opcional)

---

## 💾 **3. ESTRUTURA DOS DADOS NO MONGODB**

```javascript
// Item salvo no banco
{
  _id: "...",
  title: "Meu Primeiro Post",           // Campo padrão
  slug: "meu-primeiro-post",           // Campo padrão
  status: "published",                 // Campo padrão
  sectionId: "...",                   // Referência da section
  data: {                             // 🎯 DADOS DOS ADDONS
    "subtitulo": "Uma introdução interessante",
    "conteudo-principal": "Lorem ipsum dolor sit amet...",
    "imagem-de-capa": "https://...",
    "tags": "javascript, tutorial, iniciante"
  },
  createdAt: "2024-01-01T00:00:00Z",  // Campo padrão
  updatedAt: "2024-01-01T00:00:00Z"   // Campo padrão
}
```

---

## 🎭 **4. VISUALIZAÇÃO MELHORADA**

### **Na lista de items, aparece:**

```
┌─────────────────────────────────────────────┐
│ 📰 Meu Primeiro Post        [🟢 Publicado]  │
│                                             │
│ subtitulo: Uma introdução interessante      │
│ tags: javascript, tutorial, iniciante      │
│ conteudo-principal: Lorem ipsum dolor...    │
│                                             │
│ 🔗 /meu-primeiro-post  📅 01/01/2024       │
│                              [Editar] [❌]  │
└─────────────────────────────────────────────┘
```

---

## 🔧 **5. TIPOS DE ADDONS DISPONÍVEIS**

### **textInput** - Campo de texto curto

```javascript
{
  id: "autor",
  name: "Autor",
  type: "textInput",
  required: true
}
```

### **textarea** - Campo de texto longo

```javascript
{
  id: "descricao",
  name: "Descrição",
  type: "textarea",
  required: false
}
```

### **imageUpload** - Upload de imagem

```javascript
{
  id: "banner",
  name: "Banner Principal",
  type: "imageUpload",
  required: false
}
```

---

## 🚀 **6. EXEMPLOS DE CONTENT TYPES**

### **📰 Blog Post**

```yaml
Addons:
  - Subtítulo (textInput, obrigatório)
  - Resumo (textarea, opcional)
  - Imagem de Capa (imageUpload, opcional)
  - Tags (textInput, opcional)
  - Categoria (textInput, obrigatório)
```

### **🛍️ Produto**

```yaml
Addons:
  - Preço (textInput, obrigatório)
  - Descrição (textarea, obrigatório)
  - Foto Principal (imageUpload, obrigatório)
  - Características (textarea, opcional)
  - Categoria (textInput, obrigatório)
```

### **👤 Perfil de Equipe**

```yaml
Addons:
  - Cargo (textInput, obrigatório)
  - Bio (textarea, obrigatório)
  - Foto (imageUpload, obrigatório)
  - LinkedIn (textInput, opcional)
  - Email (textInput, opcional)
```

### **📄 Página Institucional**

```yaml
Addons:
  - Subtítulo (textInput, opcional)
  - Conteúdo (textarea, obrigatório)
  - Banner (imageUpload, opcional)
  - Call-to-Action (textInput, opcional)
```

---

## ✅ **7. TESTE PASSO A PASSO**

1. **Criar Content Type:** `/dashboard/content-types`
2. **Adicionar Addons:** Configure campos customizados
3. **Acessar Section:** Aparecerá automaticamente no sidebar
4. **Criar Item:** Formulário dinâmico com todos os campos
5. **Ver Resultado:** Item listado com dados dos addons

---

## 🎯 **VANTAGENS DO SISTEMA:**

- ✅ **Flexibilidade total** - Cada Content Type tem seus campos
- ✅ **Formulários dinâmicos** - Sem código hardcoded
- ✅ **Reutilização** - Um Content Type serve várias Sections
- ✅ **Escalabilidade** - Adicionar campos sem programar
- ✅ **UX consistente** - Interface padronizada
- ✅ **Dados estruturados** - MongoDB bem organizado

---

## 🔄 **MIGRAÇÃO DE DADOS ANTIGOS**

Items antigos com `content` serão mostrados normalmente (fallback) enquanto novos items usam o sistema de addons.

**Não há quebra de compatibilidade!** 🎉
