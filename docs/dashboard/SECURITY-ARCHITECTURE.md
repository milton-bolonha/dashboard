# Arquitetura de Segurança e Autenticação

Este documento descreve a arquitetura de segurança e o fluxo de autenticação e autorização da aplicação Dashboard.

---

## 1. Provedor de Identidade

- **Serviço:** [Clerk](https://clerk.com/)
- **Responsabilidades:** Gerenciamento de usuários (cadastro, login), sessões, perfis de usuário e metadados (como roles e permissões).

---

## 2. Autenticação (Quem é você?)

A verificação de identidade ocorre em dois níveis principais, seguindo uma estratégia **"Segura por Padrão"**.

### 2.1. Middleware (`middleware.js`)

- **Estratégia:** Proteger tudo por padrão. O acesso anônimo é a exceção, não a regra.
- **Implementação:**
  - A função `clerkMiddleware` intercepta todas as requisições que chegam ao servidor.
  - Uma lista de rotas públicas (`isPublicRoute`) é definida usando `createRouteMatcher`. Atualmente, inclui a página inicial (`/`) e os webhooks (`/api/webhooks(.*)`).
  - Para qualquer rota que **não** esteja na lista pública, o middleware executa `await auth.protect()`.
  - **Efeito:** Qualquer tentativa de acessar uma página ou API protegida sem uma sessão válida do Clerk resultará em um redirecionamento para a página de login.

### 2.2. Autenticação no Lado do Servidor (API Routes)

- **Desafio:** O helper padrão `auth()` do Clerk mostrou-se inconsistente em nosso ambiente de servidor.
- **Solução: "JWT Fallback Centralizado"**
  - **Localização:** `dashboard/lib/auth.js`
  - **Função Chave:** `getAuthenticatedUser()`
  - **Fluxo:**
    1. Tenta obter o `userId` via `auth()` padrão.
    2. Se falhar, decodifica o token de sessão JWT para extrair o `userId` (`sub` claim).
    3. Se ambos falharem, a requisição é rejeitada com um erro `401 Unauthorized`.
  - **Regra de Ouro:** **Toda lógica de backend (API, Server Actions) que precisa saber quem é o usuário DEVE usar `getAuthenticatedUser()`**.

---

## 3. Autorização (O que você pode fazer?)

Uma vez que um usuário é autenticado, a autorização é verificada em múltiplos níveis.

### Nível 1: Acesso Básico ao Dashboard

- **Concedido por:** Autenticação bem-sucedida (ver Seção 2).
- **Controlado por:** `middleware.js`.

### Nível 2: Acesso a Workspaces

- **Lógica:** Um usuário deve ser o `ownerId` de um workspace ou estar na lista de `members`.
- **Implementação:** Verificado dentro das rotas de API específicas que lidam com recursos de um workspace. A rota `/api/access/user-permissions` é um exemplo chave, validando o acesso do `userId` a um `workspaceId`.

### Nível 3: Permissões de Super Admin

- **Lógica:** Acesso a áreas administrativas globais (ex: criar chaves de acesso globais, gerenciar planos).
- **Implementação:**
  - A role `superadmin` é armazenada nos metadados privados do usuário no Clerk.
  - A função centralizada `checkSuperAdmin()` em `dashboard/lib/auth.js` é usada para verificar essa role.
  - Esta função usa `getAuthenticatedUser()` para garantir que a identidade do usuário seja resolvida corretamente antes de verificar a role.

### Como Proteger Novas Rotas de Admin (Exemplo Prático)

A arquitetura foi desenhada para ser modular. Para proteger uma nova rota de API e garantir que apenas Super Admins possam acessá-la, siga este padrão:

1.  **Importe** a função `checkSuperAdmin` no seu arquivo de rota.
2.  **Chame** a função logo no início do seu handler (`GET`, `POST`, etc.).
3.  **Verifique** o resultado. Se a função retornar um objeto de erro, retorne-o imediatamente.
4.  Se a verificação passar, o `userId` estará disponível no objeto de retorno para uso posterior.

**Exemplo de Código:**

```javascript
import { NextResponse } from "next/server";
import { checkSuperAdmin } from "@/lib/auth";

export async function POST(request) {
  // 1. Portão de segurança no início da rota
  const authCheck = await checkSuperAdmin();
  if (authCheck.error) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  // 2. Se o código chegou aqui, o usuário é um superadmin.
  // O ID do usuário está em `authCheck.userId`.
  console.log(`Usuário ${authCheck.userId} autorizado.`);

  // ... resto da sua lógica de negócio aqui ...

  return NextResponse.json({
    success: true,
    message: "Ação de admin concluída.",
  });
}
```

---

## 4. Integrações de Terceiros (Stripe)

- **Fluxo:** O Stripe se comunica com nossa aplicação via webhooks.
- **Segurança:**
  - A rota do webhook (`/api/webhooks/stripe`) é **pública** (definida no `middleware.js`) para permitir que o Stripe a acesse.
  - A segurança da rota não depende da sessão do usuário, mas da **verificação da assinatura do webhook**. Cada requisição do Stripe vem com uma assinatura no cabeçalho. Nosso backend deve usar a chave secreta do webhook do Stripe para verificar se a requisição é genuína e não foi adulterada. (Nota: A implementação real dessa verificação precisa ser garantida no código do handler do webhook).
