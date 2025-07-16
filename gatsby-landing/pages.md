# Estratégia de Criação de Páginas Dinâmicas

Este documento descreve como as páginas para Cidades e Serviços serão criadas dinamicamente no Gatsby.

## 1. Páginas Padrão (Conteúdo Simples)

Páginas como "About", "Services", "Promotions", e "Online Quote" terão seu conteúdo gerenciado por arquivos Markdown simples, facilitando a atualização por não-desenvolvedores.

**Fonte de Dados:** `content/pages/[page-slug].md` (ex: `content/pages/about.md`)

**Criação via `gatsby-node.js`:**

1.  A lógica será muito similar à das páginas de serviço.
2.  Configurar o `gatsby-source-filesystem` para a pasta `content/pages/`.
3.  Na função `createPages`, faremos uma query por `allMarkdownRemark`.
4.  Para cada arquivo, usaremos o nome do arquivo como slug da URL (ex: `about.md` -> `/about/`).
5.  `createPage({ path: \`/${slug}/\`, component: require.resolve('./src/templates/SimplePage.js'), context: { slug: slug } })`

**Template (`src/templates/SimplePage.js`):**

- Um template genérico que recebe o `slug` via `pageContext`.
- Fará uma query GraphQL para buscar o `frontmatter.title` e o `html` do corpo do Markdown.
- Renderizará o título e o conteúdo dentro de um container padrão da página.

## 2. Páginas de Cidades (Geradas Dinamicamente)

As páginas para cada cidade servida serão geradas programaticamente para fins de SEO.

**Fonte de Dados:** `content/cities.json`

**URL da Página:** `/service-areas/[city-slug]/` (ex: `/service-areas/ajax-on/`)

**Criação via `gatsby-node.js`:**

1.  Na função `createPages` do `gatsby-node.js`, faremos uma query GraphQL para buscar todos as cidades do `cities.json`.
2.  Iteraremos sobre cada cidade.
3.  Para cada cidade, criaremos um "slug" (ex: "Ajax, ON" -> "ajax-on").
4.  Usaremos a action `createPage` para gerar uma página para cada cidade, passando o nome da cidade como `context`.
5.  `createPage({ path: \`/service-areas/${slug}\`, component: require.resolve('./src/templates/CityPage.js'), context: { city: cityName } })`

**Template (`src/templates/CityPage.js`):**

- Este será um componente React que recebe a `city` do `pageContext`.
- Ele renderizará um título (`<h1>Caulking Services in {city}</h1>`), conteúdo genérico sobre os serviços na cidade específica, e talvez um formulário de contato. O conteúdo pode ser enriquecido no futuro.

## 3. Páginas de Serviços (Geradas Dinamicamente)

As páginas de serviços detalharão cada serviço oferecido. A sua sugestão de usar Markdown é excelente e a mais escalável.

**Fonte de Dados:** Uma nova pasta `content/services/` com arquivos `.md`.

**Abordagem com Markdown:**

1.  Criar uma pasta `content/services/`.
2.  Para cada serviço, criar um arquivo `.md` usando o `slug` que definimos no `services.json` (ex: `exterior-openings.md`).
3.  Cada arquivo terá `frontmatter` para o título e `body` para a descrição.

    ```markdown
    ---
    title: "Exterior Openings Caulking"
    ---

    O corpo do texto descrevendo o serviço em detalhe...
    ```

**URL da Página:** `/services/[service-slug]/` (ex: `/services/exterior-openings/`)

**Criação via `gatsby-node.js`:**

1.  Configurar o `gatsby-source-filesystem` no `gatsby-config.js` para ler a pasta `content/services/`.
2.  Usar o `gatsby-transformer-remark` para processar o Markdown.
3.  Na função `createPages` do `gatsby-node.js`, fazer uma query GraphQL por `allMarkdownRemark`.
4.  Iterar sobre cada resultado e usar a action `createPage` para gerar a página, usando o `slug` do nome do arquivo.
5.  `createPage({ path: \`/services/${slug}/\`, component: require.resolve('./src/templates/ServicePage.js'), context: { slug: slug } })`

**Template (`src/templates/ServicePage.js`):**

- Este componente receberá o `slug` como `pageContext`.
- Fará uma query GraphQL "page query" para buscar o conteúdo completo do Markdown (`html`, `frontmatter.title`).
- Renderizará o título e o conteúdo do serviço.

## 4. Páginas Customizadas (Layout Específico)

Páginas com layouts mais complexos, como "Contact Us", exigem uma abordagem diferente.

**Exemplo:** Página de Contato

**Fonte de Dados:** `content/custom-pages/contact-us.json`

**URL da Página:** `/contact-us/`

**Abordagem Sugerida:**

1.  **Componente de Página Dedicado:** Criar um componente de página diretamente em `src/pages/contact-us.js`. Esta é a forma mais simples no Gatsby de criar uma página com uma URL fixa.
2.  **Conteúdo via JSON:** Dentro do `src/pages/contact-us.js`, importaremos diretamente o arquivo `content/custom-pages/contact-us.json`. Este JSON conterá todos os textos, títulos, informações de contato (endereço, telefone) e talvez configurações para um mapa interativo.
3.  **Estrutura do Componente:** O componente `contact-us.js` terá o layout da página (ex: duas colunas com um formulário de um lado e informações de contato/mapa do outro) e preencherá esse layout com os dados importados do JSON.

Esta abordagem combina a facilidade de criação de rotas do Gatsby com a flexibilidade de gerenciamento de conteúdo via JSON para páginas que não se encaixam em um template de Markdown simples.
