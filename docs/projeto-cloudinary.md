# 🌤️ **Projeto: Integração Cloudinary Upload (Versão Robusta)**

## 📋 **Análise da Arquitetura Atual**

### **1. Sistema de Addons Existente:**

**Estrutura no Schema:**

```javascript
// schemas/index.js - ContentTypeSchema
addons: {
  type: "array",
  default: [],
  items: {
    id: { type: "string", required: true },        // UUID único
    name: { type: "string", required: true },      // Nome legível
    type: {
      type: "string",
      enum: ["textInput", "textarea", "imageUpload"],  // ← AQUI ADICIONAR "cloudinaryUpload"
      required: true
    },
    required: { type: "boolean", default: false }, // Obrigatório ou não
    config: { type: "object", default: {} },       // Configurações específicas
  },
}
```

**Tipos de Addons Atuais:**

- ✅ `textInput` - Campo de texto simples
- ✅ `textarea` - Texto longo
- ✅ `imageUpload` - Upload básico (apenas nome do arquivo)
- ✅ `dateInput` - Seletor de data
- ✅ `selectInput` - Dropdown com opções
- ✅ `numberInput` - Campo numérico
- ✅ `checkboxInput` - Checkbox sim/não

### **2. Renderização Atual no DynamicItemForm:**

**Switch Case Pattern:**

```javascript
// components/sections/DynamicItemForm.jsx
switch (addon.type) {
  case "textInput":
    return <input type="text" ... />
  case "textarea":
    return <textarea ... />
  case "imageUpload":  // ← UPLOAD ATUAL
    return <input type="file" accept="image/*" ... />
  // ← AQUI ADICIONAR case "cloudinaryUpload"
}
```

### **3. Estrutura de Dados (Proposta Melhorada):**

Em vez de salvar a URL completa, salvaremos o `public_id` retornado pelo Cloudinary. Isso nos dá flexibilidade para manipulação futura (deletar, transformar).

```javascript
// Item salvo no MongoDB
{
  title: "Meu Item",
  data: {
    "addon-id-123": "valor-do-campo",
    "imagem-upload-456": "nome-arquivo.jpg",
    "cloudinary-upload-789": "folder/image_public_id" // ← NOVO: Apenas o public_id
  }
}
```

---

## 🎯 **Plano de Integração Cloudinary**

### **1. Configuração de Ambiente (.env.local):**

As chaves `API_KEY` e `API_SECRET` serão usadas no backend para gerar assinaturas seguras.

```bash
# 🌤️ CLOUDINARY - Upload de Imagens
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=seu_cloud_name_aqui
CLOUDINARY_API_KEY=sua_api_key_aqui
CLOUDINARY_API_SECRET=sua_api_secret_aqui
```

### **2. Estrutura de Arquivos (Seguindo Padrões Existentes):**

```
📁 lib/
  └── cloudinary.js               # Config e helpers (gerar URL, etc.)
���� components/
  └── ui/
    └── CloudinaryUploadField.jsx # Componente de upload client-side
📁 app/api/
  └── upload/
    └── signature/
      └── route.js               # NOVO: Endpoint para gerar assinatura segura
```

### **3. Extensão do Schema Existente:**

**A. Atualizar ContentTypeSchema:**

```javascript
// schemas/index.js
type: {
  type: "string",
  enum: [
    "textInput", "textarea", "imageUpload",
    "cloudinaryUpload", // ← NOVO: Upload via Cloudinary
    "dateInput", "selectInput", "numberInput", "checkboxInput"
  ],
  required: true,
}
```

**B. Extensão do ContentTypeForm:**

```javascript
// components/content-types/ContentTypeForm.jsx
<select>
  <option value="cloudinaryUpload">🌤️ Upload Cloudinary</option> // ← NOVO
  // ... outros
</select>
```

### **4. Implementação no DynamicItemForm:**

**A. Adicionar ao Switch Case:**

```javascript
// components/sections/DynamicItemForm.jsx
case "cloudinaryUpload":
  return (
    <CloudinaryUploadField
      key={addon.id}
      addon={addon}
      value={formData.data[addon.id] || ""}
      onChange={(publicId) => handleAddonChange({ // ← Recebe o public_id
        target: { name: addon.id, value: publicId }
      })}
      required={addon.required}
    />
  );
```

**B. Atualizar handleAddonChange:**

O `value` recebido do `CloudinaryUploadField` já será o `public_id`.

```javascript
const handleAddonChange = (e) => {
  const { name, value, type, files } = e.target;

  if (type === "file" && files?.[0]) {
    // ... (lógica do upload básico)
  } else {
    // ← CLOUDINARY: value já vem como public_id
    setFormData((prev) => ({
      ...prev,
      data: { ...prev.data, [name]: value },
    }));
  }
};
```

### **5. Renderização na ModernItemsTable:**

A URL da imagem será construída dinamicamente a partir do `public_id` salvo.

**Atualizar renderFieldValue:**

```javascript
// components/sections/ModernItemsTable.jsx
import { buildUrl } from "#lib/cloudinary"; // Helper para construir a URL

// ...

case "cloudinaryUpload":
  return value ? (
    <img
      src={buildUrl(value, { width: 100, height: 100, crop: "fill" })} // Gera URL otimizada
      alt={addon.name}
      className="w-8 h-8 rounded object-cover"
      loading="lazy"
    />
  ) : "-";
```

---

## 🔧 **Componente CloudinaryUploadField**

### **Funcionalidades:**

1.  **🔒 Upload Assinado (Client-Side com Assinatura Server-Side):**
    -   Antes de exibir o widget, o componente fará uma requisição ao endpoint `app/api/upload/signature` para obter uma assinatura única e temporária.
    -   O upload para o Cloudinary é feito usando essa assinatura, garantindo que apenas a sua aplicação possa iniciar uploads.
    -   Isso evita o uso de "unsigned presets", que são uma falha de segurança.

2.  **Configurações via `addon.config`:**

    ```javascript
    {
      id: "banner-cloudinary",
      name: "Banner Principal",
      type: "cloudinaryUpload",
      config: {
        folder: "banners",      // Pasta no Cloudinary (será enviada para a API de assinatura)
        transformation: {       // Transformação na hora do upload
          width: 1200,
          height: 600,
          crop: "fill"
        }
      }
    }
    ```

3.  **Estados do Componente:**
    -   Idle: "Arraste uma imagem ou clique para enviar"
    -   Signing: "Preparando upload seguro..."
    -   Uploading: Progress bar + percentual + botão de cancelar
    -   Success: Preview da imagem + botão para "Trocar Imagem"
    -   Error: Mensagem de erro específica (ex: "Arquivo muito grande") + botão de "Tentar Novamente"

---

## 🚀 **Vantagens da Integração**

### **1. Mantém Arquitetura Existente:**

- ✅ Mesmo padrão de addons, mesma estrutura de dados (`public_id`), compatibilidade total.

### **2. Funcionalidades Avançadas e Seguras:**

- 🔐 **Segurança Reforçada**: Uploads assinados previnem abuso da sua conta Cloudinary.
- 🗑️ **Cleanup Confiável**: Com o `public_id`, é possível criar um script que deleta imagens órfãs do Cloudinary de forma programática e segura.
- 🔄 **Flexibilidade de Transformação**: Gere qualquer tamanho de imagem (thumbnail, full, etc.) sob demanda a partir do mesmo `public_id`.
- 🌤️ **CDN Global**, **Auto-Otimização**, **Organização em Pastas**.

### **3. Experiência de Usuário:**

- ⚡ **Upload Rápido e Seguro**, **Preview Imediato**, **Retry Automático**.

---

## 🎯 **Fases de Implementação**

### **Fase 1: Base Segura (MVP)**

1.  **Configurar Cloudinary**: Obter `cloud_name`, `api_key`, e `api_secret`.
2.  **Criar Endpoint de Assinatura**: Implementar `app/api/upload/signature/route.js`.
3.  **Componente `CloudinaryUploadField`**: Implementar a lógica de obter assinatura e fazer o upload.
4.  **Extensão do Schema e Forms**: Adicionar o tipo `cloudinaryUpload`.
5.  **Salvar `public_id`**: Garantir que o `public_id` é salvo no banco de dados.
6.  **Renderizar Imagem**: Usar um helper `buildUrl` para exibir a imagem na tabela.

### **Fase 2: Melhorias**

1.  **Cleanup Automático**: Script para remover imagens órfãs usando o `public_id`.
2.  **Configurações Avançadas**: Passar `folder` e `transformation` do `addon.config` para a API de assinatura.
3.  **Validações Robustas**: Melhorar tratamento de erros no client-side.

### **Fase 3: Avançado**

1.  **Upload Múltiplo** (galeria), **Editor de Imagem**, **Analytics**.
2.  **Migração**: Criar script para migrar uploads básicos existentes para o Cloudinary.

---

## 📝 **Próximos Passos**

1.  **Obter credenciais** do Cloudinary e configurar o `.env.local`.
2.  **Implementar a Fase 1 (Base Segura)**.
3.  **Testar** o fluxo completo: criar addon, fazer upload, salvar e exibir.
4.  **Documentar** o uso interno.

---

## 🔍 **Compatibilidade**

**Backward Compatible:**

- ✅ Upload básico continua funcionando.
- ✅ Dados existentes preservados.
- ✅ Nenhuma breaking change.

**Forward Compatible:**

- ✅ Arquitetura pronta para suportar vídeos ou outros provedores.
- ✅ `public_id` garante manutenibilidade a longo prazo.
