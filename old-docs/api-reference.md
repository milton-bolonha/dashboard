# 📡 API Reference - Netlify Functions

**Documentação completa das APIs serverless da plataforma Autores Apaixonados**

---

## 🔗 Base URL

```
Desenvolvimento: http://localhost:8888/.netlify/functions/
Produção: https://autoresapaixonados.netlify.app/.netlify/functions/
```

---

## 📖 Story Management

### POST `/story-create`

Cria uma nova história de amor.

**Request:**

```json
{
  "title": "Nossa História de Amor",
  "partner1": {
    "name": "João",
    "age": 28,
    "bio": "Desenvolvedor apaixonado"
  },
  "partner2": {
    "name": "Maria",
    "age": 25,
    "bio": "Designer criativa"
  },
  "howWeMet": "Nos conhecemos em um café...",
  "firstDate": "2023-02-14T19:00:00Z"
}
```

**Response:**

```json
{
  "story": {
    "id": "story_123abc",
    "title": "Nossa História de Amor",
    "slug": "nossa-historia-amor-1701234567",
    "partner1": { ... },
    "partner2": { ... },
    "isComplete": false,
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

**Status Codes:**

- `200` - História criada com sucesso
- `400` - Dados inválidos
- `405` - Método não permitido
- `500` - Erro interno

---

### PATCH `/story-update`

Atualiza uma história existente.

**Request:**

```json
{
  "storyId": "story_123abc",
  "data": {
    "howWeMet": "Texto atualizado...",
    "importantEvents": [
      {
        "date": "2023-06-15T00:00:00Z",
        "title": "Primeira viagem juntos",
        "description": "Fomos para a praia...",
        "emotion": "alegria"
      }
    ]
  }
}
```

**Response:**

```json
{
  "story": {
    "id": "story_123abc",
    "title": "Nossa História de Amor",
    "howWeMet": "Texto atualizado...",
    "importantEvents": [...],
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## 📚 Book Generation

### POST `/book-generate`

Gera PDF de um livro baseado em uma história.

**Request:**

```json
{
  "storyId": "story_123abc",
  "template": "classic",
  "colorScheme": "romantic",
  "fontFamily": "serif",
  "includePhotos": false
}
```

**Response:**

```json
{
  "book": {
    "id": "book_456def",
    "storyId": "story_123abc",
    "template": "classic",
    "status": "generating",
    "pdfUrl": null,
    "previewUrl": null,
    "createdAt": "2024-01-15T11:00:00Z"
  }
}
```

**Status após processamento:**

```json
{
  "book": {
    "id": "book_456def",
    "status": "ready",
    "pdfUrl": "https://storage.../book-456def.pdf",
    "previewUrl": "https://storage.../preview-456def.jpg",
    "pageCount": 45,
    "fileSize": 2048000,
    "generationTime": 12.5
  }
}
```

**Possíveis Status:**

- `draft` - Configuração inicial
- `generating` - PDF sendo gerado
- `ready` - PDF pronto para download
- `error` - Erro na geração

---

## 💰 Billing & Payments

### POST `/billing-create`

Cria sessão de checkout no Stripe.

**Request:**

```json
{
  "planId": "cupido",
  "customerId": "cus_stripe123",
  "successUrl": "https://app.com/success",
  "cancelUrl": "https://app.com/cancel"
}
```

**Response:**

```json
{
  "sessionId": "cs_stripe456",
  "url": "https://checkout.stripe.com/pay/cs_stripe456"
}
```

**Flow:**

1. Frontend chama `/billing-create`
2. Usuário é redirecionado para Stripe Checkout
3. Após pagamento, Stripe chama webhook
4. Webhook atualiza plano do usuário

---

### POST `/stripe-webhook`

Processa eventos do Stripe (uso interno).

**Headers:**

```
stripe-signature: t=1234567890,v1=abc123...
```

**Eventos Suportados:**

- `checkout.session.completed` - Pagamento concluído
- `invoice.paid` - Fatura paga
- `customer.subscription.deleted` - Assinatura cancelada

**Response:**

```json
{
  "received": true
}
```

---

## 🤖 AI Enhancement

### POST `/ai-enhance`

Melhora texto usando OpenAI.

**Request:**

```json
{
  "originalText": "Nos conhecemos num café. Foi legal.",
  "genre": "romance",
  "tone": "fofo",
  "writingStyle": "narrativo"
}
```

**Response:**

```json
{
  "enhancedText": "Em uma tarde ensolarada de primavera, nossos destinos se cruzaram no aconchegante Café Central. O que começou como um encontro casual rapidamente se transformou em algo mágico - nossos olhares se encontraram e, naquele momento, soubemos que nossas vidas jamais seriam as mesmas.",
  "wordCountOriginal": 8,
  "wordCountEnhanced": 45,
  "improvementScore": 8.5
}
```

**Parâmetros de Tom:**

- `fofo` - Texto doce e carinhoso
- `engraçado` - Com humor e leveza
- `emotivo` - Profundo e tocante
- `épico` - Grandioso e dramático

**Parâmetros de Estilo:**

- `narrativo` - Terceira pessoa, descritivo
- `conversacional` - Primeira pessoa, informal
- `poético` - Linguagem metafórica

---

## 🔐 Authentication & Authorization

Todas as APIs (exceto webhook) requerem autenticação via Clerk.

**Headers necessários:**

```
Authorization: Bearer <clerk_session_token>
```

**Verificação de plano:**
Algumas funcionalidades verificam o plano do usuário:

```javascript
// Exemplo interno de verificação
const userPlan = user.unsafeMetadata?.currentPlan;
if (userPlan !== "afrodite" && userPlan !== "zeus") {
  return { statusCode: 403, body: "Feature não disponível no seu plano" };
}
```

---

## 📊 Rate Limiting

| Endpoint          | Limite | Janela |
| ----------------- | ------ | ------ |
| `/story-create`   | 10 req | 1 hora |
| `/story-update`   | 50 req | 1 hora |
| `/book-generate`  | 5 req  | 1 hora |
| `/ai-enhance`     | 20 req | 1 hora |
| `/billing-create` | 3 req  | 5 min  |

**Response quando limite excedido:**

```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 3600
}
```

---

## ❌ Error Handling

### Padrão de Error Response

```json
{
  "error": "Mensagem de erro descritiva",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "title",
    "message": "Título é obrigatório"
  }
}
```

### Códigos de Erro Comuns

| Status | Code               | Significado            |
| ------ | ------------------ | ---------------------- |
| 400    | `VALIDATION_ERROR` | Dados inválidos        |
| 401    | `UNAUTHORIZED`     | Token inválido         |
| 403    | `FORBIDDEN`        | Sem permissão          |
| 404    | `NOT_FOUND`        | Recurso não encontrado |
| 429    | `RATE_LIMIT`       | Muitas requisições     |
| 500    | `INTERNAL_ERROR`   | Erro do servidor       |

---

## 🧪 Testing APIs

### Com cURL

```bash
# Criar história
curl -X POST http://localhost:8888/.netlify/functions/story-create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "História de Teste",
    "partner1": {"name": "João"},
    "partner2": {"name": "Maria"}
  }'

# Gerar livro
curl -X POST http://localhost:8888/.netlify/functions/book-generate \
  -H "Content-Type: application/json" \
  -d '{
    "storyId": "story_123",
    "template": "classic"
  }'
```

### Com JavaScript

```javascript
// Helper para chamar APIs
async function callAPI(endpoint, data) {
  const response = await fetch(`/.netlify/functions/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${clerkToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
}

// Uso
try {
  const { story } = await callAPI("story-create", {
    title: "Nova História",
    partner1: { name: "João" },
  });
  console.log("História criada:", story.id);
} catch (error) {
  console.error("Erro:", error.message);
}
```

---

## 📈 Monitoring & Logs

### Logs Structure

```json
{
  "timestamp": "2024-01-15T10:00:00Z",
  "level": "info",
  "function": "story-create",
  "userId": "user_123",
  "action": "create_story",
  "duration": 145,
  "success": true
}
```

### Métricas Importantes

- **Response Time:** < 2s para geração de PDF
- **Success Rate:** > 99.5%
- **Error Rate:** < 0.5%
- **Uptime:** > 99.9%

---

## 🔄 Changelog

### v1.0.0 (2024-01-15)

- ✅ Implementação inicial das APIs
- ✅ Integração com Clerk e Stripe
- ✅ Geração básica de PDF

### Próximas versões

- 🔄 Upload de fotos
- 🔄 Templates personalizados
- 🔄 Webhooks para status de livro
- 🔄 API de analytics

**Para suporte:** `amor@autoresapaixonados.com` 💖
