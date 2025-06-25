# 🚀 Guia de Desenvolvimento - Autores Apaixonados

**Como contribuir e desenvolver na plataforma de livros românticos**

---

## 🎯 Primeiros Passos

### 1. Setup do Ambiente

```bash
# Clone o repositório
git clone <repo-url>
cd dash

# Instale dependências
npm install
npm --workspace=dashboard install

# Configure variáveis de ambiente
cp env.example .env
# Preencha as chaves no arquivo .env
```

### 2. Estrutura de Desenvolvimento

```bash
# Inicia servidor de desenvolvimento
npm run dash:dev

# Em outro terminal, inicie as funções Netlify
netlify dev  # Roda functions localmente na porta 8888

# Rode testes em watch mode
npm run test -- --watch
```

---

## 🧩 Padrões de Código

### **Smart/Dumb Component Pattern**

#### ✅ DO - Component Dumb

```javascript
// components/forms/StoryForm.js
export function StoryForm({ story, onSubmit, loading, errors }) {
  const [formData, setFormData] = useState(story);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(formData);
      }}
    >
      <Input
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        error={errors.title}
      />
      <Button type="submit" loading={loading}>
        Salvar
      </Button>
    </form>
  );
}
```

#### ✅ DO - Container Smart

```javascript
// containers/StoryContainer.js
export function StoryContainer() {
  const { user } = useUser();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (storyData) => {
    setLoading(true);
    setErrors({});

    try {
      const response = await fetch("/.netlify/functions/story-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storyData),
      });

      if (!response.ok) {
        throw new Error("Falha ao criar história");
      }

      const { story } = await response.json();
      setStories((prev) => [...prev, story]);
    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <StoryForm
      story={currentStory}
      onSubmit={handleSubmit}
      loading={loading}
      errors={errors}
    />
  );
}
```

#### ❌ DON'T - Não misture responsabilidades

```javascript
// ❌ RUIM - Component fazendo fetch
function StoryForm() {
  const [story, setStory] = useState({});

  useEffect(() => {
    // NÃO! Component não deve fazer fetch
    fetch("/api/stories").then(setStory);
  }, []);

  return <form>...</form>;
}
```

---

## 🎨 Sistema de Design

### **Atomic Design Hierarchy**

```
Atoms (ui/)     → Button, Input, Badge
Molecules (forms/) → StoryForm, BookConfig
Organisms (containers/) → StoryContainer
Templates (app/) → Layout, Page Structure
Pages (app/) → Rotas finais
```

### **Convenções de Naming**

```javascript
// Componentes: PascalCase
export function StoryForm() {}
export function PlanCard() {}

// Funções: camelCase
export function validateStory() {}
export function formatPrice() {}

// Constantes: UPPER_SNAKE_CASE
export const MAX_STORY_LENGTH = 5000;
export const PLAN_TYPES = ["cupido", "afrodite", "zeus"];

// Arquivos: kebab-case
story - form.js;
plan - card.js;
user - metadata.js;
```

---

## 🔧 Netlify Functions

### **Estrutura de Function**

```javascript
// netlify/functions/story-create.js
export async function handler(event, context) {
  // 1. Validação de método
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  // 2. Parse e validação de dados
  let requestData;
  try {
    requestData = JSON.parse(event.body || "{}");
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON" }),
    };
  }

  // 3. Lógica de negócio
  try {
    const result = await processStoryCreation(requestData);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, data: result }),
    };
  } catch (error) {
    console.error("Story creation error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
}
```

### **Error Handling Pattern**

```javascript
// lib/api-client.js
export async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`/.netlify/functions/${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed: ${endpoint}`, error);
    throw error;
  }
}

// Uso nos containers
const handleSubmit = async (data) => {
  try {
    const result = await apiCall("story-create", {
      method: "POST",
      body: JSON.stringify(data),
    });
    // Handle success
  } catch (error) {
    setErrors({ general: error.message });
  }
};
```

---

## 🧪 Estratégia de Testes

### **Testes de Componentes**

```javascript
// tests/components/button.test.js
import test from "node:test";
import assert from "node:assert/strict";

test("Button - deve aplicar variante correta", () => {
  const variants = {
    primary: "bg-pink-600",
    secondary: "bg-gray-200",
    outline: "border border-pink-600",
  };

  Object.entries(variants).forEach(([variant, expectedClass]) => {
    // Test variant logic
    assert.ok(
      expectedClass.includes("bg-") || expectedClass.includes("border")
    );
  });
});
```

### **Testes de Functions**

```javascript
// tests/functions/story-create.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { handler } from "../../netlify/functions/story-create.js";

test("story-create - deve retornar 405 para método inválido", async () => {
  const event = { httpMethod: "GET" };
  const result = await handler(event, {});

  assert.equal(result.statusCode, 405);
  const body = JSON.parse(result.body);
  assert.equal(body.error, "Method Not Allowed");
});

test("story-create - deve criar história válida", async () => {
  const event = {
    httpMethod: "POST",
    body: JSON.stringify({
      title: "Teste História",
      partner1: { name: "João" },
      partner2: { name: "Maria" },
    }),
  };

  const result = await handler(event, {});
  assert.equal(result.statusCode, 200);

  const body = JSON.parse(result.body);
  assert.ok(body.data.id.startsWith("story_"));
});
```

### **Testes de Integração**

```javascript
// tests/integration/story-flow.test.js
import test from "node:test";
import assert from "node:assert/strict";

test("Story Flow - criar → atualizar → gerar livro", async () => {
  // 1. Cria história
  const createResponse = await fetch("/.netlify/functions/story-create", {
    method: "POST",
    body: JSON.stringify({ title: "Test Story" }),
  });
  const { story } = await createResponse.json();

  // 2. Atualiza história
  const updateResponse = await fetch("/.netlify/functions/story-update", {
    method: "PATCH",
    body: JSON.stringify({
      storyId: story.id,
      data: { howWeMet: "Em um café" },
    }),
  });
  assert.equal(updateResponse.status, 200);

  // 3. Gera livro
  const bookResponse = await fetch("/.netlify/functions/book-generate", {
    method: "POST",
    body: JSON.stringify({ storyId: story.id }),
  });
  assert.equal(bookResponse.status, 200);
});
```

---

## 📊 Sistema de Planos

### **Estrutura YAML**

```yaml
# config/plans.yml
metadata:
  currency: "BRL"
  trial_days: 7

plans:
  cupido:
    name: "Plano Cupido"
    price: 47
    includes:
      max_books: 1
      ai_suggestions: false
    features:
      - "1 livro digital"
      - "50 páginas max"
```

### **Helper Functions**

```javascript
// lib/plans.js
import { getPlan } from "./plans.js";

export function canUserAccessFeature(user, feature) {
  const plan = getPlan(user.unsafeMetadata?.currentPlan);
  return plan?.includes?.[feature] === true;
}

export function getUserBookLimit(user) {
  const plan = getPlan(user.unsafeMetadata?.currentPlan);
  const limit = plan?.includes?.max_books ?? 0;
  return limit === -1 ? Infinity : limit;
}

// Uso nos containers
if (!canUserAccessFeature(user, "ai_suggestions")) {
  setError("Feature não disponível no seu plano");
  return;
}
```

---

## 🎯 Checklist de Feature

Antes de implementar uma nova feature:

### **Planning**

- [ ] Definir requisitos claros
- [ ] Identificar componentes necessários
- [ ] Planejar estrutura Smart/Dumb
- [ ] Definir API endpoints
- [ ] Considerar permissões de plano

### **Implementation**

- [ ] Criar componentes dumb primeiro
- [ ] Implementar container smart
- [ ] Adicionar API function se necessário
- [ ] Integrar com sistema de planos
- [ ] Adicionar validações

### **Testing**

- [ ] Testes unitários dos componentes
- [ ] Testes das functions
- [ ] Teste manual no browser
- [ ] Verificar responsividade
- [ ] Testar diferentes planos

### **Documentation**

- [ ] Atualizar README se necessário
- [ ] Documentar novos endpoints
- [ ] Adicionar comentários no código
- [ ] Update architecture.md

---

## 🚨 Troubleshooting Comum

### **Error: Module not found**

```bash
# Certifique-se que type: "module" está no package.json
# E use extensões .js nos imports
import { something } from './file.js';  // ✅
import { something } from './file';     // ❌
```

### **Clerk Authentication Issues**

```javascript
// Sempre verifique se user está carregado
const { user, isLoaded } = useUser();

if (!isLoaded) {
  return <div>Carregando...</div>;
}

if (!user) {
  return <div>Não logado</div>;
}
```

### **Netlify Functions Local**

```bash
# Se functions não funcionam localmente:
netlify dev --live  # Tunnel para teste
netlify functions:serve  # Só functions
```

---

## 📚 Recursos Úteis

- **Documentação:** `/docs/architecture.md`
- **Componentes:** Storybook (TODO)
- **API Docs:** OpenAPI spec (TODO)
- **Design System:** Figma (TODO)

**Happy coding! 💖📚**
