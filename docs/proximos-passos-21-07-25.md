# Próximos Passos: Plano de Ação (21/07/25) - VERSÃO REVISADA 3 (Arquitetura Final)

Este documento detalha o plano de ação para as próximas fases do DashMaster.PRO. **Esta versão finaliza a decisão de arquitetura da API, adotando o padrão `api/workspaces/[id]/{recurso}` como o oficial para todas as novas funcionalidades.**

---

## Definição da Arquitetura da API

Após análise, foi confirmado que a estrutura de API ideal, centrada em workspaces (`/api/workspaces/[id]`), já existe parcialmente no projeto. As rotas para gerenciar API Keys já estão hierarquicamente corretas.

**Decisão:**

1.  **Padrão Oficial:** Todas as novas rotas de API que operam no contexto de um workspace **devem** seguir a estrutura `api/workspaces/[id]/{recurso}`.
2.  **Dívida Técnica:** Rotas antigas que não seguem este padrão (ex: `/api/sections`) são consideradas dívida técnica. Elas funcionarão, mas devem ser migradas para a nova estrutura no futuro.
3.  **Foco Imediato:** Implementar as funcionalidades necessárias (gerenciamento de API Keys e API de conteúdo) usando o padrão oficial.

---

## Roadmap Sequencial

### Passo 1: Implementar o Gerenciador de API Keys (Backend e Frontend) - ✅ CONCLUÍDO

- **O que foi feito:**
  - **Backend:** Criamos os endpoints `/api/workspaces/[id]/api-keys` (GET, POST) e `/api/workspaces/[id]/api-keys/[keyId]` (DELETE). A lógica de geração e hashing seguro das chaves foi implementada.
  - **Frontend:** O componente `ApiKeyManager.jsx` foi totalmente implementado, permitindo listar, criar e revogar chaves de API para o workspace atual.
  - **Status:** **Funcional e Testado.**

### Passo 2: Criar a API Pública de Conteúdo - ✅ CONCLUÍDO

- **O que foi feito:**
  - **API Endpoint:** Criamos o endpoint `GET /api/public/content`.
  - **Autenticação:** A rota é protegida e requer uma chave de API válida no header `Authorization: Bearer`.
  - **Lógica de Negócio:** A API busca o workspace, suas seções públicas (`isPublic: true`) e os itens correspondentes (`status: "published"`, `isActive: true`), garantindo que apenas conteúdo seguro seja exposto.
  - **Serialização:** Os dados são serializados para remover informações sensíveis e formatar os IDs corretamente.
  - **Status:** **Funcional e Testado.**

---

## Parte 2: A Jornada para a Publicação Automatizada

Com a API de conteúdo pronta, iniciamos a jornada para transformar o DashMaster em uma plataforma completa de Conteúdo como Serviço (CaaS) com publicação automatizada.

### Fase 1: Prova de Conceito - Conexão Manual com Gatsby

- **Objetivo:** Provar que um site estático externo (`gatsby-landing`) pode ser totalmente alimentado pela nossa API de Conteúdo. Esta fase é o pré-requisito fundamental para toda a automação futura.
- **Local da Tarefa:** O trabalho se concentrará principalmente no projeto `gatsby-landing`.
- **Plano de Ação:**
  1.  **Configuração do Ambiente:** No `gatsby-landing`, criar um arquivo de ambiente (`.env.development`) para armazenar a URL da API (`http://localhost:3000`) e a chave de API gerada no Passo 1.
  2.  **Lógica de Fetching:** Na página principal (`src/pages/index.js`), usar `useEffect` (para desenvolvimento) ou uma função de data-fetching do Gatsby (como `getServerData` ou `sourceNodes` em `gatsby-node.js` para o build) para chamar a nossa API `http://localhost:3000/api/public/content` com o header de autorização correto.
  3.  **Renderização Dinâmica:** Mapear os dados recebidos da API para renderizar os componentes da página dinamicamente. Por exemplo, a seção `hero` será populada com o título e subtítulo vindos da API.

### Fase 2: O Importador de Conteúdo Estático

- **Objetivo:** Implementar a arquitetura descrita em `docs/plano-importer.md` para permitir a migração de conteúdo de estruturas de arquivos para o DashMaster.
- **Plano de Ação (Resumido):**
  1.  **Desenvolver a UI do Importador:** Criar a interface no Dashboard para o usuário iniciar o processo.
  2.  **Backend (Fase de Análise):** Implementar a lógica para ler a estrutura de arquivos e gerar o `import-plan.json`.
  3.  **Backend (Fase de Execução):** Implementar o endpoint que recebe o plano e cria os `ContentTypes`, `Sections` e `Items` no banco de dados.

### Fase 3: Visão de Futuro - O Publicador Automatizado

- **Objetivo:** Implementar a arquitetura descrita em `docs/plano-caas.md` para permitir a publicação de sites com um clique.
- **Plano de Ação (Resumido):**
  1.  **Criar API de Publicação:** Desenvolver o endpoint `POST /api/workspaces/[id]/publish` no `dashboard`.
  2.  **Desenvolver o GitHub Action:** Criar o workflow (`.github/workflows/publish-site.yml`) que:
      - É acionado pela API de Publicação.
      - Busca os dados da API de Conteúdo.
      - Executa o `gatsby build`.
      - Commita os arquivos gerados em uma pasta (`/sites/[workspaceId]`) em um repositório de destino.
  3.  **Integrar com Netlify:** Configurar sites no Netlify para monitorar o repositório de destino e fazer deploy automático a partir das pastas corretas.
  4.  **Desenvolver a UI no Dashboard:** Criar a interface para o usuário configurar e acionar o processo de publicação.

---
