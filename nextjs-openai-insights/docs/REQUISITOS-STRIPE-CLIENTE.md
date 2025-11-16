# 📋 Requisitos Stripe - Checklist para Cliente

## 🎯 Objetivo

Configurar integração completa com Stripe para processar assinaturas do Pro Plan e migrar dados de guest para member após pagamento.

---

## ✅ 1. Variáveis de Ambiente Necessárias

### Para Testes (Stripe Test Mode):

```bash
# URL pública do checkout (gerada pelo Stripe)
NEXT_PUBLIC_STRIPE_CHECKOUT_URL=https://checkout.stripe.com/c/pay/cs_test_...

# Chave secreta da API (server-side)
STRIPE_SECRET_KEY=sk_test_...

# Secret do webhook (para validar eventos)
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Para Produção (Stripe Live Mode):

```bash
# URL pública do checkout (gerada pelo Stripe)
NEXT_PUBLIC_STRIPE_CHECKOUT_URL=https://checkout.stripe.com/c/pay/cs_live_...

# Chave secreta da API (server-side)
STRIPE_SECRET_KEY=sk_live_...

# Secret do webhook (para validar eventos)
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 🛒 2. Configuração do Plano no Stripe Dashboard

### Plano de Teste (para desenvolvimento):

- **Nome**: "Pro Plan - Test"
- **Preço**: Qualquer valor (ex: $1.00 ou R$ 1,00)
- **Recorrência**: Mensal ou Anual (definir qual)
- **Descrição**: "Plano Pro - Acesso completo sem limites"
- **ID do Preço**: `price_test_...` (será usado no código)

### Plano de Produção (final):

- **Nome**: "Pro Plan"
- **Preço**: Valor real definido pelo cliente
- **Recorrência**: Mensal ou Anual
- **Descrição**: "Plano Pro - Acesso completo sem limites"
- **ID do Preço**: `price_...` (será usado no código)

**⚠️ IMPORTANTE**: Anotar o **Price ID** de cada plano (aparece no Stripe Dashboard após criar o produto/preço).

---

## 🔗 3. Configuração do Checkout Session

### URLs de Redirecionamento:

- **Success URL**: `https://seudominio.com/admin?checkout=success`
- **Cancel URL**: `https://seudominio.com/admin?upgrade=cancelled`

### Metadata Necessário:

O checkout session DEVE incluir os seguintes metadados:

```json
{
  "userId": "clerk_user_id_ou_email",
  "sessionId": "session_id_do_workspace_atual"
}
```

**⚠️ IMPORTANTE**:

- `userId` é obrigatório (será usado para associar dados no MongoDB)
- `sessionId` é opcional (usado para migrar workspace específico)

### Como Criar Checkout Session:

```javascript
// Exemplo de código que o cliente precisa executar no Stripe Dashboard
// ou via API para gerar a URL do checkout

const session = await stripe.checkout.sessions.create({
  mode: "subscription",
  line_items: [
    {
      price: "price_test_...", // ID do preço do plano
      quantity: 1,
    },
  ],
  success_url: "https://seudominio.com/admin?checkout=success",
  cancel_url: "https://seudominio.com/admin?upgrade=cancelled",
  metadata: {
    userId: "user_123", // OBRIGATÓRIO
    sessionId: "session_456", // OPCIONAL
  },
});

// A URL do checkout será: session.url
// Essa URL deve ser configurada em NEXT_PUBLIC_STRIPE_CHECKOUT_URL
```

---

## 🔔 4. Configuração do Webhook

### Endpoint do Webhook:

```
https://seudominio.com/api/webhooks/stripe
```

### Eventos que DEVEM ser escutados:

- ✅ `checkout.session.completed` (OBRIGATÓRIO)
- ✅ `customer.subscription.updated` (recomendado)
- ✅ `customer.subscription.deleted` (recomendado)

### Como Configurar no Stripe Dashboard:

1. Acesse: **Stripe Dashboard → Developers → Webhooks**
2. Clique em **"Add endpoint"**
3. Cole a URL: `https://seudominio.com/api/webhooks/stripe`
4. Selecione os eventos acima
5. Copie o **Signing secret** (começa com `whsec_...`)
6. Configure em `STRIPE_WEBHOOK_SECRET`

**⚠️ IMPORTANTE**:

- Para testes locais, use **Stripe CLI** para encaminhar eventos:
  ```bash
  stripe listen --forward-to localhost:3000/api/webhooks/stripe
  ```
- O secret será exibido no terminal (use esse para testes locais)

---

## 📊 5. Informações sobre Planos Finais

### Precisamos saber:

- [ ] **Valor do plano**: R$ X,XX / mês ou ano?
- [ ] **Recorrência**: Mensal ou Anual?
- [ ] **Período de teste**: Oferecer trial? Quantos dias?
- [ ] **Desconto**: Algum desconto para plano anual?
- [ ] **Limites reais**: Mesmo sendo "Pro Plan", há limites? (ex: 1000 tiles/dia)
- [ ] **Múltiplos planos**: Haverá mais de um plano? (ex: Basic, Pro, Enterprise)

---

## 🧪 6. Checklist de Testes

### Testes que DEVEM ser feitos:

- [ ] Criar checkout session com metadata correto
- [ ] Testar pagamento com cartão de teste: `4242 4242 4242 4242`
- [ ] Verificar se webhook recebe `checkout.session.completed`
- [ ] Verificar se dados são migrados para MongoDB após pagamento
- [ ] Verificar se usuário vira "member" após pagamento
- [ ] Testar cancelamento de assinatura
- [ ] Testar atualização de assinatura

### Cartões de Teste Stripe:

- **Sucesso**: `4242 4242 4242 4242`
- **Falha**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`
- **Data**: Qualquer data futura
- **CVC**: Qualquer 3 dígitos

---

## 📝 7. Resumo do que Precisamos Receber

### Obrigatório:

1. ✅ `NEXT_PUBLIC_STRIPE_CHECKOUT_URL` (URL do checkout session)
2. ✅ `STRIPE_SECRET_KEY` (chave secreta da API)
3. ✅ `STRIPE_WEBHOOK_SECRET` (secret do webhook)
4. ✅ Price ID do plano (teste e produção)
5. ✅ URLs de sucesso/cancelamento confirmadas

### Recomendado:

6. ✅ Informações sobre planos finais (valores, recorrência)
7. ✅ Confirmação de que metadata está sendo enviado corretamente
8. ✅ Teste completo do fluxo de pagamento

---

## 🚨 Problemas Comuns

### ❌ Webhook não recebe eventos:

- Verificar se URL está correta
- Verificar se eventos estão selecionados no Stripe Dashboard
- Para testes locais, usar Stripe CLI

### ❌ Metadata não está sendo enviado:

- Verificar código que cria checkout session
- Metadata DEVE ser passado ao criar a session

### ❌ Migração não funciona:

- Verificar se `userId` está no metadata
- Verificar logs do webhook no Stripe Dashboard
- Verificar logs do servidor

---

## 📞 Próximos Passos

1. **Cliente cria produto e preço** no Stripe Dashboard
2. **Cliente gera checkout session** com metadata
3. **Cliente configura webhook** endpoint
4. **Cliente fornece todas as variáveis** de ambiente
5. **Testamos o fluxo completo** juntos

---

**Última atualização**: 2025-01-14
