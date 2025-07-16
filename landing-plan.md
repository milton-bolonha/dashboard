# Plano de Ação - Landing Page Dinâmica com Build Estático (Gatsby)

**Objetivo:** Finalizar a landing page em `/gatsby-landing`, transformando-a em um site estático de alta performance, cujo conteúdo é buscado de um Workspace e Section específicos do DashMaster.PRO durante o processo de build.

---

## Visão Geral da Arquitetura (Estratégia de Build-Time)

1.  **Fonte de Dados:** No DashMaster.PRO, teremos um Workspace e uma Section designados para conter os dados da landing page. Cada `Item` dentro desta `Section` terá uma chave para mapeamento (ex: `key: 'hero-title'`).
2.  **Endpoint Privado:** Criaremos um endpoint seguro na API do DashMaster, que só servirá para este propósito. Ele receberá os IDs do Workspace e da Section e retornará os dados.
3.  **Processo de Build (Gatsby):** Durante o build (`gatsby build`), o arquivo `gatsby-node.js` fará uma chamada a este endpoint, buscará os dados e os usará para gerar as páginas HTML estáticas. O site final não precisará de chamadas à API no lado do cliente.

---

## Tarefas Detalhadas

### 1. Backend: Criar Endpoint de Conteúdo para Build

**Descrição:** Um endpoint interno e seguro que servirá os dados brutos para o processo de build do Gatsby.

- [ ] **Estrutura dos Dados no DashMaster:**
    - Em um Workspace de sua escolha, crie uma `Section` (ex: "Conteúdo da Landing Page").
    - Dentro desta `Section`, crie `Items`. Cada item deve ter um campo `key` (ex: `hero-title`, `hero-subtitle`, `feature-box-1-title`) e um campo `value` (o texto ou URL da imagem).

- [ ] **Criar a Rota da API Privada:**
    - Criar um novo arquivo de rota: `/dashboard/app/api/private/build-content/route.js`.
    - Este endpoint será um `POST` para não expor os IDs na URL.

- [ ] **Implementar a Lógica do Endpoint:**
    - A função receberá no `body` da requisição: `{ workspaceId, sectionId }`.
    - Ela buscará todos os `Items` da `sectionId` dentro do `workspaceId` especificado.
    - A rota irá montar e retornar um objeto JSON simples no formato `chave: valor` (ex: `{ "hero-title": "Bem-vindo ao DashMaster.PRO", ... }`).

- [ ] **Segurança do Endpoint:**
    - A requisição para este endpoint deverá conter um `Authorization: Bearer <SECRET_KEY>` no header.
    - A `SECRET_KEY` será uma variável de ambiente no backend e no frontend (Gatsby) para garantir que só o processo de build possa acessá-lo.

### 2. Frontend: Configurar Gatsby para Fetching no Build

**Descrição:** Modificar o site em `/gatsby-landing` para buscar os dados durante o build e gerar a página estática.

- [ ] **Configurar Variáveis de Ambiente:**
    - No diretório `/gatsby-landing`, criar um arquivo `.env.development` e `.env.production`.
    - Adicionar as seguintes variáveis:
        - `GATSBY_DASHMASTER_API_URL="http://localhost:3000/api/private/build-content"`
        - `GATSBY_WORKSPACE_ID="..."`
        - `GATSBY_SECTION_ID="..."`
        - `GATSBY_API_SECRET_KEY="..."`

- [ ] **Implementar a Lógica de Fetching em `gatsby-node.js`:**
    - No arquivo `gatsby-node.js` na raiz do projeto Gatsby, usar a API `sourceNodes` ou `createPages`.
    - Dentro dela, usar `fetch` para fazer a chamada `POST` para o endpoint da API, enviando os IDs e o header de autorização.
    - Passar os dados recebidos para a página principal através do `pageContext`.

- [ ] **Atualizar a Página e os Componentes:**
    - Na página principal (`src/pages/index.js`), receber os dados via `props.pageContext`.
    - Mapear os dados para os componentes corretos (ex: `Hero` recebe `pageContext.data['hero-title']`).
    - Remover qualquer lógica de fetching do lado do cliente que possa existir.

- [ ] **Verificação e Teste:**
    - Rodar `gatsby build` e verificar no diretório `public` se o HTML gerado contém o texto buscado da API.
    - Isso confirma que o site é verdadeiramente estático e não depende da API após o build.

---

## ✅ Critérios de Sucesso

- Um endpoint `POST /api/private/build-content` está funcional e seguro.
- O projeto Gatsby está configurado com as variáveis de ambiente necessárias.
- Ao rodar `gatsby build`, os dados são buscados com sucesso e a landing page é gerada estaticamente com o conteúdo do DashMaster.PRO.
- O site final é rápido, seguro e não faz chamadas à API do DashMaster no navegador do usuário.