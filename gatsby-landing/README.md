# 🚀 DashMaster Gatsby Headless Template

**Você tem a visão criativa. Nós temos a engine.**

Bem-vindo ao template oficial para o **DashMaster.PRO**. Este não é apenas um tema Gatsby; é a sua plataforma de lançamento para construir experiências digitais incríveis, conectada a uma poderosa fábrica de sistemas.

Enquanto o DashMaster.PRO cuida de toda a infraestrutura complexa — pagamentos, segurança, controle de acesso e gestão de conteúdo — este template te dá o controle total sobre a parte mais importante: a **experiência do usuário**.

## ✨ Features

- **Headless Nativo:** 100% dos dados (textos, imagens, menus) vêm da API Pública do DashMaster.PRO.
- **Performance Extrema:** Construído com Gatsby para gerar sites estáticos (SSG) que carregam instantaneamente.
- **SEO Otimizado:** Estrutura pronta para as melhores práticas de SEO, com metadados dinâmicos.
- **Imagens Otimizadas:** Integração com Cloudinary (via DashMaster) para entrega de imagens otimizadas e responsivas.
- **Componentizado:** Construído com React e componentes modulares para fácil manutenção e customização.
- **PWA Ready:** Pronto para ser configurado como um Progressive Web App.

## 🏛️ Princípios Fundamentais (Por que este template é diferente)

Este template é construído sobre a filosofia do DashMaster.PRO. Entender estes princípios te ajudará a criar temas melhores e mais rápido.

#### 1. **O Frontend é a Camada de Apresentação, Apenas.**

Conforme nossa **Regra de Ouro #3**, o frontend nunca deve ter lógica de permissão. Este template é intencionalmente "burro" em relação à segurança. Ele apenas renderiza os dados que a API do DashMaster, de forma segura, diz que ele pode ver. Isso te liberta para focar 100% na UI/UX, sabendo que a base é à prova de balas.

#### 2. **Performance Herdada da API.**

Seu site será rápido não apenas por causa do Gatsby, mas porque ele é alimentado por uma API de alta performance. O DashMaster.PRO utiliza cache avançado, indexação de banco de dados e otimizações para garantir que os dados cheguem até aqui da forma mais rápida possível.

#### 3. **Dados Limpos e Prontos para Uso.**

Você nunca precisará se preocupar com tipos complexos de banco de dados como `ObjectId`. A API do DashMaster faz todo o trabalho de serialização, entregando um JSON limpo e padronizado, pronto para ser consumido diretamente pelos seus componentes React.

## 🏁 Começando

1.  **Clone o Repositório**

    ```bash
    git clone https://github.com/seu-usuario/dashmaster-gatsby-template.git
    cd dashmaster-gatsby-template
    ```

2.  **Instale as Dependências**

    ```bash
    npm install
    ```

3.  **Configure suas Variáveis de Ambiente**
    Crie um arquivo chamado `.env.local` na raiz do projeto.

    ```text
    # A URL base do seu DashMaster (geralmente o domínio principal)
    GATSBY_API_URL=https://www.dashmaster.pro

    # O ID do Workspace que você quer exibir neste site.
    GATSBY_WORKSPACE_ID=seu_workspace_id

    # A Chave de API Pública do seu Workspace.
    GATSBY_API_KEY=dmp_pk_xxxxxxxxxxxxxxxxxxxxxxxx
    ```

4.  **Inicie o Servidor**
    ```bash
    npm run develop
    ```
    Seu site estará rodando em `http://localhost:8000`.

---

## 🚀 Deploying Your Site with DashMaster.PRO

Este template foi desenhado para ser publicado pela plataforma DashMaster.PRO. O processo é automatizado para criar um site online a partir do seu conteúdo com apenas alguns cliques.

### Passo 1: Obtenha suas Credenciais

Você precisará de duas chaves, conhecidas como **Personal Access Tokens (PATs)**. Trate-as como senhas.

1.  **GitHub Token:**

    - **O que é?** Uma chave que permite ao DashMaster criar um repositório **privado** em sua conta GitHub para o seu novo site.
    - **Como Criar:**
      1.  Vá para a página de [Tokens do GitHub](https://github.com/settings/tokens).
      2.  Clique em **"Generate new token"** e selecione **"classic"**.
      3.  Dê um nome (ex: `DashMasterDeployKey`).
      4.  Marque a caixa de seleção principal **`repo`**. Este escopo é o mais simples e garante todas as permissões necessárias.
      5.  Clique em **"Generate token"**, copie e guarde a chave em um local seguro.

2.  **Netlify Token:**
    - **O que é?** Uma chave que permite ao DashMaster criar um site em sua conta da Netlify.
    - **Como Criar:**
      1.  Vá para a página de [Aplicações da Netlify](https://app.netlify.com/user/applications#personal-access-tokens).
      2.  Clique em **"New personal access token"**.
      3.  Dê uma descrição (ex: `DashMasterDeployKey`) e clique em **"Generate token"**.
      4.  Copie e guarde a chave gerada.

### Passo 2: Inicie o Deploy

1.  **Navegue até a Página de Deploy:** No seu painel DashMaster.PRO, vá para a seção "Deploy".

2.  **Abra o Modal de Configuração:** Clique no botão "Iniciar Primeiro Deploy" ou "Atualizar Site".

3.  **Insira suas Credenciais:** Cole os tokens do GitHub e da Netlify que você acabou de gerar nos campos correspondentes.

4.  **(Opcional) Use este Template:**

    - Marque a caixa "Usar um template de repositório customizado".
    - No campo de texto que aparecer, cole a URL deste repositório no GitHub.

5.  **Confirme e Assista à Mágica:** Clique em "Confirmar e Iniciar Deploy". O DashMaster irá:
    - Criar um repositório privado no seu GitHub.
    - Criar um novo site na sua conta Netlify.
    - Configurar tudo e iniciar o primeiro build do seu site.

Você pode acompanhar o progresso em tempo real na seção "Histórico de Deploys" no seu dashboard.

---

## 🛠️ Anatomia de um Tema DashMaster

Para customizar este tema, é essencial entender como os arquivos principais do Gatsby estão organizados e o que cada um faz.

### Estrutura de Pastas

- `gatsby-node.js`: **O Cérebro da Geração de Páginas.** Este arquivo é o coração da nossa arquitetura headless. Durante o processo de build, ele executa a função `getSourceData()` para buscar todo o conteúdo da API do DashMaster. Em seguida, ele itera sobre esses dados e usa a função `createPage` para gerar dinamicamente cada página do site (Cidades, Sobre, Serviços, etc.), conectando os dados a um template específico.

- `gatsby-config.js`: **O Centro de Configuração.** Aqui você gerencia os plugins do Gatsby. Já vem pré-configurado com o essencial para performance e SEO, como `gatsby-plugin-image`, `gatsby-plugin-sitemap`, e `gatsby-plugin-postcss` para TailwindCSS. Note que, diferente de outros starters, a configuração de "sources" de dados é mínima, pois nossa fonte da verdade é a API.

- `/src/templates`: **Os Moldes das Suas Páginas.** Cada arquivo aqui (ex: `HomePage.js`, `CityPage.js`) é um componente React que serve como um "molde" para um tipo de página. O `gatsby-node.js` escolhe o molde apropriado e injeta os dados (`pageContext`) para que a página seja renderizada com o conteúdo correto. É aqui que você fará a maior parte do seu trabalho de customização visual.

- `/src/pages`: **Para Páginas Estáticas.** Use esta pasta para páginas que _não_ são geradas a partir do CMS, como a página `404.js`. O Gatsby automaticamente cria uma rota para qualquer componente React colocado aqui.

### Seu Superpoder de SEO: `src/components/Seo.js`

Este componente é uma peça central do template e foi projetado para centralizar toda a complexidade de SEO.

- **O que ele faz?** Ele recebe os dados da página (`title`, `description`) e os dados globais do site (`site`) e gera automaticamente todas as meta tags essenciais (`og:title`, `og:description`, `twitter:card`, etc.) e, mais importante, os **dados estruturados (JSON-LD)** para `WebSite`, `WebPage`, e `LocalBusiness`.
- **Como usar?** Simplesmente inclua o componente `<Seo />` no topo de cada um dos seus templates em `/src/templates`, passando as props necessárias. Isso garante que todas as suas páginas terão um SEO robusto e consistente sem esforço.

---

## 🧬 A Estrutura do Dado: O Coração do Tema

**Esta é a seção mais importante.** Para ser um "Fazedor de Temas" de sucesso, você precisa dominar esta estrutura. Tudo vem de um único endpoint e segue um JSON previsível.

> **Pense neste JSON como o seu "manual de instruções". Cada componente que você criar será uma "tradução" de um pedaço deste JSON para uma representação visual.**

### Exemplo da Estrutura de Dados

```json
{
  "globalData": {
    "siteName": "Minha Empresa Inc.",
    "header": {
      "logoUrl": "cloudinary-id-logo",
      "menuItems": [
        { "label": "Home", "link": "/" },
        { "label": "Serviços", "link": "/servicos" }
      ]
    },
    "footer": {
      /* ... dados do rodapé ... */
    }
  },
  "pageData": {
    "title": "Página Inicial",
    "slug": "home",
    "sections": [
      {
        "sectionId": "hero-1",
        "type": "hero",
        "items": [
          {
            "_id": "item-hero-1",
            "title": "Construímos o Futuro da Web",
            "subtitle": "Soluções inovadoras.",
            "ctaButtonText": "Fale Conosco",
            "backgroundImage": "cloudinary-id-fundo"
          }
        ]
      },
      {
        "sectionId": "services-gallery",
        "type": "gallery",
        "items": [
          {
            "_id": "item-gallery-1",
            "imageUrl": "id-img-1",
            "title": "Desenvolvimento Web"
          },
          {
            "_id": "item-gallery-2",
            "imageUrl": "id-img-2",
            "title": "Marketing Digital"
          }
        ]
      }
    ]
  }
}
```

- `globalData`: Informações usadas em todo o site (Header, Footer).
- `pageData`: Dados específicos da página atual.
- `sections`: Um array que representa as "faixas" de conteúdo da sua página.
- `type`: A **chave de renderização**. É o nome que conecta esta seção de dados ao componente React correspondente. Por exemplo, um `type: 'hero'` será renderizado pelo seu componente `Hero.js`.
- `items`: Um array com o conteúdo real de cada seção. É aqui que você fará o `.map()` para renderizar seus elementos.

---

## ✨ AI-Powered Development: Prompts para Sua IA

Use estes prompts com sua IA assistente (Gemini, Copilot, etc.) para acelerar drasticamente o desenvolvimento. Eles são desenhados para funcionar com a estrutura deste template.

### **Prompt 1: Criar um Componente de "Galeria de Fotos"**

> **Sua Tarefa:** Crie um novo componente React em `src/components/ImageGallery.js`. Ele deve receber uma `section` como prop. O componente deve renderizar um título (`section.items[0].galleryTitle`) e depois mapear (`map`) o array `section.items[0].images`, que é uma lista de objetos contendo `imageUrl` e `caption`. Use a `buildCloudinaryUrl` de `src/lib/cloudinary.js` para processar cada `imageUrl`. Estilize a galeria como um grid responsivo (3 colunas em desktop, 1 em mobile) usando CSS Modules ou TailwindCSS.

- **Contexto:** Este prompt ensina a criar um componente que consome um tipo de seção específico, processa imagens e aplica estilos, uma das tarefas mais comuns.
- **Estrutura do Dado (DashMaster):** Para este prompt funcionar, crie um "Content-Type" no DashMaster chamado `image-gallery-item` com os campos `galleryTitle` (texto) e `images` (um campo "Repeater" ou "Group" contendo `imageUrl` e `caption`).

### **Prompt 2: Criar uma Página Customizada com Formulário de Contato**

> **Sua Tarefa:**
>
> 1.  Crie uma nova página em `src/pages/orcamento.js`.
> 2.  Nesta página, adicione um formulário de contato com os campos: "Nome", "Email" e "Mensagem".
> 3.  Ao submeter o formulário, envie os dados para uma **serverless function** que você criará em `src/api/send-budget-request.js`.
> 4.  A serverless function deve receber os dados do formulário, validar e usar a API do SendGrid para me enviar um email com a solicitação de orçamento. Lembre-se de usar variáveis de ambiente para a chave da API do SendGrid.
> 5.  Mostre uma mensagem de "Sucesso" ou "Erro" na UI após a submissão.

- **Contexto:** Este prompt força a criação de uma página estática que interage com funcionalidades dinâmicas (serverless functions), uma base para qualquer aplicação web moderna.

### **Prompt 3: Adicionar um Slider de Depoimentos na Página Inicial**

> **Sua Tarefa:**
>
> 1.  Instale a biblioteca `swiper.js` (`npm install swiper`).
> 2.  Crie um componente `src/components/TestimonialsSlider.js`.
> 3.  Este componente será renderizado na página inicial e deve buscar os dados de uma seção com o `type: 'testimonials'`.
> 4.  Cada item no array `section.items` terá a estrutura: `{ "quote": "Texto do depoimento.", "author": "Nome do Autor", "avatarUrl": "cloudinary-id-avatar" }`.
> 5.  Configure o Swiper para mostrar um depoimento por vez, com setas de navegação e paginação (bolinhas). Estilize os slides para ficarem visualmente atraentes.

- **Contexto:** Um exercício prático que envolve instalar uma dependência externa e configurá-la para funcionar com os dados dinâmicos do DashMaster.
