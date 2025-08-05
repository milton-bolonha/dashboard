# Guia de Depuração do Dashboard

Este documento é um registro vivo dos desafios de depuração que enfrentamos, das soluções que tentamos e das técnicas que se provaram eficazes. O objetivo é evitar a repetição de erros e acelerar a resolução de problemas futuros.

---

## Problema Recorrente 1: Erros `401 Unauthorized` em Rotas de API

- **Sintomas:**

  - Componentes do frontend (páginas em `/dashboard/*`) quebram ao tentar carregar dados.
  - O console do navegador mostra erros `401 Unauthorized` para chamadas a `/api/*`.
  - O console do servidor mostra que a função `auth()` do Clerk retorna um `userId` nulo ou `undefined`, mesmo com o usuário logado no frontend.
  - A rota de depuração `/api/debug/auth-check` confirma que `isLoggedIn` é `false` no servidor.

- **Causa Raiz:**

  - A comunicação entre o frontend e o backend do Next.js não está passando ou interpretando corretamente os cookies de sessão do Clerk, fazendo com que o helper `auth()` no lado do servidor falhe em identificar a sessão do usuário.

- **Técnicas que Falharam:**

  - Modificar incessantemente o `middleware.js` com diferentes configurações.
  - Tentar diferentes importações do Clerk (`@clerk/nextjs` vs. `@clerk/nextjs/server`).
  - Adicionar lógica de autenticação individual e duplicada em cada rota de API.

- **Técnica Vencedora: "JWT Fallback Centralizado"**
  - **Descrição:** Se o `auth()` padrão falha, não desistimos. Nós pegamos o token JWT bruto do cabeçalho da requisição e o decodificamos manualmente para extrair o `userId`.
  - **Implementação Definitiva:** Para evitar código duplicado, toda essa lógica foi centralizada em `dashboard/lib/auth.js`, na função `getAuthenticatedUser()`. **Toda rota de API que precisa de autenticação deve usar esta função.**

---

## Problema Recorrente 2: Erros de Build no Middleware (`Invalid path`)

- **Sintomas:**

  - O servidor de desenvolvimento do Next.js não consegue compilar.
  - O console do servidor mostra um erro `Error: Invalid path: /...` originado do `middleware.js`.

- **Causa Raiz:**

  - A função `createRouteMatcher` do Clerk usa a biblioteca `path-to-regexp`, que não suporta funcionalidades avançadas de regex como "negative lookaheads" (`(?!...)`).

- **Solução:**
  - **Abordagem "Segura por Padrão":** Em vez de tentar criar uma regra de regex complexa para _excluir_ rotas (ex: "proteger tudo em `/api` exceto `/api/webhooks`"), a abordagem correta é o inverso:
    1. Proteger **todas** as rotas por padrão.
    2. Usar `createRouteMatcher` para definir uma lista simples de rotas que são **públicas** (ex: `/`, `/api/webhooks(.*)`).
    3. No middleware, se a rota `!isPublicRoute`, então `auth.protect()`.

---

## Problema Recorrente 3: Erro de Build `Module not found: Package path ... is not exported`

- **Sintomas:**

  - O servidor de desenvolvimento falha ao compilar com um erro `Module not found`.
  - O erro aponta para uma importação de um caminho interno de um pacote em `node_modules`, como `@clerk/nextjs/dist/api/jwt`.
  - Isso quebra a aplicação inteira, pois a falha ocorre no momento do build.

- **Causa Raiz:**

  - O código estava tentando importar funcionalidades de um arquivo que não faz parte da API pública do pacote do Clerk. Isso é uma prática extremamente frágil que quebra facilmente com atualizações de pacotes.

- **Solução Definitiva: Usar Bibliotecas Padrão da Indústria**
  - **Descrição:** Em vez de depender de implementações internas e não documentadas, usamos a biblioteca `jose`, o padrão para manipulação de JWT em JavaScript.
  - **Implementação:**
    1. A dependência `jose` foi adicionada ao projeto (`npm install jose --workspace=dashboard`).
    2. A função `getAuthenticatedUser` em `lib/auth.js` foi reescrita.
    3. A nova versão usa `jwtVerify` e `createRemoteJWKSet` de `jose` para verificar a assinatura do token JWT do Clerk usando as chaves públicas (JWKS) fornecidas pela API do Clerk.
    4. Isso garante uma verificação segura e robusta, que não depende de detalhes de implementação internos do Clerk.
  - **Dependência de Ambiente:** Esta solução requer que a variável de ambiente `NEXT_PUBLIC_CLERK_FRONTEND_API` esteja corretamente configurada no arquivo `.env.local`, pois é a partir dela que a URL do JWKS é construída.

---

## Problema Recorrente 4: Erro em Runtime `TypeError: Invalid URL` ao acessar qualquer página

- **Sintomas:**

  - O servidor de desenvolvimento compila com sucesso, mas qualquer tentativa de acessar uma página protegida resulta em um erro 500.
  - O log do servidor mostra um `TypeError: Invalid URL` com `input: 'undefined/.well-known/jwks.json'`.
  - O erro se origina no arquivo `lib/auth.js`.

- **Causa Raiz:**

  - A variável de ambiente `NEXT_PUBLIC_CLERK_FRONTEND_API` não estava definida no arquivo `dashboard/.env.local`.
  - Nossa lógica de verificação de token JWT (`jose`) depende dessa variável para construir a URL correta e buscar as chaves públicas (JWKS) do Clerk. Sem ela, a URL era inválida.

- **Solução Definitiva: Configuração de Ambiente e Código Robusto**
  - **Ação 1 (Configuração):** A variável `NEXT_PUBLIC_CLERK_FRONTEND_API` foi adicionada ao `dashboard/.env.local` com o valor "Frontend API URL" do painel do Clerk.
  - **Ação 2 (Código Robusto):** O arquivo `lib/auth.js` foi aprimorado para verificar a existência dessa variável no momento da inicialização. Se a variável estiver ausente, o servidor agora lança um erro fatal imediato e claro, em vez de falhar de forma obscura durante uma requisição.

---

## Problema Recorrente 5: Erro `403 Forbidden` em Rotas de Admin

- **Páginas Afetadas:** `/dashboard/admin/access-keys`
- **Sintomas:** A página carrega, mas a chamada à API (ex: `/api/admin/access-keys`) falha com um erro `403 Forbidden`.
- **Causa Raiz:** Este erro é um **bom sinal**. Significa que a autenticação funcionou (`getAuthenticatedUser` identificou o usuário), mas a autorização falhou. A função `checkSuperAdmin` em `lib/auth.js` determinou corretamente que o usuário logado não possui a role `superadmin` nos seus metadados do Clerk.
- **Solução:** O usuário precisa ter a role de "superadmin".
  - **Ação:** Siga os passos no documento `docs/SUPERADMIN_SETUP.md` para gerar uma chave de ativação e promover o usuário atual a Super Admin.

---

## Problema Recorrente 6: Erro `401 Unauthorized` em Rotas Específicas

- **Páginas Afetadas:** `/dashboard/billing`
- **Sintomas:** A chamada à API da página (ex: `/api/billing/transactions`) falha com `401 Unauthorized`.
- **Causa Raiz:** A rota de API em questão ainda não foi refatorada para usar a nossa função de autenticação centralizada `getAuthenticatedUser()` em `lib/auth.js`. Ela ainda está usando a antiga lógica `auth()` do Clerk, que é inconsistente no nosso ambiente.
- **Solução:**
  - **Ação:** Editar o arquivo da rota da API (ex: `app/api/billing/transactions/route.js`) e substituir a verificação de autenticação manual pela chamada à nossa função `getAuthenticatedUser()`.

---

## Problema Recorrente 7: Erro `404 Not Found` em Rotas de API com ID

- **Páginas Afetadas:** `/dashboard/access/permissions`
- **Sintomas:** A chamada à API (ex: `/api/access/user-permissions`) falha com `404 Not Found`, mesmo que o dado exista no banco.
- **Causa Raiz:** A query ao MongoDB está comparando um `_id` (que é do tipo `ObjectId`) com uma string recebida da URL. O banco de dados não consegue encontrar a correspondência.
- **Solução:**
  - **Ação:** No arquivo da rota da API, a string de ID vinda da URL deve ser convertida para um `ObjectId` antes de ser usada na query do banco de dados. Ex: `import { ObjectId } from "mongodb"; ... new ObjectId(idDaUrl)`.

---

## Problema Recorrente 8: Erro `500 Internal Server Error` ao Listar Recursos (Ex: Access Keys)

- **Sintomas:**
  - Uma página de administração que deveria listar itens (ex: Chaves de Acesso) falha com um erro 500.
  - O erro acontece na rota `GET` que busca os dados.
- **Causa Raiz:**
  - A função que busca os dados no banco de dados (ex: `listKeys` em `lib/access-keys.js`) não é robusta o suficiente. Ela não consegue lidar com filtros que são `undefined` ou `null` (o que acontece quando a página é carregada sem nenhum filtro selecionado). A tentativa de construir uma query para o banco de dados com valores inválidos causa o erro.
- **Solução Definitiva: Funções de Busca Robustas**

  - **Ação:** A função de busca deve ser reescrita para construir o objeto `query` passo a passo, apenas adicionando chaves e valores se os filtros correspondentes existirem e forem válidos.
  - **Exemplo de Código (Correto):**

    ```javascript
    static async listKeys(filters = {}) {
      const query = {};

      if (filters.type) {
        query.type = filters.type;
      }
      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      }
      // Apenas adiciona o filtro de tags se for um array com conteúdo
      if (Array.isArray(filters.tags) && filters.tags.length > 0) {
        query.tags = { $in: filters.tags };
      }

      // Adicionar ordenação padrão para consistência
      const options = { sort: { createdAt: -1 } };

      return await db.find("access_keys", query, options);
    }
    ```

---

## Problema Recorrente 9: Menus de Super Admin Não Aparecem Mesmo com Role Correta

- **Sintomas:**

  - O painel do Clerk confirma que o usuário tem `privateMetadata: {role: "superadmin"}`
  - A rota `/api/debug/auth-check` retorna `401 Unauthorized` mesmo com usuário logado
  - Os menus de administração (controle de acesso, planos, keys, features) não aparecem no Sidebar
  - O processo de ativação de chave de super admin já foi executado anteriormente

- **Sequência de Correções Já Implementadas:**

  1. ✅ **Correção de Script Super Admin**: Script `generate-superadmin-key.js` foi corrigido para gerar chaves dinâmicas e solicitar `userId` do Clerk
  2. ✅ **Correção de Backend**: `access-keys/activate/route.js` foi modificado para validar `intendedUserId`
  3. ✅ **Correção de Modal**: `ActivateKeyModal.jsx` foi corrigido para omitir `workspaceId` em chaves de super admin
  4. ✅ **Correção de Crashes**: `WorkspaceContext.jsx` e `useUserPlanVerification.js` foram modificados para tratar 404 como estado normal
  5. ✅ **Correção de Sync**: `users/sync/route.js` foi alterado para usar email como chave primária
  6. ✅ **Correção de Preservação**: `billing/verify-user/route.js` foi modificado para preservar `privateMetadata`
  7. ✅ **Correção de Sidebar**: Import de `user` foi adicionado ao hook `useUser()` no `Sidebar.jsx`
  8. ✅ **Correção de API**: Rota `/api/debug/auth-check` foi atualizada para usar `getAuthenticatedUser()` centralizada

- **Status Atual da Investigação:**

  - ✅ Todas as variáveis de ambiente estão configuradas corretamente (confirmado pelo usuário)
  - ✅ **Usuário está logado** - Logs do servidor confirmam:
    - `'x-clerk-auth-status': 'signed-in'`
    - `userId = user_2zZNqqf3OlYsi0AB7KbyyqqpzpB`
    - Tokens de sessão válidos sendo enviados
    - Outras rotas funcionam normalmente (`/api/sections`, `/api/content-types`)
  - ❌ A rota `/api/debug/auth-check` ainda retorna `401 Unauthorized`
  - ❌ Menus de super admin não aparecem no Sidebar

- **Descoberta Crítica (via Logs):**

  - **O problema NÃO é autenticação** - usuário está claramente logado
  - **Outras rotas funcionam** - `/api/sections` e `/api/content-types` reconhecem o userId
  - **Problema específico** na rota `/api/debug/auth-check` que não está usando `getAuthenticatedUser()`

- **Causa Raiz Confirmada:**

  - A rota de debug ainda usa `auth()` diretamente em vez da função centralizada `getAuthenticatedUser()`
  - Outras rotas já foram migradas para o sistema correto

- **Descoberta Crítica de Segurança:**

  - ❌ **privateMetadata NÃO é acessível no frontend** - isto é por design de segurança do Clerk
  - ❌ **Sidebar tentava acessar** `user?.privateMetadata?.role` que sempre retorna `undefined` no frontend
  - ❌ **Páginas admin usavam** incorretamente `publicMetadata` em vez de `privateMetadata`

- **Solução Final Implementada:**

  - ✅ **Criada rota segura** `/api/auth/check-role` para verificar role do usuário
  - ✅ **Sidebar atualizado** para buscar role via API em vez de tentar acessar privateMetadata
  - ✅ **Corrigida rota** `/api/debug/auth-check` para usar `getCurrentAuth()`
  - ✅ **Corrigido clerkClient** - agora usa `ClerkServer.createClerkClient()` como no auth.js
  - ✅ **Sistema agora segue** arquitetura de segurança documentada

- **Status Esperado Agora:**

  - ✅ **Menus de super admin devem aparecer** após chamada à API retornar
  - ✅ **Rota `/api/auth/check-role`** deve retornar `{"isSuperAdmin": true}`
  - ✅ **Sistema seguro** - privateMetadata permanece protegido no backend

- **✅ PROBLEMA RESOLVIDO COM SUCESSO!**

  - 🎉 **Usuário confirmou:** "deu certo cachorro!"
  - ✅ **Menus de super admin apareceram** no Sidebar
  - ✅ **Sistema funcionando** com arquitetura de segurança correta
  - ✅ **privateMetadata protegido** no backend como esperado

- **Observações Importantes:**
  - ❌ **NÃO refazer** o processo de chave de super admin, pois o Clerk já confirma `role: "superadmin"`
  - ✅ **Problema era inconsistência** entre métodos de autenticação das rotas
  - ✅ **Todas as rotas agora usam** `getCurrentAuth()` consistentemente

---

## Problema Recorrente 12: Erros de Verificação de Plano em Ambiente de Desenvolvimento

- **Sintomas:**

  - Ao tentar criar um recurso (ex: Seção), a operação falha com um erro `500 Internal Server Error`.
  - O log do servidor mostra um `TypeError: Cannot read properties of undefined (reading 'getUser')` originado em `lib/plan-check.js`.
  - O erro acontece porque a função `checkPlan` tenta usar `clerkClient.users.getUser(userId)`, que não funciona de forma confiável no ambiente de desenvolvimento local.

- **Tentativa de Correção Incorreta (Anti-Padrão):**

  - A primeira sugestão foi adicionar uma verificação por `process.env.NODE_ENV === "development"` para simplesmente pular a verificação de plano em ambiente de desenvolvimento.
  - **Por que isso estava errado:** Esta abordagem cria uma divergência perigosa entre o ambiente de desenvolvimento e o de produção. Ela ignora nossa arquitetura de segurança já estabelecida, que se baseia em roles (`superadmin`), e introduz uma "solução mágica" que esconde problemas em vez de resolvê-los de forma consistente. Nós **não** criamos exceções para ambientes; nós criamos regras que funcionam em todos eles.

- **Solução Definitiva: Reforçar a Arquitetura de Roles**

  - **Causa Raiz Correta:** A verificação de plano não estava ciente da nossa regra de negócio mais importante: "Super Admins ignoram todas as restrições de plano".
  - **Ação:** A função `checkPlan` em `lib/plan-check.js` foi refatorada para, antes de mais nada, chamar a função `checkSuperAdmin()`.
  - **Lógica Final:**
    1.  O sistema verifica se o usuário é um Super Admin.
    2.  Se for, `checkPlan` retorna `true` imediatamente, concedendo acesso sem precisar chamar a API do Clerk.
    3.  Se não for, a lógica normal de verificação de plano (que funcionará em produção) continua.
  - **Resultado:** O erro em desenvolvimento foi eliminado **sem criar uma exceção de ambiente**. A solução fortalece nossa arquitetura, é mais segura e funciona de forma consistente tanto localmente quanto em produção.

---

## Problema Recorrente 13: Erro `405 Method Not Allowed` em Páginas de Edição

- **Sintomas:**

  - Após um redirecionamento bem-sucedido para uma página de edição (ex: `/dashboard/sections/.../items/.../edit`), a página falha ao carregar os dados.
  - O console do navegador mostra um erro `405 Method Not Allowed` para a chamada de API que deveria buscar os dados do item.
  - O console do servidor não mostra erros, apenas o log da requisição `GET ... 405`.

- **Causa Raiz:**

  - O erro `405` é extremamente específico e significa que a rota da API existe, mas não foi programada para aceitar o método HTTP que foi usado (neste caso, `GET`).
  - A página de edição precisa fazer uma requisição `GET` para buscar os dados do item e preencher o formulário.
  - A investigação do arquivo da rota da API (ex: `app/api/sections/[id]/items/[itemId]/route.js`) revelou que as funções para `PUT` (atualizar) e `DELETE` (deletar) foram implementadas, mas a função `GET` (buscar) foi esquecida.

- **Solução Definitiva: Implementar o Método HTTP Faltante**
  - **Ação:** A função `export const GET = withAuth(async (...) => { ... });` foi adicionada ao arquivo da rota da API correspondente.
  - **Lógica:** A nova função implementa a lógica de busca segura, usando `userId` e outros parâmetros da URL para garantir que o usuário só possa buscar itens que lhe pertencem.
  - **Resultado:** Com o método `GET` implementado, a página de edição passou a conseguir buscar os dados necessários, carregar o formulário e completar o fluxo de usuário.

---

## Problema Recorrente 11: Páginas Admin Mostram "Acesso Restrito" Mesmo para Super Admin

- **Sintomas:**

  - Páginas `/dashboard/admin/plans` e `/dashboard/admin/access-keys` mostram "Acesso Restrito"
  - Mensagem: "Esta área é restrita apenas para super administradores"
  - Usuário tem role "superadmin" confirmada no Clerk

- **Causa Raiz:**

  - Páginas admin usavam incorretamente `user?.publicMetadata?.role` no frontend
  - `publicMetadata` não contém a role (ela está em `privateMetadata`)
  - Mesmo problema de segurança identificado no Sidebar

- **Solução Implementada:**

  - ✅ **Páginas admin atualizadas** para usar `/api/auth/check-role` em vez de `publicMetadata`
  - ✅ **Estado de loading** adicionado durante verificação de role
  - ✅ **Mesma arquitetura segura** usada no Sidebar
  - ✅ **privateMetadata protegido** no backend

- **Status:**

  - ✅ **Corrigidas páginas:** `/dashboard/admin/plans` e `/dashboard/admin/access-keys`
  - ✅ **Sistema padronizado** - todas as verificações de role usam API segura
  - ✅ **Arquitetura de segurança** seguida consistentemente

- **✅ PROBLEMA RESOLVIDO COM SUCESSO!**

  - 🎉 **Usuário confirmou:** "deu certo!"
  - ✅ **Páginas admin funcionando** corretamente
  - ✅ **Sistema de super admin** totalmente operacional
  - ✅ **Arquitetura de segurança** implementada com sucesso

---

## Problema Recorrente 10: Seleção de Ícones em Content Types

- **Sintomas:**

  - Ao criar/editar Content Type, não aparece opção para escolher ícones
  - Feature de IconPicker pode estar faltando ou com bug

- **Status:** Aguardando investigação da implementação atual do `IconPicker.jsx`

---

_Este documento será atualizado à medida que novos desafios surgirem._

---

## Problema Recorrente 14: URLs de Imagem Quebradas no Site Final

- **Sintomas:**
  - O site buildado (Gatsby, Next, etc.) mostra imagens quebradas.
  - Ao inspecionar a URL da imagem, ela é um caminho relativo (ex: `/workspace-slug/uploads/...`) em vez de uma URL completa do Cloudinary (`https://res.cloudinary.com/...`).

- **Causa Raiz:**
  - O valor armazenado no banco de dados para a imagem é um `public_id` do Cloudinary (que pode conter `/`, ex: `workspace/section/user/img_id`), mas a API pública (`/api/public/content`) não está convertendo esse `public_id` em uma URL completa e pronta para consumo.
  - O template (Gatsby) recebe esse caminho parcial e o interpreta como uma rota local do site, resultando em um 404.

- **Tentativa de Correção Incorreta (Anti-Padrão):**
  - Adicionar lógica de processamento de URL dentro do template Gatsby (`gatsby-node.js`).
  - **Por que isso estava errado:** Isso viola nosso princípio de que a **API é a única fonte da verdade**. Os templates devem ser "burros" e apenas renderizar os dados que recebem. A responsabilidade de formatar os dados corretamente é sempre da API.

- **Solução Definitiva: Correção na API Pública**
  - **Ação:** A função `processImageUrls` dentro de `dashboard/app/api/public/content/route.js` foi refatorada para ser mais robusta.
  - **Lógica Final:**
    1. A função percorre recursivamente todos os dados que serão enviados para o cliente.
    2. Para cada valor do tipo `string`, ela aplica uma regra simples e eficaz: "Se **não** começa com `http` e **não** contém um `.` (extensão de arquivo), então é um `public_id` e deve ser convertido para uma URL completa do Cloudinary."
    3. Todos os outros valores são mantidos como estão.
  - **Resultado:** O template Gatsby recebe os dados 100% prontos para uso, sem precisar de nenhuma lógica de processamento de URL. A separação de responsabilidades é mantida, e o sistema fica mais robusto e fácil de manter.

