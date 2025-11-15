# 🔧 Sugestões de Variáveis de Ambiente para Rate Limiting

## 📋 Variáveis Propostas

### 1. **Limites por Workspace/Session (Guest Mode)**

```bash
# Limites diários
MAX_TILES_PER_DAY=1000          # Máximo de tiles gerados por dia por workspace
MAX_TILES_PER_HOUR=200          # Máximo de tiles gerados por hora por workspace
MAX_REQUESTS_PER_MINUTE=10       # Máximo de requisições por minuto por workspace

# Limites por template
MAX_TILES_PER_TEMPLATE=50       # Máximo de tiles que podem ser gerados de uma vez via template
MAX_BULK_PROMPTS=200            # Máximo de prompts em bulk upload
```

### 2. **Limites por Usuário Autenticado (Futuro)**

```bash
# Limites para usuários autenticados (mais generosos)
AUTHENTICATED_MAX_TILES_PER_DAY=5000
AUTHENTICATED_MAX_TILES_PER_HOUR=1000
AUTHENTICATED_MAX_REQUESTS_PER_MINUTE=30

# Limites por plano (quando tiver billing)
FREE_PLAN_MAX_TILES_PER_DAY=500
PRO_PLAN_MAX_TILES_PER_DAY=10000
ENTERPRISE_PLAN_MAX_TILES_PER_DAY=100000
```

### 3. **Limites por IP (Proteção contra Abuso)**

```bash
# Rate limiting por IP
MAX_REQUESTS_PER_IP_PER_MINUTE=20
MAX_REQUESTS_PER_IP_PER_HOUR=500
MAX_REQUESTS_PER_IP_PER_DAY=5000

# Blacklist de IPs (opcional)
BLOCKED_IPS=""                  # Lista separada por vírgula: "1.2.3.4,5.6.7.8"
```

### 4. **Limites por Modelo de IA**

```bash
# Limites específicos por modelo (custos diferentes)
GPT_5_MAX_REQUESTS_PER_HOUR=50      # GPT-5 é mais caro
GPT_5_NANO_MAX_REQUESTS_PER_HOUR=200  # GPT-5-nano é mais barato

# Limites de tokens
MAX_TOKENS_PER_REQUEST=2000
MAX_TOKENS_PER_DAY=1000000
```

### 5. **Configurações de Timeout e Retry**

```bash
# Timeouts
API_TIMEOUT_MS=30000            # 30 segundos
TILE_GENERATION_TIMEOUT_MS=60000 # 60 segundos para gerar tile

# Retry
MAX_RETRY_ATTEMPTS=3
RETRY_DELAY_MS=1000
```

### 6. **Configurações de Cache**

```bash
# Cache de respostas similares
ENABLE_RESPONSE_CACHE=true
CACHE_TTL_SECONDS=3600          # 1 hora
MAX_CACHE_SIZE_MB=100
```

### 7. **Configurações de Monitoramento**

```bash
# Logging e métricas
ENABLE_USAGE_LOGGING=true
LOG_USAGE_TO_DB=true
USAGE_ALERT_THRESHOLD=0.8       # Alerta quando usar 80% do limite
```

## 🎯 Estratégias de Implementação

### Opção 1: **Variáveis Simples (Recomendado para começar)**

```bash
# .env.local
MAX_TILES_PER_DAY=1000
MAX_TILES_PER_HOUR=200
MAX_REQUESTS_PER_MINUTE=10
```

**Vantagens:**
- Simples de configurar
- Fácil de entender
- Funciona imediatamente

**Desvantagens:**
- Não diferencia usuários/planos
- Limites fixos para todos

### Opção 2: **Variáveis por Ambiente**

```bash
# .env.development
MAX_TILES_PER_DAY=10000
MAX_TILES_PER_HOUR=2000
MAX_REQUESTS_PER_MINUTE=100

# .env.production
MAX_TILES_PER_DAY=1000
MAX_TILES_PER_HOUR=200
MAX_REQUESTS_PER_MINUTE=10

# .env.staging
MAX_TILES_PER_DAY=5000
MAX_TILES_PER_HOUR=1000
MAX_REQUESTS_PER_MINUTE=50
```

**Vantagens:**
- Diferentes limites por ambiente
- Desenvolvimento mais flexível
- Produção mais restritiva

### Opção 3: **Configuração Dinâmica (Futuro)**

```typescript
// config/rate-limits.ts
export const RATE_LIMITS = {
  guest: {
    daily: parseInt(process.env.GUEST_MAX_TILES_PER_DAY || "500", 10),
    hourly: parseInt(process.env.GUEST_MAX_TILES_PER_HOUR || "100", 10),
    perMinute: parseInt(process.env.GUEST_MAX_REQUESTS_PER_MINUTE || "5", 10),
  },
  authenticated: {
    daily: parseInt(process.env.AUTH_MAX_TILES_PER_DAY || "5000", 10),
    hourly: parseInt(process.env.AUTH_MAX_TILES_PER_HOUR || "1000", 10),
    perMinute: parseInt(process.env.AUTH_MAX_REQUESTS_PER_MINUTE || "30", 10),
  },
  // Por plano (quando tiver billing)
  plans: {
    free: {
      daily: parseInt(process.env.FREE_PLAN_MAX_TILES_PER_DAY || "500", 10),
    },
    pro: {
      daily: parseInt(process.env.PRO_PLAN_MAX_TILES_PER_DAY || "10000", 10),
    },
  },
};
```

## 📝 Exemplo de Arquivo .env.local

```bash
# Rate Limiting - Guest Mode
MAX_TILES_PER_DAY=1000
MAX_TILES_PER_HOUR=200
MAX_REQUESTS_PER_MINUTE=10

# Rate Limiting - Por IP (Proteção)
MAX_REQUESTS_PER_IP_PER_MINUTE=20
MAX_REQUESTS_PER_IP_PER_HOUR=500

# Timeouts
API_TIMEOUT_MS=30000
TILE_GENERATION_TIMEOUT_MS=60000

# Retry
MAX_RETRY_ATTEMPTS=3
RETRY_DELAY_MS=1000

# Cache
ENABLE_RESPONSE_CACHE=false
CACHE_TTL_SECONDS=3600

# Logging
ENABLE_USAGE_LOGGING=true
```

## 🚀 Recomendação Inicial

Para começar, sugiro usar apenas estas 3 variáveis:

```bash
MAX_TILES_PER_DAY=1000
MAX_TILES_PER_HOUR=200
MAX_REQUESTS_PER_MINUTE=10
```

**Por quê?**
- ✅ Simples e efetivo
- ✅ Cobre os casos principais de abuso
- ✅ Fácil de ajustar conforme necessário
- ✅ Não complica a implementação inicial

Depois, conforme a necessidade, você pode adicionar:
- Limites por IP (se detectar abuso)
- Limites por plano (quando tiver billing)
- Limites por modelo (se custos forem muito diferentes)

## 💡 Dicas de Valores

### Para Desenvolvimento:
```bash
MAX_TILES_PER_DAY=10000      # Muito alto para testar
MAX_TILES_PER_HOUR=2000
MAX_REQUESTS_PER_MINUTE=100
```

### Para Produção (Conservador):
```bash
MAX_TILES_PER_DAY=500        # Mais conservador
MAX_TILES_PER_HOUR=100
MAX_REQUESTS_PER_MINUTE=5
```

### Para Produção (Balanceado):
```bash
MAX_TILES_PER_DAY=1000       # Balanceado
MAX_TILES_PER_HOUR=200
MAX_REQUESTS_PER_MINUTE=10
```

### Para Produção (Generoso):
```bash
MAX_TILES_PER_DAY=5000       # Mais generoso
MAX_TILES_PER_HOUR=1000
MAX_REQUESTS_PER_MINUTE=30
```

## 🔍 Como Monitorar

Adicione logs quando limites forem atingidos:

```typescript
if (!check.allowed) {
  console.warn(`[RateLimit] ${sessionId} exceeded: ${check.reason}`);
  // Opcional: Enviar para serviço de monitoramento (Sentry, DataDog, etc)
}
```

## 📄 Arquivo .env.local de Exemplo

Crie um arquivo `.env.local` na raiz do projeto com:

```bash
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# AI Response Language (default: English)
NEXT_PUBLIC_AI_RESPONSE_LANGUAGE=English

# Rate Limiting - Guest Mode (Workspace/Session based)
MAX_TILES_PER_DAY=1000
MAX_TILES_PER_HOUR=200
MAX_REQUESTS_PER_MINUTE=10

# Rate Limiting - IP Based (Optional)
MAX_REQUESTS_PER_IP_PER_MINUTE=20
MAX_REQUESTS_PER_IP_PER_HOUR=500
MAX_REQUESTS_PER_IP_PER_DAY=5000

# Timeouts
API_TIMEOUT_MS=30000
TILE_GENERATION_TIMEOUT_MS=60000

# Retry Configuration
MAX_RETRY_ATTEMPTS=3
RETRY_DELAY_MS=1000

# Cache Configuration (Future)
ENABLE_RESPONSE_CACHE=false
CACHE_TTL_SECONDS=3600

# Logging
ENABLE_USAGE_LOGGING=true
LOG_USAGE_TO_DB=false
USAGE_ALERT_THRESHOLD=0.8
```

## ⚙️ Como Usar

1. **Copie o exemplo acima** para um arquivo `.env.local` na raiz do projeto
2. **Ajuste os valores** conforme sua necessidade
3. **Reinicie o servidor** para aplicar as mudanças

**Nota:** O arquivo `.env.local` não deve ser commitado no git (já está no .gitignore)

