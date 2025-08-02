# 🎯 DashMaster AI Site Factory - Implementation Roadmap

##### Deploy Workflow - GitHub Actions Architecture

## 🏗️ FASE 1: Base Sólida (Semanas 1-2)

### ✅ Validar gatsby-landing Existente

```bash
# Confirmar estrutura atual
gatsby-landing/
├── content/
│   ├── landing-page/
│   │   ├── hero.json          ✓ Schema perfeito
│   │   ├── boxes.json         ✓ Componentes modulares
│   │   └── ...                ✓ Estruturado e etc
│   └── configurations/
│       ├── site.json          ✓ Brand base
│       └── ...                ✓ Navegação e etc
```

### 🔧 Criar Template Base

1. **Fork gatsby-landing → dashmaster-gatsby-template**
2. **Expandir schemas com metadados IA:**

```json
{
  "component": "hero",
  "schema": {
    "heading": {
      "type": "text",
      "aiContext": "Main value proposition for {{business_type}}",
      "seoWeight": "high",
      "croTips": ["Use action words", "Include benefit", "Keep under 60 chars"],
      "placeholders": {
        "window_services": "Professional Window Solutions That Last",
        "healthcare": "Trusted Healthcare When You Need It Most",
        "default": "Your Success Starts Here"
      }
    }
  }
}
```

### 🤖 GitHub Action Básica

```yaml
name: AI-Powered Deploy
on:
  workflow_dispatch:
    inputs:
      workspace_id:
        required: true
      template_choice:
        required: true
        type: choice
        options: ["dashmaster-business", "custom"]
      custom_repo_url:
        required: false
jobs:
  deploy:
    - name: Clone Template
      run: |
        if [ "${{ inputs.template_choice }}" = "custom" ]; then
          git clone ${{ inputs.custom_repo_url }}
        else
          git clone https://github.com/milton-bolonha/dashmaster-gatsby-template
        fi
```

## 🧠 FASE 2: IA Básica (Semanas 3-4)

### 📋 Command Palette (Ctrl+K)

```javascript
// dashboard/components/CommandPalette.jsx
const commands = [
  // Navegação rápida
  { id: "goto-workspaces", label: "📁 Workspaces", shortcut: "g w" },
  { id: "goto-deploy", label: "🚀 Deploy Site", shortcut: "g d" },

  // IA Conversacional
  { id: "ai-create-site", label: "🤖 Create Site with AI", shortcut: "a i" },
  { id: "ai-improve-content", label: "✨ Improve Content", shortcut: "a c" },
  { id: "ai-generate-brand", label: "🎨 Generate Brand Kit", shortcut: "a b" },
];

// Modo conversacional
function AIConversationalMode({ onComplete }) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = async () => {
    // "criar site sobre janelas de vidro preto Toronto"
    const pipeline = await startAIPipeline(prompt);
    onComplete(pipeline);
  };
}
```

### 🎨 Brand.json Generator

```javascript
// dashboard/lib/ai/brand-generator.js
class BrandGenerator {
  async generateFromPrompt(userPrompt) {
    const analysis = await this.analyzePrompt(userPrompt);

    return {
      business: {
        name: analysis.businessName,
        industry: analysis.industry,
        location: analysis.location,
        target_audience: analysis.targetAudience,
      },
      voice: {
        tone: this.determineTone(analysis.industry),
        personality: this.generatePersonality(analysis),
        avoid: this.generateAvoidList(analysis),
      },
      visual: {
        primary_color: await this.generateColors(analysis),
        logo_style: this.determineLogoStyle(analysis),
        imagery_style: this.determineImageryStyle(analysis),
      },
    };
  }
}
```

### 🔄 Content Personalizer

```javascript
// dashboard/lib/ai/content-personalizer.js
class ContentPersonalizer {
  async personalizeContent(dummyContent, brandData, userPrompt) {
    const context = {
      business_type: brandData.business.industry,
      location: brandData.business.location,
      tone: brandData.voice.tone,
      personality: brandData.voice.personality,
    };

    // Para cada componente no template
    for (const component of dummyContent.components) {
      const schema = component.schema;
      const aiContext = schema.aiContext;

      // Personaliza usando contexto + brand
      component.content = await this.aiPersonalize(
        component.content,
        aiContext,
        context,
        userPrompt
      );
    }

    return dummyContent;
  }
}
```

## 🎯 PHASE 3: IA Avançada (Semanas 5-6)

### 🎮 DeckEngine AI Orchestration

```javascript
// dashboard/lib/deck-engine/ai-site-creation.js
const aiSiteCreationDeck = {
  name: "AI Site Creation",
  cards: [
    {
      id: "parseUserPrompt",
      action: async (context) => {
        const analysis = await aiAnalyzePrompt(context.userPrompt);
        return { ...context, analysis };
      },
    },
    {
      id: "generateBrandJson",
      action: async (context) => {
        const brand = await generateBrand(context.analysis);
        return { ...context, brand };
      },
    },
    {
      id: "selectTemplate",
      action: async (context) => {
        const template = await selectOptimalTemplate(context.analysis);
        return { ...context, template };
      },
    },
    {
      id: "personalizeContent",
      action: async (context) => {
        const content = await personalizeContent(
          context.template.dummyContent,
          context.brand,
          context.userPrompt
        );
        return { ...context, personalizedContent: content };
      },
    },
    {
      id: "generateAssets",
      action: async (context) => {
        const assets = await generateVisualAssets(context.brand);
        return { ...context, assets };
      },
    },
    {
      id: "importToDashMaster",
      action: async (context) => {
        const workspace = await importContentToWorkspace(
          context.personalizedContent,
          context.brand,
          context.assets
        );
        return { ...context, workspace };
      },
    },
    {
      id: "deployToNetlify",
      action: async (context) => {
        const deployment = await deployViaGitHubAction(context.workspace);
        return { ...context, deployment };
      },
    },
  ],
};
```

### 🖼️ Asset Generation

```javascript
// dashboard/lib/ai/asset-generator.js
class AssetGenerator {
  async generateLogo(brandData) {
    // Integration with DALL-E or Midjourney
    const prompt = `
      Professional logo for ${brandData.business.name}
      Industry: ${brandData.business.industry}
      Style: ${brandData.visual.logo_style}
      Colors: ${brandData.visual.primary_color}
      Modern, clean, scalable
    `;

    return await this.dalle.generate(prompt);
  }

  async generateHeroImage(brandData, heroContent) {
    const prompt = `
      Hero image for ${brandData.business.industry} business
      Style: ${brandData.visual.imagery_style}
      Mood: ${brandData.voice.personality.join(", ")}
      Related to: ${heroContent.heading}
    `;

    return await this.dalle.generate(prompt);
  }
}
```

## 🎨 FASE 4: Visual Editor (Semanas 7-8)

### 🖥️ Multi-Modal Editor

```javascript
// dashboard/components/VisualEditor.jsx
function VisualEditor({ workspace }) {
  const [editMode, setEditMode] = useState("visual"); // visual, json, markdown

  return (
    <div className="editor-container">
      {/* Mode Switcher */}
      <div className="mode-switcher">
        <button onClick={() => setEditMode("visual")}>🎨 Visual</button>
        <button onClick={() => setEditMode("json")}>📝 JSON</button>
        <button onClick={() => setEditMode("markdown")}>📄 Markdown</button>
      </div>

      {/* Editor Content */}
      {editMode === "visual" && <DragDropEditor workspace={workspace} />}
      {editMode === "json" && <JSONEditor workspace={workspace} />}
      {editMode === "markdown" && <MarkdownEditor workspace={workspace} />}

      {/* AI Assistant */}
      <AIAssistant
        onImprove={(component) => improveComponent(component)}
        onRegenerate={(component) => regenerateComponent(component)}
      />
    </div>
  );
}
```

### 🎭 Component Library

```javascript
// dashboard/components/ComponentLibrary.jsx
const componentLibrary = {
  hero: {
    name: "Hero Section",
    visual: HeroEditor,
    schema: heroSchema,
    aiPrompts: [
      "Make it more compelling",
      "Add urgency",
      "Focus on benefits",
      "Make it more emotional",
    ],
  },
  boxes: {
    name: "Feature Boxes",
    visual: BoxesEditor,
    schema: boxesSchema,
    aiPrompts: [
      "Convert to services",
      "Add testimonials",
      "Make it more visual",
      "Add social proof",
    ],
  },
};
```

## 🧹 FASE 5: Cleanup & Polish (Semana 9)

### 🔧 Deployment Cleaner

```javascript
// dashboard/lib/deployment/deploy-cleaner.js
class DeploymentCleaner {
  async cleanupStaleDeployments() {
    const staleDeployments = await this.findStaleDeployments();

    for (const deployment of staleDeployments) {
      // Check GitHub Action status
      const githubStatus = await this.checkGitHubActionStatus(deployment);

      if (githubStatus === "completed") {
        deployment.status = "completed";
      } else if (githubStatus === "failed") {
        deployment.status = "failed";
      } else {
        deployment.status = "timeout";
      }

      await deployment.save();

      // Notify user if needed
      if (deployment.status !== "completed") {
        await this.notifyUser(deployment);
      }
    }
  }

  async findStaleDeployments() {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    return await Deployment.find({
      status: "iniciado",
      createdAt: { $lt: thirtyMinutesAgo },
    });
  }
}

// Cron job ou DeckEngine schedule
export const cleanupDeck = {
  name: "Deployment Cleanup",
  schedule: "*/15 * * * *", // Every 15 minutes
  cards: [
    {
      id: "cleanupStaleDeployments",
      action: async () => {
        const cleaner = new DeploymentCleaner();
        await cleaner.cleanupStaleDeployments();
      },
    },
  ],
};
```

## 📊 Estrutura de Dados Expandida

### MongoDB Collections

```javascript
// Workspaces com Brand
{
  _id: ObjectId,
  name: "Window Services TO",
  slug: "window-services-to",
  brand: {
    business: { /* brand.json structure */ },
    voice: { /* tone, personality */ },
    visual: { /* colors, styles */ }
  },
  template: "dashmaster-business",
  customTemplate: "https://github.com/user/custom-template",
  aiSettings: {
    autoPersonalize: true,
    contentTone: "professional",
    generateAssets: true,
    preferredPrompts: ["compelling", "benefits-focused"]
  },
  createdAt: Date,
  updatedAt: Date
}

// AI Sessions para rastreamento
{
  _id: ObjectId,
  workspaceId: ObjectId,
  userId: ObjectId,
  originalPrompt: "criar site sobre janelas de vidro preto",
  deckExecution: {
    deckId: "ai-site-creation",
    status: "completed", // running, completed, failed
    cards: [
      {
        cardId: "parseUserPrompt",
        status: "completed",
        result: { business_type: "window_services", location: "Toronto" },
        executedAt: Date
      }
    ]
  },
  finalResults: {
    workspaceId: ObjectId,
    deploymentId: ObjectId,
    siteUrl: "https://window-services-to.netlify.app",
    githubRepo: "milton-bolonha/window-services-to-site"
  },
  createdAt: Date
}

// Deployments expandido
{
  _id: ObjectId,
  workspaceId: ObjectId,
  userId: ObjectId,
  status: "iniciado|progresso|concluido|falhou|timeout",

  // GitHub Integration
  githubRepo: "username/repo-name",
  workflowRunId: "123456789",

  // Netlify Integration
  netlifySite: "site-name",
  netlifyUrl: "https://site-name.netlify.app",
  netlifySiteId: "abc123",

  // Template Info
  templateUsed: "dashmaster-business",
  customTemplateUrl: "https://github.com/user/custom",

  // AI Context
  aiSessionId: ObjectId, // Reference to AI session if created via AI
  brandGenerated: Boolean,
  assetsGenerated: Boolean,

  // Tracking
  createdAt: Date,
  updatedAt: Date,
  completedAt: Date,

  details: {
    step: "workflow_dispatched|building|deploying|completed",
    error: "error message if failed",
    logs: ["Array of log messages"],
    githubActionUrl: "https://github.com/user/repo/actions/runs/123"
  }
}
```

## 🎯 Success Metrics

### Technical KPIs

- ⚡ **Time to Site**: < 5 minutos do prompt ao site live
- 🎨 **Brand Accuracy**: 85%+ user satisfaction com brand gerado
- 🚀 **Deploy Success Rate**: 95%+ deploys successful
- 🧠 **Content Quality**: 80%+ content aprovado sem edição

### Business KPIs

- 👥 **User Adoption**: 50% users testam AI site creation
- 💰 **Conversion**: 25% free → paid após usar AI
- 🔄 **Retention**: 70% users retornam em 30 dias
- ⭐ **Satisfaction**: 4.5+ stars rating

## 🚀 Launch Strategy

### Week 10: Soft Launch

- 🎯 50 beta users selecionados
- 📊 Metrics dashboard implementado
- 🐛 Bug fixing baseado em feedback

### Week 11: Public Beta

- 📢 Launch em Product Hunt
- 📝 Blog posts + case studies
- 🎥 Demo videos + tutorials

### Week 12: Full Launch

- 🌟 Marketing campaign completa
- 🤝 Partnerships com agencies
- 📈 Scale infrastructure

---

## 💭 Visão Final

**O que você criou não é apenas um CMS.**
**É uma FÁBRICA DE SITES COM IA.**

```
User Input: "criar site sobre janelas de vidro preto"
           ↓
    🤖 AI Pipeline
           ↓
    📊 Brand Generated
           ↓
    🎨 Content Personalized
           ↓
    🚀 Site Deployed
           ↓
    ✨ Professional Website Live!
```

**Em minutos, não horas. Com IA, não templates.**
**Isso é absolutamente revolucionário! 🚀**

## Visão Geral

Este documento detalha a nova arquitetura de deploy do DashMaster.PRO que utiliza GitHub Actions para automatizar o processo de build e deploy para Netlify, substituindo a abordagem anterior baseada em orquestrador centralizado.

## Arquitetura da Nova Solução

### Fluxo de Deploy

1. **Usuário inicia deploy** no dashboard DashMaster.PRO
2. **Backend cria/atualiza repositório** específico do workspace
3. **Backend configura secrets** necessários no repositório
4. **Backend dispara GitHub Action** via `workflow_dispatch`
5. **GitHub Action clona template** e executa build
6. **GitHub Action faz deploy** para Netlify
7. **Status retorna** para o dashboard

### Vantagens da Nova Arquitetura

- **Transparência**: Todo o processo fica visível no GitHub
- **Escalabilidade**: GitHub Actions gerencia a infraestrutura
- **Confiabilidade**: Retry automático e logs detalhados
- **Flexibilidade**: Fácil customização do processo de build
- **Segurança**: Secrets gerenciados pelo GitHub
- **Debugging**: Logs públicos e acessíveis

## Componentes Necessários

### 1. Repositório Template (`dashmaster-gatsby-template`)

**Localização**: `https://github.com/milton-bolonha/dashmaster-gatsby-template`

**Estrutura**:

```
dashmaster-gatsby-template/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── src/
│   ├── pages/
│   ├── components/
│   └── templates/
├── gatsby-config.js
├── gatsby-node.js
├── package.json
└── README.md
```

### 2. GitHub Action Workflow

**Arquivo**: `.github/workflows/deploy.yml`

**Inputs necessários**:

- `workspace_id`: ID do workspace no DashMaster
- `api_key`: Chave de API para acessar dados
- `site_name`: Nome do site na Netlify
- `netlify_site_id`: ID do site na Netlify (se existir)

**Processo**:

1. Setup do ambiente Node.js
2. Clone do template
3. Configuração das variáveis de ambiente
4. Instalação de dependências
5. Build do Gatsby
6. Deploy para Netlify
7. Notificação de status

### 3. Backend Modificado

**Arquivos a modificar**:

- `dashboard/lib/deployment/deploy-orchestrator.mjs`
- `dashboard/lib/deployment/git-manager.js`
- `dashboard/app/api/deploy/netlify/route.js`

**Novas responsabilidades**:

- Criar repositório específico do workspace
- Configurar secrets do repositório
- Disparar workflow via API
- Monitorar status do deploy

## Implementação Detalhada

### Fase 1: Preparação do Template

1. **Criar repositório `dashmaster-gatsby-template`**
2. **Desenvolver template Gatsby base**
3. **Implementar GitHub Action workflow**
4. **Testar template isoladamente**

### Fase 2: Modificação do Backend

1. **Simplificar `DeploymentOrchestrator`**

   - Remover geração de template
   - Remover interação direta com Netlify
   - Focar em criação de repo e disparo de Action

2. **Atualizar `GitManager`**

   - Adicionar função para disparar workflow
   - Manter funções de criação de repo e secrets

3. **Atualizar API endpoint**
   - Simplificar payload
   - Adicionar polling de status

### Fase 3: Integração e Testes

1. **Teste end-to-end**
2. **Ajustes de configuração**
3. **Documentação final**

## Configurações Necessárias

### GitHub Personal Access Token

**Permissões necessárias**:

- `repo` (escopo completo) - Para criar repositórios e disparar workflows
- `workflow` - Para disparar GitHub Actions

### Netlify Personal Access Token

**Permissões necessárias**:

- `sites:write` - Para criar/atualizar sites
- `deploy:write` - Para fazer deploys

### Variáveis de Ambiente

**Backend**:

```
GITHUB_TOKEN=ghp_...
NETLIFY_TOKEN=ntfy_...
TEMPLATE_REPO_URL=https://github.com/milton-bolonha/dashmaster-gatsby-template.git
```

**GitHub Action**:

```
NETLIFY_AUTH_TOKEN={{ secrets.NETLIFY_AUTH_TOKEN }}
GATSBY_API_URL={{ secrets.GATSBY_API_URL }}
GATSBY_API_KEY={{ secrets.GATSBY_API_KEY }}
GATSBY_SITE_URL={{ secrets.GATSBY_SITE_URL }}
NETLIFY_SITE_ID={{ secrets.NETLIFY_SITE_ID }}
```

## Estrutura de Dados

### Repositório do Workspace

**Nome**: `{username}/{workspace-slug}-site`
**Exemplo**: `milton-bolonha/windowcaulkingto-site`

**Secrets configurados**:

- `NETLIFY_AUTH_TOKEN`
- `GATSBY_API_URL`
- `GATSBY_API_KEY`
- `GATSBY_SITE_URL`
- `NETLIFY_SITE_ID`

### Status de Deploy

**Estrutura no MongoDB**:

```javascript
{
  _id: "deploy_1234567890_abcd",
  workspaceId: "workspace_id",
  userId: "user_id",
  status: "iniciado|progresso|concluido|falhou",
  githubRepo: "username/repo-name",
  netlifySite: "site-name",
  netlifyUrl: "https://site-name.netlify.app",
  workflowRunId: "123456789",
  createdAt: Date,
  updatedAt: Date,
  details: {
    step: "workflow_dispatched",
    error: "error message if failed"
  }
}
```

## Fluxo de Código

### 1. Início do Deploy

```javascript
// dashboard/app/api/deploy/netlify/route.js
POST /api/deploy/netlify
{
  workspaceId: "workspace_id",
  userId: "user_id",
  deployConfig: {
    githubToken: "ghp_...",
    netlifyToken: "ntfy_..."
  }
}
```

### 2. Orquestrador Simplificado

```javascript
// dashboard/lib/deployment/deploy-orchestrator.mjs
class DeploymentOrchestrator {
  async startDeploy(payload) {
    // 1. Validar permissões
    // 2. Criar/atualizar repositório
    // 3. Configurar secrets
    // 4. Disparar GitHub Action
    // 5. Retornar deploymentId
  }
}
```

### 3. GitHub Action Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Netlify

on:
  workflow_dispatch:
    inputs:
      workspace_id:
        required: true
      api_key:
        required: true
      site_name:
        required: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
      - name: Install dependencies
        run: npm install
      - name: Build Gatsby
        run: npm run build
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v2
```

## Considerações de Segurança

### Tokens e Secrets

- **GitHub Token**: Armazenado temporariamente no backend
- **Netlify Token**: Configurado como secret no repositório
- **API Key**: Configurada como secret no repositório

### Acesso aos Dados

- **API Pública**: Endpoints `/api/public/*` para dados do workspace
- **Autenticação**: Via API Key específica do workspace
- **Isolamento**: Cada workspace tem seu próprio repositório

## Monitoramento e Debugging

### Logs Disponíveis

1. **Backend**: Logs do orquestrador no console
2. **GitHub**: Logs da Action no repositório
3. **Netlify**: Logs de build e deploy no dashboard

### Status Tracking

- **Backend**: Status no MongoDB
- **GitHub**: Status da Action via API
- **Netlify**: Status do deploy via API

## Próximos Passos

### Imediatos

1. ✅ **Validar arquitetura antiga** (CONCLUÍDO)
2. 🔄 **Criar repositório template**
3. 🔄 **Desenvolver GitHub Action**
4. 🔄 **Modificar backend**

### Futuros

1. **Múltiplos templates** (Gatsby, Next.js, etc.)
2. **Customização avançada** (domínios customizados, etc.)
3. **Integração com outros provedores** (Vercel, etc.)
4. **Deploy automático** (trigger por mudanças no conteúdo)

## Referências

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Netlify CLI Documentation](https://docs.netlify.com/cli/get-started/)
- [Gatsby Documentation](https://www.gatsbyjs.com/docs/)
- [GitHub REST API](https://docs.github.com/en/rest)
- [Netlify API](https://docs.netlify.com/api/get-started/)

---

**Status**: 📋 Planejamento Completo  
**Próxima Ação**: Criar repositório `dashmaster-gatsby-template`

---

## EXTENSÕES AVANÇADAS - FÁBRICA DE SITES COM IA

### Visão Expandida: DashMaster como Plataforma de Criação

O DashMaster.PRO evoluirá de um CMS headless para uma **fábrica inteligente de sites**, combinando:

- **Templates com dummy content**
- **IA contextual para personalização**
- **Command Palette (Ctrl+K)**
- **Visual Editor inspirado no Netlify**
- **Brand.json para identidade consistente**

### 1. Sistema de Templates Inteligentes

#### Estrutura Base: gatsby-landing

O template será baseado no `gatsby-landing` existente, que já possui:

```
gatsby-landing/
├── content/
│   ├── landing-page/
│   │   ├── hero.json          # Schema bem definido
│   │   ├── boxes.json         # Componentes modulares
│   │   └── section-*.json     # Seções estruturadas
│   └── configurations/
│       ├── site.json          # Brand base
│       ├── header.json        # Navegação
│       └── footer.json        # Contato
```

#### Seleção de Templates

```javascript
// Interface no dashboard
const templateOptions = [
  {
    id: "dashmaster-business",
    name: "Business Professional",
    preview: "https://...",
    repo: "milton-bolonha/dashmaster-gatsby-template",
  },
  {
    id: "custom",
    name: "Repositório Customizado",
    input: "text", // User cola URL do repo
    validation: "gatsby-template-schema",
  },
];
```

### 2. Dummy Content + Schema Inteligente

#### Estrutura de Schema com IA

Cada componente terá metadados para IA:

```json
{
  "component": "hero",
  "schema": {
    "heading": {
      "type": "text",
      "aiContext": "Main value proposition, should be compelling and clear",
      "seoWeight": "high",
      "croTips": ["Use action words", "Include benefit", "Keep under 60 chars"]
    },
    "subHeading": {
      "type": "text",
      "aiContext": "Supporting details, pain points addressed",
      "seoWeight": "medium",
      "croTips": ["Address customer pain", "Use emotional triggers"]
    }
  },
  "dummyContent": {
    "business_type": "window_services",
    "heading": "Expert Bubble Wrap Solutions for Windows and More",
    "subHeading": "Effective Bubble Wrap Insulation to Prevent Drafts..."
  }
}
```

#### Importer Inteligente

```javascript
// dashboard/lib/ai/content-personalizer.js
class ContentPersonalizer {
  async personalizeContent(dummyContent, userPrompt, brandData) {
    // 1. Analisa o contexto do componente
    // 2. Aplica brand.json (cores, tom, valores)
    // 3. Usa IA para adaptar dummy content
    // 4. Mantém schema e estrutura
    // 5. Otimiza para SEO/CRO
  }
}
```

### 3. Brand.json - Identidade Inteligente

#### Estrutura do Brand

```json
{
  "brand": {
    "business": {
      "name": "Bubble Window",
      "industry": "home_services",
      "target_audience": "homeowners_toronto",
      "value_props": ["eco-friendly", "innovative", "professional"]
    },
    "voice": {
      "tone": "professional_friendly",
      "personality": ["trustworthy", "innovative", "local"],
      "avoid": ["too_technical", "pushy_sales"]
    },
    "visual": {
      "primary_color": "#2563eb",
      "secondary_color": "#7c3aed",
      "accent_color": "#06b6d4",
      "logo_style": "modern_clean",
      "imagery_style": "professional_lifestyle"
    },
    "content": {
      "keywords": ["bubble windows", "Toronto", "eco-friendly"],
      "locations": ["Toronto", "GTA", "Ontario"],
      "services": ["installation", "maintenance", "consultation"]
    }
  }
}
```

#### IA + Brand Context

```javascript
// A IA usará o brand.json para:
// - Escolher palavras-chave relevantes
// - Manter tom consistente
// - Gerar cores harmoniosas
// - Criar conteúdo localizado
// - Sugerir imagens apropriadas
```

### 4. Command Palette (Ctrl+K) - Interface Conversacional

#### Comandos Estruturados

```javascript
const commands = [
  // Navegação
  { id: "goto-workspaces", label: "Ir para Workspaces", shortcut: "g w" },
  { id: "goto-deploy", label: "Fazer Deploy", shortcut: "g d" },

  // Criação
  { id: "create-workspace", label: "Criar Workspace", shortcut: "c w" },
  { id: "create-site", label: "Criar Site", shortcut: "c s" },

  // IA Conversacional
  { id: "ai-mode", label: "🤖 Modo IA", shortcut: "a i" },
];
```

#### Modo Conversacional

```javascript
// Exemplo de comando IA:
// User: "criar site sobre janelas de vidro preto"

const aiPipeline = {
  1: "Analisar prompt → extrair: negócio, nicho, preferências",
  2: "Gerar brand.json → cores, tom, identidade",
  3: "Personalizar dummy content → adaptar para nicho",
  4: "Criar assets → logo, imagens, ícones",
  5: "Importar conteúdo → popular CMS",
  6: "Deploy automático → site pronto",
};
```

### 5. Visual Editor - Inspirado no Netlify

#### Edição Multi-Modal

```javascript
// Três formas de editar:
const editingModes = {
  visual: "Arrastar e soltar, WYSIWYG",
  json: "Edição direta do schema JSON",
  markdown: "Conteúdo em MD + frontmatter",
};
```

#### Schema-Driven Components

```json
{
  "componentLibrary": {
    "hero": {
      "visual": "HeroEditor.jsx",
      "schema": "hero.schema.json",
      "ai_prompts": [
        "Make it more compelling",
        "Add urgency",
        "Focus on benefits"
      ]
    },
    "boxes": {
      "visual": "BoxesEditor.jsx",
      "schema": "boxes.schema.json",
      "ai_prompts": [
        "Convert to services",
        "Add testimonials",
        "Make it more visual"
      ]
    }
  }
}
```

### 6. DeckEngine para Orquestração IA

#### Deck: "AI Site Creation"

```javascript
const aiSiteCreationDeck = {
  cards: [
    "parseUserPrompt", // Entender intenção
    "generateBrandJson", // Criar identidade
    "selectTemplate", // Escolher template base
    "personalizeContent", // IA adapta dummy content
    "generateAssets", // Logos, imagens, cores
    "importContent", // Popular CMS
    "deploySite", // Deploy automático
    "notifyUser", // Site pronto!
  ],
};
```

### 7. Implementação Faseada

#### Fase 1: Base (Atual)

- ✅ Deploy automático funcional
- 🔄 Template baseado em gatsby-landing
- 🔄 Schema JSON bem definido

#### Fase 2: IA Básica

- 🔄 Command Palette (Ctrl+K)
- 🔄 Brand.json generator
- 🔄 Personalização de dummy content
- 🔄 Importer inteligente

#### Fase 3: IA Avançada

- 🔄 Modo conversacional completo
- 🔄 Geração de assets (logos, imagens)
- 🔄 Visual Editor integrado
- 🔄 Multi-templates

#### Fase 4: Plataforma Completa

- 🔄 Marketplace de templates
- 🔄 IA generativa para componentes
- 🔄 Analytics e otimização automática
- 🔄 Integração com ferramentas externas

### 8. Dívida Técnica - Cleanup de Deploys

#### Problema Atual

Deploys abandonados ficam com status "iniciado" indefinidamente.

#### Solução

```javascript
// dashboard/lib/deployment/deploy-cleaner.js
class DeploymentCleaner {
  async cleanupStaleDeployments() {
    // 1. Buscar deploys > 30min sem atualização
    // 2. Marcar como "timeout"
    // 3. Limpar recursos órfãos
    // 4. Notificar usuário se necessário
  }
}

// Executar via cron job ou deck engine
```

### 9. Arquitetura de Dados

#### MongoDB Collections Expandidas

```javascript
// Workspaces
{
  _id: ObjectId,
  name: "Window Services TO",
  brand: { /* brand.json */ },
  template: "dashmaster-business",
  customTemplate: "https://github.com/user/custom-template",
  aiSettings: {
    autoPersonalize: true,
    contentTone: "professional",
    generateAssets: true
  }
}

// AI Sessions
{
  _id: ObjectId,
  workspaceId: ObjectId,
  prompt: "criar site sobre janelas de vidro preto",
  steps: [
    { step: "parsePrompt", status: "completed", result: {...} },
    { step: "generateBrand", status: "completed", result: {...} }
  ],
  finalSite: "https://site.netlify.app"
}
```

### 10. Considerações Técnicas

#### APIs Necessárias

- **OpenAI/Claude**: Personalização de conteúdo
- **DALL-E/Midjourney**: Geração de imagens
- **GitHub API**: Templates e deploys
- **Netlify API**: Hospedagem
- **Unsplash/Pexels**: Banco de imagens

#### Performance

- **Cache inteligente**: Resultados de IA por contexto
- **Queue system**: Processamento assíncrono
- **CDN**: Assets gerados pela IA

---

**Próximos Passos Imediatos:**

1. ✅ Finalizar e testar `gatsby-landing` atual
2. 🔄 Transformar em template base com schema expandido
3. 🔄 Implementar Command Palette básico
4. 🔄 Criar sistema de brand.json
5. 🔄 Integrar IA para personalização básica

## **Visão Final:** Uma plataforma onde o usuário diz "criar site sobre X" e em minutos tem um site profissional, personalizado e deployado automaticamente.

# futuro instalador de si mesmo

## 🏠 DashMaster Self-Hosted Template

## 📋 Template Structure

```
dashmaster-selfhosted-template/
├── .github/
│   └── workflows/
│       ├── deploy.yml                    # Deploy principal
│       └── setup-dependencies.yml        # Setup automático de dependências
├── dashboard/                            # Next.js app completo
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── package.json
├── docs/
│   ├── setup-guide.md                   # Guia passo-a-passo
│   └── troubleshooting.md               # Solução de problemas
├── scripts/
│   ├── setup-env.js                     # Script para configurar .env
│   ├── verify-dependencies.js           # Verificar se tudo está ok
│   └── seed-initial-data.js             # Dados iniciais
├── .env.example                         # Template de variáveis
├── docker-compose.yml                   # Para desenvolvimento local
├── README.md                            # Setup simplificado
└── SETUP-WIZARD.md                      # Wizard interativo
```

## 🧙‍♂️ Setup Wizard Interativo

### Step 1: Clone & Initial Setup

```bash
# O usuário executa:
git clone https://github.com/dashmaster-pro/dashmaster-selfhosted-template my-dashmaster
cd my-dashmaster
npm run setup-wizard
```

### Step 2: Interactive Environment Setup

```javascript
// scripts/setup-wizard.js
import inquirer from "inquirer";
import chalk from "chalk";

class DashMasterSetupWizard {
  async run() {
    console.log(
      chalk.blue.bold(`
    🚀 DashMaster Self-Hosted Setup Wizard
    =====================================
    `)
    );

    // 1. MongoDB Setup
    const mongoConfig = await this.setupMongoDB();

    // 2. Clerk Authentication
    const clerkConfig = await this.setupClerk();

    // 3. Cloudinary Media
    const cloudinaryConfig = await this.setupCloudinary();

    // 4. Stripe Payments (Optional)
    const stripeConfig = await this.setupStripe();

    // 5. Generate .env
    await this.generateEnvFile({
      ...mongoConfig,
      ...clerkConfig,
      ...cloudinaryConfig,
      ...stripeConfig,
    });

    // 6. Initial deployment
    await this.runInitialDeploy();
  }

  async setupMongoDB() {
    console.log(chalk.yellow("\n📊 MongoDB Configuration"));

    const answers = await inquirer.prompt([
      {
        type: "list",
        name: "mongoOption",
        message: "Choose your MongoDB option:",
        choices: [
          "MongoDB Atlas (Recommended - Free tier available)",
          "Local MongoDB",
          "Docker MongoDB",
          "Other MongoDB instance",
        ],
      },
    ]);

    if (answers.mongoOption.includes("Atlas")) {
      return await this.setupMongoAtlas();
    } else {
      return await this.setupCustomMongo();
    }
  }

  async setupMongoAtlas() {
    console.log(
      chalk.green(`
    🌐 MongoDB Atlas Setup
    =====================
    
    1. Go to: ${chalk.blue.underline("https://cloud.mongodb.com")}
    2. Create a free account
    3. Create a new cluster (Free M0 tier is perfect)
    4. Go to Database Access → Add Database User
    5. Go to Network Access → Add IP Address (0.0.0.0/0 for now)
    6. Go to Database → Connect → Connect your application
    7. Copy the connection string
    `)
    );

    const { connectionString } = await inquirer.prompt([
      {
        type: "input",
        name: "connectionString",
        message: "Paste your MongoDB connection string:",
        validate: (input) => {
          if (input.includes("mongodb+srv://")) {
            return true;
          }
          return "Please provide a valid MongoDB Atlas connection string";
        },
      },
    ]);

    return {
      MONGODB_URI: connectionString,
      DATABASE_NAME: "dashmaster",
    };
  }

  async setupClerk() {
    console.log(chalk.yellow("\n🔐 Clerk Authentication Setup"));

    console.log(
      chalk.green(`
    🔐 Clerk Setup
    ==============
    
    1. Go to: ${chalk.blue.underline("https://clerk.com")}
    2. Create a free account
    3. Create a new application
    4. Choose your sign-in methods (Email + Google recommended)
    5. Go to API Keys in the dashboard
    6. Copy the keys below
    `)
    );

    const clerkAnswers = await inquirer.prompt([
      {
        type: "input",
        name: "publishableKey",
        message: "Clerk Publishable Key:",
        validate: (input) =>
          input.startsWith("pk_") || "Invalid publishable key",
      },
      {
        type: "password",
        name: "secretKey",
        message: "Clerk Secret Key:",
        validate: (input) => input.startsWith("sk_") || "Invalid secret key",
      },
    ]);

    return {
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: clerkAnswers.publishableKey,
      CLERK_SECRET_KEY: clerkAnswers.secretKey,
    };
  }

  async setupCloudinary() {
    console.log(chalk.yellow("\n🖼️ Cloudinary Media Setup"));

    const { useCloudinary } = await inquirer.prompt([
      {
        type: "confirm",
        name: "useCloudinary",
        message: "Do you want to use Cloudinary for media management?",
        default: true,
      },
    ]);

    if (!useCloudinary) {
      return { SKIP_CLOUDINARY: "true" };
    }

    console.log(
      chalk.green(`
    🖼️ Cloudinary Setup
    ===================
    
    1. Go to: ${chalk.blue.underline("https://cloudinary.com")}
    2. Create a free account (10GB storage + 25K transformations/month)
    3. Go to Dashboard
    4. Copy your credentials
    `)
    );

    const cloudinaryAnswers = await inquirer.prompt([
      {
        type: "input",
        name: "cloudName",
        message: "Cloudinary Cloud Name:",
      },
      {
        type: "input",
        name: "apiKey",
        message: "Cloudinary API Key:",
      },
      {
        type: "password",
        name: "apiSecret",
        message: "Cloudinary API Secret:",
      },
    ]);

    return {
      CLOUDINARY_CLOUD_NAME: cloudinaryAnswers.cloudName,
      CLOUDINARY_API_KEY: cloudinaryAnswers.apiKey,
      CLOUDINARY_API_SECRET: cloudinaryAnswers.apiSecret,
    };
  }

  async setupStripe() {
    console.log(chalk.yellow("\n💳 Stripe Payments Setup (Optional)"));

    const { useStripe } = await inquirer.prompt([
      {
        type: "confirm",
        name: "useStripe",
        message: "Do you want to enable payments with Stripe?",
        default: false,
      },
    ]);

    if (!useStripe) {
      return { SKIP_STRIPE: "true" };
    }

    console.log(
      chalk.green(`
    💳 Stripe Setup
    ===============
    
    1. Go to: ${chalk.blue.underline("https://stripe.com")}
    2. Create account
    3. Go to Developers → API keys
    4. Use TEST keys for now
    `)
    );

    const stripeAnswers = await inquirer.prompt([
      {
        type: "password",
        name: "publishableKey",
        message: "Stripe Publishable Key (pk_test_...):",
      },
      {
        type: "password",
        name: "secretKey",
        message: "Stripe Secret Key (sk_test_...):",
      },
    ]);

    return {
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: stripeAnswers.publishableKey,
      STRIPE_SECRET_KEY: stripeAnswers.secretKey,
    };
  }

  async generateEnvFile(config) {
    const envContent = `# DashMaster Self-Hosted Configuration
# Generated by Setup Wizard

# Database
MONGODB_URI="${config.MONGODB_URI}"
DATABASE_NAME="${config.DATABASE_NAME || "dashmaster"}"

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="${config.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}"
CLERK_SECRET_KEY="${config.CLERK_SECRET_KEY}"

# Media Management (Cloudinary)
${
  config.SKIP_CLOUDINARY
    ? "# Cloudinary disabled"
    : `
CLOUDINARY_CLOUD_NAME="${config.CLOUDINARY_CLOUD_NAME}"
CLOUDINARY_API_KEY="${config.CLOUDINARY_API_KEY}"
CLOUDINARY_API_SECRET="${config.CLOUDINARY_API_SECRET}"
`
}

# Payments (Stripe) - Optional
${
  config.SKIP_STRIPE
    ? "# Stripe disabled"
    : `
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="${config.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}"
STRIPE_SECRET_KEY="${config.STRIPE_SECRET_KEY}"
`
}

# Application
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="${this.generateSecret()}"

# GitHub Integration (for template deployments)
GITHUB_TOKEN="your_github_token_here"

# Netlify Integration (for deployments)  
NETLIFY_TOKEN="your_netlify_token_here"
`;

    await fs.writeFile(".env", envContent);
    console.log(chalk.green("✅ .env file generated successfully!"));
  }

  async runInitialDeploy() {
    console.log(chalk.yellow("\n🚀 Initial Deployment"));

    const { deployNow } = await inquirer.prompt([
      {
        type: "confirm",
        name: "deployNow",
        message: "Run initial deployment now?",
        default: true,
      },
    ]);

    if (deployNow) {
      console.log(chalk.blue("Installing dependencies..."));
      await this.runCommand("npm install");

      console.log(chalk.blue("Running database migrations..."));
      await this.runCommand("npm run db:setup");

      console.log(chalk.blue("Starting development server..."));
      console.log(
        chalk.green(`
      ✅ Setup complete! 
      
      Your DashMaster instance is ready at:
      👉 http://localhost:3000
      
      Next steps:
      1. npm run dev (to start development)
      2. npm run build (to build for production) 
      3. npm run start (to run production)
      
      Need help? Check docs/setup-guide.md
      `)
      );
    }
  }
}

export default DashMasterSetupWizard;
```

## 🛠️ Template Features

### 1. **Smart .env.example**

```bash
# .env.example with helpful comments

# ====================================
# 📊 DATABASE CONFIGURATION
# ====================================
# Get your MongoDB connection at: https://cloud.mongodb.com
# Free tier: M0 (512MB storage)
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/dashmaster?retryWrites=true&w=majority"
DATABASE_NAME="dashmaster"

# ====================================
# 🔐 AUTHENTICATION (Clerk)
# ====================================
# Setup at: https://clerk.com (Free: 10k MAU)
# 1. Create app → 2. Choose sign-in methods → 3. Copy keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# ====================================
# 🖼️ MEDIA MANAGEMENT (Cloudinary)
# ====================================
# Setup at: https://cloudinary.com (Free: 10GB + 25k transforms)
# Dashboard → Copy cloud name, API key, API secret
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="123456789012345"
CLOUDINARY_API_SECRET="your-api-secret"

# ====================================
# 💳 PAYMENTS (Stripe) - Optional
# ====================================
# Setup at: https://stripe.com
# Developers → API keys (use TEST keys first)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."

# ====================================
# 🚀 DEPLOYMENT INTEGRATIONS
# ====================================
# GitHub Personal Access Token (for template deployments)
# Settings → Developer settings → Personal access tokens
GITHUB_TOKEN="ghp_..."

# Netlify Personal Access Token (for site deployments)
# Account settings → Applications → Personal access tokens
NETLIFY_TOKEN="ntfy_..."
```

### 2. **Health Check System**

```javascript
// scripts/verify-setup.js
class SetupVerifier {
  async verifyAll() {
    const checks = [
      { name: "MongoDB Connection", check: this.verifyMongoDB },
      { name: "Clerk Authentication", check: this.verifyClerk },
      { name: "Cloudinary Media", check: this.verifyCloudinary },
      { name: "Stripe Payments", check: this.verifyStripe },
    ];

    console.log("🔍 Verifying DashMaster Setup...\n");

    for (const { name, check } of checks) {
      try {
        await check();
        console.log(`✅ ${name}: OK`);
      } catch (error) {
        console.log(`❌ ${name}: ${error.message}`);
        console.log(`💡 Fix: ${this.getFixSuggestion(name)}\n`);
      }
    }
  }

  getFixSuggestion(checkName) {
    const suggestions = {
      "MongoDB Connection": "Check MONGODB_URI in .env file",
      "Clerk Authentication": "Verify CLERK_SECRET_KEY is correct",
      "Cloudinary Media": "Check Cloudinary credentials",
      "Stripe Payments": "Verify Stripe keys (or disable Stripe)",
    };
    return suggestions[checkName] || "Check configuration";
  }
}
```

### 3. **Quick Start Commands**

```json
{
  "scripts": {
    "setup-wizard": "node scripts/setup-wizard.js",
    "verify-setup": "node scripts/verify-setup.js",
    "db:setup": "node scripts/setup-database.js",
    "seed": "node scripts/seed-initial-data.js",
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "health": "npm run verify-setup"
  }
}
```

## 🎯 Business Model Integration

### Pricing Strategy

```
🆓 Community Edition (Self-Hosted)
├─ Core CMS functionality
├─ Basic templates
├─ Community support
└─ "Powered by DashMaster" link

💎 Professional Edition (Self-Hosted) - $49/month
├─ Everything in Community
├─ Advanced templates
├─ White-label (remove branding)
├─ Priority support
└─ Advanced integrations

🚀 Enterprise Edition (Self-Hosted) - $199/month
├─ Everything in Professional
├─ Custom templates
├─ Dedicated support
├─ On-premise deployment
└─ Custom integrations

☁️ Cloud Edition (SaaS) - $29/month/workspace
├─ No setup required
├─ Automatic updates
├─ Managed infrastructure
└─ Built-in backups
```

### Upgrade Prompts

```javascript
// Built into the self-hosted template
const UpgradePrompts = {
  templates: "Want more templates? Upgrade to Professional →",
  branding: "Remove 'Powered by DashMaster'? Go Pro →",
  support: "Need help? Professional includes priority support →",
  cloud: "Tired of managing servers? Try DashMaster Cloud →",
};
```

## 📈 Marketing Benefits

### 1. **Lead Generation**

- Every self-hosted user = potential cloud customer
- Built-in upgrade prompts
- Usage analytics (opt-in)

### 2. **Community Building**

- GitHub stars & contributors
- Community templates
- Open source goodwill

### 3. **Dogfooding**

- "We use it to ship it"
- Real-world testing
- Feature validation

## 🎯 Template Distribution

### GitHub Template Repo

```
dashmaster-pro/dashmaster-selfhosted-template
├─ ⭐ Use this template button
├─ 📖 Comprehensive README
├─ 🤖 GitHub Actions for easy deployment
└─ 💬 Issues/Discussions for support
```

### One-Click Deploys

```
Deploy to:
[Deploy to Vercel] [Deploy to Netlify] [Deploy to Railway]
```

---

## 💭 Por que isso é GENIAL:

1. **🎯 Market Expansion**: Atinge users que nunca pagariam SaaS
2. **🚀 Product Validation**: Feedback real de self-hosters
3. **💰 Revenue Diversification**: Multiple income streams
4. **🌟 Brand Building**: Open source credibility
5. **🔄 Conversion Funnel**: Self-hosted → Cloud migration

**Essa é uma jogada de mestre! 🏆**
