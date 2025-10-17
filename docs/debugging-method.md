# 🔍 Métodos de Debugging para DeckEngine

## 🎯 Visão Geral

Este documento apresenta métodos e técnicas para debugging do DeckEngine no contexto do projeto dashboard, especificamente para o processo de deploy de sites estáticos.

---

## 🚨 Problemas Comuns e Soluções

### 1. Deploy Falha na Validação

**Sintomas:**

- Deploy para na primeira carta (`validateRequest`)
- Logs mostram erro de permissão ou token inválido

**Debugging:**

```javascript
// Adicionar logs detalhados na carta validateRequest
validateRequest = async (context) => {
  console.log(
    `🔍 [DEBUG] Iniciando validação para deploy ${context.deploymentId}`
  );
  console.log(`🔍 [DEBUG] Payload:`, JSON.stringify(context.payload, null, 2));

  try {
    // ... código existente ...
    console.log(`✅ [DEBUG] Validação bem-sucedida`);
  } catch (error) {
    console.error(`❌ [DEBUG] Erro na validação:`, error);
    console.error(`❌ [DEBUG] Stack trace:`, error.stack);
    throw error;
  }
};
```

**Verificações:**

- Tokens do GitHub e Netlify válidos
- Permissões do usuário no workspace
- Rate limiting não excedido

### 2. Falha na Criação de API Key

**Sintomas:**

- Deploy falha na segunda carta (`createApiKey`)
- Erro de conexão com banco de dados

**Debugging:**

```javascript
// Verificar conexão com MongoDB
const testConnection = async () => {
  try {
    const { db } = await import("@/lib/db");
    await db.command({ ping: 1 });
    console.log("✅ Conexão com MongoDB OK");
  } catch (error) {
    console.error("❌ Erro na conexão MongoDB:", error);
  }
};

// Adicionar na carta createApiKey
createApiKey = async (context) => {
  console.log(`🔍 [DEBUG] Testando conexão MongoDB...`);
  await testConnection();

  // ... resto do código ...
};
```

### 3. Problemas com GitHub API

**Sintomas:**

- Falha na criação de repositório
- Erro de autenticação GitHub

**Debugging:**

```javascript
// Testar token GitHub
const testGitHubToken = async (token) => {
  const { Octokit } = await import("@octokit/rest");
  const octokit = new Octokit({ auth: token });

  try {
    const { data: user } = await octokit.rest.users.getAuthenticated();
    console.log(`✅ Token GitHub válido para usuário: ${user.login}`);
    return true;
  } catch (error) {
    console.error(`❌ Token GitHub inválido:`, error.message);
    return false;
  }
};
```

### 4. Falha na Netlify

**Sintomas:**

- Erro ao criar site na Netlify
- Token Netlify inválido

**Debugging:**

```javascript
// Testar token Netlify
const testNetlifyToken = async (token) => {
  try {
    const response = await fetch("https://api.netlify.com/api/v1/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const user = await response.json();
      console.log(`✅ Token Netlify válido para usuário: ${user.full_name}`);
      return true;
    } else {
      console.error(`❌ Token Netlify inválido: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Erro ao testar token Netlify:`, error);
    return false;
  }
};
```

---

## 🛠️ Ferramentas de Debugging

### 1. Logs Estruturados

```javascript
// Utilitário para logs estruturados
const debugLog = (deploymentId, step, message, data = null) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    deploymentId,
    step,
    message,
    data,
  };

  console.log(`🔍 [DEBUG] ${JSON.stringify(logEntry)}`);

  // Opcional: Salvar no banco para análise posterior
  saveDebugLog(logEntry);
};

// Uso nas cartas
createApiKey = async (context) => {
  debugLog(
    context.deploymentId,
    "createApiKey",
    "Iniciando criação de API Key"
  );

  try {
    // ... código ...
    debugLog(
      context.deploymentId,
      "createApiKey",
      "API Key criada com sucesso",
      {
        keyPrefix: apiKeyValue.substring(0, 7),
      }
    );
  } catch (error) {
    debugLog(context.deploymentId, "createApiKey", "Erro na criação", {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};
```

### 2. Monitoramento de Performance

```javascript
// Wrapper para medir tempo de execução
const measureExecution = async (cardName, context, cardFunction) => {
  const startTime = Date.now();

  try {
    console.log(`⏱️ [PERF] Iniciando ${cardName} em ${new Date().toISOString()}`);
    const result = await cardFunction(context);
    const duration = Date.now() - startTime;

    console.log(`✅ [PERF] ${cardName} completada em ${duration}ms`);

    // Alertar se demorou muito
    if (duration > 30000) { // 30 segundos
      console.warn(`⚠️ [PERF] ${cardName} demorou ${duration}ms (acima do esperado)`);
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [PERF] ${cardName} falhou após ${duration}ms:`, error);
    throw error;
  }
};

// Aplicar nas cartas
setupDeploymentDecks() {
  this.engine.createDeck("netlify-deploy", {
    cards: [
      (context) => measureExecution('validateRequest', context, this.validateRequest),
      (context) => measureExecution('createApiKey', context, this.createApiKey),
      // ... outras cartas
    ],
    // ... resto da configuração
  });
}
```

### 3. Verificação de Estado

```javascript
// Verificar estado do contexto entre cartas
const validateContext = (context, requiredFields) => {
  const missing = requiredFields.filter((field) => !context[field]);

  if (missing.length > 0) {
    console.error(`❌ [CONTEXT] Campos ausentes: ${missing.join(", ")}`);
    console.error(`❌ [CONTEXT] Contexto atual:`, Object.keys(context));
    throw new Error(
      `Contexto inválido: campos ausentes - ${missing.join(", ")}`
    );
  }

  console.log(`✅ [CONTEXT] Todos os campos necessários presentes`);
};

// Uso nas cartas
createOrFindRepository = async (context) => {
  validateContext(context, ["deploymentId", "workspace", "payload"]);

  // ... resto do código ...
};
```

---

## 🔧 Scripts de Debugging

### 1. Script de Teste de Conectividade

```javascript
// scripts/test-deckengine-connectivity.js
import { DeploymentOrchestrator } from "../lib/deployment/deploy-orchestrator.js";

const testConnectivity = async () => {
  console.log("🔍 Testando conectividade do DeckEngine...");

  try {
    // Testar criação do orquestrador
    const orchestrator = new DeploymentOrchestrator();
    console.log("✅ DeploymentOrchestrator criado com sucesso");

    // Testar configuração do deck
    const deckStatus = orchestrator.engine.getDeckStatus("netlify-deploy");
    console.log("✅ Deck configurado:", deckStatus);

    // Testar health check
    const health = orchestrator.engine.healthCheck();
    console.log("✅ Health check:", health);
  } catch (error) {
    console.error("❌ Erro no teste de conectividade:", error);
  }
};

testConnectivity();
```

### 2. Script de Simulação de Deploy

```javascript
// scripts/simulate-deploy.js
import { DeploymentOrchestrator } from "../lib/deployment/deploy-orchestrator.js";

const simulateDeploy = async () => {
  console.log("🎮 Simulando deploy para debugging...");

  const mockPayload = {
    userId: "test-user-id",
    workspaceId: "test-workspace-id",
    deployConfig: {
      githubToken: process.env.GITHUB_TOKEN || "test-token",
      netlifyToken: process.env.NETLIFY_TOKEN || "test-token",
      siteName: "test-site",
    },
  };

  try {
    const orchestrator = new DeploymentOrchestrator();

    // Executar apenas as primeiras cartas para teste
    const testContext = {
      payload: mockPayload,
      deploymentId: `test_${Date.now()}`,
      workspace: {
        _id: "test-workspace",
        name: "Test Workspace",
        slug: "test-workspace",
        ownerId: "test-user",
      },
    };

    console.log("🔍 Testando validateRequest...");
    await orchestrator.validateRequest(testContext);

    console.log("🔍 Testando createApiKey...");
    await orchestrator.createApiKey(testContext);

    console.log("✅ Simulação concluída com sucesso");
  } catch (error) {
    console.error("❌ Erro na simulação:", error);
  }
};

simulateDeploy();
```

---

## 📊 Análise de Logs

### 1. Padrões de Log para Análise

```bash
# Buscar por erros específicos
grep -i "error\|falha\|failed" logs/deploy.log

# Buscar por deploys específicos
grep "deploy_1703123456789_abcd" logs/deploy.log

# Analisar tempo de execução
grep "PERF" logs/deploy.log | awk '{print $NF}' | sort -n

# Buscar por timeouts
grep "timeout\|600000" logs/deploy.log
```

### 2. Métricas de Performance

```javascript
// Coletar métricas de performance
const collectMetrics = async () => {
  const deployments = await db.find(
    "deployments",
    {},
    { sort: { createdAt: -1 }, limit: 100 }
  );

  const metrics = {
    total: deployments.length,
    successful: deployments.filter((d) => d.status === "success").length,
    failed: deployments.filter((d) => d.status === "failed").length,
    averageDuration: 0,
    failureReasons: {},
  };

  // Calcular duração média
  const successfulDeploys = deployments.filter(
    (d) => d.status === "success" && d.duration
  );
  if (successfulDeploys.length > 0) {
    metrics.averageDuration =
      successfulDeploys.reduce((sum, d) => sum + d.duration, 0) /
      successfulDeploys.length;
  }

  // Analisar motivos de falha
  deployments
    .filter((d) => d.status === "failed")
    .forEach((d) => {
      const reason = d.error?.message || "unknown";
      metrics.failureReasons[reason] =
        (metrics.failureReasons[reason] || 0) + 1;
    });

  console.log("📊 Métricas de Deploy:", metrics);
  return metrics;
};
```

---

## 🚨 Troubleshooting Rápido

### Checklist de Debugging

1. **Verificar Logs**

   ```bash
   tail -f logs/deploy.log | grep "deploy_${DEPLOYMENT_ID}"
   ```

2. **Testar Conectividade**

   ```bash
   node scripts/test-deckengine-connectivity.js
   ```

3. **Verificar Tokens**

   ```bash
   node scripts/test-tokens.js
   ```

4. **Simular Deploy**

   ```bash
   node scripts/simulate-deploy.js
   ```

5. **Verificar Banco de Dados**
   ```bash
   node scripts/check-database.js
   ```

### Comandos Úteis

```bash
# Verificar status do DeckEngine
curl -X GET "http://localhost:3000/api/debug/deckengine/status"

# Forçar limpeza de deploys antigos
node scripts/cleanup-stale-deploys.js

# Verificar métricas
node scripts/collect-metrics.js

# Testar webhook
curl -X POST "http://localhost:3000/api/deploy/webhook" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

---

## 🎯 Próximos Passos

1. **Implementar dashboard de debugging** em tempo real
2. **Adicionar alertas automáticos** para falhas
3. **Criar testes automatizados** para cada carta
4. **Implementar rollback automático** em caso de falha
5. **Adicionar métricas de negócio** (tempo médio de deploy, taxa de sucesso)

Este guia fornece uma base sólida para debugging do DeckEngine, permitindo identificação rápida e resolução de problemas no processo de deploy.
