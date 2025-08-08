import { Octokit } from "@octokit/rest";
import sodium from "libsodium-wrappers";

class GitManager {
  constructor(githubToken) {
    this.octokit = new Octokit({
      auth: githubToken,
      request: {
        timeout: 60000, // Aumentado para 60 segundos
        retries: 3, // Adicionar retries automáticos
      },
    });

    // Aguardar sodium estar pronto
    this.sodiumReady = sodium.ready;
  }

  // Função auxiliar para fazer requisições com retry
  async makeRequestWithRetry(requestFn, maxRetries = 3, delay = 2000) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;

        // Verificar se é um erro de conectividade
        const isConnectionError =
          error.code === "ECONNRESET" ||
          error.code === "ETIMEDOUT" ||
          error.code === "ENOTFOUND" ||
          error.message?.includes("network socket disconnected") ||
          error.message?.includes("fetch failed");

        if (isConnectionError && attempt < maxRetries) {
          console.log(
            `🔄 Tentativa ${attempt} falhou, tentando novamente em ${delay}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 1.5; // Backoff exponencial
          continue;
        }

        throw error;
      }
    }

    throw lastError;
  }

  async createOrUpdateRepository(workspace, templateFiles) {
    const repoName = `${workspace.slug}-site`;

    try {
      // Tentar criar o repositório
      const repo = await this.createRepository(repoName, workspace.name);
      return repo;
    } catch (error) {
      if (error.status === 422) {
        // Repositório já existe - fazer update
        console.log(`Repositório ${repoName} já existe, fazendo update...`);

        const { data: user } = await this.octokit.rest.users.getAuthenticated();
        const { data: repo } = await this.octokit.rest.repos.get({
          owner: user.login,
          repo: repoName,
        });

        return repo;
      }
      throw error;
    }
  }

  async createRepository(repoName, workspaceName) {
    try {
      const { data: repo } =
        await this.octokit.rest.repos.createForAuthenticatedUser({
          name: repoName,
          description: `Site estático para ${workspaceName} - Gerado pelo DashMaster.PRO`,
          private: true, // Garantir que o repositório seja sempre privado
          auto_init: true,
        });

      return repo;
    } catch (error) {
      console.error("Erro ao criar repositório:", error);
      throw error;
    }
  }

  async commitFiles(repo, templateFiles) {
    console.log(`Fazendo commit de ${templateFiles.size} arquivos...`);
    const owner = repo.owner.login;
    const repoName = repo.name;

    try {
      for (const [filePath, fileContent] of templateFiles.entries()) {
        try {
          // Tentar obter o arquivo para ver se ele já existe
          const { data: existingFile } = await this.makeRequestWithRetry(() =>
            this.octokit.rest.repos.getContent({
              owner,
              repo: repoName,
              path: filePath,
            })
          );

          // Se existir, atualizar
          await this.makeRequestWithRetry(() =>
            this.octokit.rest.repos.createOrUpdateFileContents({
              owner,
              repo: repoName,
              path: filePath,
              message: `Update ${filePath}`,
              content: Buffer.from(fileContent).toString("base64"),
              sha: existingFile.sha,
            })
          );
          console.log(`✅ Arquivo atualizado: ${filePath}`);
        } catch (error) {
          if (error.status === 404) {
            // Se não existir, criar
            await this.makeRequestWithRetry(() =>
              this.octokit.rest.repos.createOrUpdateFileContents({
                owner,
                repo: repoName,
                path: filePath,
                message: `Create ${filePath}`,
                content: Buffer.from(fileContent).toString("base64"),
              })
            );
            console.log(`✅ Arquivo criado: ${filePath}`);
          } else {
            throw error; // Lançar outros erros
          }
        }

        // Pequena pausa entre commits para evitar rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error("Erro ao fazer commit dos arquivos:", error);
      throw error;
    }
  }

  async createSecrets(repo, secrets) {
    console.log(`Criando ${Object.keys(secrets).length} secrets...`);

    try {
      // Aguardar sodium estar pronto
      await this.sodiumReady;

      // Obter chave pública do repositório
      const { data: publicKey } = await this.makeRequestWithRetry(() =>
        this.octokit.rest.actions.getRepoPublicKey({
          owner: repo.owner.login,
          repo: repo.name,
        })
      );

      // Criar cada secret
      for (const [name, value] of Object.entries(secrets)) {
        if (!value || value === "PLACEHOLDER_SITE_ID") {
          console.log(`⏭️ Pulando secret ${name} (valor vazio ou placeholder)`);
          continue;
        }

        // DEBUG: Log especial para GATSBY_API_KEY
        if (name === "GATSBY_API_KEY") {
          console.log(
            `🔑 DEBUG: Criando secret GATSBY_API_KEY com valor: ${value.substring(
              0,
              12
            )}...`
          );
        }

        const encryptedValue = this.encryptSecret(value, publicKey.key);

        // Usar retry logic para criar o secret
        await this.makeRequestWithRetry(() =>
          this.octokit.rest.actions.createOrUpdateRepoSecret({
            owner: repo.owner.login,
            repo: repo.name,
            secret_name: name,
            encrypted_value: encryptedValue,
            key_id: publicKey.key_id,
          })
        );

        console.log(`✅ Secret ${name} criado`);

        // Pequena pausa entre secrets para evitar rate limiting
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    } catch (error) {
      console.error("Erro ao criar secrets:", error);
      throw error;
    }
  }

  encryptSecret(value, publicKey) {
    // Converter chave pública de base64
    const binkey = sodium.from_base64(
      publicKey,
      sodium.base64_variants.ORIGINAL
    );

    // Converter valor para binário
    const binsec = sodium.from_string(value);

    // Criptografar usando sealed box
    const encBytes = sodium.crypto_box_seal(binsec, binkey);

    // Retornar como base64
    return sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL);
  }

  async triggerWorkflow(repo, workflowFileName, inputs) {
    console.log(`Disparando workflow ${workflowFileName}...`);

    try {
      await this.makeRequestWithRetry(() =>
        this.octokit.rest.actions.createWorkflowDispatch({
          owner: repo.owner.login,
          repo: repo.name,
          workflow_id: workflowFileName,
          ref: repo.default_branch, // Usar a branch padrão do repositório
          inputs,
        })
      );

      console.log(`✅ Workflow ${workflowFileName} disparado`);
    } catch (error) {
      console.error("Erro ao disparar workflow:", error);
      throw error;
    }
  }

  getOwner() {
    // Assumir que o token é do próprio usuário
    // Isso pode ser melhorado para suportar organizações
    return this.octokit.auth.token.split("_")[0]; // Simplificação
  }

  async deleteRepository(repositoryName) {
    try {
      const { data: user } = await this.octokit.rest.users.getAuthenticated();

      // repositoryName pode vir como "owner/repo" ou apenas "repo"
      let owner, repo;
      if (repositoryName.includes("/")) {
        [owner, repo] = repositoryName.split("/");
      } else {
        owner = user.login;
        repo = repositoryName;
      }

      await this.octokit.rest.repos.delete({
        owner: owner,
        repo: repo,
      });

      console.log(`✅ Repositório ${owner}/${repo} deletado com sucesso`);
      return true;
    } catch (error) {
      console.error(
        `❌ Erro ao deletar repositório ${repositoryName}:`,
        error.message || error
      );
      throw error;
    }
  }
}

export { GitManager };
