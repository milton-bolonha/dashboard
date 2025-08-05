import fs from "fs/promises";
import path from "path";

class TemplateGenerator {
  constructor(workspace) {
    this.workspace = workspace;
    // Futuramente, poderíamos ter múltiplos templates base
    this.templateBase = path.resolve("./gatsby-landing");
  }

  async generateGatsbyTemplate() {
    const templateFiles = new Map();

    // Arquivos de Configuração
    templateFiles.set("package.json", this.generatePackageJson());
    templateFiles.set("gatsby-config.js", this.generateGatsbyConfig());
    templateFiles.set("gatsby-node.js", this.generateGatsbyNode());
    templateFiles.set(".gitignore", this.generateGitignore());
    templateFiles.set("README.md", this.generateReadme());
    templateFiles.set("tailwind.config.js", this.generateTailwindConfig());

    // Arquivos de CI/CD
    templateFiles.set(
      ".github/workflows/deploy.yml",
      this.generateGitHubWorkflow()
    );
    templateFiles.set("netlify.toml", this.generateNetlifyConfig());

    // Código Fonte (simplificado, para começar)
    // Em uma versão futura, poderíamos copiar e modificar os arquivos do gatsby-landing
    templateFiles.set("src/pages/index.js", await this.generateIndexPage());
    templateFiles.set("src/pages/404.js", await this.generate404Page());
    templateFiles.set(
      "src/styles/global.css",
      await this.generateGlobalStyles()
    );

    return templateFiles;
  }

  generatePackageJson() {
    // Baseado no package.json do gatsby-landing
    const dependencies = {
      gatsby: "^5.14.1",
      react: "^18.2.0",
      "react-dom": "^18.2.0",
      "gatsby-plugin-postcss": "^6.14.0",
      "gatsby-plugin-image": "^3.14.0",
      "gatsby-plugin-sharp": "^5.14.0",
      "gatsby-transformer-sharp": "^5.14.0",
      "gatsby-plugin-manifest": "^5.14.0",
      "gatsby-plugin-sitemap": "^6.14.0",
      "gatsby-plugin-netlify": "^5.1.1",
      "node-fetch": "^2.7.0",
      tailwindcss: "^3.4.1", // Usando v3 para compatibilidade ampla
      autoprefixer: "^10.4.19",
      postcss: "^8.4.38",
    };

    return JSON.stringify(
      {
        name: `${this.workspace.slug}-site`,
        version: "1.0.0",
        private: true,
        description: `Site estático para ${this.workspace.name}, gerado pelo DashMaster.PRO`,
        scripts: {
          develop: "gatsby develop",
          start: "gatsby develop",
          build: "gatsby build",
          serve: "gatsby serve",
          clean: "gatsby clean",
        },
        dependencies: dependencies,
      },
      null,
      2
    );
  }

  generateGatsbyConfig() {
    return `
require("dotenv").config({
  path: \`.env.\${process.env.NODE_ENV}\`,
});

module.exports = {
  siteMetadata: {
    title: "${this.workspace.name}",
    description: "${
      this.workspace.description || `Site para ${this.workspace.name}`
    }",
    siteUrl: process.env.GATSBY_SITE_URL || "https://example.com",
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
        theme_color: "#663399",
        display: "minimal-ui",
        icon: "src/images/icon.png", // Requer um ícone padrão no template
      },
    },
    'gatsby-plugin-netlify',
  ],
};
`;
  }

  generateGatsbyNode() {
    return `
const path = require("path");
const fetch = require("node-fetch");

async function fetchContent(apiKey, apiUrl) {
  try {
    const response = await fetch(apiUrl, {
      headers: { 'Authorization': \`Bearer \${apiKey}\` }
    });
    if (!response.ok) {
      throw new Error(\`API request failed: \${response.statusText}\`);
    }
    return await response.json();
  } catch (error) {
    console.error("Erro ao buscar conteúdo da API:", error);
    return null;
  }
}

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions;
  const publicApiUrl = process.env.GATSBY_API_URL; // Já contém a URL completa
  const apiKey = process.env.GATSBY_API_KEY;

  const apiResult = await fetchContent(apiKey, publicApiUrl);

  if (apiResult && apiResult.content) {
    // Exemplo: Criar uma página para cada item de uma seção "posts"
    const postsSection = apiResult.content.find(s => s.slug === 'posts');
    if (postsSection && postsSection.items) {
      postsSection.items.forEach(item => {
        createPage({
          path: \`/posts/\${item.slug}\`,
          component: path.resolve("./src/templates/post.js"),
          context: {
            itemData: item.data,
          },
        });
      });
    }

    // Criar página principal
    createPage({
        path: "/",
        component: path.resolve("./src/pages/index.js"),
        context: {
            siteData: apiResult.content
        }
    })
  }
};
`;
  }

  generateGitHubWorkflow() {
    return `name: Deploy to Netlify
on:
  push:
    branches:
      - main
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Build site
        run: npm run build
        env:
          GATSBY_API_URL: \${{ secrets.GATSBY_API_URL }}
          GATSBY_API_KEY: \${{ secrets.GATSBY_API_KEY }}
          GATSBY_SITE_URL: \${{ secrets.GATSBY_SITE_URL }}
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v2
        with:
          publish-dir: './public'
          production-branch: master
          github-token: \${{ secrets.GITHUB_TOKEN }}
          deploy-message: "Deploy \${{ github.sha }}"
        env:
          NETLIFY_AUTH_TOKEN: \${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: \${{ secrets.NETLIFY_SITE_ID }}
        timeout-minutes: 1
`;
  }

  generateNetlifyConfig() {
    return `[build]
  command = "npm run build"
  publish = "public"

[build.environment]
  NODE_VERSION = "18"
  NPM_FLAGS = "--version"
`;
  }

  generateGitignore() {
    return `
.cache/
public/
node_modules/
.DS_Store
.env.*
`;
  }

  generateReadme() {
    return `# ${this.workspace.name}
        
Este site foi gerado automaticamente pelo DashMaster.PRO.

**Workspace:** ${this.workspace.slug}
**Data de Geração:** ${new Date().toISOString()}
`;
  }

  generateTailwindConfig() {
    return `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`;
  }

  async generateIndexPage() {
    return `import React from "react";
export default function Home({ pageContext }) {
    const { siteData } = pageContext;
    return (
        <div>
            <h1>${this.workspace.name}</h1>
            <p>Site gerado via DashMaster.PRO!</p>
            <pre>{JSON.stringify(siteData, null, 2)}</pre>
        </div>
    )
}
`;
  }

  async generate404Page() {
    return `import React from "react"
export default function NotFound() {
    return (
        <div>
            <h1>404: Página Não Encontrada</h1>
            <p>A página que você procura não existe.</p>
        </div>
    )
}
`;
  }

  async generateGlobalStyles() {
    return `@tailwind base;
@tailwind components;
@tailwind utilities;
`;
  }

  generateEnvConfig() {
    // A API Key pública do workspace será usada aqui
    const apiKey = this.workspace.apiKeys?.find(
      (k) => k.type === "public"
    )?.key;
    if (!apiKey) {
      console.warn(
        `Workspace ${this.workspace.slug} não possui uma API Key pública. Usando placeholder.`
      );
    }

    return {
      production: `GATSBY_API_URL=${
        process.env.APP_URL || "https://dashmaster.pro"
      }/api/public/content
GATSBY_API_KEY=${apiKey || "COLOQUE_SUA_API_KEY_PUBLICA_AQUI"}
GATSBY_SITE_URL=https://${this.workspace.slug}.netlify.app`,

      development: `GATSBY_API_URL=http://localhost:3000
GATSBY_API_KEY=${apiKey || "COLOQUE_SUA_API_KEY_PUBLICA_AQUI"}
GATSBY_SITE_URL=http://localhost:8000`,
    };
  }
}

export { TemplateGenerator };
