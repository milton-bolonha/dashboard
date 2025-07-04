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

_Este documento será atualizado à medida que novos desafios surgirem._
