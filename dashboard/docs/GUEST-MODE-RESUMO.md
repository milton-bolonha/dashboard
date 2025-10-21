# 🎯 Guest Mode - Resumo Executivo

## TL;DR (Muito Rápido)

```
Guest Mode = Dashboard gratuito com limite de 2 empresas
├─ Template 1 ou 2 = Dashboard predefinido (sections prontas)
├─ Cookie = "Bilhete de identificação" do guest
└─ Redis = Contador compartilhado para rate limiting
```

## 📊 Template 1 vs Template 2

### O que são?

**Dashboards predefinidos** para pesquisa de empresas (tipo os templates que vocês já têm: blog, ecommerce, business)

### Template 1 - "Basic Sales Research" (Simples)

```
3 Sections:
├─ Company Overview (info básica)
├─ Competitors (concorrentes)
└─ News & Insights (notícias)

Uso: Guest rápido que quer info básica
```

### Template 2 - "Deep Research" (Completo)

```
5 Sections:
├─ Company Profile (perfil completo)
├─ Competitors Analysis (análise profunda)
├─ Market Insights (tendências)
├─ Key Contacts (contatos-chave)
└─ Sales Opportunities (oportunidades)

Uso: Guest que quer análise profunda
```

### Na Landing Page:

```jsx
<select>
  <option value="template_1">📊 Basic Research</option>
  <option value="template_2">🔍 Deep Research</option>
</select>
```

## 🍪 Cookie - O que é e por que?

### Problema sem Cookie:

```
Guest cria workspace → Server responde → ESQUECE TUDO!
Guest tenta acessar → Server: "Quem é você?" ❌
```

### Solução com Cookie:

```
Guest cria workspace
  → Server cria: guest_id = "abc-123"
  → Server envia: Cookie("guest_id", "abc-123")
  → Browser GUARDA automaticamente

Guest tenta acessar
  → Browser ENVIA cookie automaticamente
  → Server: "Ah! É o guest abc-123"
  → Busca workspace no DB ✅
```

### Código (Automático):

```javascript
// Server envia (você NÃO faz nada no frontend):
cookies().set("guest_id", guestId, {
  httpOnly: true, // JS não pode ler (segurança)
  secure: true, // Só HTTPS
  sameSite: "strict", // Anti-CSRF
});

// Browser envia automaticamente em TODA request!
// Você NÃO precisa fazer: fetch(..., { headers: { Cookie: ... }})
// É AUTOMÁTICO! 🎉
```

## ⚡ Redis - Por que precisa?

### Problema: Rate Limiting em Serverless

```
Atacante → 1000 requests/segundo

Vercel cria 3 instâncias:
├─ Instance A (memória própria): Vê 100 requests → ✅ Permite
├─ Instance B (memória própria): Vê 100 requests → ✅ Permite
└─ Instance C (memória própria): Vê 100 requests → ✅ Permite

Total: 300 requests passaram! ❌ Rate limiting NÃO funcionou!
```

### Solução: Redis = Memória Compartilhada

```
Atacante → 1000 requests/segundo

         ┌─── REDIS (Upstash) ───┐
         │  IP: 1.2.3.4          │
         │  Count: 11            │ ← Todas veem!
         └────────────────────────┘
                ▲  ▲  ▲
                │  │  │
    ┌───────────┼──┼──┼───────────┐
    │           │  │  │           │
Instance A   Instance B   Instance C
Request 1:   Request 2:   Request 11:
Count=1 ✅   Count=2 ✅   Count=11 ❌ BLOQUEADO!

✅ Rate limiting FUNCIONA!
```

### Setup Redis (5 minutos):

1. **Criar conta**: https://upstash.com (grátis)
2. **Create Database** → Copy URL e Token
3. **Adicionar .env**:
   ```bash
   REDIS_URL=https://your-redis.upstash.io
   REDIS_TOKEN=your-token
   ```
4. **Instalar**:
   ```bash
   npm install @upstash/redis
   ```

## 🎯 Fluxo Completo Visual

```
1. GUEST NA LANDING
   ├─ Escolhe Template 1 ou 2
   ├─ Digita: "Tesla", "tesla.com"
   └─ Clica "Start Free Trial"

2. SERVER CRIA WORKSPACE
   ├─ Gera guest_id (UUID)
   ├─ Cria workspace no MongoDB
   ├─ Aplica Template 1 (3 sections)
   └─ Envia Cookie (automático)

3. GUEST USA DASHBOARD
   ├─ Pesquisa Tesla (1/2) ✅
   ├─ Pesquisa SpaceX (2/2) ✅
   └─ Tenta pesquisar 3ª empresa ❌

4. BLOQUEIO + UPGRADE PROMPT
   ├─ Modal: "Sign up for unlimited"
   ├─ CTA: "Sign Up Free"
   └─ Redireciona para /sign-up

5. CONVERSÃO
   ├─ Webhook Clerk detecta signup
   ├─ Migra dados guest → user
   └─ Guest vira usuário real ✅
```

## 💰 O que Custa?

| Item            | Custo                          |
| --------------- | ------------------------------ |
| Cookies         | ✅ Grátis (nativo do HTTP)     |
| Redis (Upstash) | ✅ Grátis até 10k requests/dia |
| MongoDB         | ✅ Já usam                     |
| Clerk           | ✅ Já usam                     |

**Total adicional**: R$ 0,00 🎉

## ⚙️ Desenvolvimento vs Produção

### Desenvolvimento (pode mockar):

```javascript
// Não precisa Redis local
const mockRateLimit = () => ({ allowed: true });
```

### Produção (PRECISA Redis):

```javascript
// Redis real para rate limiting
const redis = new Redis({ url: process.env.REDIS_URL });
```

## 🚀 Próximos Passos

Quer que eu implemente:

1. ✅ **Templates já criados** (`guest-templates.js`)
2. ⏳ **Sistema de cookies** (nas APIs guest)
3. ⏳ **Rate limiting com Redis**
4. ⏳ **Guest dashboard page**
5. ⏳ **Conversão para usuário real**

Qual você quer que eu faça primeiro?
