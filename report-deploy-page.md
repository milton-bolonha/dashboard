# Relatório de Incidente e Resolução: Erro 500 na Página de Deploy

**Data:** 03 de Agosto de 2025
**Feature Afetada:** Página de Deploy (`/dashboard/deploy`)
**Ambiente:** Produção (Netlify)

## 1. Sumário do Problema

Acessar a página de deploy em produção (`https://dashmaster.pro/dashboard/deploy`) resultava em um erro `500 Internal Server Error`, tanto ao carregar a página (`GET`) quanto ao tentar iniciar um novo deploy (`POST`). O erro também se manifestava localmente como uma página em branco ou parcialmente renderizada, impedindo o uso da funcionalidade.

O problema era multifacetado, envolvendo uma combinação de erros de build em produção, inconsistências de dados após a transferência de propriedade de um workspace e bugs de runtime no código do frontend e do backend.

---

## 2. Diagnóstico e Investigação

Seguindo os guias de desenvolvimento (`development-guide.md`, `DEBUGGING-GUIDE.md`), a investigação seguiu os seguintes passos:

1.  **Hipótese Inicial: Variáveis de Ambiente:** A primeira suspeita foi a falta de variáveis de ambiente (`APP_PUBLIC_URL`, `MONGODB_URI`, etc.) em produção. O usuário confirmou que todas as variáveis estavam configuradas, descartando essa hipótese.

2.  **Hipótese 2: Erro de Build (Causa Raiz):** A análise dos logs de build da Netlify revelou múltiplos erros de `Module not found` (`@netlify/open-api`, `lucide-react`). Isso apontou para um problema no **contexto de build**. O arquivo `netlify.toml` estava configurado com `base = "dashboard"`, o que fazia com que o `npm install` e o `build` rodassem de forma isolada, sem acesso à `node_modules` da raiz do monorepo.

3.  **Hipótese 3: Inconsistência de Dados (Agravante):** Após uma transferência de propriedade, o objeto `netlifyDeployment` estava presente no documento do `workspace`, mas a página quebrava ao tentar lê-lo. Isso foi causado por um bug na API (`GET /api/deploy/netlify`) que verificava a permissão usando apenas o `ownerId`, bloqueando o acesso para o antigo dono (agora `admin`).

4.  **Hipótese 4: Bugs de Runtime (Sintomas):**
    - A página de deploy (`DeployPage.jsx`) tentava ler propriedades de `currentWorkspace.netlifyDeployment` sem verificar se o objeto existia, causando um `TypeError` e o erro 500 quando os dados não eram encontrados (seja por falha na API ou por um workspace novo).
    - A API de deploy tinha caminhos de importação frágeis (`../../..`) e usava métodos de acesso a parâmetros da URL (`new URL(request.url)`) que não são robustos o suficiente para o ambiente de produção.

---

## 3. Resolução e Correções Aplicadas

A solução foi abordada em múltiplas frentes para tratar tanto a causa raiz quanto os sintomas:

1.  **Correção do Processo de Build (Solução Definitiva):**

    - **Arquivo:** `netlify.toml`
    - **Ação:** A configuração foi alterada para o padrão correto de monorepo:
      - `base` foi removido.
      - `command` foi alterado para `npm run build --workspace=dashboard`.
      - `publish` foi ajustado para `dashboard/.next`.
    - **Resultado:** Garante que a Netlify instale as dependências e construa o projeto a partir da raiz, resolvendo todos os erros de `Module not found` de forma permanente.

2.  **Robustez da API de Deploy:**

    - **Arquivo:** `dashboard/app/api/deploy/netlify/route.js`
    - **Ações:**
      - A verificação de permissão na rota `GET` foi corrigida para checar se o usuário é um `member` (`"members.userId": auth.userId`) em vez de apenas o `ownerId`.
      - A leitura de `searchParams` foi alterada para o método mais seguro `request.nextUrl.searchParams`.
      - As importações relativas frágeis (`../../..`) foram substituídas por aliases de caminho (`@/lib/...`).

3.  **Robustez da Página de Deploy (Frontend):**

    - **Arquivo:** `dashboard/app/dashboard/deploy/page.jsx`
    - **Ações:**
      - O componente agora aguarda o `WorkspaceContext` terminar de carregar (`workspaceLoading`) antes de tentar buscar o histórico de deploys, evitando "race conditions".
      - Foi adicionado tratamento de erro explícito. Se a API de histórico falhar, a página exibe uma mensagem de erro em vez de quebrar ou ficar em branco.
      - Foram adicionados "optional chaining" (`?.`) em todas as leituras do objeto `netlifyDeployment` para prevenir `TypeError` se o objeto não existir.

4.  **Padronização de Módulos:**

    - **Arquivo:** `dashboard/lib/deployment/deploy-orchestrator.mjs`
    - **Ação:** O arquivo foi renomeado para `deploy-orchestrator.js` para usar uma extensão mais padrão, e todas as suas importações foram atualizadas.

5.  **Correção do Modal de Configuração Vazio:**
    - **Arquivo:** `dashboard/app/dashboard/deploy/page.jsx`
    - **Problema:** O modal de configuração estava sendo renderizado vazio, sem os campos necessários para GitHub e Netlify tokens.
    - **Ações:**
      - Implementado formulário completo com campos para `GitHub Personal Access Token` e `Netlify Personal Access Token`.
      - Adicionado checkbox para "Usar repositório customizado" com campo condicional para URL do repositório.
      - Implementada validação no frontend para garantir que os tokens obrigatórios sejam preenchidos.
      - Adicionadas mensagens de ajuda para orientar o usuário sobre os tipos de token necessários.
      - Implementado tratamento de erro visual dentro do modal.

## 4. Conformidade com Guias de Desenvolvimento

Todas as correções implementadas seguem as **Regras de Ouro** estabelecidas no `development-guide.md`:

- **✅ Regra de Ouro #1 (Autenticação Centralizada):** A API `/api/deploy/netlify` usa `getCurrentAuth()` de `@/lib/auth` seguindo o padrão estabelecido.
- **✅ Regra de Ouro #2 (Acesso via `lib/db.js`):** Todas as operações de banco de dados utilizam o helper centralizado `db`.
- **✅ Regra de Ouro #3 (Nunca Confie no Frontend):** A validação de tokens e permissões é feita no backend, com o frontend apenas reagindo às respostas da API.
- **✅ Regra de Ouro #4 (GitHub Action Isolada):** O sistema passa todas as configurações necessárias via `inputs` para a GitHub Action, incluindo tokens e URLs de webhook.

As práticas de **debugging sistemático** foram aplicadas conforme `debugging-strategies-agent.mdc`:

- Uso estratégico de `console.log` para rastrear fluxo de dados
- Verificação de assumptions sobre tipos de dados e valores
- Teste com exemplos reproduzíveis mínimos
- Análise de requests/responses no dev tools

## 5. Problemas Adicionais Descobertos Durante a Análise

Durante a revisão completa em conformidade com os guias de desenvolvimento, foram identificados problemas adicionais de inconsistência arquitetural:

6.  **Inconsistência na Autenticação Centralizada:**
    - **Problema:** Algumas rotas de API ainda usavam métodos não padronizados (`auth()` direto ou `getAuthenticatedUser()`) em vez do método centralizado `getCurrentAuth()` especificado na **Regra de Ouro #1**.
    - **Rotas Corrigidas:**
      - `dashboard/app/api/users/sync/route.js` - GET endpoint migrado de `auth()` para `getCurrentAuth()`
      - `dashboard/app/api/auth/debug/route.js` - Atualizado para comparar ambos os métodos de debug
    - **Rotas Identificadas com `getAuthenticatedUser()` (necessitam migração futura):**
      - `/api/dashboard/stats`
      - `/api/content-types/[id]`
      - `/api/billing/transactions`
      - `/api/access-keys/activate`
      - `/api/access/check`
      - `/api/access/user-permissions`

## 6. Análise da Questão "Por que só essa rota tem problemas?"

A investigação revelou que a rota de deploy não era única em ter problemas, mas sim **a mais complexa** e **exposta a múltiplas vulnerabilidades simultâneas**:

1. **Complexidade de Build:** A única rota que dependia de processos de build com monorepo
2. **Modal Vazio:** Interface incompleta impedindo operação básica
3. **Race Conditions:** Dependência de carregamento assíncrono de workspace
4. **Permissões Pós-Transferência:** Primeira rota testada após mudança de propriedade
5. **Validação de Tokens:** Única funcionalidade que requer validação externa (GitHub/Netlify)

**Outras rotas também apresentavam inconsistências**, mas eram mascaradas por:

- Menor complexidade operacional
- Uso em cenários mais controlados
- Fallbacks silenciosos em caso de erro

## 7. Conclusão

O erro 500 na página de deploy foi causado por uma **confluência de problemas sistemáticos**:

- **Causa Primária:** Configuração de build inadequada para monorepo (`netlify.toml`)
- **Causa Secundária:** Interface incompleta (modal vazio) impedindo operação
- **Causa Terciária:** Inconsistências arquiteturais na autenticação e tratamento de dados

A resolução não apenas corrigiu a funcionalidade de deploy, mas também **expôs e iniciou a correção de inconsistências arquiteturais mais amplas** no sistema. O projeto agora está mais alinhado com suas próprias **Regras de Ouro** e práticas de desenvolvimento estabelecidas.

**Status Atual:**

- ✅ Deploy page totalmente funcional
- ✅ Modal de configuração implementado
- ✅ Conformidade com guias de desenvolvimento iniciada
- 🔄 Migração completa de autenticação em andamento (6 rotas restantes identificadas)
