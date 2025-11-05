# Bug: MongoDB Connection Timeout em Netlify Functions

## 📋 Resumo Executivo

**Problema**: Conexão MongoDB falha no Netlify Functions, resultando em erro 502 no cliente.

**Status Atual**:

- ✅ Whitelist MongoDB configurada (`0.0.0.0/0`)
- ✅ Timeout configurado (10s)
- ✅ Retry logic implementado (`withRetry()`)
- ✅ Connection pooling reutilizável
- ⚠️ **Promise rejection não tratada na inicialização da conexão**
- ⚠️ **Erro não propagado adequadamente para rotas**

**Causa Raiz**: A conexão MongoDB falha durante a inicialização, e a Promise rejeitada não é resetada, causando falhas em cascata em todas as operações subsequentes.

**Solução Prioritária**: Melhorar tratamento de erros na inicialização da conexão, resetando a Promise quando a conexão falhar e implementando retry na inicialização.

## Descrição

A aplicação está falhando ao tentar conectar ao MongoDB Atlas quando executada em Netlify Functions. O erro ocorre após o envio de formulário, resultando em erro 502 no cliente.

## Sintomas

### Browser (Cliente)

- Formulário é submetido com sucesso
- Validação passa (`AllValid: true`)
- Items são construídos corretamente (8 items com 5 campos)
- Requisição para `/api/prompt-jobs` retorna **502 Bad Gateway**
- Erro genérico: `"An unknown error has occurred"`

### Server (Netlify Functions)

- Função Lambda inicia corretamente
- Tentativa de conexão MongoDB é iniciada
- Conexão falha com timeout após 10 segundos
- Erro: `MongoServerSelectionError: Server selection timed out after 10000 ms`
- Erro não tratado resulta em Promise Rejection não tratada
- Lambda retorna erro 400 devido a Request ID inválido

## Logs Detalhados

### Browser Console

```
[IAFormsPresenterClassic] 🚀 ========== SUBMIT INICIADO ==========
[IAFormsPresenterClassic] 🚀 Inputs atuais: Object
[IAFormsPresenterClassic] 🚀 InputStates: Object
[IAFormsPresenterClassic] 🚀 AllValid: true
[IAFormsPresenterClassic] 🔄 Atualizando itemsBuilder com valores atuais antes do submit...
[IAFormsPresenterClassic] 🚀 Construindo items diretamente com valores: {
  "company": "Instituto",
  "companyWebsite": "https://io-landing.netlify.app/",
  "solution": "Mentorship Career Program",
  "researchTarget": "NFL",
  "researchWebsite": "https://www.nfl.com"
}
[IAFormsPresenterClassic] 📦 Items construídos diretamente: 8 items com 5 campos cada
[IAFormsPresenterClassic] 📦 Primeiro item: {
  "orderIndex": 0,
  "company": "Instituto",
  "companyWebsite": "https://io-landing.netlify.app/",
  "solution": "Mentorship Career Program",
  "researchTarget": "NFL",
  "researchWebsite": "https://www.nfl.com"
}
[IAFormsPresenterClassic] 🚀 Usando onRunWithItems (modo direto)...
[IAFormsContainer] 📦 Usando items passados diretamente: 8
[IAFormsContainer v2.0] 🚀 Iniciando Fluxo 2.0...
/api/prompt-jobs:1 Failed to load resource: the server responded with a status of 502 ()
[IAFormsContainer v2.0] ❌ Erro ao criar job e workspace:
Object
  errorMessage: "An unknown error has occurred"
  errorType: "Error"
```

### Server Logs (Netlify Functions)

```
Nov 4, 06:52:26 PM: 67321d7e Duration: 2032.34 ms	Memory Usage: 150 MB
Nov 4, 06:52:28 PM: efd1f134 INFO   [MongoDB] Initializing client with URI: mongodb+srv://***:***@cluster0.ewvnyea.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
Nov 4, 06:52:28 PM: efd1f134 INFO   🔌 Nova conexão MongoDB criada
Nov 4, 06:52:29 PM: efd1f134 INFO   🗑️ RESET Guest Session - Iniciando...
Nov 4, 06:52:29 PM: efd1f134 Duration: 2353.14 ms	Memory Usage: 163 MB
Nov 4, 06:52:30 PM: 63ba1de1 Duration: 473.41 ms	Memory Usage: 184 MB
Nov 4, 06:53:14 PM: 63ba1de1 ERROR  [MongoDB] Connection failed: [MongoServerSelectionError: Server selection timed out after 10000 ms] {
  errorLabelSet: Set(0) {},
  reason: [TopologyDescription],
  code: undefined
}
Nov 4, 06:53:14 PM: 63ba1de1 ERROR  Unhandled Promise Rejection 	{"errorType":"Runtime.UnhandledPromiseRejection","errorMessage":"MongoServerSelectionError: Server selection timed out after 10000 ms","reason":{"errorType":"MongoServerSelectionError","errorMessage":"Server selection timed out after 10000 ms","errorLabelSet":{},"reason":{"type":"ReplicaSetNoPrimary","servers":{"ac-mvbh0hm-shard-00-02.ewvnyea.mongodb.net:27017":{"address":"ac-mvbh0hm-shard-00-02.ewvnyea.mongodb.net:27017","type":"Unknown","hosts":[],"passives":[],"arbiters":[],"tags":{},"minWireVersion":0,"maxWireVersion":0,"roundTripTime":-1,"minRoundTripTime":0,"lastUpdateTime":10589,"lastWriteDate":0,"error":null,"topologyVersion":null,"setName":null,"setVersion":null,"electionId":null,"logicalSessionTimeoutMinutes":null,"maxMessageSizeBytes":null,"maxWriteBatchSize":null,"maxBsonObjectSize":null,"primary":null,"me":null,"$clusterTime":null,"iscryptd":false},"ac-mvbh0hm-shard-00-00.ewvnyea.mongodb.net:27017":{"address":"ac-mvbh0hm-shard-00-00.ewvnyea.mongodb.net:27017","type":"Unknown","hosts":[],"passives":[],"arbiters":[],"tags":{},"minWireVersion":0,"maxWireVersion":0,"roundTripTime":-1,"minRoundTripTime":0,"lastUpdateTime":10590,"lastWriteDate":0,"error":null,"topologyVersion":null,"setName":null,"setVersion":null,"electionId":null,"logicalSessionTimeoutMinutes":null,"maxMessageSizeBytes":null,"maxBsonObjectSize":null,"primary":null,"me":null,"$clusterTime":null,"iscryptd":false},"ac-mvbh0hm-shard-00-01.ewvnyea.mongodb.net:27017":{"address":"ac-mvbh0hm-shard-00-01.ewvnyea.mongodb.net:27017","type":"Unknown","hosts":[],"passives":[],"arbiters":[],"tags":{},"minWireVersion":0,"maxWireVersion":0,"roundTripTime":-1,"minRoundTripTime":0,"lastUpdateTime":10590,"lastUpdateTime":0,"error":null,"topologyVersion":null,"setName":null,"setVersion":null,"electionId":null,"logicalSessionTimeoutMinutes":null,"maxMessageSizeBytes":null,"maxBsonObjectSize":null,"primary":null,"me":null,"$clusterTime":null,"iscryptd":false}},"stale":false,"compatible":true,"heartbeatFrequencyMS":10000,"localThresholdMS":15,"setName":"atlas-10j15g-shard-0","maxElectionId":null,"maxSetVersion":null,"commonWireVersion":0,"logicalSessionTimeoutMinutes":null},"stack":["MongoServerSelectionError: Server selection timed out after 10000 ms","    at Topology.selectServer (/var/task/node_modules/mongodb/lib/sdam/topology.js:326:38)","    at runNextTicks (node:internal/process/task_queues:65:5)","    at listOnTimeout (node:internal/timers:549:9)","    at process.processTimers (node:internal/timers:523:7)","    at async Topology._connect (/var/task/node_modules/mongodb/lib/sdam/topology.js:200:28)","    at async Topology.connect (/var/task/node_modules/mongodb/lib/sdam/topology.js:152:13)","    at async topologyConnect (/var/task/node_modules/mongodb/lib/mongo_client.js:246:17)","    at async MongoClient._connect (/var/task/node_modules/mongodb/lib/mongo_client.js:259:13)","    at async MongoClient.connect (/var/task/node_modules/mongodb/lib/mongo_client.js:184:13)"]},"promise":{},"stack":["Runtime.UnhandledPromiseRejection: MongoServerSelectionError: Server selection timed out after 10000 ms","    at process.<anonymous> (file:///var/runtime/index.mjs:1448:17)","    at process.emit (node:events:530:35)","    at emitUnhandledRejection (node:internal/process/promises:252:13)","    at throwUnhandledRejectionsMode (node:internal/process/promises:388:19)","    at processPromiseRejections (node:internal/process/promises:475:17)","    at processTicksAndRejections (node:internal/process/task_queues:106:32)","    at runNextTicks (node:internal/process/task_queues:69:3)","    at listOnTimeout (node:internal/timers:549:9)","    at process.processTimers (node:internal/timers:523:7)"]}
Nov 4, 06:53:14 PM: [ERROR] [1762293194027] LAMBDA_RUNTIME Failed to post handler success response. Http response code: 400. {"errorMessage":"Invalid request ID","errorType":"InvalidRequestID"}
Nov 4, 06:53:14 PM: da016246 Duration: 41.12 ms	Memory Usage: 184 MB
```

## Análise do Problema

### Causa Raiz

1. **Timeout de Conexão MongoDB**: O driver MongoDB não consegue estabelecer conexão com os servidores do Atlas dentro do timeout de 10 segundos
2. **ReplicaSet Sem Primary**: O erro indica `ReplicaSetNoPrimary` - nenhum servidor primário foi encontrado
3. **Servidores Não Acessíveis**: Todos os três shards (`ac-mvbh0hm-shard-00-00`, `ac-mvbh0hm-shard-00-01`, `ac-mvbh0hm-shard-00-02`) estão reportando como `Unknown` type, sugerindo que não estão respondendo

### Problemas Adicionais

1. **Promise Rejection Não Tratada**: O erro não está sendo capturado adequadamente, resultando em Unhandled Promise Rejection
2. **Request ID Inválido**: Após o timeout, a Lambda não consegue responder corretamente, gerando erro 400
3. **Erro 502 no Cliente**: O cliente recebe erro genérico sem informações úteis sobre o problema real

## Possíveis Causas

1. ~~**Firewall/IP Whitelist**: IPs do Netlify podem não estar na whitelist do MongoDB Atlas~~ ✅ **JÁ VERIFICADO**: Whitelist já contém `0.0.0.0/0`
2. **Network Restrictions**: Políticas de rede do Netlify podem estar bloqueando conexões de saída
3. **Connection Pooling**: Múltiplas conexões simultâneas podem estar esgotando recursos
4. **Cold Start**: Timeout de 10s pode ser insuficiente em cold starts do Lambda (mas já foi aumentado anteriormente)
5. **DNS Resolution**: Problemas de resolução DNS nos servidores Netlify
6. **MongoDB Atlas Status**: Cluster pode estar offline ou com problemas (mas logs indicam que recebe requisições)

## Status Atual das Recomendações

### ✅ Já Implementado

1. ✅ **IP Whitelist**: Já configurado com `0.0.0.0/0`
2. ✅ **Timeout Configurado**: Timeout já foi aumentado para 10s (otimizado para Netlify)
3. ✅ **Retry Logic**: Função `withRetry()` já existe em `dashboard/lib/db.js` com exponential backoff
4. ✅ **Connection Pooling**: Conexão MongoDB é reutilizada via `global._mongoClientPromise`
5. ✅ **Tratamento de Erros**: Try/catch existe nas rotas, mas precisa melhorar no nível de conexão

### ⚠️ Problemas Identificados

1. **Promise Rejection Não Tratada**: A conexão MongoDB falha, mas a Promise rejection não está sendo capturada adequadamente
2. **Erro Silencioso**: O erro de conexão não está sendo propagado corretamente para a rota, resultando em 502
3. **Monitoramento**: Não há métricas visíveis de conexão e latência

### 🔍 Observações Importantes

- **Conexão Local Funciona**: Indica que o problema é específico do ambiente Netlify
- **MongoDB Recebe Requisições**: Logs no MongoDB Atlas mostram que as requisições chegam, mas retornam 502
- **Timeout de 10s**: Pode ser insuficiente em alguns casos, mas aumentar não é a solução (já foi testado)

## Soluções Promissoras

### 1. MongoDB Data API (Descontinuada)

**Status**: ⚠️ MongoDB Data API foi descontinuada em 30 de setembro de 2025

**Alternativa**: Delbridge Data API oferece funcionalidade similar:

- Suporte completo a operações CRUD
- Linguagem de consulta nativa do MongoDB (MQL)
- Manipulação de esquemas flexíveis
- Migração suave com mínima interrupção

**Referência**: [Delbridge Data API](https://delbridge.solutions/mongodb-data-api/)

### 2. MongoDB Realm/Functions (Atlas App Services)

**Status**: ⚠️ MongoDB Realm (agora Atlas App Services) atingiu fim de vida e não é mais suportado ativamente

**O que era**: Plataforma para construir aplicativos móveis e web com:

- Sincronização de dados em tempo real
- Autenticação de usuários
- Execução de funções serverless
- Código JavaScript no servidor

**Alternativa Atual**: Considerar usar MongoDB Atlas Triggers ou Functions diretamente no Atlas

### 3. Health Checks e Circuit Breaker

**Implementação Recomendada**:

```javascript
// Health Check Pattern
class MongoDBHealthCheck {
  constructor(clientPromise) {
    this.clientPromise = clientPromise;
    this.lastCheck = null;
    this.isHealthy = false;
    this.failureCount = 0;
  }

  async check() {
    try {
      const client = await this.clientPromise;
      await client.db().admin().ping();
      this.isHealthy = true;
      this.failureCount = 0;
      this.lastCheck = Date.now();
      return true;
    } catch (error) {
      this.isHealthy = false;
      this.failureCount++;
      this.lastCheck = Date.now();
      return false;
    }
  }
}

// Circuit Breaker Pattern
class CircuitBreaker {
  constructor(operation, options = {}) {
    this.operation = operation;
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000;
    this.state = "CLOSED"; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.nextAttempt = Date.now();
  }

  async execute(...args) {
    if (this.state === "OPEN") {
      if (Date.now() < this.nextAttempt) {
        throw new Error("Circuit breaker is OPEN");
      }
      this.state = "HALF_OPEN";
    }

    try {
      const result = await this.operation(...args);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = "CLOSED";
  }

  onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      this.state = "OPEN";
      this.nextAttempt = Date.now() + this.resetTimeout;
    }
  }
}
```

### 4. Rede e Firewall do Netlify

**Como Verificar**:

1. **Netlify Functions Logs**: Verificar logs de rede no Netlify Dashboard

   - Acessar: Netlify Dashboard → Site → Functions → Logs
   - Procurar por erros de conexão ou timeout

2. **MongoDB Atlas Network Access**:

   - Acessar: MongoDB Atlas → Network Access
   - Verificar se há IPs específicos bloqueados
   - Verificar logs de conexão no MongoDB Atlas

3. **Netlify Build Settings**:

   - Verificar se há variáveis de ambiente relacionadas a rede
   - Verificar se há plugins ou configurações que possam afetar conexões de saída

4. **Teste de Conectividade**:
   ```javascript
   // Criar endpoint de teste
   export async function GET() {
     try {
       const client = await clientPromise;
       await client.db().admin().ping();
       return NextResponse.json({ status: "connected" });
     } catch (error) {
       return NextResponse.json(
         {
           status: "failed",
           error: error.message,
           stack: error.stack,
         },
         { status: 500 }
       );
     }
   }
   ```

### 5. Monitoramento de Métricas

**Como Monitorar**:

1. **MongoDB Atlas Metrics**:

   - Acessar: MongoDB Atlas → Metrics
   - Verificar: Connection Count, Operation Latency, Network Throughput
   - Verificar: Logs de conexão e desconexão

2. **Netlify Functions Metrics**:

   - Acessar: Netlify Dashboard → Functions → Analytics
   - Verificar: Invocation count, Duration, Error rate
   - Verificar: Logs de execução

3. **Implementar Logging Estruturado**:
   ```javascript
   // Adicionar ao db.js
   export async function logConnectionMetrics() {
     const client = await clientPromise;
     const stats = {
       timestamp: new Date().toISOString(),
       topology: client.topology?.description?.type,
       servers: client.topology?.description?.servers,
       // ... mais métricas
     };
     console.log("[MongoDB Metrics]", JSON.stringify(stats));
   }
   ```

## 📊 Análise de Uso do MongoDB e Otimizações

### Status Atual da Conexão

**✅ Ponto Positivo**: Conexão MongoDB é reutilizada corretamente

- Uso de `global._mongoClientPromise` para reutilizar conexão entre invocações Lambda
- Connection pooling configurado (`maxPoolSize: 10`)
- Cada operação usa `getCollection()` que reutiliza a mesma conexão

**⚠️ Problema Identificado**: Múltiplas operações sequenciais quando poderiam ser em batch

### Análise de Operações MongoDB

#### 1. Uso de Bulk Operations

**✅ Bom Exemplo**: `dashboard/lib/guest-tile-pipeline.js`

- Usa `bulkWrite()` com batch de tiles (BATCH_SIZE = 2)
- Operações não ordenadas (`ordered: false`) para melhor performance
- Implementação adequada de flush de batch pendente

```javascript
// ✅ BOM: Usa bulkWrite com batch
await db.bulkWrite("guest_workspaces", operations, { ordered: false });
```

**❌ Problema Crítico**: `dashboard/app/api/importer/execute/route.js`

- Loop fazendo `insertOne()` e `updateOne()` individualmente
- Para cada item, faz `findOne()` + `insertOne` ou `updateOne`
- Se importar 100 items = 200+ operações MongoDB individuais

```javascript
// ❌ RUIM: Loop com operações individuais
for (const item of file.itemsData) {
  const existingItem = await db.findOne("items", itemFilter);
  if (existingItem) {
    await db.updateOne(itemFilter, { $set: { ...item } });
  } else {
    await db.insertOne("items", { ...item });
  }
}
```

**Impacto**:

- 100 items = 100 `findOne()` + 100 `insertOne/updateOne()` = 200 operações
- Cada operação = 1 round-trip de rede
- Latência: ~10-50ms por operação = 2-10 segundos só em operações de rede

### Comparação com Melhores Práticas

#### ✅ Práticas Já Implementadas

1. **Connection Pooling**: ✅ Reutilização de conexão via `global._mongoClientPromise`
2. **Retry Logic**: ✅ Função `withRetry()` com exponential backoff
3. **Bulk Operations Disponíveis**: ✅ `insertMany()` e `bulkWrite()` implementados

#### ❌ Práticas NÃO Implementadas (Oportunidades de Melhoria)

1. **Bulk Write Operations**:

   - ❌ Muitos loops fazendo `insertOne()`/`updateOne()` individualmente
   - ❌ Pouco uso de `bulkWrite()` para múltiplas operações
   - ❌ `insertMany()` raramente usado

2. **Batch Size Optimization**:

   - ❌ Não há configuração de tamanho de batch otimizado
   - ❌ Batch size fixo em alguns lugares (ex: BATCH_SIZE = 2)
   - ⚠️ Não testado qual batch size ideal para nosso caso

3. **Ordered vs Unordered Writes**:

   - ✅ Usado `ordered: false` em `guest-tile-pipeline.js` (bom!)
   - ❌ Maioria dos casos não especifica, usa default (ordered: true)
   - ⚠️ Operações ordenadas podem ser mais lentas mas garantem consistência

4. **Indexing**:

   - ⚠️ Não verificado se índices estão otimizados para queries frequentes
   - ⚠️ Não há análise de queries lentas

5. **Schema Design**:
   - ✅ Uso de embedding onde apropriado (ex: `workspace_data`)
   - ⚠️ Não verificado se há campos vazios sendo salvos desnecessariamente

### Arquivos que Precisam de Otimização

#### 🔴 Prioridade Alta

1. **`dashboard/app/api/importer/execute/route.js`** (Linhas 177-209)

   - **Problema**: Loop fazendo `findOne()` + `insertOne/updateOne()` para cada item
   - **Solução**: Agrupar operações em `bulkWrite()`
   - **Impacto Estimado**: Redução de 80-90% no tempo de importação

2. **Qualquer loop que faça múltiplas operações MongoDB**:
   - Buscar todos os arquivos com padrão `for.*await.*db\.(insertOne|updateOne)`
   - Converter para usar `bulkWrite()` ou `insertMany()`

#### 🟡 Prioridade Média

3. **Operações individuais que poderiam ser agrupadas**:
   - Verificar se há múltiplas operações sequenciais que poderiam ser em batch
   - Exemplo: Atualizações de status múltiplas

### Recomendações de Otimização

#### 1. Implementar Bulk Operations no Importer

**Antes** (177-209 linhas):

```javascript
// ❌ RUIM: 200+ operações individuais para 100 items
for (const item of file.itemsData) {
  const existingItem = await db.findOne("items", itemFilter);
  if (existingItem) {
    await db.updateOne(itemFilter, { $set: { ...item } });
  } else {
    await db.insertOne("items", { ...item });
  }
}
```

**Depois** (Recomendado):

```javascript
// ✅ BOM: 1 operação bulk para todos os items
const operations = [];

// Preparar todas as operações
for (const item of file.itemsData) {
  const itemFilter = {
    workspaceId: workspaceObjectId,
    sectionId,
    slug: item.slug,
  };

  operations.push({
    updateOne: {
      filter: itemFilter,
      update: {
        $set: {
          ...item,
          sectionId,
          contentTypeId,
          workspaceId: workspaceObjectId,
          userId,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      upsert: true, // Inserir se não existir
    },
  });
}

// Executar todas de uma vez
if (operations.length > 0) {
  await db.bulkWrite("items", operations, { ordered: false });
  results.itemsCreated += operations.length;
}
```

**Benefícios**:

- Redução de 200+ operações para 1 operação
- Redução de latência de rede de ~2-10s para ~50-200ms
- Melhor uso de recursos do MongoDB

#### 2. Otimizar Batch Size

**Atual**: `BATCH_SIZE = 2` (muito pequeno)
**Recomendado**: Testar e configurar baseado em:

- Tamanho médio dos documentos
- Memória disponível
- Latência de rede

```javascript
// Configurável por ambiente
const BATCH_SIZE = process.env.MONGODB_BATCH_SIZE || 50;

// Para documentos pequenos (< 1KB): 50-100
// Para documentos médios (1-10KB): 20-50
// Para documentos grandes (> 10KB): 10-20
```

#### 3. Adicionar Helper para Bulk Upsert

Criar função helper para facilitar bulk upserts:

```javascript
// Adicionar ao dashboard/lib/db.js
export async function bulkUpsert(collection, items, keyFields) {
  const operations = items.map((item) => ({
    updateOne: {
      filter: Object.fromEntries(
        keyFields.map((field) => [field, item[field]])
      ),
      update: {
        $set: { ...item, updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() },
      },
      upsert: true,
    },
  }));

  if (operations.length === 0) return { insertedCount: 0, modifiedCount: 0 };

  const result = await bulkWrite(collection, operations, { ordered: false });

  return {
    insertedCount: result.upsertedCount || 0,
    modifiedCount: result.modifiedCount || 0,
  };
}
```

#### 4. Monitorar Performance

Adicionar métricas de operações MongoDB:

```javascript
// Adicionar ao dashboard/lib/db.js
export async function bulkWriteWithMetrics(
  collection,
  operations,
  options = {}
) {
  const startTime = Date.now();
  const result = await bulkWrite(collection, operations, options);
  const duration = Date.now() - startTime;

  console.log(
    `[MongoDB Metrics] bulkWrite: ${operations.length} ops, ${duration}ms`
  );

  return result;
}
```

### Resumo de Métricas Atuais

**Operações MongoDB Identificadas**:

- **327 matches** de `await db.(insertOne|updateOne|findOne)` em 106 arquivos
- **Muitos loops** fazendo operações sequenciais
- **Pouco uso** de `bulkWrite()` e `insertMany()`

**Impacto Estimado das Otimizações**:

- **Importer**: Redução de 80-90% no tempo de execução
- **Tile Generation**: Já otimizado com batch (bom exemplo!)
- **Geral**: Redução de 50-70% em operações de escrita em batch

### ✅ Status após implementação (05/11/2025)

- `dashboard/lib/db.js`

  - Refatorado para circuito interno com retries configuráveis, fechamento seguro (`closeMongoClient`) e wrapper `withMongoConnection` alinhado ao fluxo SSE/polling descrito no `relatorio-cards.md`.
  - Novos helpers `bulkWriteWithMetrics` e `bulkUpsert` com logging estruturado `[MongoDB Metrics]` + orientação ordered/unordered para reforçar boas práticas de bulk write.

- `dashboard/app/api/importer/execute/route.js`

  - Substitui loops `findOne`/`insertOne` por `bulkUpsert` com batches configuráveis (`MONGODB_BATCH_SIZE`).
  - Métricas de upsert e logs por seção/contentType garantem visibilidade e reduzem round-trips.

- `dashboard/lib/guest-tile-pipeline.js`

  - Batch size ajustável (`GUEST_TILE_BATCH_SIZE`) e telemetria por batch via `db.bulkWrite(..., metadata)` mantendo compatibilidade com o pipeline SSE/polling.

- `dashboard/app/api/health/mongodb/route.js`

  - Novo endpoint de health check com circuito local (`MONGODB_HEALTH_FAILURE_THRESHOLD`, `MONGODB_HEALTH_TIMEOUT_MS`) e retry header.

- `dashboard/env-template.txt`

  - Variáveis documentadas para controle fino de conexão/batching e fallback de tiles.

- `docs/mongodb-performance.md`

  - Guia rápido consolidando bulk writes, ordered vs unordered, e tuning baseado nas fontes de referência (vídeo e talk anexados).

- Rotas guest + SSE (`withMongoConnectionHandler`, `useSSEManager`, `AdminDashboardContainer`)

  - Todas as APIs sensíveis (workspace, tiles, notes, files, templates, etc.) passam por pre-warm e devolvem 503 rápido quando o cluster ainda acorda — adeus 504 + F5.
  - SSE ganhou backoff e callback (`onPermanentError`) que ativa o polling incremental até os tiles estarem salvos.

## Análise Técnica do Código

### Problema na Inicialização da Conexão (`dashboard/lib/db.js`)

O código atual cria a conexão MongoDB assim:

```javascript
if (!global._mongoClientPromise) {
  client = new MongoClient(uri, options);
  global._mongoClientPromise = client
    .connect()
    .then((connectedClient) => {
      console.log("[MongoDB] Connection established successfully");
      return connectedClient;
    })
    .catch((error) => {
      console.error("[MongoDB] Connection failed:", error);
      throw error; // ⚠️ PROBLEMA: Re-throw não resolve o problema
    });
}
clientPromise = global._mongoClientPromise;
```

**Problema Identificado**:

1. Se a conexão falhar na primeira tentativa, `global._mongoClientPromise` fica como uma Promise rejeitada
2. Todas as operações subsequentes (`await clientPromise`) vão falhar imediatamente
3. A Promise rejeitada não é resetada, então mesmo após a conexão ser restabelecida, o código continua usando a Promise rejeitada
4. O erro não é propagado adequadamente para as rotas, resultando em 502

**Solução Recomendada**:

- Resetar `global._mongoClientPromise` quando a conexão falhar
- Implementar retry na inicialização da conexão
- Adicionar tratamento de erro nas operações `db.*` para capturar erros de conexão

## Próximos Passos Prioritários

### Imediatos

1. **Melhorar Tratamento de Erros na Conexão**:

   - Resetar `global._mongoClientPromise` quando a conexão falhar
   - Implementar retry na inicialização da conexão com exponential backoff
   - Adicionar wrapper para operações `db.*` que captura erros de conexão
   - Garantir que erros sejam propagados corretamente para as rotas com mensagens descritivas

2. **Implementar Health Check**:

   - Criar endpoint `/api/health/mongodb` para verificar conexão
   - Implementar circuit breaker para evitar tentativas repetidas durante falhas

3. **Diagnóstico de Rede**:
   - Criar endpoint de teste de conectividade
   - Verificar logs do MongoDB Atlas para conexões recebidas
   - Comparar comportamento local vs produção

### Longo Prazo

1. **Considerar Alternativas**:

   - Avaliar Delbridge Data API como alternativa ao MongoDB Data API
   - Considerar MongoDB Atlas Triggers para operações serverless
   - Avaliar outras soluções de banco de dados serverless

2. **Implementar Observabilidade**:

   - Adicionar métricas de conexão e latência
   - Implementar alertas para falhas de conexão
   - Criar dashboard de monitoramento

3. **Otimização de Conexão**:
   - Implementar connection pool monitoring
   - Otimizar configurações de timeout baseado em métricas reais
   - Considerar estratégias de warm-up para evitar cold starts
