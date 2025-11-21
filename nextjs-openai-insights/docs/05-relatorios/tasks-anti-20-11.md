# Relatório de Implementação - SaaS, Stripe & Clerk (20/11/2025)

## Resumo
Nesta sessão, implementamos a infraestrutura completa para os planos SaaS (Free, Pro, Pro Plus), integração com Stripe, controle de limites de uso, e autenticação com Clerk.

## 1. Documentação e Planejamento
- **Criado**: `docs/saas_plans.md` com a tabela detalhada de limites e preços.
- **Criado**: `src/lib/saas/plans.ts` definindo as constantes e tipos dos planos no código.
- **Criado**: `docs/env.example` com template de variáveis de ambiente.
- **Criado**: `docs/clerk_setup.md` com instruções de configuração do Clerk.

## 2. Banco de Dados (MongoDB)
- **Atualizado**: Modelo `User` (`src/lib/db/models/User.ts`) para incluir:
  - `plan`: Enum ("FREE", "PRO", "PRO_PLUS").
  - `stripeCustomerId`, `subscriptionId`, `subscriptionStatus`.
  - `usage`: Objeto para rastrear consumo (tokens, companies, contacts, files).

## 3. Lógica de Negócios (SaaS)
- **Criado**: `src/lib/saas/usage-service.ts`
  - `checkLimit(userId, type, amount)`: Verifica se o usuário pode realizar a ação baseada no plano.
  - `incrementUsage(userId, metric, amount)`: Atualiza os contadores no banco.
  - `getUserUsage(userId)`: Retorna o uso atual e o plano do usuário.

## 4. Integração Stripe
- **Instalado**: Pacote `stripe`.
- **Implementado**: Webhook em `src/app/api/webhooks/stripe/route.ts`.
  - Escuta eventos `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
  - Atualiza automaticamente o plano do usuário no MongoDB ao receber confirmação de pagamento.
  - Migra dados de "Guest" para "Member" após o checkout.
  - **SEGURANÇA**: Ativada validação de assinatura do webhook usando `stripe.webhooks.constructEvent`.

## 5. Autenticação Clerk
- **Instalado**: Pacote `@clerk/nextjs`.
- **Criado**: `middleware.ts` na raiz para proteção de rotas.
- **Atualizado**: `src/lib/providers.tsx` para envolver o app com `ClerkProvider`.
- **Atualizado**: `src/lib/auth/get-auth.ts` para usar `auth()` do Clerk.
- **Criado**: Páginas de sign-in e sign-up em `/sign-in/[[...sign-in]]/page.tsx` e `/sign-up/[[...sign-up]]/page.tsx`.

## 6. Aplicação de Limites (Enforcement)
Implementamos verificações de limite nas principais rotas da API:

### Criação de Empresas (Workspaces)
- **Arquivo**: `src/app/api/generate/route.ts`
- **Lógica**: Antes de gerar um novo workspace, verifica `checkLimit(userId, "companies")`.
- **Ação**: Incrementa `companiesCount` após salvar no MongoDB.

### Criação de Contatos
- **Arquivo**: `src/app/api/workspace/contacts/route.ts`
- **Lógica**: Verifica `checkLimit(userId, "contacts")` antes de gerar o outreach.
- **Ação**: Incrementa `contactsCount` após salvar.

### Geração de Tiles (Tokens)
- **Arquivo**: `src/app/api/workspace/tiles/route.ts`
- **Lógica**: Verifica `checkLimit(userId, "tokens", cost)` antes de chamar a OpenAI.
- **Middleware**: `src/lib/server/usage-middleware.ts` atualizado para usar o novo `usage-service`.
- **Ação**: Incrementa `tokensUsed` (estimado em 100 tokens/tile por enquanto, conforme plano).

### Limites de Convidado (Guest)
- **Restaurado**: Rastreamento em memória no `usage-middleware.ts`.
- **Limites**: 1000 tiles/dia, 200 tiles/hora, 20 req/min.

## 7. Correções e Ajustes
- Corrigidos erros de TypeScript no webhook do Stripe (tipagem de eventos).
- Corrigidos erros de redeclaração de variáveis em `tiles/route.ts`.
- Atualizado webhook do Stripe para aceitar `client_reference_id` (para checkout de guests).
- Criada lógica para gerar `userId` placeholder se o guest pagar sem conta.

## Próximos Passos (Ações do Usuário)

1. **Configurar Clerk**:
   - Criar conta em [clerk.com](https://clerk.com)
   - Criar aplicação
   - Copiar `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` e `CLERK_SECRET_KEY`
   - Adicionar ao `.env.local`

2. **Configurar Webhook do Stripe**:
   - Ir em Stripe Dashboard > Developers > Webhooks
   - Adicionar endpoint: `https://seudominio.com/api/webhooks/stripe`
   - Selecionar eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copiar webhook secret para `.env.local`

3. **Testar**:
   ```bash
   npm run build
   npm run dev
   ```
