# 🚀 Escalabilidade: MongoDB, Prisma e Milhares de Usuários

## 📊 Situação Atual vs. Futuro

### **Estado Atual (MVP com Cookies)**

- ✅ Funcional para MVP e testes
- ✅ Sem dependências de banco de dados
- ✅ Rápido para desenvolvimento
- ❌ Limitado a sessões de 30 minutos
- ❌ Não escala para múltiplos dispositivos
- ❌ Dados perdidos ao limpar cookies

### **Migração para MongoDB**

#### **Por que MongoDB?**

1. **Flexibilidade**: Schema dinâmico perfeito para workspaces variáveis
2. **Performance**: Excelente para leitura de documentos completos (workspaces)
3. **Escalabilidade**: Horizontal scaling nativo
4. **Custo**: MongoDB Atlas tem tier gratuito generoso

#### **Prisma vs. MongoDB Native Driver**

**❌ NÃO usar Prisma com MongoDB:**

- Prisma é otimizado para SQL (PostgreSQL, MySQL)
- MongoDB tem driver nativo muito mais eficiente
- Prisma adiciona overhead desnecessário
- Schema validation do Prisma não se alinha bem com MongoDB flexível

**✅ Usar MongoDB Native Driver:**

```typescript
// Exemplo de uso direto (já temos isso no projeto)
import { db } from "@/lib/db";

// Operações são diretas e rápidas
await db.findOne("workspaces", { userId });
await db.updateOne("workspaces", { _id }, { $set: { ... } });
```

## 🏗️ Arquitetura para Escalabilidade

### **1. Estrutura de Dados**

```typescript
// Collection: workspaces
{
  _id: ObjectId,
  userId: string,           // Clerk user ID
  sessionId: string,        // UUID único
  company: {
    id: string,
    name: string,
    tiles: Tile[],
    contacts: Contact[],
    notes: Note[],
  },
  appearance: {
    baseColor: string,
    // ... outros tokens
  },
  createdAt: Date,
  updatedAt: Date,
  // Índices para performance
  indexes: [
    { userId: 1, createdAt: -1 },  // Busca rápida por usuário
    { sessionId: 1 },               // Busca por sessão
  ]
}
```

### **2. Estratégias de Performance**

#### **A. Caching em Múltiplas Camadas**

```typescript
// 1. Browser Cache (localStorage) - já temos
// 2. Server-side Cache (Redis/Memory)
// 3. Database Indexes

// Exemplo de cache em memória no servidor
const workspaceCache = new Map<
  string,
  { data: WorkspaceSnapshot; expires: number }
>();

async function getWorkspaceCached(sessionId: string) {
  // Check cache first
  const cached = workspaceCache.get(sessionId);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  // Fetch from MongoDB
  const workspace = await db.findOne("workspaces", { sessionId });

  // Cache for 5 minutes
  workspaceCache.set(sessionId, {
    data: workspace,
    expires: Date.now() + 5 * 60 * 1000,
  });

  return workspace;
}
```

#### **B. Queries Otimizadas**

```typescript
// ❌ RUIM: Buscar tudo e filtrar no código
const allWorkspaces = await db.findMany("workspaces", {});
const userWorkspaces = allWorkspaces.filter((w) => w.userId === userId);

// ✅ BOM: Usar índices e queries específicas
const userWorkspaces = await db.findMany(
  "workspaces",
  { userId },
  { sort: { createdAt: -1 }, limit: 10 }
);
```

#### **C. Paginação e Limites**

```typescript
// Para listas grandes, sempre paginar
const workspaces = await db.findMany(
  "workspaces",
  { userId },
  {
    skip: page * pageSize,
    limit: pageSize,
    sort: { updatedAt: -1 },
  }
);
```

### **3. Gerenciamento de Estado**

#### **Problema Atual: Race Conditions**

O problema que você identificou é real! Quando múltiplos useEffects rodam simultaneamente, pode haver condições de corrida.

**Solução: Estado Unificado com Prioridades**

```typescript
// Estado único para workspace com prioridades claras
const workspaceState = {
  source: "localStorage" | "server" | "cache",
  data: WorkspaceSnapshot | null,
  isLoading: boolean,
  lastUpdated: number,
};

// Prioridade: server > cache > localStorage
```

#### **Polling Inteligente**

```typescript
// Polling com backoff exponencial
const pollingStrategy = {
  initial: 2000, // 2s
  max: 10000, // 10s máximo
  backoff: 1.5, // Multiplicador
  maxAttempts: 30, // ~5 minutos total
};

// Parar polling quando:
// 1. Tiles detectados
// 2. Workspace não existe (404)
// 3. Timeout atingido
// 4. Erro persistente
```

### **4. Escalabilidade para Milhares de Usuários**

#### **A. Connection Pooling**

```typescript
// MongoDB já gerencia connection pooling automaticamente
// Mas podemos configurar:
const mongoOptions = {
  maxPoolSize: 50, // Máximo de conexões simultâneas
  minPoolSize: 5, // Mínimo mantido
  maxIdleTimeMS: 30000, // Fechar conexões idle após 30s
};
```

#### **B. Read Replicas (Futuro)**

```typescript
// Para leitura pesada, usar read replicas
const readDb = mongoClient.db("insights").readPreference("secondary");
const writeDb = mongoClient.db("insights");
```

#### **C. Sharding (Muito Futuro)**

```typescript
// Quando tiver milhões de documentos
// Shard por userId ou região geográfica
```

## 🔧 Implementação Prática

### **Fase 1: Migração Gradual (Agora)**

1. **Manter cookies como fallback**
2. **Adicionar MongoDB como fonte primária**
3. **Sincronizar cookies ↔ MongoDB**

```typescript
// Estratégia híbrida
async function getWorkspace(sessionId: string) {
  // 1. Tentar MongoDB primeiro
  const mongoWorkspace = await db.findOne("workspaces", { sessionId });
  if (mongoWorkspace) return mongoWorkspace;

  // 2. Fallback para cookies (compatibilidade)
  const cookieWorkspace = await readWorkspace();
  if (cookieWorkspace) {
    // Migrar para MongoDB
    await db.insertOne("workspaces", cookieWorkspace);
    return cookieWorkspace;
  }

  return null;
}
```

### **Fase 2: Otimizações (Próximos Passos)**

1. **Cache em memória** (Redis ou Map)
2. **Índices otimizados** no MongoDB
3. **Queries paginadas** para listas
4. **Background jobs** para operações pesadas

### **Fase 3: Escala (Futuro)**

1. **Read replicas** para leitura
2. **CDN** para assets estáticos
3. **Load balancing** entre servidores
4. **Monitoring** (Datadog, New Relic)

## 📈 Métricas de Performance Esperadas

### **Com MongoDB Nativo:**

- **Query simples**: < 10ms
- **Query com índice**: < 5ms
- **Insert/Update**: < 15ms
- **Suporta**: 10k+ queries/segundo por servidor

### **Com Caching:**

- **Cache hit**: < 1ms
- **Cache miss**: < 10ms (query MongoDB)

## ✅ Recomendações Finais

1. **NÃO usar Prisma** - MongoDB native driver é melhor
2. **Usar índices** - Crítico para performance
3. **Implementar cache** - Reduz carga no banco
4. **Monitorar queries** - Identificar gargalos
5. **Paginar resultados** - Nunca buscar tudo de uma vez
6. **Background jobs** - Operações pesadas fora do request

## 🎯 Próximos Passos

1. ✅ Corrigir race conditions no estado atual
2. ✅ Implementar polling inteligente
3. 🔄 Preparar estrutura MongoDB (schemas, índices)
4. 🔄 Migração gradual cookies → MongoDB
5. 🔄 Implementar cache em memória
6. 🔄 Monitoring e otimização
