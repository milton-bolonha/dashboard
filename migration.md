# Plano de Migração: Gatsby Landing Page para Headless CMS

**Objetivo:** Migrar o site Gatsby de um sistema de conteúdo estático (arquivos JSON/Markdown locais) para um sistema totalmente headless, consumindo dados da API pública do seu backend.

**Estratégia Principal:** Utilizaremos o arquivo `gatsby-node.js` para, durante o processo de build, buscar todos os dados necessários da API (`/api/public/content`). Com esses dados em mãos, geraremos dinamicamente todas as páginas do site (páginas de conteúdo, páginas de cidade, etc.), passando os dados específicos de cada página e os dados globais (header, footer, SEO) através do `context` do Gatsby.

---

## Detalhamento da Migração Passo a Passo

### **Passo 1: Configuração do Ambiente**

1.  **Instalar `node-fetch`**: O ambiente Node.js do Gatsby precisará de um pacote para fazer requisições de API.

    ```bash
    cd gatsby-landing
    npm install node-fetch@2
    ```

2.  **Criar Arquivos de Ambiente**: Na raiz da pasta `gatsby-landing`, crie um arquivo `.env.development` para guardar suas credenciais de forma segura.

    ```ini
    # gatsby-landing/.env.development
    GATSBY_API_URL=http://localhost:3000
    GATSBY_API_KEY=dsmp_9QuXkHUYDz4Nmj-oNVrY6DBVFrDYwv1O
    ```

3.  **Carregar Variáveis de Ambiente**: Modifique o `gatsby-config.js` para que ele possa ler o arquivo `.env`.

    ```javascript
    // gatsby-landing/gatsby-config.js
    require("dotenv").config({
      path: `.env.${process.env.NODE_ENV}`,
    });

    module.exports = {
      // ... resto da sua configuração
    };
    ```

### **Passo 2: Modificar `gatsby-node.js` para Buscar Dados da API**

Este é o passo mais crítico. Vamos substituir a lógica de leitura de arquivos locais pela lógica de chamada de API.

1.  **Função de Fetch**: No topo do `gatsby-node.js`, adicione a função para buscar os dados.

    ```javascript
    // gatsby-landing/gatsby-node.js
    const path = require("path");
    const fetch = require("node-fetch"); // Adicionar esta linha

    async function getSourceData() {
      const apiUrl = `${process.env.GATSBY_API_URL}/api/public/content`;
      const apiKey = process.env.GATSBY_API_KEY;

      try {
        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });
        if (!response.ok) {
          throw new Error(`API call failed with status: ${response.status}`);
        }
        const data = await response.json();
        return data.content;
      } catch (error) {
        console.error("Failed to fetch source data:", error);
        process.exit(1); // Interrompe o build se a API falhar
      }
    }
    ```

2.  **Lógica de Criação de Páginas**: Dentro da função `exports.createPages`, vamos usar os dados da API.

    ```javascript
    // gatsby-landing/gatsby-node.js
    exports.createPages = async ({ graphql, actions }) => {
      const { createPage } = actions;

      const allContent = await getSourceData();

      // Helper para encontrar seções facilmente
      const getContentBySlug = (slug) =>
        allContent.find((c) => c.slug === slug);

      // Extrair dados globais para injetar em todas as páginas
      const globalData = {
        header: getContentBySlug("header")?.items[0]?.data,
        footer: getContentBySlug("footer")?.items[0]?.data,
        site: getContentBySlug("site")?.items[0]?.data,
        services: getContentBySlug("services")?.items[0]?.data,
        topbar: getContentBySlug("topbar")?.items[0]?.data,
      };

      // 1. Gerar Páginas Customizadas e de Conteúdo (About, Services, etc.)
      const pages = (getContentBySlug("pages")?.items || []).concat(
        getContentBySlug("custom-pages")?.items || []
      );

      pages.forEach((page) => {
        const pageTemplate = page.data.template || "CustomPage"; // ex: CustomPage, LibraryPage
        createPage({
          path: `/${page.slug}`,
          component: path.resolve(`./src/templates/${pageTemplate}.js`),
          context: {
            pageData: page,
            globalData: globalData,
          },
        });
      });

      // 2. Gerar Páginas de Cidades
      const citiesList = getContentBySlug("cities")?.items[0]?.data || {};
      const cityTemplate = getContentBySlug("cities-pages")?.items.find(
        (t) => t.slug === "city-template"
      );

      if (Object.keys(citiesList).length > 0 && cityTemplate) {
        Object.values(citiesList).forEach((city) => {
          createPage({
            path: `/service-areas/${city.slug}`,
            component: path.resolve("./src/templates/CityPage.js"),
            context: {
              city,
              templateData: cityTemplate,
              globalData: globalData,
            },
          });
        });
      }

      // REMOVER ou COMENTAR toda a lógica antiga que usa `graphql` e `fs.readFileSync`
    };
    ```

### **Passo 3: Atualizar Templates para Usar `pageContext`**

Agora, os templates não precisarão mais de queries GraphQL para buscar dados da página. Eles receberão tudo via `pageContext`.

**Exemplo de modificação para `src/templates/CustomPage.js`:**

```javascript
// ANTES (com GraphQL)
// ...
// export const pageQuery = graphql` ... `;

// DEPOIS (usando pageContext)
import React from "react";
import LayoutContainer from "../containers/LayoutContainer";
import PageBuilderContainer from "../containers/PageBuilderContainer";
import MarkdownContentContainer from "../containers/MarkdownContentContainer";
import Seo from "../components/Seo";

const CustomPage = ({ pageContext }) => {
  const { pageData } = pageContext;
  const { data, html } = pageData; // 'data' contém o frontmatter, 'html' o conteúdo markdown

  return (
    <LayoutContainer
      bgImage={data.image}
      pageTitle={data.name}
      // Dados globais agora vêm do pageContext e são passados para o Layout
      globalData={pageContext.globalData}
    >
      <PageBuilderContainer pageBuilderData={data.page_builder} />

      <div className="container mx-auto px-4 py-8">
        <MarkdownContentContainer frontmatter={data} html={html} />
      </div>
    </LayoutContainer>
  );
};

export const Head = ({ location, pageContext }) => (
  <Seo
    // O componente SEO também receberá os dados globais via props
    site={pageContext.globalData.site}
    title={pageContext.pageData.name}
    description={pageContext.pageData.description}
    path={location.pathname}
    navigationItems={pageContext.globalData.header.menu.data.items}
    services={pageContext.globalData.services.services}
  />
);

export default CustomPage;
```

O mesmo padrão será aplicado aos outros templates (`SimplePage.js`, `CityPage.js`, etc.) e aos containers que dependem de dados (`LayoutContainer`, `FooterContainer`, etc.).

### **Passo 4: Centralizar Dados Globais no Layout**

O `LayoutContainer` será o responsável por receber `globalData` e distribuir para os componentes filhos, como `Header` e `Footer`.

```javascript
// src/containers/LayoutContainer.js
import React from "react";
import Layout from "../components/Layout";

// Remover imports de JSON estático
// import headerData from "../../content/header.json";
// import topbarData from "../../content/topbar.json";

const LayoutContainer = ({ children, bgImage, pageTitle, globalData }) => {
  const { topbarData, headerData } = globalData;
  const showTopBar =
    topbarData &&
    (topbarData.content?.data?.texto || topbarData.marquee?.data?.texto);

  return (
    <Layout
      showTopBar={showTopBar}
      topbarData={topbarData}
      headerData={headerData}
      // ...outras props
    >
      {children}
    </Layout>
  );
};

export default LayoutContainer;
```

### **Passo 5: Limpeza do Projeto**

Após a migração e testes, podemos remover os arquivos e códigos que se tornaram obsoletos.

1.  **Excluir a pasta `gatsby-landing/content`**: Ela não será mais a fonte da verdade.
2.  **Remover Queries GraphQL**: Excluir as `pageQuery` de todos os arquivos de template.
3.  **Simplificar `createSchemaCustomization`**: A customização de schema em `gatsby-node.js` pode ser bastante reduzida ou removida, pois os dados não virão mais do `MarkdownRemark`.

---

Este plano fornece um caminho claro para a migração. Podemos começar implementando o **Passo 1** e o **Passo 2** para validar a busca de dados e a criação de páginas.
