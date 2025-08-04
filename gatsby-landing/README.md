# 🚀 DashMaster Gatsby Headless Template

[![Gatsby](https://img.shields.io/badge/Gatsby-663399?style=for-the-badge&logo=gatsby&logoColor=white)](https://www.gatsbyjs.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**Você tem a visão criativa. Nós temos a engine.**

Um template Gatsby headless oficial para o **DashMaster.PRO** que conecta sua criatividade frontend a uma poderosa infraestrutura backend. Este não é apenas um tema Gatsby; é a sua plataforma de lançamento para construir experiências digitais incríveis.

## 📖 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Diferenciais](#-diferenciais)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Configuração](#-configuração)
- [Deploy](#-deploy)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Arquitetura de Dados](#-arquitetura-de-dados)
- [Desenvolvimento](#-desenvolvimento)
- [Prompts para IA](#-prompts-para-ia)
- [Contribuição](#-contribuição)
- [Licença](#-licença)
- [Suporte](#-suporte)

## 🎯 Sobre o Projeto

O DashMaster Gatsby Template é uma solução headless que separa completamente o frontend da infraestrutura complexa. Enquanto o DashMaster.PRO cuida de toda a parte backend — pagamentos, segurança, controle de acesso e gestão de conteúdo — este template te dá o controle total sobre a **experiência do usuário**.

### 🌟 Diferenciais

Este template é construído sobre a filosofia única do DashMaster.PRO. Entender estes princípios te ajudará a criar temas melhores e mais rápido:

#### 1. **Performance Herdada da API**
Seu site será rápido não apenas por causa do Gatsby, mas porque ele é alimentado por uma API de alta performance com cache avançado, indexação de banco de dados e otimizações.

#### 2. **Dados Limpos e Prontos para Uso**
Você nunca precisará se preocupar com tipos complexos de banco de dados como `ObjectId`. A API do DashMaster faz todo o trabalho de serialização, entregando um JSON limpo e padronizado.

## ✨ Features

- **🎯 Headless Nativo:** 100% dos dados (textos, imagens, menus) vêm da API Pública do DashMaster.PRO
- **⚡ Performance Extrema:** Construído com Gatsby 5 para gerar sites estáticos (SSG) que carregam instantaneamente
- **🔍 SEO Otimizado:** Estrutura pronta para as melhores práticas de SEO, com metadados dinâmicos
- **🖼️ Imagens Otimizadas:** Integração com Cloudinary (via DashMaster) para entrega de imagens otimizadas e responsivas
- **🧩 Componentizado:** Construído com React e componentes modulares para fácil manutenção e customização
- **📱 PWA Ready:** Pronto para ser configurado como um Progressive Web App
- **🎨 TailwindCSS:** Framework CSS utilitário para desenvolvimento rápido
- **🔧 TypeScript Ready:** Suporte opcional ao TypeScript

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 22 LTS)
- **npm** ou **yarn**
- **Git**
- Uma conta ativa no **DashMaster.PRO**
- Chave de API Pública do seu Workspace

## 🚀 Instalação

1. **Clone o Repositório**
   ```bash
   git clone https://github.com/seu-usuario/dashmaster-gatsby-template.git
   cd dashmaster-gatsby-template
   ```

2. **Instale as Dependências**
   ```bash
   npm install
   # ou
   yarn install
   ```

3. **Configure as Variáveis de Ambiente**
   
   Crie um arquivo `.env.local` na raiz do projeto:
   ```env
   # A URL base do seu DashMaster (geralmente http://localhost:3000 em desenvolvimento)
   GATSBY_API_URL=http://localhost:3000
   
   # A Chave de API Pública do seu Workspace
   GATSBY_API_KEY=dmp_pk_xxxxxxxxxxxxxxxxxxxxxxxx
   
   # Configurações do Cloudinary (opcional)
   GATSBY_CLOUDINARY_CLOUD_NAME=seu_cloud_name
   CLOUDINARY_API_KEY=sua_api_key
   CLOUDINARY_API_SECRET=seu_api_secret
   
   # Chave da API do Gemini (para funcionalidades de IA, se aplicável)
   GEMINI_API_KEY=sua_gemini_key
   ```

4. **Inicie o Servidor de Desenvolvimento**
   ```bash
   npm run develop
   ```
   
   Seu site estará rodando em `http://localhost:8000`

## 📜 Scripts Disponíveis

No diretório do projeto, você pode executar:

- **`npm run develop`** - Inicia o servidor de desenvolvimento
- **`npm run build`** - Constrói a versão de produção
- **`npm run serve`** - Serve a versão construída localmente
- **`npm run clean`** - Limpa o cache do Gatsby
- **`npm run format`** - Formata o código com Prettier
- **`npm run lint`** - Executa o ESLint para verificar o código
- **`npm run test`** - Executa os testes (se configurados)

## ⚙️ Configuração

### Variáveis de Ambiente

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `GATSBY_API_URL` | URL base da API do DashMaster | ✅ |
| `GATSBY_API_KEY` | Chave pública da API | ✅ |
| `GATSBY_CLOUDINARY_CLOUD_NAME` | Nome da conta Cloudinary | ❌ |
| `CLOUDINARY_API_KEY` | Chave da API Cloudinary | ❌ |
| `CLOUDINARY_API_SECRET` | Secret da API Cloudinary | ❌ |
| `GEMINI_API_KEY` | Chave da API do Gemini | ❌ |

### gatsby-config.js

O arquivo de configuração já vem otimizado com:
- Plugins essenciais para performance e SEO
- Configuração do TailwindCSS
- Otimização de imagens
- Geração de sitemap
- Suporte a PWA (opcional)

## 🚀 Deploy

Este template foi desenhado para ser publicado pela plataforma DashMaster.PRO. O processo é automatizado para criar um site online a partir do seu conteúdo com apenas alguns cliques.

### Passo 1: Obtenha suas Credenciais

Você precisará de duas chaves, conhecidas como **Personal Access Tokens (PATs)**. Trate-as como senhas.

#### GitHub Token
- **O que é?** Uma chave que permite ao DashMaster criar um repositório **privado** em sua conta GitHub para o seu novo site.
- **Como Criar:**
  1. Vá para a página de [Tokens do GitHub](https://github.com/settings/tokens)
  2. Clique em **"Generate new token"** e selecione **"classic"**
  3. Dê um nome (ex: `DashMasterDeployKey`)
  4. Marque a caixa de seleção principal **`repo`**. Este escopo garante todas as permissões necessárias
  5. Clique em **"Generate token"**, copie e guarde a chave em um local seguro

#### Netlify Token
- **O que é?** Uma chave que permite ao DashMaster criar um site em sua conta da Netlify.
- **Como Criar:**
  1. Vá para a página de [Aplicações da Netlify](https://app.netlify.com/user/applications#personal-access-tokens)
  2. Clique em **"New personal access token"**
  3. Dê uma descrição (ex: `DashMasterDeployKey`) e clique em **"Generate token"**
  4. Copie e guarde a chave gerada

### Passo 2: Inicie o Deploy

1. **Navegue até a Página de Deploy:** No seu painel DashMaster.PRO, vá para a seção "Deploy"
2. **Abra o Modal de Configuração:** Clique no botão "Iniciar Primeiro Deploy" ou "Atualizar Site"
3. **Insira suas Credenciais:** Cole os tokens do GitHub e da Netlify nos campos correspondentes
4. **(Opcional) Use este Template:**
   - Marque a caixa "Usar um template de repositório customizado"
   - No campo de texto que aparecer, cole a URL deste repositório no GitHub
5. **Confirme e Assista à Mágica:** Clique em "Confirmar e Iniciar Deploy"

O DashMaster irá:
- Criar um repositório privado no seu GitHub
- Criar um novo site na sua conta Netlify
- Configurar tudo e iniciar o primeiro build do seu site

Você pode acompanhar o progresso em tempo real na seção "Histórico de Deploys" no seu dashboard.

## 📁 Estrutura do Projeto

```
├── src/
│   ├── components/          # Componentes React reutilizáveis
│   ├── templates/           # Templates de página do Gatsby
│   ├── pages/              # Páginas estáticas
│   ├── lib/                # Utilitários e helpers
│   ├── styles/             # Arquivos de estilo globais
│   └── images/             # Imagens estáticas
├── gatsby-node.js          # Configuração de build e geração de páginas
├── gatsby-config.js        # Configuração do Gatsby
├── tailwind.config.js      # Configuração do TailwindCSS
└── package.json
```

### Arquivos Principais

#### `gatsby-node.js`
**O Cérebro da Geração de Páginas.** Durante o processo de build, ele executa a função `getSourceData()` para buscar todo o conteúdo da API do DashMaster. O arquivo automaticamente:

- Gera páginas de cidades dinamicamente com templates personalizáveis
- Cria páginas de conteúdo (About, Services, Promotions)
- Gera páginas customizadas com templates específicos
- Constrói a página inicial com dados da seção landing-page
- Extrai e organiza dados globais (header, footer, configurações)

#### `gatsby-config.js`
**O Centro de Configuração.** Gerencia os plugins do Gatsby, já vem pré-configurado com o essencial para performance e SEO.

#### `/src/templates`
**Os Moldes das Suas Páginas.** Cada arquivo aqui é um componente React que serve como um "molde" para um tipo de página. É aqui que você fará a maior parte do seu trabalho de customização visual.

#### `/src/components/Seo.js`
**Seu Superpoder de SEO.** Este componente centraliza toda a complexidade de SEO, gerando automaticamente meta tags essenciais e dados estruturados (JSON-LD).

## 🧬 Arquitetura de Dados

**Esta é a seção mais importante.** Para ser um "Fazedor de Temas" de sucesso, você precisa dominar esta estrutura. Tudo vem de um único endpoint e segue um JSON previsível.

> **Pense neste JSON como o seu "manual de instruções". Cada componente que você criar será uma "tradução" de um pedaço deste JSON para uma representação visual.**

### Estrutura de Dados

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

### Conceitos Chave

- **`globalData`**: Informações usadas em todo o site (Header, Footer)
- **`pageData`**: Dados específicos da página atual
- **`sections`**: Array que representa as "faixas" de conteúdo da página
- **`type`**: A **chave de renderização** que conecta a seção ao componente React
- **`items`**: Array com o conteúdo real de cada seção

## 🛠️ Desenvolvimento

### Criando Novos Componentes

1. Crie seu componente em `src/components/`
2. Importe e use em seus templates
3. Utilize a estrutura de dados padrão do DashMaster

### Exemplo de Componente

```jsx
import React from 'react';
import { buildCloudinaryUrl } from '../lib/cloudinary';

const Hero = ({ section }) => {
  const heroData = section.items[0];
  
  return (
    <section className="hero">
      <img 
        src={buildCloudinaryUrl(heroData.backgroundImage)} 
        alt={heroData.title}
      />
      <h1>{heroData.title}</h1>
      <p>{heroData.subtitle}</p>
    </section>
  );
};

export default Hero;
```

## 🤖 Prompts para IA

Use estes prompts com sua IA assistente para acelerar o desenvolvimento:

### Prompt 1: Criar Componente de Galeria
> **Sua Tarefa:** Crie um novo componente React em `src/components/ImageGallery.js`. Ele deve receber uma `section` como prop. O componente deve renderizar um título (`section.items[0].galleryTitle`) e depois mapear o array `section.items[0].images`, que é uma lista de objetos contendo `imageUrl` e `caption`. Use a `buildCloudinaryUrl` de `src/lib/cloudinary.js` para processar cada `imageUrl`. Estilize a galeria como um grid responsivo usando TailwindCSS.

### Prompt 2: Página com Formulário
> **Sua Tarefa:** Crie uma nova página em `src/pages/orcamento.js` com um formulário de contato. Adicione uma serverless function em `src/api/send-budget-request.js` que usa SendGrid para enviar emails. Mostre mensagens de sucesso/erro na UI.

### Prompt 3: Slider de Depoimentos
> **Sua Tarefa:** Instale swiper.js e crie um componente `TestimonialsSlider.js` que renderize depoimentos de uma seção `type: 'testimonials'`. Configure navegação e paginação com Swiper.

---

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 💬 Suporte

- **Documentação:** [docs.dashmaster.pro](https://docs.dashmaster.pro)
- **Email:** suporte@dashmaster.pro
- **Discord:** [Comunidade DashMaster](https://discord.gg/dashmaster)
- **Issues:** Use as [GitHub Issues](https://github.com/seu-usuario/dashmaster-gatsby-template/issues) para reportar bugs

## 🙏 Créditos

- **DashMaster.PRO** - Infraestrutura backend
- **Gatsby** - Framework React para sites estáticos
- **TailwindCSS** - Framework CSS utilitário
- **Cloudinary** - Otimização e entrega de imagens

---

**Feito com ❤️ pela equipe DashMaster**