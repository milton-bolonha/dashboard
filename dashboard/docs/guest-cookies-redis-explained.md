# 🍪 Cookies e ⚡ Redis no Guest System - Explicação Completa

## 🍪 Por que Cookies para Guest Users?

### O Problema: HTTP é Stateless

```
┌──────────────────────────────────────────────────────────┐
│  PROBLEMA: Servidor não lembra quem você é               │
└──────────────────────────────────────────────────────────┘

Request 1: Guest cria workspace
  ├─ Server: "OK, criei workspace com ID abc-123"
  └─ Responde e ESQUECE tudo

Request 2: Guest tenta buscar workspace
  ├─ Server: "Quem é você? Não conheço você!"
  └─ ❌ Não sabe qual workspace retornar
```

### A Solução: Cookies 🍪

```
┌──────────────────────────────────────────────────────────┐
│  SOLUÇÃO: Cookie guarda um "bilhete de identificação"    │
└──────────────────────────────────────────────────────────┘

Request 1: Guest cria workspace
  ├─ Server cria: workspace_id = "abc-123"
  ├─ Server cria: guest_id = "uuid-v4-123"
  ├─ Server salva: cookie("guest_id", "uuid-v4-123")
  └─ Browser GUARDA o cookie automaticamente

Request 2: Guest busca workspace
  ├─ Browser ENVIA cookie automaticamente: "guest_id=uuid-v4-123"
  ├─ Server: "Ah! Você é o guest uuid-v4-123"
  ├─ Server busca no DB: WHERE guest_id = "uuid-v4-123"
  └─ ✅ Retorna o workspace correto!
```

## 🔐 Cookie Seguro vs Cookie Normal

### ❌ Cookie Inseguro (JavaScript pode ler)

```javascript
// ❌ INSEGURO - JavaScript pode roubar
document.cookie = "guest_id=abc-123";

// Hacker pode fazer:
console.log(document.cookie); // "guest_id=abc-123" ← ROUBADO!
```

### ✅ Cookie Seguro (HttpOnly + Secure + SameSite)

```javascript
// ✅ SEGURO - JavaScript NÃO pode ler
cookies().set("guest_id", "abc-123", {
  httpOnly: true, // ← JavaScript não pode acessar
  secure: true, // ← Só funciona em HTTPS
  sameSite: "strict", // ← Bloqueia CSRF attacks
  maxAge: 7 * 24 * 60 * 60, // 7 dias
});

// Hacker tenta roubar:
console.log(document.cookie); // "" ← VAZIO! Cookie protegido!
```

## 🎯 Como o Cookie Funciona no Nosso Sistema

### Fluxo Completo:

```
┌─────────────────────────────────────────────────────────────┐
│  1. GUEST ACESSA LANDING PAGE                                │
│     URL: https://seuapp.com/                                 │
│     Cookie: (nenhum)                                         │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│  2. GUEST PREENCHE FORMULÁRIO                                │
│     Company: "Tesla"                                         │
│     Template: "template_1"                                   │
│     → Clica "Start Free Trial"                               │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│  3. POST /api/guest/workspace                                │
│                                                              │
│  Server:                                                     │
│  ├─ Gera: guest_id = "550e8400-e29b-41d4-a716-446655440000" │
│  ├─ Cria no DB:                                             │
│  │  {                                                       │
│  │    guest_id: "550e8400...",                              │
│  │    workspace_data: {                                     │
│  │      companies: ["Tesla"],                               │
│  │      template_id: "template_1"                           │
│  │    }                                                     │
│  │  }                                                       │
│  │                                                          │
│  └─ Envia cookie:                                           │
│     Set-Cookie: guest_id=550e8400...; HttpOnly; Secure      │
│                                                              │
│  Browser GUARDA automaticamente!                            │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│  4. GUEST NAVEGANDO NO DASHBOARD                             │
│     URL: https://seuapp.com/dashboard/trial                  │
│                                                              │
│  Browser ENVIA cookie automaticamente:                       │
│  Cookie: guest_id=550e8400-e29b-41d4-a716-446655440000      │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│  5. GET /api/guest/workspace                                 │
│                                                              │
│  Server:                                                     │
│  ├─ Lê cookie: req.cookies.guest_id                         │
│  ├─ Busca no DB: WHERE guest_id = "550e8400..."            │
│  └─ Retorna workspace com as 2 empresas                     │
│                                                              │
│  ✅ Guest continua autenticado entre requests!              │
└─────────────────────────────────────────────────────────────┘
```

## ⚡ Por que Redis? (Rate Limiting)

### O Problema em Ambiente Serverless

```
┌──────────────────────────────────────────────────────────┐
│  PROBLEMA: Vercel/Netlify = Múltiplas Instâncias         │
└──────────────────────────────────────────────────────────┘

Atacante faz 1000 requests/segundo:

┌─────────┐   Request 1-100   ┌──────────┐
│ Atacante├──────────────────►│Instance A│
│         │                   │ (memória)│
│         │   Request 101-200 └──────────┘
│         ├──────────────────►┌──────────┐
│         │                   │Instance B│
│         │                   │ (memória)│
│         │   Request 201-300 └──────────┘
│         ├──────────────────►┌──────────┐
│         │                   │Instance C│
└─────────┘                   │ (memória)│
                              └──────────┘

❌ Cada instância tem SUA PRÓPRIA memória!
❌ Instance A não sabe que B e C já receberam requests
❌ Rate limiting NÃO FUNCIONA!
```

### A Solução: Redis (Memória Compartilhada)

```
┌──────────────────────────────────────────────────────────┐
│  SOLUÇÃO: Redis = Memória compartilhada entre instâncias │
└──────────────────────────────────────────────────────────┘

Atacante faz 1000 requests/segundo:

                              ┌────────────────┐
                              │  REDIS SERVER  │
                              │  (Upstash)     │
                              │                │
                              │ IP: 1.2.3.4    │
                              │ Count: 1000 ← │
                              └────────────────┘
                                 ▲  ▲  ▲
                                 │  │  │
        ┌────────────────────────┼──┼──┼────────────────┐
        │                        │  │  │                │
        │                        │  │  │                │
  ┌─────────┐             ┌──────────┐  ┌──────────┐  ┌──────────┐
  │Atacante │ Request 1  │Instance A├─►│Instance B├─►│Instance C│
  │         ├───────────►│          │  │          │  │          │
  │         │            │ Check    │  │ Check    │  │ Check    │
  │         │            │ Redis:   │  │ Redis:   │  │ Redis:   │
  │         │            │ Count=1  │  │ Count=2  │  │ Count=11 │
  └─────────┘            └──────────┘  └──────────┘  └──────────┘
                               │              │              │
                         Request 11:    Request 12:   Request 13:
                         ✅ OK (10/10) ❌ BLOCK!    ❌ BLOCK!
                                       (limite)     (limite)

✅ Todas as instâncias COMPARTILHAM o contador no Redis!
✅ Rate limiting FUNCIONA mesmo com múltiplas instâncias!
```

## 🔧 Redis: O que Precisamos

### 1. Serviço: Upstash Redis (Grátis até 10k requests/dia)

```bash
# Criar conta em: https://upstash.com
# Criar Redis Database
# Copiar REDIS_URL e REDIS_TOKEN
```

### 2. Variáveis de Ambiente

```bash
# dashboard/.env.local
REDIS_URL=https://your-redis.upstash.io
REDIS_TOKEN=your-token-here
```

### 3. Como Usamos no Código

```javascript
// dashboard/lib/guest-rate-limit.js
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
});

// Rate limiting: 10 requests/minuto por IP
export async function checkRateLimit(ip) {
  const key = `rate_limit:${ip}`;

  // Incrementa contador no Redis
  const count = await redis.incr(key);

  // Se é a primeira request, define expiração de 1 minuto
  if (count === 1) {
    await redis.expire(key, 60); // 60 segundos
  }

  // Verifica se ultrapassou limite
  if (count > 10) {
    return {
      allowed: false,
      limit: 10,
      current: count,
      message: "Too many requests. Try again in 1 minute.",
    };
  }

  return {
    allowed: true,
    limit: 10,
    current: count,
    remaining: 10 - count,
  };
}

// Uso na API:
export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for") || req.ip;
  const rateLimit = await checkRateLimit(ip);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: rateLimit.message },
      { status: 429 } // Too Many Requests
    );
  }

  // Continuar com a lógica normal...
}
```

## 🆚 Redis vs Memória Local

| Aspecto              | Memória Local                 | Redis (Upstash)                  |
| -------------------- | ----------------------------- | -------------------------------- |
| **Compartilhamento** | ❌ Cada instância isolada     | ✅ Todas instâncias compartilham |
| **Rate Limiting**    | ❌ Não funciona em serverless | ✅ Funciona perfeitamente        |
| **Persistência**     | ❌ Perde dados ao reiniciar   | ✅ Dados persistem               |
| **Escalabilidade**   | ❌ Limitado por instância     | ✅ Escala automaticamente        |
| **Custo**            | ✅ Grátis                     | ✅ Grátis até 10k/dia            |
| **Latência**         | ✅ ~0ms                       | ⚠️ ~20-50ms                      |
| **Ambiente**         | ❌ Só funciona local          | ✅ Funciona em produção          |

## 🎯 Quando Usar Redis?

### ✅ USE Redis para:

- Rate limiting em produção
- Contadores compartilhados
- Cache de sessões guest
- Feature flags
- Blacklist de IPs

### ❌ NÃO use Redis para:

- Dados permanentes (use MongoDB)
- Arquivos grandes (use S3/Cloudinary)
- Dados de usuário autenticado (use MongoDB)

## 🚀 Setup Rápido (5 minutos)

### 1. Criar conta Upstash

```
https://upstash.com/
→ Sign Up (grátis)
→ Create Database
→ Copy REDIS_URL e REDIS_TOKEN
```

### 2. Adicionar ao .env

```bash
# dashboard/.env.local
REDIS_URL=https://....upstash.io
REDIS_TOKEN=AY...
```

### 3. Instalar dependência

```bash
cd dashboard
npm install @upstash/redis
```

### 4. Testar

```javascript
// dashboard/test-redis.js
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
});

async function test() {
  await redis.set("test_key", "Hello Redis!");
  const value = await redis.get("test_key");
  console.log("✅ Redis funcionando:", value);
}

test();
```

## 📊 Resumo Visual

```
┌─────────────────────────────────────────────────────────┐
│  COOKIE                                                  │
│  ├─ Identifica o guest entre requests                   │
│  ├─ Guardado no BROWSER                                 │
│  ├─ Enviado automaticamente em TODAS requests           │
│  └─ Seguro: HttpOnly + Secure + SameSite               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  REDIS                                                   │
│  ├─ Rate limiting em ambiente serverless                │
│  ├─ Memória compartilhada entre TODAS instâncias        │
│  ├─ Contador de requests por IP/guest                   │
│  └─ Previne ataques DoS                                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  MONGODB                                                 │
│  ├─ Armazena dados PERMANENTES do guest workspace       │
│  ├─ Empresas pesquisadas, sections, items              │
│  └─ Dados que precisam persistir por 7 dias            │
└─────────────────────────────────────────────────────────┘
```

## 💡 Analogia do Mundo Real

### Cookie = Pulseira de Festival 🎟️

```
Você vai a um festival de música:

1. Entrada: Compra ingresso → Recebe PULSEIRA
2. Durante o festival:
   ├─ Vai no bar: Mostra pulseira → Compra bebida
   ├─ Vai no palco 1: Mostra pulseira → Entra
   └─ Vai no palco 2: Mostra pulseira → Entra

A pulseira IDENTIFICA você durante todo o festival!

Cookie = Pulseira digital que identifica o guest!
```

### Redis = Porteiro Compartilhado 🚪

```
Festival tem 3 entradas (instâncias serverless):

SEM Redis:
├─ Entrada A: Conta pessoas entrando (50)
├─ Entrada B: Conta pessoas entrando (50)
└─ Entrada C: Conta pessoas entrando (50)
Total: ???  ← Ninguém sabe o total real!

COM Redis:
├─ Entrada A: Avisa porteiro central (+50)
├─ Entrada B: Avisa porteiro central (+50)
└─ Entrada C: Avisa porteiro central (+50)
Total: 150 ← Porteiro central sabe TUDO!

Redis = Porteiro central que conta tudo!
```

---

**Precisa de Redis?**  
✅ **SIM** - Para rate limiting em produção  
✅ **NÃO** - Para desenvolvimento local (pode mockar)

**Precisa de Cookies?**  
✅ **SIM** - Única forma stateless de identificar guests  
✅ **SEMPRE** - Com flags de segurança (httpOnly, secure, sameSite)
