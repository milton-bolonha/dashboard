# 📊 Relatório de Uso do DeckEngine no Dashboard

## 🎯 Préambulo: O que é o DeckEngine

O **DeckEngine** é um motor de processamento de tarefas flexível e modular, projetado para orquestrar e executar fluxos de trabalho complexos de forma confiável e controlada. Ele implementa uma arquitetura baseada na metáfora de "jogo de cartas" para simplificar conceitos como pipelines, concorrência e rastreamento de estado.

### Contexto de Aplicação no Dashboard

No contexto do nosso projeto dashboard, o DeckEngine é utilizado especificamente para **orquestrar o processo de deploy de sites estáticos** na plataforma Netlify. Ele gerencia um fluxo complexo que envolve:

- Validação de permissões e tokens
- Criação de chaves de API
- Configuração de repositórios Git
- Geração de workflows do GitHub Actions
- Criação de sites na Netlify
- Disparo de processos de build

### Overview do Relatório

Este relatório documenta:

1. **Localização e Arquivos**: Onde o DeckEngine está sendo usado
2. **Implementação Atual**: Como está configurado e funcionando
3. **Fluxo de Deploy**: Detalhamento do processo orquestrado
4. **Exemplos de Código**: Trechos relevantes da implementação
5. **Análise e Recomendações**: Pontos de melhoria e considerações

---

## 📍 Localização e Arquivos

### Arquivos Principais

| Arquivo                                           | Função                                 | Importação                                                                         |
| ------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------- |
| `dashboard/lib/deployment/deploy-orchestrator.js` | **Principal** - Orquestrador de deploy | `import { DeckEngineApp } from "../../../deckEngine/core/index.js"`                |
| `dashboard/app/api/deploy/netlify/route.js`       | API endpoint que usa o orquestrador    | `import { DeploymentOrchestrator } from "@/lib/deployment/deploy-orchestrator.js"` |

### Estrutura do DeckEngine

```
deckEngine/
├── core/
│   ├── engine/
│   │   ├── deck-engine.js          # Motor principal
│   │   ├── arena.js               # Gerenciamento de concorrência
│   │   └── utils.js               # Utilitários
│   ├── platform/
│   │   └── platform-adapter.js    # Adaptador de plataforma
│   └── index.js                   # Ponto de entrada
├── index.js                       # Wrapper principal
└── README.md                      # Documentação
```

---

## 🔧 Implementação Atual

### 1. Inicialização do DeckEngine

```javascript
// dashboard/lib/deployment/deploy-orchestrator.js
import { DeckEngineApp } from "../../../deckEngine/core/index.js";
import { PlatformAdapter } from "../../../deckEngine/core/platform/platform-adapter.js";

class DeploymentOrchestrator {
  constructor() {
    this.engine = new DeckEngineApp({
      platform: "node",
      logging: ["console", "database"],
      concurrencyLimit: 3,
    });

    this.setupDeploymentDecks();
  }
}
```

### 2. Configuração do Deck de Deploy

```javascript
setupDeploymentDecks() {
  // Deck principal de deploy com GitHub Actions
  this.engine.createDeck("netlify-deploy", {
    cards: [
      this.validateRequest,
      this.createApiKey,
      this.setupRepositoryStructure,
      this.createOrFindRepository,
      this.createOrUpdateSecrets,
      this.addGitHubWorkflow,
      this.createNetlifySite,
      this.triggerWorkflow,
      this.markDispatchAsSuccessful,
    ],
    timeout: 600000, // 10 minutos
    retries: 1,
    onFailure: this.notifyUserFailure,
  });
}
```

### 3. Execução do Deploy

```javascript
async startDeploy(payload) {
  this.workspaceId = payload.workspaceId;
  this.userId = payload.userId;

  // 1. Criar o ID antes de iniciar o processo
  const deploymentId = `deploy_${Date.now()}_${payload.workspaceId.slice(-4)}`;

  // 2. Injetar o ID no payload que será usado pelo DeckEngine
  const newPayload = { ...payload, deploymentId };

  // 3. Iniciar o processo em background
  this.engine.playMatch("netlify-deploy", newPayload).catch((err) => {
    console.error(
      `[DeckEngine] Falha ao iniciar o match para o deploy ${deploymentId}:`,
      err
    );
  });

  // 4. Retornar o ID imediatamente para o chamador da API
  return {
    id: deploymentId,
    state: "initiated",
  };
}
```

---

## 🔄 Fluxo de Deploy Detalhado

### Sequência de Execução

O DeckEngine executa as seguintes "cartas" em sequência:

1. **`validateRequest`** - Valida permissões e tokens
2. **`createApiKey`** - Gera chave de API para o deploy
3. **`setupRepositoryStructure`** - Prepara estrutura inicial do repo
4. **`createOrFindRepository`** - Cria/encontra repositório no GitHub
5. **`createOrUpdateSecrets`** - Configura secrets do repositório
6. **`addGitHubWorkflow`** - Adiciona workflow do GitHub Actions
7. **`createNetlifySite`** - Cria site na Netlify
8. **`triggerWorkflow`** - Dispara o workflow de build
9. **`markDispatchAsSuccessful`** - Notifica sucesso do disparo

### Exemplo de Carta: createApiKey

```javascript
createApiKey = async (context) => {
  console.log(
    `[${context.deploymentId}] 2. Gerando API Key para este deploy...`
  );

  try {
    const { nanoid } = await import("nanoid");
    const crypto = await import("crypto");

    const apiKeyValue = `dsmp_${nanoid(32)}`;
    const hashedKey = crypto
      .createHash("sha256")
      .update(apiKeyValue)
      .digest("hex");

    const apiKeyData = {
      userId: context.workspace.ownerId,
      workspaceId: context.workspace._id.toString(),
      name: `Deploy Key - ${new Date().toISOString().split("T")[0]}`,
      hashedKey,
      keyPrefix: apiKeyValue.substring(0, 7),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insertOne("apiKeys", apiKeyData);
    context.apiKey = apiKeyValue;

    console.log(
      `[${context.deploymentId}] ✅ API Key criada: ${apiKeyValue.substring(
        0,
        12
      )}...`
    );
    await this.logStatus(
      context.deploymentId,
      "progresso",
      "API Key gerada com sucesso"
    );
  } catch (error) {
    console.error(`[${context.deploymentId}] ❌ Erro em createApiKey:`, error);
    throw error;
  }
};
```

---

## 🎯 Pontos de Integração

### 1. API Endpoint

```javascript
// dashboard/app/api/deploy/netlify/route.js
export async function POST(request) {
  // ... validações de segurança ...

  const orchestrator = new DeploymentOrchestrator();

  const deploymentInfo = await orchestrator.startDeploy({
    userId: auth.userId,
    workspaceId,
    deployConfig,
  });

  return NextResponse.json({
    message:
      "Processo de deploy iniciado com sucesso. Você pode acompanhar o status no seu dashboard.",
    deploymentId: deploymentInfo.id,
  });
}
```

### 2. Logging e Monitoramento

```javascript
async logStatus(deploymentId, status, details = {}) {
  try {
    const deploymentsCollection = await getCollection("deployments");

    const updateData = {
      $set: {
        status,
        updatedAt: new Date(),
        workspaceId: this.workspaceId,
        userId: this.userId,
        ...detailsObject,
      },
    };

    await deploymentsCollection.updateOne({ _id: deploymentId }, updateData, {
      upsert: true,
    });

    console.log(`[${deploymentId}] 📊 Status atualizado: ${status}`);
  } catch (err) {
    console.error(`Falha ao logar status do deploy ${deploymentId}:`, err);
  }
}
```

---

## 📊 Análise de Uso

### Pontos Fortes

1. **Orquestração Robusta**: O DeckEngine garante execução sequencial e tratamento de erros
2. **Rastreabilidade**: Cada deploy tem ID único e logs detalhados
3. **Modularidade**: Cada etapa é uma "carta" independente e reutilizável
4. **Timeout e Retry**: Configuração de timeout (10min) e retry automático
5. **Execução Assíncrona**: Não bloqueia a API, retorna ID imediatamente

### Configurações Atuais

- **Timeout**: 600.000ms (10 minutos)
- **Retries**: 1 tentativa
- **Concurrency Limit**: 3 deploys simultâneos
- **Logging**: Console + Database
- **Platform**: Node.js

### Limitações Identificadas

1. **Dependência Externa**: DeckEngine está fora do diretório dashboard
2. **Falta de Monitoramento**: Não há dashboard para acompanhar execuções
3. **Tratamento de Erros**: Poderia ser mais granular por etapa
4. **Rollback**: Não há mecanismo de rollback automático

---

## 🚀 Recomendações e Melhorias

### 1. Monitoramento e Observabilidade

```javascript
// Sugestão: Adicionar métricas
this.engine.on("cardStart", (cardName, context) => {
  console.log(
    `🎯 Iniciando carta: ${cardName} para deploy ${context.deploymentId}`
  );
});

this.engine.on("cardComplete", (cardName, context, duration) => {
  console.log(`✅ Carta ${cardName} completada em ${duration}ms`);
});
```

### 2. Dashboard de Deploy

```javascript
// Sugestão: Endpoint para status em tempo real
export async function GET(request) {
  const { deploymentId } = request.nextUrl.searchParams;

  const status = await this.engine.waitForMatch(deploymentId, 5000);
  return NextResponse.json(status);
}
```

### 3. Rollback Automático

```javascript
// Sugestão: Adicionar carta de rollback
this.rollbackDeploy = async (context) => {
  if (context.site) {
    await netlifyManager.deleteSite(context.site.id);
  }
  if (context.repo) {
    await gitManager.deleteRepository(context.repo.id);
  }
};
```

### 4. Configuração Flexível

```javascript
// Sugestão: Configuração por workspace
const deckConfig = {
  timeout: workspace.deployTimeout || 600000,
  retries: workspace.deployRetries || 1,
  concurrencyLimit: workspace.deployConcurrency || 3,
};
```

---

## 📈 Métricas de Uso

### Estatísticas Atuais

- **Deck Único**: `netlify-deploy`
- **Cartas por Deck**: 9 cartas
- **Timeout Configurado**: 10 minutos
- **Retry Policy**: 1 tentativa
- **Concurrency**: 3 deploys simultâneos

### Logs Típicos

```
[deploy_1703123456789_abcd] 1. Validando requisição...
[deploy_1703123456789_abcd] ✅ Validação concluída.
[deploy_1703123456789_abcd] 2. Gerando API Key para este deploy...
[deploy_1703123456789_abcd] ✅ API Key criada: dsmp_a1b2c3d4...
[deploy_1703123456789_abcd] 3. Configurando estrutura do repositório...
[deploy_1703123456789_abcd] ✅ Estrutura preparada
[deploy_1703123456789_abcd] 4. Criando/Encontrando repositório Git...
[deploy_1703123456789_abcd] ✅ Repositório criado: https://github.com/user/repo
```

---

## 🎯 Conclusão

O DeckEngine está sendo utilizado de forma **eficiente e bem estruturada** no projeto dashboard, especificamente para orquestrar o processo de deploy de sites estáticos. A implementação atual demonstra:

- **Arquitetura sólida** com separação clara de responsabilidades
- **Tratamento robusto de erros** com logging detalhado
- **Execução assíncrona** que não bloqueia a API
- **Rastreabilidade completa** de cada deploy

### Próximos Passos Sugeridos

1. **Implementar dashboard de monitoramento** para acompanhar deploys em tempo real
2. **Adicionar métricas e alertas** para falhas e performance
3. **Implementar rollback automático** para casos de falha
4. **Considerar mover DeckEngine** para dentro do projeto dashboard
5. **Adicionar testes automatizados** para o fluxo de deploy

O uso atual do DeckEngine representa uma **implementação madura e bem pensada** que facilita significativamente a complexidade do processo de deploy, tornando-o mais confiável e observável.
