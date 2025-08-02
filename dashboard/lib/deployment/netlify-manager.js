import { NetlifyAPI } from "netlify";

class NetlifyManager {
  constructor(netlifyToken) {
    this.client = new NetlifyAPI(netlifyToken);
  }

  async createSite(workspace, repoData) {
    const siteName = `${workspace.slug}-site-${Math.random()
      .toString(36)
      .substring(2, 8)}`;

    try {
      const site = await this.client.createSite({
        body: {
          name: siteName,
          repo: {
            provider: "github",
            repo: repoData.full_name,
            private: repoData.private,
            branch: repoData.default_branch,
          },
          build_settings: {
            cmd: "npm run build",
            dir: "public",
            provider: "github",
            repo_path: repoData.full_name,
            repo_branch: repoData.default_branch,
          },
        },
      });
      console.log(`Site criado na Netlify: ${site.name} (${site.id})`);
      return site;
    } catch (error) {
      console.error("Erro ao criar site na Netlify:", error.message || error);

      // Se a criação falhar (ex: nome já existe), tentamos encontrar um site vinculado ao repo
      try {
        const sites = await this.client.listSites({
          filter: { repo: repoData.full_name },
        });

        if (sites && sites.length > 0) {
          console.log(
            `Encontrado site existente para o repositório: ${sites[0].name}`
          );
          return sites[0];
        }
      } catch (searchError) {
        console.error(
          "Erro ao tentar buscar site existente:",
          searchError.message || searchError
        );
      }

      throw new Error("Falha ao criar ou encontrar site na Netlify.");
    }
  }

  async getSite(siteId) {
    try {
      const site = await this.client.getSite({ siteId });
      return site;
    } catch (error) {
      console.error(`Erro ao buscar site ${siteId}:`, error.message || error);
      throw error;
    }
  }

  async triggerBuild(siteId) {
    console.log(`Acionando build para o site ${siteId}...`);
    try {
      return await this.client.createSiteBuild({ siteId });
    } catch (error) {
      console.error(
        `Erro ao acionar build para o site ${siteId}:`,
        error.message || error
      );
      throw error;
    }
  }

  async getBuildStatus(buildId) {
    try {
      return await this.client.getSiteBuild({ build_id: buildId });
    } catch (error) {
      console.error(
        `Erro ao obter status do build ${buildId}:`,
        error.message || error
      );
      throw error;
    }
  }
}

export { NetlifyManager };
