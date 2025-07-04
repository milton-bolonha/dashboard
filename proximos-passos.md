# Próximos Passos para o Dashboard

Este documento delineia as próximas tarefas críticas para a evolução, estabilização e manutenção do projeto. Ele inclui **Avisos de Arquitetura e Segurança** baseados em desafios enfrentados anteriormente.

---

## 🏛️ Fase 0: Pilares de Estabilidade e Boas Práticas (LEIA ANTES DE CODAR)

Antes de adicionar novas funcionalidades, é crucial internalizar estes princípios para evitar a reintrodução de bugs complexos.

- **Aviso de Segurança #1: Autenticação Centralizada.**

  - **Problema:** Rotas de API usavam lógicas de autenticação inconsistentes, causando erros `401 Unauthorized`.
  - **Diretriz:** TODA rota de API que precisa de um usuário logado DEVE começar com `const { userId } = await getAuthenticatedUser();` de `lib/auth.js`. Não use o `auth()` do Clerk diretamente.

- **Aviso de Segurança #2: Autorização de Admin.**

  - **Problema:** Funções de superadmin ficavam desprotegidas.
  - **Diretriz:** TODA rota de API que executa uma ação de administrador DEVE ser protegida com `const authCheck = await checkSuperAdmin();`. Verifique o retorno `authCheck.error` imediatamente.

- **Aviso de Arquitetura #1: Queries ao Banco de Dados.**

  - **Problema:** Comparações de `_id` do MongoDB com strings de ID da URL causavam erros `404 Not Found`.
  - **Diretriz:** Ao buscar um documento por ID, SEMPRE converta o ID da string para um ObjectId: `new ObjectId(idDaString)`.

- **Aviso de Arquitetura #2: Funções de Biblioteca Robustas.**
  - **Problema:** Funções que chamam o banco de dados quebravam com erros `500` se recebessem filtros `undefined`.
  - **Diretriz:** Funções que constroem queries (como `listKeys` ou `listPlans`) devem ser robustas, verificando se os filtros existem e são válidos antes de adicioná-los à query do banco de dados.

---

## 🚀 Fase 1: Funcionalidades e Correções Imediatas

O foco aqui é resolver as lacunas de funcionalidade mais urgentes que impedem o uso completo das áreas de administração.

### 1. Implementar CRUD Completo para Planos

- **Página:** `/dashboard/admin/plans`
- **Problema:** Atualmente, a página lista os planos, mas não permite criar, editar ou excluir.
- **Ação:**
  - Adicionar um botão "Novo Plano" na interface.
  - Criar um formulário (pode ser em um modal) para preencher os detalhes de um novo plano.
  - Implementar a rota de API `POST /api/admin/plans` para salvar o novo plano no banco de dados.
  - Implementar as funcionalidades de Edição (`PUT /api/admin/plans/[id]`) e Exclusão (`DELETE /api/admin/plans/[id]`).
- **⚠️ Alertas para esta tarefa:**
  - **Segurança:** Todas as três novas rotas de API (`POST`, `PUT`, `DELETE`) **DEVEM** ser protegidas pela verificação `checkSuperAdmin`.
  - **Arquitetura:** As rotas `PUT` e `DELETE` precisarão de um ID. Lembre-se de converter o ID da URL para `ObjectId` antes de fazer a query no banco de dados.

### 2. Refatorar e Corrigir `lib/access-keys.js`

- **Problema:** A lógica de listagem de chaves foi movida para a rota da API como um desvio (`workaround`) para um bug na função `listKeys` da biblioteca.
- **Ação:**
  - Corrigir a função `AccessKeys.listKeys` em `dashboard/lib/access-keys.js` para que ela lide corretamente com filtros vazios ou `undefined`. O "Problema Recorrente 8" no guia de depuração tem a solução exata.
  - Após corrigir a biblioteca, refatorar a rota `GET /api/admin/access-keys` para voltar a usar `AccessKeys.listKeys(filters)`, tornando o código mais limpo e centralizado.
- **⚠️ Alertas para esta tarefa:**
  - **Arquitetura:** Aplique o padrão do "Problema Recorrente 8" do `DEBUGGING-GUIDE.md` para tornar a função `listKeys` robusta.

---

## 🛠️ Fase 2: Estabilidade e Qualidade de Código

Com as funcionalidades críticas no lugar, o foco muda para garantir que a aplicação seja robusta, fácil de depurar e resistente a regressões.

### 1. Criar Suíte de Testes Automatizados (E2E)

- **Objetivo:** Prevenir que correções futuras quebrem funcionalidades existentes.
- **Ferramenta Sugerida:** Playwright ou Cypress.
- **Testes Prioritários a Criar:**
  1.  **Fluxo de Super Admin:** Teste que simula o login, a promoção para superadmin usando uma chave, e a navegação para uma página de admin.
  2.  **CRUD de Content Types:** Teste que cria um novo tipo de conteúdo, adiciona um item, edita-o e depois o exclui.
  3.  **Acesso a Páginas:** Testes que verificam se um usuário comum é bloqueado de acessar as páginas `/admin/*` e se um superadmin consegue acessá-las.
- **⚠️ Alertas para esta tarefa:**
  - **Arquitetura:** Configure os testes para rodar contra um banco de dados de teste separado ou implemente um mecanismo de limpeza (setup/teardown) para não poluir sua base de desenvolvimento.

### 2. Implementar `DEBUG_MODE` Global

- **Objetivo:** Facilitar a depuração em ambientes de desenvolvimento sem poluir os logs de produção.
- **Ação:**
  - Adicionar uma variável `DASH_DEBUG_MODE=true` ao arquivo `.env.local`.
  - Criar uma função helper, por exemplo `logDebug(message, ...args)`, que só exibe o log no console se `process.env.DASH_DEBUG_MODE` for `true`.
  - Substituir os `console.log` de depuração espalhados pelo código por chamadas a esta nova função.
- **⚠️ Alertas para esta tarefa:**
  - **Segurança:** NUNCA faça log de dados sensíveis (chaves de API, tokens, informações pessoais do usuário), mesmo no modo de depuração.

### 3. Auditoria Completa das Rotas de API

- **Objetivo:** Garantir que todas as rotas de API seguem o novo padrão de segurança.
- **Ação:**
  - Revisar **todos** os arquivos em `dashboard/app/api/`.
  - Garantir que cada rota que precise de autenticação use `getAuthenticatedUser()`.
  - Garantir que cada rota de administração use `checkSuperAdmin()`.
  - Garantir que queries ao banco de dados com IDs de URL convertam a string para `ObjectId`.

---

## 📖 Fase 3: Documentação e Governança

Manter a documentação atualizada é crucial para a escalabilidade da equipe e do projeto.

### 1. Criar Guia de Testes para QA (Manual)

- **Objetivo:** Fornecer um roteiro claro para que um testador (ou um desenvolvedor) possa validar manualmente as principais funcionalidades da aplicação.
- **Ação:**
  - Criar um novo documento em `docs/dashboard/TESTING-PLAN.md`.
  - Detalhar passo a passo os fluxos de teste para um **usuário comum** (criar conteúdo, gerenciar seções) e para um **superadmin** (gerenciar planos, chaves, usuários).

### 2. Manter o `DEBUGGING-GUIDE.md` Atualizado

- **Cultura:** Sempre que um novo bug significativo for encontrado e resolvido, o primeiro passo após a correção deve ser adicionar uma nova entrada ao `docs/dashboard/DEBUGGING-GUIDE.md`. Isso cria uma base de conhecimento valiosa para o futuro.
