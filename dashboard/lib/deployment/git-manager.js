import { Octokit } from "@octokit/rest";
import sodium from "libsodium-wrappers";

class GitManager {
  constructor(githubToken) {
    this.octokit = new Octokit({
      auth: githubToken,
    });

    // Aguardar sodium estar pronto
    this.sodiumReady = sodium.ready;
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
          const { data: existingFile } =
            await this.octokit.rest.repos.getContent({
              owner,
              repo: repoName,
              path: filePath,
            });

          // Se existir, atualizar
          await this.octokit.rest.repos.createOrUpdateFileContents({
            owner,
            repo: repoName,
            path: filePath,
            message: `Update ${filePath}`,
            content: Buffer.from(fileContent).toString("base64"),
            sha: existingFile.sha,
          });
          console.log(`✅ Arquivo atualizado: ${filePath}`);
        } catch (error) {
          if (error.status === 404) {
            // Se não existir, criar
            await this.octokit.rest.repos.createOrUpdateFileContents({
              owner,
              repo: repoName,
              path: filePath,
              message: `Create ${filePath}`,
              content: Buffer.from(fileContent).toString("base64"),
            });
            console.log(`✅ Arquivo criado: ${filePath}`);
          } else {
            throw error; // Lançar outros erros
          }
        }
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
      const { data: publicKey } =
        await this.octokit.rest.actions.getRepoPublicKey({
          owner: repo.owner.login,
          repo: repo.name,
        });

      // Criar cada secret
      for (const [name, value] of Object.entries(secrets)) {
        if (!value || value === "PLACEHOLDER_SITE_ID") {
          console.log(`⏭️ Pulando secret ${name} (valor vazio ou placeholder)`);
          continue;
        }

        const encryptedValue = this.encryptSecret(value, publicKey.key);

        await this.octokit.rest.actions.createOrUpdateRepoSecret({
          owner: repo.owner.login,
          repo: repo.name,
          secret_name: name,
          encrypted_value: encryptedValue,
          key_id: publicKey.key_id,
        });

        console.log(`✅ Secret ${name} criado`);
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
      await this.octokit.rest.actions.createWorkflowDispatch({
        owner: repo.owner.login,
        repo: repo.name,
        workflow_id: workflowFileName,
        ref: repo.default_branch, // Usar a branch padrão do repositório
        inputs,
      });

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
}

export { GitManager };
