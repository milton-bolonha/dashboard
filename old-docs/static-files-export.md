# Plano de Ação - Sincronização de Conteúdo com Arquivos Estáticos (Git-Based)

**Objetivo:** Implementar um sistema que permita que `Sections` sejam exportadas como arquivos estáticos (Markdown/JSON) para o sistema de arquivos local e, opcionalmente, sincronizadas com um repositório Git, transformando o DashMaster.PRO em um Git-Based Headless CMS.

**Posicionamento no Plano:** Fase 3. Esta é uma funcionalidade avançada que depende da robustez do `deckEngine` (implementado na Fase 2) e se alinha com a estratégia de monetização e API para desenvolvedores.

---

## Arquitetura da Solução

1.  **Configuração por Section:** O usuário poderá habilitar a sincronização nas configurações de uma `Section` específica, definindo o formato dos arquivos e, opcionalmente, os detalhes de um repositório Git.
2.  **Motor de Sincronização (`deckEngine`):** Um novo **Deck** no `deckEngine` será responsável por orquestrar todo o processo: buscar os dados, formatar, escrever os arquivos e, se configurado, executar os comandos Git.
3.  **Gatilhos (Triggers):** A sincronização poderá ser acionada de duas formas:
    - **Manualmente:** Por um botão "Sincronizar Agora" na UI.
    - **Automaticamente:** Através de eventos (`item.created`, `item.updated`) que iniciam uma "partida" no `deckEngine`.
4.  **Estrutura de Arquivos:** Os arquivos serão salvos em um diretório `content/` na raiz do projeto, seguindo a estrutura `content/[section-slug]/[item-slug].(md|json)`.

---

## Tarefas Detalhadas

### 1. Backend: Configuração e Lógica de Sincronização

- [ ] **Atualizar o Schema da `Section`:**
    - Adicionar um novo objeto de configuração ao schema:
    ```json
    {
      "staticSync": {
        "enabled": { "type": "boolean", "default": false },
        "format": { "type": "string", "enum": ["json", "markdown"], "default": "markdown" },
        "gitBased": { "type": "boolean", "default": false },
        "gitRepoUrl": { "type": "string" },
        "gitBranch": { "type": "string", "default": "main" },
        "gitAccessToken": { "type": "string" } // Será armazenado de forma segura
      }
    }
    ```

- [ ] **Criar o Deck `content-sync` no `deckEngine`:**
    - **Carta 1: `fetchSectionItems`**: Busca todos os `Items` da `Section` a ser sincronizada.
    - **Carta 2: `formatAndWriteFiles`**: Itera sobre os `Items`. Para cada um, formata o conteúdo (JSON ou Markdown com frontmatter) e escreve o arquivo na estrutura `content/[section-slug]/[item-slug].ext`. Também remove arquivos de `Items` que foram deletados.
    - **Carta 3: `gitCommitAndPush`**: Se `gitBased` for `true`, esta carta usará a biblioteca `simple-git` para:
        1.  `git add .` no diretório `content/`.
        2.  `git commit -m "[SYNC] Atualização de conteúdo da section [section-slug]"`.
        3.  `git push` para a `gitRepoUrl` configurada, usando o `gitAccessToken`.

- [ ] **Implementar os Gatilhos:**
    - **API para Gatilho Manual:** Criar um endpoint `POST /api/sections/{id}/sync` que inicia uma partida no deck `content-sync`.
    - **Gatilho Automático:** Configurar `EventRoutes` no `deckEngine` para escutar eventos de CRUD nos `Items` de sections com `staticSync.enabled: true` e iniciar a partida.

### 2. Frontend: UI para Configuração

- [ ] **Criar Componente de Configuração:**
    - Na página de edição de uma `Section`, adicionar uma nova aba "Sincronização Estática".
    - Criar um formulário para o usuário preencher os campos do objeto `staticSync`.
    - O `gitAccessToken` deve ser tratado como um campo de senha e nunca ser exibido após salvo.

- [ ] **Adicionar Controles na UI:**
    - Incluir um botão "Sincronizar Agora" que chama a API de gatilho manual.
    - Exibir o status da última sincronização (ex: "Última sincronização bem-sucedida há 5 minutos").

### 3. Dependências e Segurança

- [ ] **Instalar `simple-git`:** Adicionar a biblioteca `simple-git` ao `package.json` do `dashboard`.
- [ ] **Segurança de Tokens:** Garantir que os `gitAccessToken` sejam criptografados no banco de dados e nunca expostos em logs ou respostas de API.

---

## ✅ Critérios de Sucesso

- O usuário pode configurar uma `Section` para ser sincronizada com arquivos locais.
- Ao salvar um `Item`, o arquivo correspondente é criado/atualizado no diretório `content/`.
- Se o modo Git-Based estiver ativado, as alterações nos arquivos são automaticamente commitadas e enviadas para o repositório Git configurado.
- A UI fornece feedback claro sobre o status da sincronização.