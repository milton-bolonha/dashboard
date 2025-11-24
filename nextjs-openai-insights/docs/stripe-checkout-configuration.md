# Configuração do Stripe Checkout

## Configurar Redirecionamento com session_id

Para que o sistema funcione corretamente após o pagamento, você precisa configurar o Stripe Checkout para redirecionar com `session_id` na URL.

### Opção 1: Usando Payment Links (Recomendado para desenvolvimento)

Se você está usando Payment Links do Stripe:

1. Acesse o [Stripe Dashboard](https://dashboard.stripe.com)
2. Vá em **Products** → Selecione seu produto
3. Clique em **Payment links**
4. Edite o link de pagamento
5. Configure:
   - **Success URL**: `https://yourdomain.com/admin?checkout=success&session_id={CHECKOUT_SESSION_ID}`
   - **Cancel URL**: `https://yourdomain.com/admin?upgrade=cancelled`

**Nota**: O Stripe substitui automaticamente `{CHECKOUT_SESSION_ID}` pelo ID real da sessão.

### Opção 2: Usando Checkout Sessions API (Recomendado para produção)

Se você está criando sessões via API, configure assim:

```typescript
const session = await stripe.checkout.sessions.create({
  mode: "payment",
  line_items: [{ price: "price_xxx", quantity: 1 }],
  success_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin?upgrade=cancelled`,
  customer_email: userEmail, // Opcional: pré-preenche email
  metadata: {
    userId: userId, // Opcional: para associar com usuário
  },
});
```

### Variáveis de Ambiente Necessárias

Certifique-se de ter configurado:

```bash
NEXT_PUBLIC_APP_URL=https://yourdomain.com
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_CHECKOUT_URL=https://buy.stripe.com/test_xxx
```

### Como Funciona

1. Usuário clica em "Upgrade" → Abre Stripe Checkout
2. Usuário paga → Stripe redireciona para: `/admin?checkout=success&session_id=cs_xxx`
3. App detecta `?checkout=success` → Verifica pagamento usando `session_id`
4. Se pagamento confirmado → Cria usuário e migra dados
5. Se precisa onboarding → Redireciona para `/onboarding`
6. Após onboarding → Libera acesso completo

### Testando

Use cartão de teste do Stripe:

- **Número**: `4242 4242 4242 4242`
- **Data**: Qualquer data futura
- **CVC**: Qualquer 3 dígitos

### Troubleshooting

**Problema**: Não está redirecionando com session_id

- **Solução**: Verifique se configurou `{CHECKOUT_SESSION_ID}` na URL de sucesso

**Problema**: Pagamento não é verificado

- **Solução**: Verifique se `STRIPE_SECRET_KEY` está configurado corretamente
- **Solução**: Verifique logs do servidor para erros de verificação

**Problema**: Usuário não é criado após pagamento

- **Solução**: Verifique se webhook está configurado ou se verificação manual está funcionando
- **Solução**: Verifique logs do endpoint `/api/payment/complete`
