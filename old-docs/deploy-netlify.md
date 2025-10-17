# 🚀 Plano Detalhado: Deploy Automatizado para Netlify

**Status:** 📋 **Planejamento Detalhado**  
**Versão:** 1.0  
**Autor:** Milton Bolonha  
**Data:** Janeiro 2025

---

## 📄 Sumário Executivo

Transformar o DashMaster.PRO em uma **"fábrica de sites estáticos"** completamente automatizada. Com um clique, cada workspace poderá gerar um site estático completo, versioná-lo em um repositório Git dedicado e publicá-lo na Netlify de forma totalmente programática.

### 🎯 Objetivos Principais

1. **Deploy com Um Clique**: Interface simples no dashboard para deploy instantâneo
2. **Automação Completa**: Zero intervenção manual após configuração inicial
3. **CI/CD Nativo**: Pipeline automático de build/deploy via GitHub Actions
4. **Orquestração Inteligente**: Usar deckEngine para workflows robustos
5. **Escalabilidade**: Suporte a múltiplos workspaces e sites simultâneos

## 📚 Sumário (Table of Contents)

- [📄 Sumário Executivo](#-sumário-executivo)
- [🏗️ Arquitetura do Sistema](#️-arquitetura-do-sistema)
  - [Componentes Principais](#componentes-principais)
  - [Fluxo de Deploy Completo (Visão do Usuário)](#fluxo-de-deploy-completo-visão-do-usuário)
- [🔧 Fase 1: Infraestrutura Backend - deckEngine Deployment Orchestrator](#-fase-1-infraestrutura-backend---deckengine-deployment-orchestrator)
  - [Por que usar o deckEngine?](#por-que-usar-o-deckengine)
- [🎨 Fase 2: Template Generator - Fábrica de Código](#-fase-2-template-generator---fábrica-de-código)
- [🔗 Fase 3: Git & GitHub Integration](#-fase-3-git--github-integration)
  - [A Lógica dos Repositórios: Um por Workspace](#a-lógica-dos-repositórios-um-por-workspace)
- [🌐 Fase 4: Netlify Integration](#-fase-4-netlify-integration)
- [🎛️ Fase 5: Frontend - Interface do Dashboard](#-fase-5-frontend---interface-do-dashboard)
  - [A Experiência do Usuário: Polling em Tempo Real](#a-experiência-do-usuário-polling-em-tempo-real)
- [📊 Fase 6: Monitoramento e Analytics](#-fase-6-monitoramento-e-analytics)
  - [Monitoramento vs. Observabilidade: Qual a diferença?](#monitoramento-vs-observabilidade-qual-a-diferença)
- [🛡️ Fase 6: Considerações de Segurança](#️-fase-6-considerações-de-segurança)
  - [A Importância da Criptografia de Tokens](#a-importância-da-criptografia-de-tokens)
- [🔄 Fase 7: Sistema de Templates Avançado](#-fase-7-sistema-de-templates-avançado)
- [🧪 Fase 8: Testes e Validação - A Garantia de Confiança do MVP](#-fase-8-testes-e-validação---a-garantia-de-confiança-do-mvp)
  - [O Valor Prático dos Testes para o Lançamento](#o-valor-prático-dos-testes-para-o-lançamento)
- [📋 Checklist de Implementação](#-checklist-de-implementação)
- [🚀 Cronograma de Desenvolvimento](#-cronograma-de-desenvolvimento)
- [💡 Expansões Futuras](#-expansões-futuras)
- [🎯 Conclusão](#-conclusão)

---

## 🏗️ Arquitetura do Sistema

### Componentes Principais

```mermaid
graph TB
    A[Dashboard UI] --> B[Deploy Manager API]
    B --> C[deckEngine Orchestrator]
    C --> D[Template Generator]
    C --> E[Git Manager]
    C --> F[Netlify Manager]
    D --> G[Gatsby Template]
    E --> H[GitHub API]
    F --> I[Netlify API]
    J[Workspace Data] --> K[Public API]
    K --> L[Generated Site]
```

### Fluxo de Deploy Completo

1. **Trigger**: Usuário clica "Deploy para Netlify" no dashboard
2. **Orquestração**: deckEngine inicia um "Deck" de deploy
3. **Geração**: Template Gatsby é gerado com dados do workspace
4. **Versionamento**: Código é commitado em repositório GitHub
5. **CI/CD**: GitHub Actions executa build e deploy
6. **Publicação**: Site é publicado na Netlify
7. **Notificação**: URL final é retornada ao usuário

8. **Trigger**: No dashboard, o usuário clica em "Publicar no Netlify", insere seus tokens de API do GitHub e da Netlify em um formulário seguro.
9. **Orquestração (Início Imediato)**: O backend responde instantaneamente "Deploy iniciado!" e a interface começa a mostrar o progresso em tempo real. Nos bastidores, o `deckEngine` inicia um "Deck" de deploy.
10. **Geração e Versionamento (Automático)**: O sistema cria um **novo repositório privado no GitHub do usuário**. Em seguida, gera todo o código-fonte de um site Gatsby, já configurado para consumir os dados do workspace, e envia esse código para o novo repositório.
11. **Configuração da Ponte (Automático)**: O sistema acessa a Netlify, cria um novo site e o configura para observar o repositório recém-criado. Ele também injeta os tokens necessários de forma segura nos "Secrets" do GitHub.
12. **CI/CD (Automático)**: A configuração enviada para o GitHub aciona a "GitHub Action", que automaticamente instala as dependências, faz o build do site (puxando os dados da API pública do DashMaster.PRO) e envia o resultado para a Netlify.
13. **Publicação e Notificação (Finalização)**: A Netlify publica o site e a URL final (ex: `meu-workspace.netlify.app`) é capturada e exibida no dashboard do DashMaster.PRO, junto com o status "Concluído!".

---

## 🔧 Fase 1: Infraestrutura Backend - deckEngine Deployment Orchestrator

### Por que usar o deckEngine?

A automação de deploy é um processo com múltiplos passos que pode falhar por diversas razões (token inválido, API do GitHub instável, etc.). Usar o `deckEngine` nos dá superpoderes para lidar com essa complexidade:

- **Resiliência:** A opção de `retries: 2` significa que, se uma chamada de API para o GitHub falhar por um problema momentâneo de rede, o `deckEngine` tentará novamente de forma automática antes de desistir.
- **Visibilidade:** Cada `card` (etapa) do deck pode registrar seu sucesso ou falha. Isso nos dá uma trilha de auditoria perfeita para depurar problemas, alinhando-se com a nossa estratégia de **Observabilidade**.
- **Clareza:** O fluxo de deploy se torna um código legível e sequencial, em vez de uma cadeia complexa de callbacks e promises.

### Arquivo: `dashboard/lib/deployment/deploy-orchestrator.js`

```javascript
const DeckEngineApp = require("../../../deckEngine/core/index");
const {
  PlatformAdapter,
} = require("../../../deckEngine/core/platform/platform-adapter");

class DeploymentOrchestrator {
  constructor() {
    this.engine = new DeckEngineApp({
      platform: "node", // Rodando no servidor Next.js
      logging: ["console", "database"], // Logs para UI em tempo real
      concurrencyLimit: 3, // Max 3 deploys simultâneos
    });

    this.setupDeploymentDecks();
  }

  setupDeploymentDecks() {
    // Deck principal de deploy
    this.engine.createDeck("netlify-deploy", {
      cards: [
        this.validateWorkspace,
        this.generateTemplate,
        this.createGitRepository,
        this.commitCode,
        this.createNetlifySite,
        this.triggerBuild,
        this.pollDeployStatus,
        this.notifyUser,
      ],
      timeout: 300000, // 5 minutos máximo
      retries: 2,
    });

    // Deck para updates incrementais
    this.engine.createDeck("site-update", {
      cards: [
        this.validateWorkspace,
        this.generateTemplate,
        this.commitUpdate,
        this.triggerRebuild,
        this.notifyUser,
      ],
    });
  }

  // Cartas individuais do deck
  validateWorkspace = async (context) => {
    const { workspaceId, userId } = context.payload;

    // Verificar se workspace existe e user tem permissão
    const workspace = await db.findOne("workspaces", {
      _id: workspaceId,
      $or: [
        { ownerId: userId },
        {
          "members.userId": userId,
          "members.role": { $in: ["owner", "admin"] },
        },
      ],
    });

    if (!workspace) {
      throw new Error("Workspace não encontrado ou sem permissão");
    }

    context.workspace = workspace;
    context.deploymentId = `deploy_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    return context;
  };

  generateTemplate = async (context) => {
    const generator = new TemplateGenerator(context.workspace);
    const templateFiles = await generator.generateGatsbyTemplate();

    context.templateFiles = templateFiles;
    context.envConfig = generator.generateEnvConfig();
    context.workflowConfig = generator.generateGitHubWorkflow();

    return context;
  };

  // ... outras cartas
}
```

### Arquivo: `dashboard/app/api/deploy/netlify/route.js`

```javascript
import { NextResponse } from "next/server";
import { getCurrentAuth, getCurrentWorkspace } from "@/lib/auth";
import { DeploymentOrchestrator } from "@/lib/deployment/deploy-orchestrator";
import { db } from "@/lib/db";

/**
 * POST /api/deploy/netlify
 * Inicia deploy automatizado para Netlify
 */
export async function POST(request) {
  try {
    const { userId } = await getCurrentAuth();
    const { workspaceId, deployConfig } = await request.json();

    const workspace = await getCurrentWorkspace(userId, workspaceId);
    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace não encontrado" },
        { status: 404 }
      );
    }

    const orchestrator = new DeploymentOrchestrator();

    // Iniciar deploy assíncrono
    const deployment = await orchestrator.startDeploy({
      workspaceId: workspace._id,
      userId,
      config: deployConfig,
    });

    // Salvar deployment no banco para tracking
    await db.insertOne("deployments", {
      _id: deployment.id,
      workspaceId: workspace._id,
      userId,
      status: "started",
      createdAt: new Date(),
      config: deployConfig,
    });

    return NextResponse.json({
      deploymentId: deployment.id,
      status: "started",
      message: "Deploy iniciado com sucesso",
    });
  } catch (error) {
    console.error("Erro no deploy:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/deploy/netlify/[deploymentId]
 * Consulta status do deploy
 */
export async function GET(request, { params }) {
  try {
    const { deploymentId } = params;
    const { userId } = await getCurrentAuth();

    const deployment = await db.findOne("deployments", {
      _id: deploymentId,
      userId,
    });

    if (!deployment) {
      return NextResponse.json(
        { error: "Deploy não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(deployment);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

## 🎨 Fase 2: Template Generator - Fábrica de Código

### Arquivo: `dashboard/lib/deployment/template-generator.js`

```javascript
import fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";

class TemplateGenerator {
  constructor(workspace) {
    this.workspace = workspace;
    this.templateBase = path.resolve("./templates/gatsby-template");
  }

  async generateGatsbyTemplate() {
    const templateFiles = new Map();

    // 1. Arquivos base do Gatsby
    templateFiles.set("package.json", this.generatePackageJson());
    templateFiles.set("gatsby-config.js", this.generateGatsbyConfig());
    templateFiles.set("gatsby-node.js", this.generateGatsbyNode());
    templateFiles.set(".gitignore", this.generateGitignore());
    templateFiles.set("README.md", this.generateReadme());

    // 2. Configurações de CI/CD
    templateFiles.set(
      ".github/workflows/deploy.yml",
      this.generateGitHubWorkflow()
    );
    templateFiles.set("netlify.toml", this.generateNetlifyConfig());

    // 3. Código fonte
    templateFiles.set("src/pages/404.js", this.generate404Page());
    templateFiles.set(
      "src/templates/HomePage.js",
      await this.generateHomePageTemplate()
    );
    templateFiles.set(
      "src/templates/CustomPage.js",
      await this.generateCustomPageTemplate()
    );
    templateFiles.set(
      "src/templates/CityPage.js",
      await this.generateCityPageTemplate()
    );

    // 4. Componentes base
    await this.generateComponents(templateFiles);

    // 5. Estilos
    templateFiles.set(
      "src/styles/global.css",
      await this.generateGlobalStyles()
    );
    templateFiles.set("tailwind.config.js", this.generateTailwindConfig());

    return templateFiles;
  }

  generatePackageJson() {
    return JSON.stringify(
      {
        name: `${this.workspace.slug}-site`,
        version: "1.0.0",
        description: `Site estático para ${this.workspace.name}`,
        scripts: {
          develop: "gatsby develop",
          build: "gatsby build",
          serve: "gatsby serve",
          clean: "gatsby clean",
        },
        dependencies: {
          gatsby: "^5.14.1",
          react: "^18.2.0",
          "react-dom": "^18.2.0",
          "node-fetch": "^2.7.0",
          "gatsby-plugin-postcss": "^6.14.0",
          "gatsby-plugin-image": "^3.14.0",
          "gatsby-plugin-sharp": "^5.14.0",
          "gatsby-transformer-sharp": "^5.14.0",
          "gatsby-plugin-manifest": "^5.14.0",
          "gatsby-plugin-sitemap": "^6.14.0",
          tailwindcss: "^4.1.11",
          autoprefixer: "^10.4.21",
          postcss: "^8.5.6",
        },
        author: this.workspace.owner?.name || this.workspace.name,
        license: "MIT",
      },
      null,
      2
    );
  }

  generateGatsbyConfig() {
    return `require("dotenv").config({
  path: \`.env.\${process.env.NODE_ENV}\`,
});

module.exports = {
  siteMetadata: {
    title: "${this.workspace.name}",
    description: "${
      this.workspace.description || "Site gerado pelo DashMaster.PRO"
    }",
    siteUrl: process.env.GATSBY_SITE_URL || "https://${
      this.workspace.slug
    }.netlify.app",
  },
  plugins: [
    "gatsby-plugin-postcss",
    "gatsby-plugin-image",
    "gatsby-plugin-sitemap",
    "gatsby-plugin-sharp",
    "gatsby-transformer-sharp",
    {
      resolve: "gatsby-plugin-manifest",
      options: {
        name: "${this.workspace.name}",
        short_name: "${this.workspace.slug}",
        start_url: "/",
        background_color: "#ffffff",
        theme_color: "#0066cc",
        display: "minimal-ui",
        icon: "src/images/icon.png",
      },
    },
  ],
};`;
  }

  generateGatsbyNode() {
    return `const path = require("path");
const fetch = require("node-fetch");

async function getSourceData() {
  const apiUrl = \`\${process.env.GATSBY_API_URL}/api/public/content\`;
  const apiKey = process.env.GATSBY_API_KEY;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: \`Bearer \${apiKey}\`,
      },
    });
    
    if (!response.ok) {
      throw new Error(\`API call failed with status: \${response.status}\`);
    }
    
    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error("Failed to fetch source data:", error);
    process.exit(1);
  }
}

exports.createPages = async ({ actions }) => {
  const { createPage } = actions;
  const allContent = await getSourceData();

  // Helper para encontrar seções
  const getContentBySlug = (slug) => allContent.find((c) => c.slug === slug);

  // Dados globais
  const globalData = {
    header: getContentBySlug("header")?.items[0]?.data,
    footer: getContentBySlug("footer")?.items[0]?.data,
    site: getContentBySlug("site")?.items[0]?.data,
    services: getContentBySlug("services")?.items[0]?.data,
    topbar: getContentBySlug("topbar")?.items[0]?.data,
    cities: getContentBySlug("cities")?.items[0]?.data,
  };

  // 1. Página inicial
  const landingPageSection = getContentBySlug("landing-page");
  if (landingPageSection) {
    createPage({
      path: "/",
      component: path.resolve("./src/templates/HomePage.js"),
      context: {
        pageData: [landingPageSection],
        globalData: globalData,
      },
    });
  }

  // 2. Páginas customizadas
  const pages = (getContentBySlug("pages")?.items || []).concat(
    getContentBySlug("custom-pages")?.items || []
  );

  pages.forEach((page) => {
    const pageTemplate = page.data.template || "CustomPage";
    createPage({
      path: \`/\${page.slug}\`,
      component: path.resolve(\`./src/templates/\${pageTemplate}.js\`),
      context: {
        pageData: page,
        globalData: globalData,
      },
    });
  });

  // 3. Páginas de cidades (se existirem)
  const citiesList = getContentBySlug("cities")?.items[0]?.data || {};
  const cityTemplate = getContentBySlug("cities-pages")?.items.find(
    (t) => t.slug === "city-template"
  );

  if (Object.keys(citiesList).length > 0 && cityTemplate) {
    Object.values(citiesList).forEach((city) => {
      createPage({
        path: \`/service-areas/\${city.slug}\`,
        component: path.resolve("./src/templates/CityPage.js"),
        context: {
          city,
          templateData: cityTemplate,
          globalData: globalData,
        },
      });
    });
  }
};`;
  }

  generateGitHubWorkflow() {
    return `name: Deploy to Netlify

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build site
      run: npm run build
      env:
        GATSBY_API_URL: \${{ secrets.GATSBY_API_URL }}
        GATSBY_API_KEY: \${{ secrets.GATSBY_API_KEY }}
        GATSBY_SITE_URL: \${{ secrets.GATSBY_SITE_URL }}
        
    - name: Deploy to Netlify
      uses: netlify/actions/deploy@master
      with:
        publish-dir: ./public
        production-branch: main
        production-deploy: \${{ github.ref == 'refs/heads/main' }}
      env:
        NETLIFY_AUTH_TOKEN: \${{ secrets.NETLIFY_AUTH_TOKEN }}
        NETLIFY_SITE_ID: \${{ secrets.NETLIFY_SITE_ID }}`;
  }

  generateNetlifyConfig() {
    return `[build]
  command = "npm run build"
  publish = "public"

[build.environment]
  NODE_VERSION = "20"
  NPM_FLAGS = "--production=false"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200`;
  }

  generateEnvConfig() {
    return {
      production: `GATSBY_API_URL=${process.env.NEXT_PUBLIC_APP_URL}
GATSBY_API_KEY=${this.workspace.apiKey || "PLACEHOLDER_API_KEY"}
GATSBY_SITE_URL=https://${this.workspace.slug}.netlify.app`,

      development: `GATSBY_API_URL=http://localhost:3000
GATSBY_API_KEY=${this.workspace.apiKey || "PLACEHOLDER_API_KEY"}
GATSBY_SITE_URL=http://localhost:8000`,
    };
  }

  // ... outros métodos de geração de templates
}

export { TemplateGenerator };
```

---

## 🔗 Fase 3: Git & GitHub Integration

### A Lógica dos Repositórios: Um por Workspace

A arquitetura mais segura, escalável e profissional é a de **um repositório Git dedicado para cada workspace/site gerado**. Ter um repositório central com todos os sites dentro (monorepo) traria problemas de segurança (um usuário poderia ver o código de outro) e performance.

Portanto, o DashMaster.PRO irá **criar automaticamente um novo repositório privado** na conta GitHub do usuário na primeira vez que ele fizer o deploy de um workspace. Para qualquer deploy futuro daquele mesmo workspace, o sistema apenas enviará as atualizações para o repositório já existente. Isso garante isolamento, segurança e simplicidade.

### Arquivo: `dashboard/lib/deployment/git-manager.js`

```javascript
import { Octokit } from "@octokit/rest";
import { nanoid } from "nanoid";

class GitManager {
  constructor(githubToken, orgName = null) {
    this.octokit = new Octokit({
      auth: githubToken,
    });
    this.orgName = orgName;
  }

  async createRepository(workspace, templateFiles) {
    const repoName = `${workspace.slug}-site`;

    try {
      // 1. Criar repositório
      const repo = await this.octokit.rest.repos.create({
        name: repoName,
        description: `Site estático para ${workspace.name} - Gerado pelo DashMaster.PRO`,
        private: true,
        auto_init: false,
        ...(this.orgName && { org: this.orgName }),
      });

      // 2. Fazer commit inicial com todos os arquivos
      await this.commitFiles(repo.data, templateFiles);

      // 3. Configurar branch protection
      await this.setupBranchProtection(repo.data);

      return repo.data;
    } catch (error) {
      if (error.status === 422) {
        // Repositório já existe, fazer update
        return await this.updateRepository(workspace, templateFiles);
      }
      throw error;
    }
  }

  async commitFiles(repo, templateFiles) {
    const commits = [];

    // Converter Map para array de arquivos
    const files = Array.from(templateFiles.entries()).map(
      ([path, content]) => ({
        path,
        content,
        encoding: "utf-8",
      })
    );

    // Fazer commit em lotes para evitar rate limiting
    const batchSize = 10;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);

      const tree = await this.createTree(repo, batch);
      const commit = await this.createCommit(
        repo,
        tree,
        `Deploy inicial - Lote ${Math.floor(i / batchSize) + 1}`
      );
      commits.push(commit);
    }

    return commits;
  }

  async createTree(repo, files) {
    const tree = files.map((file) => ({
      path: file.path,
      mode: "100644",
      type: "blob",
      content: file.content,
    }));

    const response = await this.octokit.rest.git.createTree({
      owner: repo.owner.login,
      repo: repo.name,
      tree,
    });

    return response.data;
  }

  async createCommit(repo, tree, message) {
    // Obter commit pai (se existir)
    let parentSha = null;
    try {
      const ref = await this.octokit.rest.git.getRef({
        owner: repo.owner.login,
        repo: repo.name,
        ref: "heads/main",
      });
      parentSha = ref.data.object.sha;
    } catch (error) {
      // Branch main não existe ainda
    }

    const commit = await this.octokit.rest.git.createCommit({
      owner: repo.owner.login,
      repo: repo.name,
      message,
      tree: tree.sha,
      ...(parentSha && { parents: [parentSha] }),
    });

    // Atualizar referência da branch
    await this.octokit.rest.git
      .createRef({
        owner: repo.owner.login,
        repo: repo.name,
        ref: "refs/heads/main",
        sha: commit.data.sha,
      })
      .catch(async () => {
        // Ref já existe, atualizar
        await this.octokit.rest.git.updateRef({
          owner: repo.owner.login,
          repo: repo.name,
          ref: "heads/main",
          sha: commit.data.sha,
        });
      });

    return commit.data;
  }

  async setupBranchProtection(repo) {
    try {
      await this.octokit.rest.repos.updateBranchProtection({
        owner: repo.owner.login,
        repo: repo.name,
        branch: "main",
        required_status_checks: {
          strict: true,
          contexts: ["build-and-deploy"],
        },
        enforce_admins: false,
        required_pull_request_reviews: null,
        restrictions: null,
        allow_force_pushes: false,
        allow_deletions: false,
      });
    } catch (error) {
      console.warn(
        "Não foi possível configurar branch protection:",
        error.message
      );
    }
  }

  async createSecrets(repo, secrets) {
    const publicKey = await this.octokit.rest.actions.getRepoPublicKey({
      owner: repo.owner.login,
      repo: repo.name,
    });

    for (const [name, value] of Object.entries(secrets)) {
      const encryptedValue = await this.encryptSecret(
        value,
        publicKey.data.key
      );

      await this.octokit.rest.actions.createOrUpdateRepoSecret({
        owner: repo.owner.login,
        repo: repo.name,
        secret_name: name,
        encrypted_value: encryptedValue,
        key_id: publicKey.data.key_id,
      });
    }
  }

  async encryptSecret(value, publicKey) {
    const sodium = require("libsodium-wrappers");
    await sodium.ready;

    const binkey = sodium.from_base64(
      publicKey,
      sodium.base64_variants.ORIGINAL
    );
    const binsec = sodium.from_string(value);
    const encBytes = sodium.crypto_box_seal(binsec, binkey);

    return sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL);
  }
}

export { GitManager };
```

---

## 🌐 Fase 4: Netlify Integration

### Arquivo: `dashboard/lib/deployment/netlify-manager.js`

```javascript
import fetch from "node-fetch";
import FormData from "form-data";

class NetlifyManager {
  constructor(netlifyToken) {
    this.token = netlifyToken;
    this.baseUrl = "https://api.netlify.com/api/v1";
  }

  async createSite(workspace, repoData) {
    const siteConfig = {
      name: `${workspace.slug}-site`,
      repo: {
        provider: "github",
        repo: repoData.full_name,
        branch: "main",
        dir: "/",
        cmd: "npm run build",
        env: {
          NODE_VERSION: "20",
          GATSBY_API_URL: process.env.NEXT_PUBLIC_APP_URL,
          GATSBY_API_KEY: workspace.apiKey,
          GATSBY_SITE_URL: `https://${workspace.slug}.netlify.app`,
        },
      },
      settings: {
        build_command: "npm run build",
        publish_dir: "public",
        production_branch: "main",
      },
    };

    const response = await this.makeRequest("POST", "/sites", siteConfig);
    return response;
  }

  async updateEnvironmentVariables(siteId, envVars) {
    const promises = Object.entries(envVars).map(([key, value]) =>
      this.makeRequest("PUT", `/sites/${siteId}/env/${key}`, {
        key,
        scopes: ["builds", "functions"],
        values: [
          {
            value,
            context: "all",
          },
        ],
      })
    );

    return Promise.all(promises);
  }

  async triggerBuild(siteId) {
    return this.makeRequest("POST", `/sites/${siteId}/builds`);
  }

  async getBuildStatus(buildId) {
    return this.makeRequest("GET", `/builds/${buildId}`);
  }

  async configureDomain(siteId, domain) {
    return this.makeRequest("POST", `/sites/${siteId}/domains`, {
      domain,
    });
  }

  async enableHTTPS(siteId) {
    return this.makeRequest("POST", `/sites/${siteId}/ssl`);
  }

  async createForm(siteId, formConfig) {
    return this.makeRequest("POST", `/sites/${siteId}/forms`, formConfig);
  }

  async deployFromZip(siteId, zipBuffer) {
    const formData = new FormData();
    formData.append("file", zipBuffer, {
      filename: "deploy.zip",
      contentType: "application/zip",
    });

    const response = await fetch(`${this.baseUrl}/sites/${siteId}/deploys`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(
        `Netlify API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  async makeRequest(method, endpoint, data = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const options = {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Netlify API error: ${response.status} ${error}`);
    }

    return response.json();
  }
}

export { NetlifyManager };
```

---

## 🎛️ Fase 5: Frontend - Interface do Dashboard

### A Experiência do Usuário: Polling em Tempo Real

O processo de deploy é longo e não podemos deixar o usuário com uma tela de "carregando" por 5 minutos. O "Polling em Tempo Real" resolve isso:

1.  **Requisição Inicial:** O frontend envia a requisição para iniciar o deploy.
2.  **Resposta Imediata:** O backend inicia o processo no `deckEngine` e responde **imediatamente**: "Ok, recebi. O ID do seu deploy é `deploy-123`."
3.  **O "Ping" (Polling):** A partir desse momento, a cada 3-5 segundos, o frontend faz uma nova pergunta silenciosa ao backend: "Qual é o status do deploy `deploy-123`?".
4.  **Atualização de Status:** O backend responde com o progresso atual: "Status: `criando_repositorio`", depois "Status: `fazendo_build_na_netlify`", etc.
5.  **Interface Dinâmica:** O frontend recebe essa resposta e atualiza a interface para o usuário em tempo real, mostrando o progresso passo a passo, criando uma experiência transparente e interativa.

### Arquivo: `dashboard/app/dashboard/deploy/page.jsx`

```jsx
"use client";

import { useState, useEffect } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { CheckIcon, XMarkIcon, ClockIcon } from "@heroicons/react/24/outline";

export default function DeployPage() {
  const { currentWorkspace } = useWorkspace();
  const [deployments, setDeployments] = useState([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployConfig, setDeployConfig] = useState({
    githubToken: "",
    netlifyToken: "",
    domain: "",
    enableHTTPS: true,
  });
  const [showConfigModal, setShowConfigModal] = useState(false);

  const handleDeploy = async () => {
    if (!currentWorkspace) return;

    setIsDeploying(true);
    try {
      const response = await fetch("/api/deploy/netlify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-workspace-id": currentWorkspace._id,
        },
        body: JSON.stringify({
          workspaceId: currentWorkspace._id,
          deployConfig,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Adicionar deployment à lista e começar polling
        setDeployments((prev) => [result, ...prev]);
        pollDeployment(result.deploymentId);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      alert(`Erro no deploy: ${error.message}`);
    } finally {
      setIsDeploying(false);
      setShowConfigModal(false);
    }
  };

  const pollDeployment = async (deploymentId) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/deploy/netlify/${deploymentId}`);
        const deployment = await response.json();

        setDeployments((prev) =>
          prev.map((d) => (d.deploymentId === deploymentId ? deployment : d))
        );

        if (["completed", "failed"].includes(deployment.status)) {
          return; // Para o polling
        }

        setTimeout(poll, 3000); // Poll a cada 3 segundos
      } catch (error) {
        console.error("Erro no polling:", error);
      }
    };

    poll();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckIcon className="w-5 h-5 text-green-500" />;
      case "failed":
        return <XMarkIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-yellow-500 animate-spin" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "text-green-700 bg-green-100";
      case "failed":
        return "text-red-700 bg-red-100";
      default:
        return "text-yellow-700 bg-yellow-100";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Deploy para Netlify
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Publique seu workspace como um site estático na Netlify
        </p>
      </div>

      {/* Status Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Status do Workspace</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {currentWorkspace?.sectionsCount || 0}
            </div>
            <div className="text-sm text-gray-500">Seções</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {currentWorkspace?.itemsCount || 0}
            </div>
            <div className="text-sm text-gray-500">Itens</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {currentWorkspace?.apiKey ? "✓" : "✗"}
            </div>
            <div className="text-sm text-gray-500">API Key</div>
          </div>
        </div>
      </div>

      {/* Deploy Button */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">Deploy Rápido</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Crie e publique seu site em minutos
            </p>
          </div>
          <Button
            onClick={() => setShowConfigModal(true)}
            disabled={isDeploying}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isDeploying ? "Deployando..." : "Iniciar Deploy"}
          </Button>
        </div>
      </div>

      {/* Deployments History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Histórico de Deploys</h3>
        {deployments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Nenhum deploy realizado ainda
          </p>
        ) : (
          <div className="space-y-4">
            {deployments.map((deployment) => (
              <div
                key={deployment.deploymentId}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(deployment.status)}
                    <div>
                      <div className="font-medium">
                        {deployment.deploymentId}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(deployment.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        deployment.status
                      )}`}
                    >
                      {deployment.status}
                    </span>
                    {deployment.siteUrl && (
                      <a
                        href={deployment.siteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Ver Site
                      </a>
                    )}
                  </div>
                </div>
                {deployment.log && (
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded text-sm font-mono">
                    {deployment.log}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Config Modal */}
      {showConfigModal && (
        <Modal
          onClose={() => setShowConfigModal(false)}
          title="Configurar Deploy"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                GitHub Token
              </label>
              <input
                type="password"
                value={deployConfig.githubToken}
                onChange={(e) =>
                  setDeployConfig((prev) => ({
                    ...prev,
                    githubToken: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
              <p className="text-xs text-gray-500 mt-1">
                Token com permissões de repo.{" "}
                <a
                  href="https://github.com/settings/tokens"
                  target="_blank"
                  className="text-blue-600"
                >
                  Criar token
                </a>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Netlify Token
              </label>
              <input
                type="password"
                value={deployConfig.netlifyToken}
                onChange={(e) =>
                  setDeployConfig((prev) => ({
                    ...prev,
                    netlifyToken: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="nfp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
              <p className="text-xs text-gray-500 mt-1">
                Token pessoal do Netlify.{" "}
                <a
                  href="https://app.netlify.com/user/applications#personal-access-tokens"
                  target="_blank"
                  className="text-blue-600"
                >
                  Criar token
                </a>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Domínio Customizado (Opcional)
              </label>
              <input
                type="text"
                value={deployConfig.domain}
                onChange={(e) =>
                  setDeployConfig((prev) => ({
                    ...prev,
                    domain: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="www.meusite.com"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableHTTPS"
                checked={deployConfig.enableHTTPS}
                onChange={(e) =>
                  setDeployConfig((prev) => ({
                    ...prev,
                    enableHTTPS: e.target.checked,
                  }))
                }
                className="mr-2"
              />
              <label htmlFor="enableHTTPS" className="text-sm">
                Ativar HTTPS automaticamente
              </label>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                onClick={handleDeploy}
                disabled={
                  !deployConfig.githubToken || !deployConfig.netlifyToken
                }
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Confirmar Deploy
              </Button>
              <Button
                onClick={() => setShowConfigModal(false)}
                variant="secondary"
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
```

---

## 📊 Fase 6: Monitoramento e Analytics

- **Monitoramento:** É o nosso "painel do carro". Ele nos dá as métricas de alto nível sobre a **saúde do sistema**: Quantos deploys estão ativos? Qual a taxa de sucesso? O tempo médio está aumentando? Ele nos diz **QUE** algo está acontecendo.
- **Observabilidade:** É a nossa "telemetria de motor". Ela nos permite entender o **PORQUÊ** de algo estar acontecendo. Qual etapa específica do deploy está falhando mais? Um usuário específico está tendo mais problemas? Ela nos dá o contexto para depurar e otimizar de forma cirúrgica.

O `DeploymentAnalytics.js` foi projetado para nos dar ambos, garantindo controle total sobre a saúde e a performance da funcionalidade de deploy.

### Arquivo: `dashboard/lib/deployment/deployment-analytics.js`

```javascript
class DeploymentAnalytics {
  constructor() {
    this.metrics = new Map();
  }

  trackDeploymentStart(deploymentId, workspaceId) {
    this.metrics.set(deploymentId, {
      workspaceId,
      startTime: Date.now(),
      phase: "started",
      steps: [],
    });
  }

  trackStep(deploymentId, stepName, duration, success = true, error = null) {
    const metric = this.metrics.get(deploymentId);
    if (metric) {
      metric.steps.push({
        name: stepName,
        duration,
        success,
        error,
        timestamp: Date.now(),
      });
    }
  }

  trackDeploymentEnd(deploymentId, success = true, finalUrl = null) {
    const metric = this.metrics.get(deploymentId);
    if (metric) {
      metric.endTime = Date.now();
      metric.totalDuration = metric.endTime - metric.startTime;
      metric.success = success;
      metric.finalUrl = finalUrl;

      // Salvar no banco para analytics
      this.saveMetrics(deploymentId, metric);
    }
  }

  async saveMetrics(deploymentId, metric) {
    try {
      await db.insertOne("deployment_metrics", {
        deploymentId,
        ...metric,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error("Erro ao salvar métricas:", error);
    }
  }

  async getWorkspaceStats(workspaceId) {
    const metrics = await db.find("deployment_metrics", { workspaceId });

    return {
      totalDeployments: metrics.length,
      successRate: metrics.filter((m) => m.success).length / metrics.length,
      avgDuration:
        metrics.reduce((sum, m) => sum + m.totalDuration, 0) / metrics.length,
      lastDeployment: metrics[metrics.length - 1]?.endTime,
      commonErrors: this.aggregateErrors(metrics),
    };
  }

  aggregateErrors(metrics) {
    const errors = {};
    metrics.forEach((metric) => {
      metric.steps.forEach((step) => {
        if (step.error) {
          errors[step.error] = (errors[step.error] || 0) + 1;
        }
      });
    });

    return Object.entries(errors)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([error, count]) => ({ error, count }));
  }
}

export { DeploymentAnalytics };
```

---

## 🛡️ Considerações de Segurança

### A Importância da Criptografia de Tokens

## Os tokens de API do GitHub e da Netlify são credenciais extremamente sensíveis, como senhas que dão permissão total para gerenciar repositórios e sites. **Nunca devemos armazená-los como texto puro no banco de dados.**

## O `SecurityManager` implementa uma camada de segurança essencial:

--

1.  **Criptografia na Escrita:** Quando o usuário insere um token, nós o criptografamos usando uma chave secreta que existe apenas no ambiente do nosso servidor. O que é salvo no banco é um texto indecifrável.
2.  **Descriptografia em Tempo de Uso:** Quando o `deckEngine` precisa usar o token para uma chamada de API, ele o descriptografa em memória, usa-o imediatamente e o descarta logo em seguida. O token em texto puro nunca é mantido de forma persistente.
3.  **Segurança em Caso de Vazamento:** Essa abordagem garante que, mesmo no pior cenário de um vazamento do banco de dados, os tokens dos usuários permaneceriam seguros e inutilizáveis por um invasor.

### Arquivo: `dashboard/lib/deployment/security-manager.js`

```javascript
import crypto from "crypto";

class SecurityManager {
  constructor() {
    this.encryptionKey = process.env.ENCRYPTION_KEY;
  }

  // Criptografar tokens antes de armazenar
  encryptToken(token) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher("aes-256-cbc", this.encryptionKey);
    let encrypted = cipher.update(token, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
  }

  // Descriptografar tokens
  decryptToken(encryptedToken) {
    const [ivHex, encrypted] = encryptedToken.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipher("aes-256-cbc", this.encryptionKey);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  // Validar permissões de deploy
  async validateDeployPermissions(userId, workspaceId) {
    const workspace = await db.findOne("workspaces", { _id: workspaceId });

    if (!workspace) {
      throw new Error("Workspace não encontrado");
    }

    const isOwner = workspace.ownerId === userId;
    const isAdmin = workspace.members?.some(
      (member) => member.userId === userId && member.role === "admin"
    );

    if (!isOwner && !isAdmin) {
      throw new Error("Sem permissão para deploy");
    }

    return true;
  }

  // Rate limiting para deploys
  async checkRateLimit(userId) {
    const oneHour = 60 * 60 * 1000;
    const recentDeploys = await db.find("deployments", {
      userId,
      createdAt: { $gte: new Date(Date.now() - oneHour) },
    });

    if (recentDeploys.length >= 5) {
      throw new Error("Limite de deploys por hora excedido (5)");
    }

    return true;
  }

  // Sanitizar nomes de repositório
  sanitizeRepoName(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 100);
  }

  // Validar tokens
  validateGitHubToken(token) {
    return token && token.startsWith("ghp_") && token.length >= 40;
  }

  validateNetlifyToken(token) {
    return token && token.startsWith("nfp_") && token.length >= 40;
  }
}

export { SecurityManager };
```

---

## 🔄 Fase 7: Sistema de Templates Avançado

### Arquivo: `dashboard/lib/deployment/template-system.js`

```javascript
class TemplateSystem {
  constructor() {
    this.templates = new Map();
    this.loadTemplates();
  }

  loadTemplates() {
    // Gatsby Template (Padrão)
    this.templates.set("gatsby", {
      name: "Gatsby Static Site",
      description: "Site estático rápido e otimizado para SEO",
      framework: "gatsby",
      buildCommand: "npm run build",
      outputDir: "public",
      nodeVersion: "20",
      dependencies: {
        gatsby: "^5.14.1",
        react: "^18.2.0",
        "react-dom": "^18.2.0",
        "node-fetch": "^2.7.0",
      },
    });

    // Next.js Template (Futuro)
    this.templates.set("nextjs", {
      name: "Next.js Static Export",
      description: "Site estático com Next.js e export estático",
      framework: "nextjs",
      buildCommand: "npm run build && npm run export",
      outputDir: "out",
      nodeVersion: "20",
      dependencies: {
        next: "^14.0.0",
        react: "^18.2.0",
        "react-dom": "^18.2.0",
      },
    });

    // Nuxt Template (Futuro)
    this.templates.set("nuxt", {
      name: "Nuxt.js Static Generation",
      description: "Site estático com Nuxt.js para Vue.js",
      framework: "nuxt",
      buildCommand: "npm run generate",
      outputDir: "dist",
      nodeVersion: "20",
      dependencies: {
        nuxt: "^3.8.0",
        vue: "^3.3.0",
      },
    });
  }

  getTemplate(templateId) {
    return this.templates.get(templateId);
  }

  getAvailableTemplates() {
    return Array.from(this.templates.entries()).map(([id, template]) => ({
      id,
      ...template,
    }));
  }

  generateTemplateFiles(templateId, workspace, config = {}) {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} não encontrado`);
    }

    switch (template.framework) {
      case "gatsby":
        return this.generateGatsbyTemplate(workspace, config);
      case "nextjs":
        return this.generateNextJSTemplate(workspace, config);
      case "nuxt":
        return this.generateNuxtTemplate(workspace, config);
      default:
        throw new Error(`Framework ${template.framework} não suportado`);
    }
  }

  generateGatsbyTemplate(workspace, config) {
    // Implementação existente do TemplateGenerator
    const generator = new TemplateGenerator(workspace);
    return generator.generateGatsbyTemplate();
  }

  generateNextJSTemplate(workspace, config) {
    // Futuro: Implementar template Next.js
    const templateFiles = new Map();

    templateFiles.set(
      "package.json",
      JSON.stringify(
        {
          name: `${workspace.slug}-site`,
          scripts: {
            build: "next build",
            export: "next export",
            start: "next start",
          },
          dependencies: {
            next: "^14.0.0",
            react: "^18.2.0",
            "react-dom": "^18.2.0",
          },
        },
        null,
        2
      )
    );

    templateFiles.set(
      "next.config.js",
      `
module.exports = {
  output: 'export',
  images: {
    unoptimized: true
  },
  env: {
    API_URL: process.env.API_URL,
    API_KEY: process.env.API_KEY
  }
};
    `
    );

    // ... mais arquivos do Next.js

    return templateFiles;
  }

  generateNuxtTemplate(workspace, config) {
    // Futuro: Implementar template Nuxt
    const templateFiles = new Map();

    // ... implementar Nuxt template

    return templateFiles;
  }
}

export { TemplateSystem };
```

---

## 📈 Fase 8: Dashboard Analytics e Relatórios

### Arquivo: `dashboard/app/dashboard/deploy/analytics/page.jsx`

```jsx
"use client";

import { useState, useEffect } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function DeployAnalyticsPage() {
  const { currentWorkspace } = useWorkspace();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentWorkspace) {
      loadAnalytics();
    }
  }, [currentWorkspace]);

  const loadAnalytics = async () => {
    try {
      const response = await fetch(
        `/api/deploy/analytics/${currentWorkspace._id}`
      );
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Erro ao carregar analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels:
      analytics?.deploymentHistory?.map((d) =>
        new Date(d.date).toLocaleDateString()
      ) || [],
    datasets: [
      {
        label: "Deploys por Dia",
        data: analytics?.deploymentHistory?.map((d) => d.count) || [],
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Histórico de Deploys",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Analytics de Deploy
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Métricas e insights sobre seus deployments
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="text-2xl font-bold text-blue-600">
            {analytics?.totalDeployments || 0}
          </div>
          <div className="text-sm text-gray-500">Total de Deploys</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="text-2xl font-bold text-green-600">
            {((analytics?.successRate || 0) * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-500">Taxa de Sucesso</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="text-2xl font-bold text-purple-600">
            {Math.round(analytics?.avgDuration / 1000 || 0)}s
          </div>
          <div className="text-sm text-gray-500">Tempo Médio</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="text-2xl font-bold text-orange-600">
            {analytics?.sitesCount || 0}
          </div>
          <div className="text-sm text-gray-500">Sites Ativos</div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* Error Analysis */}
      {analytics?.commonErrors?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Erros Mais Comuns</h3>
          <div className="space-y-3">
            {analytics.commonErrors.map((error, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded"
              >
                <div className="text-sm">{error.error}</div>
                <div className="text-sm font-medium text-red-600">
                  {error.count}x
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Deployments */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Deploys Recentes</h3>
        {analytics?.recentDeployments?.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Nenhum deploy encontrado
          </p>
        ) : (
          <div className="space-y-3">
            {analytics?.recentDeployments?.map((deployment) => (
              <div
                key={deployment.deploymentId}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded"
              >
                <div>
                  <div className="font-medium">{deployment.deploymentId}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(deployment.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      deployment.success
                        ? "text-green-700 bg-green-100"
                        : "text-red-700 bg-red-100"
                    }`}
                  >
                    {deployment.success ? "Sucesso" : "Falha"}
                  </span>
                  <div className="text-sm text-gray-500">
                    {Math.round(deployment.totalDuration / 1000)}s
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 🧪 Fase 8: Testes e Validação

Para um lançamento rápido e seguro (MVP), os testes não são um luxo, são uma ferramenta estratégica. Eles são nossa garantia de que a funcionalidade principal não vai quebrar na mão do primeiro usuário.

- **Testes Unitários:** Verificam as menores peças do sistema. Para o MVP, focaremos apenas nos mais críticos (ex: sanitização de nomes, criptografia).
- **Testes de Integração:** **Estes são os mais importantes para o MVP.** Eles são como uma "vistoria final", garantindo que os componentes principais (`Orchestrator`, `GitManager`, `NetlifyManager`) se comunicam corretamente. Eles pegam bugs de lógica entre as partes do sistema, que são os mais comuns e difíceis de achar manualmente. Um bom conjunto de testes de integração nos dá a confiança para lançar, sabendo que o fluxo principal está sólido.
- **Testes E2E (End-to-End):** Simulam a jornada completa do usuário. Para o MVP, podemos ter um ou dois testes principais para validar o "caminho feliz" (o fluxo de sucesso), garantindo que a experiência do usuário de ponta a ponta está funcional.

### Arquivo: `dashboard/tests/deployment.test.js`

```javascript
import { test, expect } from "@jest/globals";
import { DeploymentOrchestrator } from "../lib/deployment/deploy-orchestrator.js";
import { TemplateGenerator } from "../lib/deployment/template-generator.js";
import { GitManager } from "../lib/deployment/git-manager.js";
import { NetlifyManager } from "../lib/deployment/netlify-manager.js";

// Mock do banco de dados
const mockDb = {
  findOne: jest.fn(),
  insertOne: jest.fn(),
  find: jest.fn(),
};

describe("Deployment System", () => {
  describe("TemplateGenerator", () => {
    test("deve gerar template Gatsby válido", async () => {
      const workspace = {
        _id: "test-workspace",
        name: "Test Workspace",
        slug: "test-workspace",
        description: "Test description",
      };

      const generator = new TemplateGenerator(workspace);
      const templateFiles = await generator.generateGatsbyTemplate();

      expect(templateFiles).toBeInstanceOf(Map);
      expect(templateFiles.has("package.json")).toBe(true);
      expect(templateFiles.has("gatsby-config.js")).toBe(true);
      expect(templateFiles.has("gatsby-node.js")).toBe(true);

      const packageJson = JSON.parse(templateFiles.get("package.json"));
      expect(packageJson.name).toBe("test-workspace-site");
      expect(packageJson.dependencies.gatsby).toBeDefined();
    });

    test("deve gerar configuração de ambiente", () => {
      const workspace = {
        slug: "test-workspace",
        apiKey: "test-api-key",
      };

      const generator = new TemplateGenerator(workspace);
      const envConfig = generator.generateEnvConfig();

      expect(envConfig.production).toContain("GATSBY_API_KEY=test-api-key");
      expect(envConfig.development).toContain(
        "GATSBY_API_URL=http://localhost:3000"
      );
    });
  });

  describe("GitManager", () => {
    test("deve criar repositório com configuração correta", async () => {
      const mockOctokit = {
        rest: {
          repos: {
            create: jest.fn().mockResolvedValue({
              data: {
                full_name: "user/test-repo",
                owner: { login: "user" },
                name: "test-repo",
              },
            }),
          },
          git: {
            createTree: jest
              .fn()
              .mockResolvedValue({ data: { sha: "tree-sha" } }),
            createCommit: jest
              .fn()
              .mockResolvedValue({ data: { sha: "commit-sha" } }),
            createRef: jest.fn().mockResolvedValue({}),
          },
        },
      };

      const gitManager = new GitManager("fake-token");
      gitManager.octokit = mockOctokit;

      const workspace = { slug: "test-workspace", name: "Test Workspace" };
      const templateFiles = new Map([["README.md", "# Test"]]);

      const repo = await gitManager.createRepository(workspace, templateFiles);

      expect(mockOctokit.rest.repos.create).toHaveBeenCalledWith({
        name: "test-workspace-site",
        description:
          "Site estático para Test Workspace - Gerado pelo DashMaster.PRO",
        private: true,
        auto_init: false,
      });
    });
  });

  describe("NetlifyManager", () => {
    test("deve criar site com configuração correta", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            id: "site-id",
            url: "https://test-site.netlify.app",
          }),
      });

      const netlifyManager = new NetlifyManager("fake-token");
      const workspace = { slug: "test-workspace", apiKey: "test-api-key" };
      const repoData = { full_name: "user/test-repo" };

      const site = await netlifyManager.createSite(workspace, repoData);

      expect(fetch).toHaveBeenCalledWith(
        "https://api.netlify.com/api/v1/sites",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer fake-token",
          }),
        })
      );
    });
  });

  describe("DeploymentOrchestrator", () => {
    test("deve executar workflow completo de deploy", async () => {
      const orchestrator = new DeploymentOrchestrator();

      // Mock das dependências
      orchestrator.validateWorkspace = jest.fn().mockResolvedValue({
        workspace: { _id: "test-id", slug: "test" },
        deploymentId: "deploy-123",
      });

      orchestrator.generateTemplate = jest.fn().mockResolvedValue({
        templateFiles: new Map(),
        envConfig: {},
        workflowConfig: "",
      });

      const deployment = await orchestrator.startDeploy({
        workspaceId: "test-id",
        userId: "user-123",
        config: {},
      });

      expect(deployment).toBeDefined();
      expect(deployment.id).toBeDefined();
    });
  });
});

describe("Integração E2E", () => {
  test("deve executar deploy completo (mock)", async () => {
    // Test de integração end-to-end com mocks
    const workspace = {
      _id: "test-workspace",
      name: "Test Workspace",
      slug: "test-workspace",
      apiKey: "test-api-key",
    };

    const deployConfig = {
      githubToken: "ghp_test",
      netlifyToken: "nfp_test",
    };

    // Simular todo o fluxo de deploy
    const orchestrator = new DeploymentOrchestrator();

    // Mock de todas as etapas
    jest
      .spyOn(orchestrator, "validateWorkspace")
      .mockResolvedValue({ workspace });
    jest
      .spyOn(orchestrator, "generateTemplate")
      .mockResolvedValue({ templateFiles: new Map() });
    jest
      .spyOn(orchestrator, "createGitRepository")
      .mockResolvedValue({ repo: { full_name: "test/repo" } });
    jest
      .spyOn(orchestrator, "createNetlifySite")
      .mockResolvedValue({ site: { url: "https://test.netlify.app" } });

    const result = await orchestrator.engine.playMatch("netlify-deploy", {
      workspaceId: workspace._id,
      deployConfig,
    });

    expect(result.state).toBe("VICTORY");
  });
});
```

---

## 📋 Checklist de Implementação

### Fase 1: Backend Core ✅

- [ ] `deploy-orchestrator.js` - Sistema de orquestração deckEngine
- [ ] `/api/deploy/netlify` - Endpoints de deploy
- [ ] `template-generator.js` - Gerador de templates
- [ ] Sistema de schemas para deployments

### Fase 2: Integrações Externas ✅

- [ ] `git-manager.js` - Integração GitHub API
- [ ] `netlify-manager.js` - Integração Netlify API
- [ ] `security-manager.js` - Gestão de tokens e segurança
- [ ] Sistema de rate limiting

### Fase 3: Frontend Dashboard ✅

- [ ] `/dashboard/deploy` - Interface de deploy
- [ ] `/dashboard/deploy/analytics` - Dashboard de métricas
- [ ] Modais de configuração
- [ ] Sistema de polling para status

### Fase 4: Templates e Workflows ✅

- [ ] Template Gatsby base
- [ ] GitHub Actions workflow
- [ ] Configurações Netlify
- [ ] Sistema de variáveis de ambiente

### Fase 5: Monitoramento ✅

- [ ] `deployment-analytics.js` - Sistema de métricas
- [ ] Logs estruturados
- [ ] Alertas de erro
- [ ] Dashboard de performance

### Fase 6: Testes ✅

- [ ] Testes unitários
- [ ] Testes de integração
- [ ] Testes E2E
- [ ] Testes de carga

---

## 🚀 Cronograma de Desenvolvimento

### Semana 1-2: Fundação

- Implementar deckEngine orchestrator
- Criar endpoints básicos de deploy
- Template generator para Gatsby

### Semana 3-4: Integrações

- GitHub API integration
- Netlify API integration
- Sistema de segurança

### Semana 5-6: Frontend

- Interface de deploy no dashboard
- Sistema de polling e status
- Configurações de deploy

### Semana 7-8: Polimento

- Analytics e métricas
- Testes abrangentes
- Documentação
- Deploy em produção

---

## 💡 Expansões Futuras

### Templates Adicionais

- **Next.js Static Export**: Para quem prefere React puro
- **Nuxt.js Generate**: Para ecossistema Vue.js
- **Astro**: Para sites ultra-rápidos
- **SvelteKit**: Para performance máxima

### Integrações Avançadas

- **Vercel Deploy**: Alternativa ao Netlify
- **AWS Amplify**: Para ecossistema AWS
- **GitHub Pages**: Para projetos open source
- **CloudFlare Pages**: Para performance global

### Features Avançadas

- **Preview Deploys**: Deploy automático de branches
- **A/B Testing**: Deploy de múltiplas versões
- **CDN Optimization**: Otimização automática de assets
- **Analytics Integration**: Google Analytics, Hotjar, etc.

---

## 🎯 Conclusão

Este plano detalhado transforma o DashMaster.PRO em uma verdadeira **"fábrica de sites estáticos"**, oferecendo:

1. **Deploy com Um Clique**: Interface simples e intuitiva
2. **Automação Completa**: Zero intervenção manual
3. **Orquestração Robusta**: deckEngine para workflows confiáveis
4. **Escalabilidade**: Suporte a múltiplos workspaces
5. **Observabilidade**: Métricas e analytics completos
6. **Segurança**: Gestão segura de credenciais
7. **Extensibilidade**: Arquitetura preparada para crescer

O resultado será uma experiência de deploy **profissional e automatizada** que coloca o DashMaster.PRO em uma posição única no mercado de Headless CMS, oferecendo não apenas gestão de conteúdo, mas também **publicação automatizada** de sites estáticos de alta performance.
