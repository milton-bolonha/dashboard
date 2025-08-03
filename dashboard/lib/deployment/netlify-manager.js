class NetlifyManager {
  constructor(netlifyToken) {
    this.token = netlifyToken;
    this.baseUrl = "https://api.netlify.com/api/v1";
  }

  async _fetch(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Netlify API Error (${response.status}): ${error}`);
    }

    return response.json();
  }

  async createSite(workspace, repoData) {
    const siteName = `${workspace.slug}-site-${Math.random()
      .toString(36)
      .substring(2, 8)}`;

    try {
      const site = await this._fetch("/sites", {
        method: "POST",
        body: JSON.stringify({
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
        }),
      });
      console.log(`Site criado na Netlify: ${site.name} (${site.id})`);
      return site;
    } catch (error) {
      console.error("Erro ao criar site na Netlify:", error.message || error);

      // Se a criação falhar (ex: nome já existe), tentamos encontrar um site vinculado ao repo
      try {
        const sites = await this._fetch(
          `/sites?repo=${encodeURIComponent(repoData.full_name)}`
        );

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
      const site = await this._fetch(`/sites/${siteId}`);
      return site;
    } catch (error) {
      console.error(`Erro ao buscar site ${siteId}:`, error.message || error);
      throw error;
    }
  }

  async triggerBuild(siteId) {
    console.log(`Acionando build para o site ${siteId}...`);
    try {
      return await this._fetch(`/sites/${siteId}/builds`, {
        method: "POST",
        body: JSON.stringify({}),
      });
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
      return await this._fetch(`/builds/${buildId}`);
    } catch (error) {
      console.error(
        `Erro ao obter status do build ${buildId}:`,
        error.message || error
      );
      throw error;
    }
  }

  async deleteSite(siteId) {
    try {
      await this._fetch(`/sites/${siteId}`, {
        method: "DELETE",
      });
      console.log(`Site ${siteId} deletado com sucesso`);
      return true;
    } catch (error) {
      console.error(`Erro ao deletar site ${siteId}:`, error.message || error);
      throw error;
    }
  }
}

export { NetlifyManager };
