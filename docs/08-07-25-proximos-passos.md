# 🚀 Próximos Passos - 08/07/2025

## 🎯 **PRIORIDADE 1: Exposição de Dados Públicos de Sections**

### **Objetivo Principal**

Implementar sistema para expor dados de sections que são moldados e inseridos como itens, permitindo acesso público controlado aos dados não-privados.

### **Contexto Atual**

- ✅ Sistema de super admin funcionando
- ✅ Sections e items sendo criados
- ❌ **Dados não são expostos publicamente**
- ❌ **API keys existem mas não funcionais**
- ❌ **Sem diferenciação entre dados públicos/privados**

---

## 📋 **Plano de Implementação**

### **Fase 1: Estrutura Base (Semana 1)**

#### **1.1 Configuração de Visibilidade por Section**

```javascript
// Adicionar ao schema de Section
access: {
  visibility: "public" | "private" | "authenticated",
  publicFields: ["title", "description", "items"], // campos que podem ser públicos
  requireApiKey: boolean,
  rateLimit: number
}
```

#### **1.2 API Keys Funcionais**

- **Ativar sistema de API keys** existente
- **Implementar validação** de chaves
- **Rate limiting** por chave
- **Logs de uso** para analytics

#### **1.3 Endpoints Públicos**

```javascript
// GET /api/public/sections/{slug}
// GET /api/public/sections/{slug}/items
// GET /api/public/sections/{slug}/items/{itemId}
```

### **Fase 2: Controle Granular (Semana 2)**

#### **2.1 Diferenciação Público/Privado**

- **Campos públicos:** título, descrição, dados básicos
- **Campos privados:** dados sensíveis, metadados internos
- **Configuração por campo** na interface admin

#### **2.2 Sistema de Permissões**

```javascript
// Por section
publicAccess: {
  allowAnonymous: boolean,
  requireApiKey: boolean,
  allowedFields: string[],
  rateLimit: number
}
```

#### **2.3 Interface de Configuração**

- **Toggle público/privado** por section
- **Seleção de campos** expostos
- **Configuração de API keys**
- **Preview de dados** que serão expostos

### **Fase 3: Implementação Técnica (Semana 3)**

#### **3.1 Rotas Públicas**

```javascript
// Implementar endpoints
GET / api / public / sections;
GET / api / public / sections / { slug };
GET / api / public / sections / { slug } / items;
GET / api / public / sections / { slug } / items / { itemId };
```

#### **3.2 Middleware de Segurança**

- **Validação de API keys**
- **Rate limiting**
- **Filtros de campos** baseados em permissões
- **Logs de acesso**

#### **3.3 Cache e Performance**

- **Cache de dados públicos**
- **CDN para assets**
- **Otimização de queries**

---

## 🔧 **Implementação Técnica**

### **1. Schema Updates**

#### **Section Schema - Adicionar Controles de Acesso**

```javascript
{
  // ... campos existentes ...

  // NOVO: Controles de acesso público
  publicAccess: {
    isPublic: { type: "boolean", default: false },
    requireApiKey: { type: "boolean", default: true },
    allowedFields: [{ type: "string" }], // ["title", "description", "items"]
    rateLimit: { type: "number", default: 100 }, // requests per hour
    allowAnonymous: { type: "boolean", default: false },
    customDomain: { type: "string" }, // para white label
  },

  // NOVO: Configurações de API
  apiConfig: {
    enabled: { type: "boolean", default: false },
    keys: [{
      key: "string",
      name: "string",
      permissions: ["read", "write"],
      rateLimit: "number",
      expiresAt: "date"
    }],
    webhooks: [{
      url: "string",
      events: ["item.created", "item.updated"],
      secret: "string"
    }]
  }
}
```

### **2. API Endpoints**

#### **2.1 Listar Sections Públicas**

```javascript
// GET /api/public/sections
export async function GET(request) {
  const sections = await db.find("sections", {
    "publicAccess.isPublic": true,
  });

  return NextResponse.json({
    sections: sections.map((s) => ({
      slug: s.slug,
      title: s.name,
      description: s.description,
      itemCount: s.itemCount,
      lastUpdated: s.updatedAt,
    })),
  });
}
```

#### **2.2 Dados de Section Específica**

```javascript
// GET /api/public/sections/{slug}
export async function GET(request, { params }) {
  const { slug } = params;

  const section = await db.findOne("sections", {
    slug,
    "publicAccess.isPublic": true,
  });

  if (!section) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }

  // Filtrar apenas campos públicos
  const publicData = {
    title: section.name,
    description: section.description,
    itemCount: section.itemCount,
    lastUpdated: section.updatedAt,
  };

  return NextResponse.json(publicData);
}
```

#### **2.3 Items de Section**

```javascript
// GET /api/public/sections/{slug}/items
export async function GET(request, { params }) {
  const { slug } = params;
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get("page")) || 1;
  const limit = parseInt(searchParams.get("limit")) || 20;

  const section = await db.findOne("sections", {
    slug,
    "publicAccess.isPublic": true,
  });

  if (!section) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }

  const items = await db.find(
    "items",
    {
      sectionId: section._id,
    },
    {
      skip: (page - 1) * limit,
      limit: limit,
      sort: { createdAt: -1 },
    }
  );

  // Filtrar apenas campos públicos dos items
  const publicItems = items.map((item) => ({
    id: item._id,
    title: item.title,
    description: item.description,
    createdAt: item.createdAt,
    // Outros campos públicos configurados
  }));

  return NextResponse.json({
    items: publicItems,
    pagination: {
      page,
      limit,
      total: await db.count("items", { sectionId: section._id }),
    },
  });
}
```

### **3. Sistema de API Keys**

#### **3.1 Validação de Chave**

```javascript
// middleware/api-key-auth.js
export async function validateApiKey(request) {
  const apiKey = request.headers.get("x-api-key");

  if (!apiKey) {
    return { valid: false, error: "API key required" };
  }

  // Buscar chave no banco
  const key = await db.findOne("api_keys", {
    key: apiKey,
    isActive: true,
    expiresAt: { $gt: new Date() },
  });

  if (!key) {
    return { valid: false, error: "Invalid API key" };
  }

  // Verificar rate limit
  const usage = await checkRateLimit(key.key);
  if (!usage.allowed) {
    return { valid: false, error: "Rate limit exceeded" };
  }

  return { valid: true, key };
}
```

#### **3.2 Rate Limiting**

```javascript
// lib/rate-limit.js
export async function checkRateLimit(apiKey) {
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const requests = await db.count("api_requests", {
    apiKey,
    timestamp: { $gte: hourAgo },
  });

  const key = await db.findOne("api_keys", { key: apiKey });
  const limit = key?.rateLimit || 100;

  return {
    allowed: requests < limit,
    remaining: Math.max(0, limit - requests),
    resetAt: new Date(now.getTime() + 60 * 60 * 1000),
  };
}
```

---

## 🎨 **Interface de Configuração**

### **1. Toggle Público/Privado**

```jsx
// components/sections/PublicAccessConfig.jsx
export function PublicAccessConfig({ section, onChange }) {
  const [config, setConfig] = useState(
    section.publicAccess || {
      isPublic: false,
      requireApiKey: true,
      allowedFields: ["title", "description"],
      rateLimit: 100,
    }
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={config.isPublic}
          onChange={(e) => {
            setConfig((prev) => ({ ...prev, isPublic: e.target.checked }));
            onChange({ ...config, isPublic: e.target.checked });
          }}
        />
        <label>Section Pública</label>
      </div>

      {config.isPublic && (
        <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium">Configurações Públicas</h4>

          <div>
            <label className="block text-sm font-medium mb-2">
              Campos Públicos
            </label>
            <div className="space-y-2">
              {["title", "description", "items", "metadata"].map((field) => (
                <label key={field} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.allowedFields.includes(field)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setConfig((prev) => ({
                          ...prev,
                          allowedFields: [...prev.allowedFields, field],
                        }));
                      } else {
                        setConfig((prev) => ({
                          ...prev,
                          allowedFields: prev.allowedFields.filter(
                            (f) => f !== field
                          ),
                        }));
                      }
                    }}
                  />
                  <span className="capitalize">{field}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Rate Limit (requests/hour)
            </label>
            <input
              type="number"
              value={config.rateLimit}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  rateLimit: parseInt(e.target.value),
                }))
              }
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

### **2. Preview de Dados**

```jsx
// components/sections/PublicDataPreview.jsx
export function PublicDataPreview({ section, config }) {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (config.isPublic) {
      // Simular dados que serão expostos
      const publicData = {
        title: section.name,
        description: section.description,
        itemCount: section.items?.length || 0,
        lastUpdated: section.updatedAt,
      };

      // Filtrar apenas campos permitidos
      const filteredData = {};
      config.allowedFields.forEach((field) => {
        if (publicData[field] !== undefined) {
          filteredData[field] = publicData[field];
        }
      });

      setPreview(filteredData);
    }
  }, [section, config]);

  if (!config.isPublic) return null;

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h4 className="font-medium mb-2">Preview dos Dados Públicos</h4>
      <pre className="text-sm bg-white p-3 rounded border">
        {JSON.stringify(preview, null, 2)}
      </pre>
    </div>
  );
}
```

---

## 📊 **Métricas e Analytics**

### **1. Logs de Acesso**

```javascript
// Log de cada acesso público
await db.insertOne("public_access_logs", {
  sectionId: section._id,
  apiKey: request.headers.get("x-api-key"),
  ip: request.headers.get("x-forwarded-for"),
  userAgent: request.headers.get("user-agent"),
  endpoint: request.url,
  timestamp: new Date(),
  responseTime: Date.now() - startTime,
});
```

### **2. Dashboard de Analytics**

- **Total de acessos** por section
- **API keys mais usadas**
- **Rate limit hits**
- **Geolocalização** dos acessos
- **Performance** dos endpoints

---

## 🚀 **Cronograma de Implementação**

### **Semana 1: Base**

- [ ] Schema updates para publicAccess
- [ ] Endpoints básicos `/api/public/sections`
- [ ] Sistema de API keys funcional
- [ ] Rate limiting básico

### **Semana 2: Controles**

- [ ] Interface de configuração
- [ ] Filtros de campos públicos/privados
- [ ] Preview de dados
- [ ] Logs de acesso

### **Semana 3: Polimento**

- [ ] Cache e performance
- [ ] Analytics dashboard
- [ ] Documentação da API
- [ ] Testes completos

---

## 🎯 **Objetivos de Negócio**

### **1. Monetização**

- **API keys pagas** para acesso premium
- **Rate limits** por plano
- **Webhooks** para integrações

### **2. Growth**

- **Dados públicos** geram tráfego
- **SEO** para sections públicas
- **Viralização** de conteúdo interessante

### **3. Analytics**

- **Uso de dados** para insights
- **Popularidade** de sections
- **Engagement** de usuários

---

## 🔐 **Considerações de Segurança**

### **1. Dados Sensíveis**

- **Nunca expor** dados privados
- **Validação rigorosa** de campos públicos
- **Auditoria** de todos os acessos

### **2. Rate Limiting**

- **Proteger contra** abuso
- **Diferentes limites** por tipo de chave
- **Monitoramento** de padrões suspeitos

### **3. API Keys**

- **Rotação automática** de chaves
- **Permissões granulares** por chave
- **Revogação** rápida se necessário

---

**Próximo passo: Implementar Fase 1 - Estrutura Base** 🚀
