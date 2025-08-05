import { DeckEngineApp } from "../../../deckEngine/core/index.js";
import { PlatformAdapter } from "../../../deckEngine/core/platform/platform-adapter.js";
import { TemplateGenerator } from "./template-generator.js";
import { GitManager } from "./git-manager.js";
import { NetlifyManager } from "./netlify-manager.js";
import { SecurityManager } from "./security-manager.js";

import { ObjectId } from "mongodb";
import { getCollection, db } from "../db.js";

class DeploymentOrchestrator {
  constructor() {
    this.engine = new DeckEngineApp({
      platform: "node",
      logging: ["console", "database"],
      concurrencyLimit: 3,
    });

    this.setupDeploymentDecks();
  }

  setupDeploymentDecks() {
    // Deck principal de deploy com GitHub Actions
    this.engine.createDeck("netlify-deploy", {
      cards: [
        this.validateRequest,
        this.createApiKey, // NOVO: Criar API Key primeiro
        this.setupRepositoryStructure,
        this.createOrFindRepository,
        this.createOrUpdateSecrets,
        this.addGitHubWorkflow,
        this.createNetlifySite,
        this.triggerWorkflow,
        this.markDispatchAsSuccessful, // Renomeado de notifyUserSuccess
      ],
      timeout: 600000, // 10 minutos
      retries: 1,
      onFailure: this.notifyUserFailure,
    });
  }

  // --- CARTAS DO DECK DE DEPLOY ---

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

      // Armazenar a API key no contexto para usar depois
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
      console.error(
        `[${context.deploymentId}] ❌ Erro em createApiKey:`,
        error
      );
      throw error;
    }
  };

  validateRequest = async (context) => {
    const { workspaceId, userId, deployConfig, deploymentId } = context.payload;
    context.deploymentId = deploymentId;

    console.log(`[${deploymentId}] 1. Validando requisição...`);

    const securityManager = new SecurityManager();
    await securityManager.validateDeployPermissions(userId, workspaceId);
    await securityManager.checkRateLimit(userId);

    if (
      !securityManager.validateGitHubToken(deployConfig.githubToken) ||
      !securityManager.validateNetlifyToken(deployConfig.netlifyToken)
    ) {
      throw new Error("Tokens de API inválidos.");
    }

    // Buscar o workspace
    const workspacesCollection = await getCollection("workspaces");
    const workspaceData = await workspacesCollection
      .find({ _id: new ObjectId(workspaceId) })
      .toArray();

    if (!workspaceData || workspaceData.length === 0) {
      throw new Error("Workspace não encontrado.");
    }
    const workspace = workspaceData[0];

    context.workspace = workspace;

    await this.logStatus(deploymentId, "iniciado", { step: "validateRequest" });
    console.log(`[${deploymentId}] ✅ Validação concluída.`);
    return context;
  };

  createOrFindRepository = async (context) => {
    console.log(
      `[${context.deploymentId}] 4. Criando/Encontrando repositório Git...`
    );

    try {
      const { deployConfig } = context.payload;
      const gitManager = new GitManager(deployConfig.githubToken);

      // Criar um novo repositório privado para o workspace
      const repoName = `${context.workspace.slug}-site`;
      const repo = await gitManager.createOrUpdateRepository(context.workspace);

      context.repo = repo;

      await this.logStatus(context.deploymentId, "progresso", {
        step: "createOrFindRepository",
        repoUrl: repo.html_url,
      });

      console.log(
        `[${context.deploymentId}] ✅ Repositório criado: ${repo.html_url}`
      );
      return context;
    } catch (error) {
      console.error(
        `[${context.deploymentId}] ❌ Erro em createOrFindRepository:`,
        error
      );
      throw error;
    }
  };

  setupRepositoryStructure = async (context) => {
    console.log(
      `[${context.deploymentId}] 3. Configurando estrutura do repositório...`
    );

    try {
      const { deployConfig } = context.payload;

      // Preparar estrutura vazia inicial (NÃO clona código por padrão)
      const initialFiles = new Map();

      // README inicial
      initialFiles.set(
        "README.md",
        `# ${context.workspace.name} - Site\n\n` +
          `Site gerado pelo DashMaster.PRO\n\n` +
          `- **Workspace:** ${context.workspace.name}\n` +
          `- **Criado em:** ${new Date().toISOString()}\n\n` +
          `## Estrutura\n\n` +
          `Após o primeiro deploy, este repositório conterá:\n` +
          `- \`website/\` - Arquivos estáticos do site\n` +
          `- \`content/\` - Backup do conteúdo (opcional)\n` +
          `- \`source/\` - Código fonte do template (opcional)\n`
      );

      // .gitignore
      initialFiles.set(
        ".gitignore",
        `node_modules/\npublic/\n.cache/\n.env*\n*.log\n`
      );

      // netlify.toml para configurar a branch de produção
      const netlifyTomlContent = `
[build]
  command = "npm run build"
  publish = "public"

[context.production]
  branch = "master"
`.trim();

      initialFiles.set("netlify.toml", netlifyTomlContent);

      context.initialFiles = initialFiles;

      console.log(`[${context.deploymentId}] ✅ Estrutura preparada`);
      return context;
    } catch (error) {
      console.error(
        `[${context.deploymentId}] ❌ Erro em setupRepositoryStructure:`,
        error
      );
      throw error;
    }
  };

  createOrUpdateSecrets = async (context) => {
    console.log(
      `[${context.deploymentId}] 5. Configurando secrets do repositório...`
    );

    try {
      const { deployConfig } = context.payload;
      const gitManager = new GitManager(deployConfig.githubToken);

      // DEBUG: Verificar se a API Key está no contexto
      console.log(
        `[${context.deploymentId}] 🔍 DEBUG: context.apiKey =`,
        context.apiKey ? `${context.apiKey.substring(0, 12)}...` : "UNDEFINED"
      );

      const secrets = {
        GATSBY_API_URL: `${
          process.env.NEXT_PUBLIC_APP_URL || "https://dashmaster.pro"
        }/api/public/content`,
        GATSBY_API_KEY: context.apiKey || "PLACEHOLDER_API_KEY",
        GATSBY_SITE_URL: `https://${context.workspace.slug}.netlify.app`, // Será atualizado após criar site
        NETLIFY_AUTH_TOKEN: deployConfig.netlifyToken,
        NETLIFY_SITE_ID: "PLACEHOLDER_SITE_ID", // Será atualizado após criar o site
        WEBHOOK_SECRET: "webhook-secret-placeholder",
        WEBHOOK_URL: `${process.env.APP_PUBLIC_URL}/api/deploy/webhook`,
      };

      await gitManager.createSecrets(context.repo, secrets);

      context.secrets = secrets;

      await this.logStatus(context.deploymentId, "progresso", {
        step: "createOrUpdateSecrets",
      });

      console.log(`[${context.deploymentId}] ✅ Secrets configurados`);
      return context;
    } catch (error) {
      console.error(
        `[${context.deploymentId}] ❌ Erro em createOrUpdateSecrets:`,
        error
      );
      throw error;
    }
  };

  addGitHubWorkflow = async (context) => {
    console.log(
      `[${context.deploymentId}] 6. Adicionando GitHub Action workflow...`
    );

    try {
      const { deployConfig } = context.payload;
      const gitManager = new GitManager(deployConfig.githubToken);

      // Template inline para evitar erro ENOENT em produção
      const workflowContent = `name: Deploy DashMaster.PRO Site to Netlify

on:
  workflow_dispatch:
    inputs:
      workspace_id:
        description: "DashMaster.PRO Workspace ID"
        required: true
      deploy_id:
        description: "DashMaster.PRO Deploy ID"
        required: true
      site_name:
        description: "Netlify Site Name"
        required: true
      template_repo:
        description: "Template Repository URL"
        required: true
        default: "https://github.com/milton-bolonha/dashmaster-gatsby-template"
      save_source_code:
        description: "Save template source code to repository"
        required: false
        default: "false"
      save_content_backup:
        description: "Save content as static files backup"
        required: false
        default: "true"
      webhook_url:
        description: "URL to send status updates"
        required: true
      webhook_secret:
        description: "Secret to authenticate webhook calls"
        required: true

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Clone Template for Build
        run: |
          # Clona o template em um subdiretório para build
          mkdir build_dir
          git clone \${{ github.event.inputs.template_repo }} build_dir
          cd build_dir
          
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: 'build_dir/package-lock.json' # Aponta para o local correto

      - name: Install Dependencies
        run: |
          cd build_dir
          npm ci

      - name: Send Starting Status
        run: >
          curl -X POST -H "Authorization: Bearer \${{ github.event.inputs.webhook_secret }}" -H "Content-Type: application/json"
          -d '{"status": "iniciado", "run_id": "\${{ github.run_id }}", "deploy_id": "\${{ github.event.inputs.deploy_id }}", "step": "setup", "message": "Iniciando o processo de deploy..."}'
          "\${{ github.event.inputs.webhook_url }}"

      - name: Build Gatsby Site
        run: |
          cd build_dir
          curl -X POST -H "Authorization: Bearer \${{ github.event.inputs.webhook_secret }}" -H "Content-Type: application/json" -d '{"status": "progresso", "run_id": "\${{ github.run_id }}", "deploy_id": "\${{ github.event.inputs.deploy_id }}", "step": "build", "message": "Construindo o site Gatsby..."}' "\${{ github.event.inputs.webhook_url }}"
          npm run build
        env:
          GATSBY_API_URL: https://dashmaster.pro/api/public/content
          GATSBY_API_KEY: \${{ secrets.GATSBY_API_KEY }}
          GATSBY_SITE_URL: https://\${{ github.event.inputs.site_name }}.netlify.app
          NETLIFY_SITE_ID: \${{ secrets.NETLIFY_SITE_ID }}
          NETLIFY_AUTH_TOKEN: \${{ secrets.NETLIFY_AUTH_TOKEN }}

      - name: Prepare Repository Structure
        run: |
          # Move os arquivos buildados para a raiz
          mv build_dir/public/* ./website/
          
          # Copia o backup e o source code se solicitado
          if [ "\${{ github.event.inputs.save_content_backup }}" = "true" ]; then
            curl -H "Authorization: Bearer \${{ secrets.GATSBY_API_KEY }}" "https://dashmaster.pro/api/public/content" -o ./content/backup.json
          fi
          if [ "\${{ github.event.inputs.save_source_code }}" = "true" ]; then
            mv build_dir/src ./source/
            mv build_dir/gatsby-*.js ./source/
            mv build_dir/package.json ./source/
          fi
          
          # Limpa o diretório de build
          rm -rf build_dir
          
          # Cria o README na raiz
          cat > README.md << EOF
          # Site gerado pelo DashMaster.PRO
          ...
          EOF


      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v2
        with:
          publish-dir: "./website"
          production-branch: master
        env:
          NETLIFY_SITE_ID: \${{ secrets.NETLIFY_SITE_ID }}
          NETLIFY_AUTH_TOKEN: \${{ secrets.NETLIFY_AUTH_TOKEN }}

      - name: Send Success Status
        if: success()
        run: >
          curl -X POST -H "Authorization: Bearer \${{ github.event.inputs.webhook_secret }}" -H "Content-Type: application/json"
          -d '{"status": "concluido", "run_id": "\${{ github.run_id }}", "deploy_id": "\${{ github.event.inputs.deploy_id }}", "message": "Deploy finalizado com sucesso! 🎉"}'
          "\${{ github.event.inputs.webhook_url }}"

      - name: Send Failure Status
        if: failure()
        run: >
          curl -X POST -H "Authorization: Bearer \${{ github.event.inputs.webhook_secret }}" -H "Content-Type: application/json"
          -d '{"status": "falhou", "run_id": "\${{ github.run_id }}", "deploy_id": "\${{ github.event.inputs.deploy_id }}", "message": "Ocorreu um erro durante o deploy. Verifique os logs da Action para mais detalhes."}'
          "\${{ github.event.inputs.webhook_url }}"

      - name: Commit Repository Structure
        run: |
          if [ -d ".git" ]; then
            git config --local user.email "action@github.com"
            git config --local user.name "GitHub Action"
            git add .
            git commit -m "Deploy: Site estático gerado pelo DashMaster.PRO" || exit 0
            git push
          else
            echo "Não é um repositório git, pulando commit..."
          fi`;

      // Adicionar o workflow e arquivos iniciais ao repositório
      const allFiles = new Map([
        ...context.initialFiles.entries(),
        [".github/workflows/deploy.yml", workflowContent],
      ]);

      await gitManager.commitFiles(context.repo, allFiles);

      console.log(`[${context.deploymentId}] ✅ Workflow adicionado`);
      return context;
    } catch (error) {
      console.error(
        `[${context.deploymentId}] ❌ Erro em addGitHubWorkflow:`,
        error
      );
      // Logar a falha e parar a execução
      await this.notifyUserFailure(context, error);
      throw error;
    }
  };

  createNetlifySite = async (context) => {
    console.log(`[${context.deploymentId}] 7. Criando site na Netlify...`);

    try {
      const { deployConfig } = context.payload;
      const netlifyManager = new NetlifyManager(deployConfig.netlifyToken);

      // Verificar se o workspace já tem um site Netlify configurado
      let site;
      if (context.workspace.netlifyDeployment) {
        console.log(
          `[${context.deploymentId}] ℹ️ Workspace já possui site Netlify: ${context.workspace.netlifyDeployment.siteId}`
        );

        // Tentar reutilizar o site existente
        try {
          site = await netlifyManager.getSite(
            context.workspace.netlifyDeployment.siteId
          );
          console.log(
            `[${context.deploymentId}] ✅ Reutilizando site existente: ${site.name}`
          );
        } catch (error) {
          console.log(
            `[${context.deploymentId}] ⚠️ Site existente não encontrado, criando novo...`
          );
          site = await netlifyManager.createSite(
            context.workspace,
            context.repo
          );
        }
      } else {
        // Primeira vez - criar novo site
        site = await netlifyManager.createSite(context.workspace, context.repo);

        // Salvar informações de deploy no workspace
        const workspacesCollection = await getCollection("workspaces");
        await workspacesCollection.updateOne(
          { _id: context.workspace._id },
          {
            $set: {
              netlifyDeployment: {
                siteId: site.id,
                siteName: site.name,
                siteUrl: site.url,
                repoUrl: context.repo.html_url,
                createdAt: new Date(),
              },
              updatedAt: new Date(),
            },
          }
        );
        console.log(
          `[${context.deploymentId}] 💾 Informações de deploy salvas no workspace`
        );
      }

      context.site = site;

      // Atualizar secrets com dados reais do site
      const gitManager = new GitManager(deployConfig.githubToken);
      await gitManager.createSecrets(context.repo, {
        NETLIFY_SITE_ID: site.id,
        GATSBY_SITE_URL: site.url, // URL real retornado pela Netlify
      });
      console.log(
        `[${context.deploymentId}] 🔄 Secrets atualizados: NETLIFY_SITE_ID=${site.id}, GATSBY_SITE_URL=${site.url}`
      );

      await this.logStatus(context.deploymentId, "progresso", {
        step: "createNetlifySite",
        siteUrl: site.url,
      });

      console.log(
        `[${context.deploymentId}] ✅ Site Netlify configurado: ${site.url}`
      );
      return context;
    } catch (error) {
      console.error(
        `[${context.deploymentId}] ❌ Erro em createNetlifySite:`,
        error
      );
      throw error;
    }
  };

  triggerWorkflow = async (context) => {
    console.log(`[${context.deploymentId}] 8. Disparando GitHub Action...`);

    try {
      const { deployConfig } = context.payload;
      const gitManager = new GitManager(deployConfig.githubToken);

      // Montar a URL do webhook
      const webhookUrl = `${process.env.APP_PUBLIC_URL}/api/deploy/webhook`;

      // Disparar o workflow via workflow_dispatch
      const workflowInputs = {
        workspace_id: context.workspace._id.toString(),
        deploy_id: context.deploymentId, // Passar o ID do nosso deploy
        site_name: context.site?.name || context.workspace.slug, // Usar nome real do site se disponível
        template_repo:
          context.payload.deployConfig.customRepoUrl ||
          "https://github.com/milton-bolonha/dashmaster-gatsby-template",
        save_source_code: "false", // MVP
        save_content_backup: "true", // MVP
        webhook_url: webhookUrl, // Passa a URL para a Action
        webhook_secret: context.secrets.WEBHOOK_SECRET, // Passa o secret
      };

      await gitManager.triggerWorkflow(
        context.repo,
        "deploy.yml",
        workflowInputs
      );

      await this.logStatus(context.deploymentId, "progresso", {
        step: "triggerWorkflow",
        workflowInputs,
      });

      console.log(`[${context.deploymentId}] ✅ GitHub Action disparada`);
      return context;
    } catch (error) {
      console.error(
        `[${context.deploymentId}] ❌ Erro em triggerWorkflow:`,
        error
      );
      await this.notifyUserFailure(context, error);
      throw error;
    }
  };

  markDispatchAsSuccessful = async (context) => {
    console.log(
      `[${context.deploymentId}] 9. Notificando sucesso do disparo...`
    );

    try {
      await this.logStatus(context.deploymentId, "progresso", {
        step: "dispatchSuccessful",
        repoUrl: context.repo.html_url,
        siteUrl: context.site.url,
        message: "Ação do GitHub disparada. Aguardando resultado do webhook...",
      });

      console.log(
        `[${context.deploymentId}] 🎉 Ação do GitHub disparada com sucesso!`
      );
      return context;
    } catch (error) {
      console.error(
        `[${context.deploymentId}] ❌ Erro ao notificar sucesso do disparo:`,
        error
      );
      // Mesmo que esta etapa falhe, não queremos que o deploy inteiro falhe.
      // O importante é que a Action foi disparada.
      return context;
    }
  };

  notifyUserFailure = async (context, error) => {
    console.log(`[${context.deploymentId}] ❌ Notificando falha...`);

    try {
      await this.logStatus(context.deploymentId, "falhou", {
        step: "notifyUserFailure",
        error: error.message,
        message: `Deploy falhou: ${error.message}`,
      });

      console.log(
        `[${context.deploymentId}] ❌ Deploy falhou: ${error.message}`
      );
    } catch (logError) {
      console.error(
        `[${context.deploymentId}] ❌ Erro ao logar falha:`,
        logError
      );
    }
  };

  async logStatus(deploymentId, status, details = {}) {
    try {
      const deploymentsCollection = await getCollection("deployments");

      const updateData = {
        $set: {
          status,
          updatedAt: new Date(),
          workspaceId: this.workspaceId, // Garantir que o workspaceId seja sempre salvo
          userId: this.userId, // Garantir que o userId seja sempre salvo
          ...details,
        },
      };

      // Se é o primeiro status (iniciado), definir createdAt
      if (status === "iniciado") {
        updateData.$setOnInsert = {
          createdAt: new Date(),
        };
      }

      await deploymentsCollection.updateOne({ _id: deploymentId }, updateData, {
        upsert: true,
      });

      console.log(`[${deploymentId}] 📊 Status atualizado: ${status}`);
    } catch (err) {
      console.error(`Falha ao logar status do deploy ${deploymentId}:`, err);
    }
  }

  async startDeploy(payload) {
    this.workspaceId = payload.workspaceId;
    this.userId = payload.userId;

    // 1. Criar o ID antes de iniciar o processo
    const deploymentId = `deploy_${Date.now()}_${payload.workspaceId.slice(
      -4
    )}`;

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
}

export { DeploymentOrchestrator };
