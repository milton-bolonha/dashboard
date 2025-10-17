# ⚔️ Plano de Batalha da Semana (07/07/23) - Edição Superar!

## Sumário Executivo

Esta semana, nosso foco é validar 100% o _core_ do sistema e, para nos superarmos, vamos iniciar a fundação da próxima camada crítica de negócio: o sistema de roles. Este documento detalha o que será testado, como nos prepararmos e qual nova frente de desenvolvimento abriremos.

---

## 🗺️ Tabela Mestra de Tarefas do Projeto

| Tarefa                                                    | Prioridade / Fase | Status                        |
| --------------------------------------------------------- | ----------------- | ----------------------------- |
| **Ciclo de Testes Manuais (Workspaces, Itens, API Keys)** | MVP (Fase 1)      | 🎯 **FOCO DESTA SEMANA**      |
| **Modelagem e API de Roles/Permissões/Acessos/Bloqueios** | MVP (Fase 1)      | 🚀 **NOVO FOCO DESTA SEMANA** |
| Desenvolver Forms Multi-Steps                             | MVP (Fase 1)      | Próxima Prioridade            |
| Incluir Planos e Addons no Stripe                         | MVP (Fase 1)      | Próxima Prioridade            |
| Separar Aplicação (Split Home/Dashboard)                  | MVP (Fase 1)      | Aguardando Base Sólida        |
| Integração nos Domínios Oficiais                          | MVP (Fase 1)      | Aguardando Base Sólida        |
| Criar Suíte de Testes Automatizados (E2E)                 | Pós-MVP (Fase 2)  | Futuro                        |
| Refatorar `lib/access-keys.js`                            | Pós-MVP (Fase 2)  | Futuro                        |
| ... (e outras tarefas das fases 2 e 3)                    | Pós-MVP           | Futuro                        |

---

### Tarefa 1 a 4: Ciclo de Testes de Validação do Core

- **Objetivo:** Executar os cenários definidos para Workspaces, Planos, Conteúdo, API Keys e Exportação.
- **Status:** Sem alterações, plano mantido conforme definido anteriormente.
- **Execução:** Siga os checklists detalhados abaixo.

---

### 🚀 Tarefa 5 (Nova): Modelagem e API Inicial do Sistema de Roles

- **Objetivo:** Definir a estrutura de dados para roles (`admin`, `user` de um workspace) e implementar os endpoints básicos da API para atribuir e verificar essas roles. Isso destrava a lógica de permissões granulares.
- **Preparação (Assistente 🤖):**
  - **Análise de Arquitetura:** Vou analisar o schema atual de `users` e `workspaces` no MongoDB para propor a forma mais eficiente de associar um `userId` a uma `role` dentro de um `workspace`. A melhor abordagem provavelmente é um array no documento do workspace, ex: `members: [{ userId: '...', role: 'admin' }]`.
  - **Proposta de API:** Vou desenhar a estrutura de uma nova rota de API, como `POST /api/workspaces/[id]/members`, que permitiria a um admin do workspace convidar e atribuir uma role a um novo membro.
  - **Arquivos-Chave:** `dashboard/app/api/workspaces/[id]/route.js` (para edição), `schemas/index.js` (para novo schema).
- **Execução do Teste (Você 👨‍💻):**
  - [ ] **Cenário 6: Atribuição e Verificação de Role**
    - [ ] Usando o MongoDB Compass ou um script, adicione manualmente um `userId` e a role `admin` a um `workspace`.
    - [ ] Crie (ou modifique) um endpoint de API que só deva ser acessível por um `admin` de workspace.
    - [ ] Tente acessar esse endpoint com o usuário que você promoveu a admin. O acesso deve ser permitido.
    - [ ] Tente acessar o mesmo endpoint com um usuário comum (não-membro ou com role de `user`). O acesso deve ser bloqueado com um erro 403.
- **O que Observar:** A estrutura de dados proposta faz sentido? A lógica de verificação na API é clara e segura?

---

_Checklists detalhados para as tarefas 1-4 permanecem abaixo._

### Tarefa 1: Workspaces e Planos (O Coração do Acesso)

- **Objetivo:** Garantir que os limites de planos funcionam e que os dados dos workspaces são 100% isolados entre os usuários.
- **Preparação (Assistente 🤖):**
  - **Análise de Código:** Vou revisar a rota `POST /api/workspaces` e a função `plan-check.js` para confirmar que a verificação de limite de workspaces ocorre **antes** de qualquer escrita no banco de dados.
  - **Ponto de Falha Comum:** A lógica de contagem de workspaces (`db.collection('workspaces').countDocuments({ userId })`) pode falhar se o `userId` não for tratado corretamente. Vou verificar se a query está robusta.
  - **Arquivos-Chave:** `dashboard/app/api/workspaces/route.js`, `dashboard/lib/plan-check.js`, `dashboard/lib/auth.js`.
- **Execução do Teste (Você 👨‍💻):**
  - [ ] **Cenário 1: Limite de Workspaces**
    - [ ] Faça login com um usuário no plano "Free".
    - [ ] Tente criar mais workspaces do que o permitido.
    - [ ] **Observar:** O sistema deve bloquear e exibir uma mensagem clara de "limite atingido", sugerindo um upgrade.
  - [ ] **Cenário 2: Isolamento de Dados**
    - [ ] Crie `UsuarioA` e `UsuarioB`.
    - [ ] Com `UsuarioA`, crie `WorkspaceA` com conteúdo dentro.
    - [ ] Faça logout, entre como `UsuarioB` e tente acessar a URL do `WorkspaceA`.
    - [ ] **Observar:** O acesso deve ser impossível (403 ou 404).

### Tarefa 2: Seções, Content Types e Itens (O Core do Conteúdo)

- **Objetivo:** Validar o fluxo completo de criação de conteúdo, garantindo que a interface é intuitiva e que a integridade dos dados é mantida.
- **Preparação (Assistente 🤖):**
  - **Análise de Código:** Vou revisar as APIs de `content-types`, `sections` e `items`, focando na validação dos dados de entrada e na integridade das referências (como `workspaceId`).
  - **Ponto de Falha Comum:** Criar uma `section` ou `item` associado a um `content-type` que não existe, ou com um `workspaceId` incorreto. Vou verificar se a API valida a existência dessas referências antes de salvar.
  - **Arquivos-Chave:** `dashboard/app/api/content-types/route.js`, `dashboard/app/api/sections/route.js`, `dashboard/schemas/index.js`.
- **Execução do Teste (Você 👨‍💻):**
  - [ ] **Cenário 3: Fluxo Completo de Conteúdo**
    - [ ] Crie um novo Tipo de Conteúdo (ex: "Artigo").
    - [ ] Crie uma nova Seção (ex: "Blog") e associe-a ao tipo "Artigo".
    - [ ] Acesse a seção "Blog" e adicione um novo item ("Meu Primeiro Artigo").
    - [ ] Edite o item recém-criado.
    - [ ] Exclua o item.
    - [ ] **Observar:** O fluxo é lógico e sem atritos? A interface responde bem? Algum erro inesperado?

### Tarefa 3: API Keys (Acesso Externo)

- **Objetivo:** Garantir que as chaves de API podem ser gerenciadas pelo usuário e que elas autenticam corretamente os endpoints protegidos.
- **Preparação (Assistente 🤖):**
  - **Análise de Código:** Vou auditar o `dashboard/lib/access-keys.js`. As chaves devem ser geradas de forma segura e armazenadas como _hash_ no banco, nunca em texto plano. A verificação deve comparar o hash da chave recebida com o hash armazenado.
  - **Ponto de Falha Comum:** A geração de chaves não ser aleatória o suficiente, ou o processo de verificação ser vulnerável a ataques de _timing_.
  - **Arquivos-Chave:** `dashboard/lib/access-keys.js`, e um exemplo de rota de API que usa a autenticação por chave.
- **Execução do Teste (Você 👨‍💻):**
  - [ ] **Cenário 4: Gestão e Autenticação de Chaves**
    - [ ] No dashboard, crie uma nova chave de API.
    - [ ] Copie a chave no momento da criação.
    - [ ] Use uma ferramenta (Postman/Insomnia) para acessar um endpoint protegido com a chave (`Authorization: Bearer SUA_CHAVE`).
    - [ ] Tente acessar o mesmo endpoint com uma chave inválida.
    - [ ] Volte ao dashboard e exclua a chave.
    - [ ] **Observar:** O sistema permite copiar a chave facilmente? A resposta para a chave inválida é um claro `401 Unauthorized`?

### Tarefa 4: Exportação e Autorização de Dados

- **Objetivo:** Confirmar que os mecanismos de exportação de dados respeitam a autenticação e, mais importante, a autorização (propriedade dos dados).
- **Preparação (Assistente 🤖):**
  - **Análise de Código:** Vou procurar por qualquer endpoint de "export" e garantir que ele não apenas verifica se o usuário está logado (`getAuthenticatedUser`), mas também se o `userId` da sessão é o mesmo `userId` associado ao workspace que está sendo exportado.
  - **Ponto de Falha Comum:** A API verifica a autenticação, mas esquece de verificar a autorização.
  - **Arquivos-Chave:** As rotas de API dentro de `dashboard/app/api` que possuam funcionalidade de exportação.
- **Execução do Teste (Você 👨‍💻):**
  - [ ] **Cenário 5: Exportação Segura**
    - [ ] Logado como `UsuarioA`, tente acessar a URL de exportação do `WorkspaceB` (do `UsuarioB`).
    - [ ] **Observar:** O acesso deve ser bloqueado, mesmo estando autenticado (erro 403 ou 404).
