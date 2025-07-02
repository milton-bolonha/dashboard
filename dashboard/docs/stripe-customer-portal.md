# 🔗 Integração com Stripe Customer Portal

## Visão Geral

O sistema utiliza o **Stripe Customer Portal** para gerenciamento de assinaturas, que oferece:

- Interface nativa do Stripe para cobrança
- Gerenciamento de assinaturas pelos usuários
- Histórico de faturas
- Atualização de métodos de pagamento
- Cancelamento de assinaturas

## Como Funciona

### 1. **Fluxo de Assinatura**

```mermaid
graph TD
    A[Usuário clica "Upgrade"] --> B[Redireciona para Customer Portal]
    B --> C[Stripe processa pagamento]
    C --> D[Webhook envia evento]
    D --> E[Sistema atualiza workspace]
    E --> F[Permissões liberadas]
```

### 2. **Eventos do Webhook**

O sistema processa estes eventos do Customer Portal:

- `customer.subscription.created` - Nova assinatura
- `customer.subscription.updated` - Mudança de plano
- `customer.subscription.deleted` - Cancelamento
- `invoice.payment_succeeded` - Pagamento aprovado
- `invoice.payment_failed` - Falha no pagamento

### 3. **Configuração do Customer Portal**

No Stripe Dashboard:

1. **Settings > Billing > Customer Portal**
2. **Ativar funcionalidades:**
   - ✅ Update payment methods
   - ✅ Cancel subscriptions
   - ✅ Switch plans
   - ✅ View invoice history
   - ✅ Download invoices

### 4. **URL de Redirecionamento**

```javascript
// Gerar URL do Customer Portal
const session = await stripe.billingPortal.sessions.create({
  customer: "cus_xxx", // ID do cliente
  return_url: "https://seuapp.com/dashboard/billing",
});

// Redirecionar usuário
window.location.href = session.url;
```

### 5. **Identificação do Workspace**

Como o Customer Portal não permite `client_reference_id`, identificamos o workspace via:

**Opção 1: Customer ID**

```javascript
// Salvar customer ID no workspace
workspace.stripe.customerId = "cus_xxx";

// No webhook, buscar workspace pelo customer
const workspace = await db.findOne("workspaces", {
  "stripe.customerId": event.data.object.customer,
});
```

**Opção 2: Metadata do Customer**

```javascript
// Ao criar customer, adicionar metadata
await stripe.customers.update(customerId, {
  metadata: {
    workspaceId: workspace._id,
  },
});
```

### 6. **Eventos Importantes**

#### `customer.subscription.updated`

```javascript
{
  "id": "sub_xxx",
  "object": "subscription",
  "customer": "cus_xxx",
  "items": {
    "data": [{
      "price": {
        "id": "price_xxx",
        "product": "prod_xxx"
      }
    }]
  },
  "status": "active" // active, past_due, canceled, etc
}
```

#### `invoice.payment_succeeded`

```javascript
{
  "id": "in_xxx",
  "customer": "cus_xxx",
  "subscription": "sub_xxx",
  "payment_intent": "pi_xxx",
  "amount_paid": 2900, // em centavos
  "status": "paid"
}
```

## Implementação no Dashboard

### 1. **Botão de Gerenciar Assinatura**

```jsx
// components/billing/ManageSubscription.jsx
function ManageSubscriptionButton() {
  const handleManageSubscription = async () => {
    const response = await fetch("/api/billing/portal", {
      method: "POST",
      headers: { "x-workspace-id": currentWorkspace._id },
    });

    const { url } = await response.json();
    window.location.href = url;
  };

  return (
    <button onClick={handleManageSubscription}>Gerenciar Assinatura</button>
  );
}
```

### 2. **API do Portal**

```javascript
// app/api/billing/portal/route.js
export async function POST(request) {
  const workspaceId = request.headers.get("x-workspace-id");
  const workspace = await db.findOne("workspaces", { _id: workspaceId });

  const session = await stripe.billingPortal.sessions.create({
    customer: workspace.stripe.customerId,
    return_url: `${process.env.NEXT_PUBLIC_URL}/dashboard/billing`,
  });

  return NextResponse.json({ url: session.url });
}
```

## Testes

### Webhook Testing

```bash
# Usar Stripe CLI para testar webhooks localmente
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Simular eventos
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_succeeded
```

### Portal Testing

1. Criar customer de teste
2. Criar subscription via Dashboard
3. Acessar Customer Portal
4. Testar mudanças de plano
5. Verificar se webhooks atualizam o sistema

## Segurança

### 1. **Verificação de Webhook**

```javascript
const sig = request.headers.get("stripe-signature");
const event = stripe.webhooks.constructEvent(
  body,
  sig,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

### 2. **Validação de Customer**

```javascript
// Verificar se customer pertence ao workspace
const workspace = await db.findOne("workspaces", {
  "stripe.customerId": customerId,
  "members.userId": userId, // Usuário atual
});
```

### 3. **Rate Limiting**

- Implementar rate limiting no endpoint do portal
- Validar permissões antes de gerar URL

## Monitoramento

### Logs Importantes

- Criação de sessões do portal
- Processamento de webhooks
- Erros de sincronização
- Mudanças de status de assinatura

### Métricas

- Taxa de conversão para assinatura
- Churn rate (cancelamentos)
- Revenue per workspace
- Uso de features por plano
