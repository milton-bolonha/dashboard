# ⚡ Quick Start - Dashboard Engine

Guia para colocar o Dashboard Engine funcionando em menos de 10 minutos.

## 🎯 Pré-requisitos

- ✅ Node.js 18+ instalado
- ✅ Conta no [Clerk](https://clerk.com) (grátis)
- ✅ Conta no [Stripe](https://stripe.com) (grátis)
- ✅ MongoDB (local ou [Atlas](https://mongodb.com/atlas))

## 🚀 Passos

### 1. **Clone e Instale**

```bash
git clone <repo-url>
cd dashboard
npm install
```

### 2. **Execute o Setup**

```bash
npm run setup
```

Este comando:

- ✅ Cria `.env.local`
- ✅ Verifica dependências
- ✅ Valida estrutura de pastas

### 3. **Configure Clerk**

1. Acesse [dashboard.clerk.com](https://dashboard.clerk.com)
2. Crie um novo projeto
3. Copie as chaves:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### 4. **Configure Stripe**

1. Acesse [dashboard.stripe.com](https://dashboard.stripe.com)
2. Modo Teste → API Keys:

```env
STRIPE_SECRET_KEY=sk_test_...
```

3. Crie produtos/preços e anote os Price IDs

### 5. **Configure Database**

**Opção A - MongoDB Local:**

```env
MONGODB_URI=mongodb://localhost:27017/dashboard_engine
```

**Opção B - MongoDB Atlas:**

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dashboard_engine
```

### 6. **Gere Chaves de Segurança**

```bash
# Gerar chaves aleatórias
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```env
INTERNAL_API_KEY=sua_chave_interna_aqui
ADMIN_EXPORT_KEY=sua_chave_admin_aqui
```

### 7. **Configure Price Mapping**

Edite `config/stripe-plans.js` com seus Price IDs reais:

```javascript
export const STRIPE_PLAN_MAPPING = {
  test: {
    price_seu_price_id_aqui: "cupido",
    price_outro_price_id: "afrodite",
  },
};
```

### 8. **Execute o Projeto**

```bash
npm run dev
```

🎉 **Pronto!** Acesse http://localhost:3000

## ✅ Teste se Funciona

### 1. **Teste Auth**

- [ ] Clique "Criar Conta"
- [ ] Faça signup/login
- [ ] Acesse `/dashboard`

### 2. **Teste Content Types**

- [ ] Va em Content Types
- [ ] Crie um novo tipo
- [ ] Veja se aparece no menu

### 3. **Teste Billing (Opcional)**

- [ ] Configure webhook do Stripe
- [ ] Faça um checkout teste
- [ ] Verifique se plano aparece no dashboard

## 🔧 Configuração de Produção

### Webhooks do Stripe

1. No Stripe Dashboard → Webhooks
2. Adicione endpoint: `https://seu-dominio/.netlify/functions/stripe-webhook`
3. Eventos: `checkout.session.completed`, `invoice.paid`
4. Copie o signing secret:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Deploy na Netlify

1. Conecte seu repositório
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

## 🐛 Problemas Comuns

### ❌ "Unauthorized" no Dashboard

**Solução:** Verifique se as chaves do Clerk estão corretas

### ❌ Webhook não funciona

**Solução:**

1. Verifique `STRIPE_WEBHOOK_SECRET`
2. Confirme URL no Stripe
3. Verifique logs da Netlify

### ❌ Planos não aparecem

**Solução:**

1. Configure `STRIPE_PLAN_MAPPING` corretamente
2. Execute verificação manual no dashboard
3. Verifique logs do webhook

### ❌ Erro de conexão com MongoDB

**Solução:**

1. Verifique `MONGODB_URI`
2. Confirme se MongoDB está rodando (local)
3. Verifique credenciais (Atlas)

## 📚 Próximos Passos

Agora que está funcionando:

1. **📖 Leia a [Arquitetura](../architecture.md)** - Entenda como funciona
2. **🔄 Estude a [Triangulação](../billing-triangulation.md)** - Sistema de billing
3. **🚀 Consulte o [Guia de Desenvolvimento](../development-guide.md)** - Customize e estenda
4. **📖 Use a [API Reference](../api-reference.md)** - Integre com outros sistemas

## 💡 Dicas de Desenvolvimento

### Logs Úteis

```javascript
// No navegador (F12)
localStorage.setItem('debug', '*');  // Ver todos os logs

// No servidor
DEBUG=* npm run dev  // Ver logs detalhados
```

### Teste APIs Rapidamente

```bash
# Verificar planos do usuário
curl http://localhost:3000/api/billing/verify-user

# Listar usuários (autenticado)
curl http://localhost:3000/api/users/list
```

### Debug de Webhooks

Use [Stripe CLI](https://stripe.com/docs/stripe-cli) para testar localmente:

```bash
stripe listen --forward-to localhost:3000/.netlify/functions/stripe-webhook
```

## 🤝 Precisa de Ajuda?

- 📖 Consulte a documentação completa
- 🐛 Abra uma issue no repositório
- 💬 Use as discussões para perguntas
- 📧 Entre em contato com a equipe

---

**🎉 Parabéns! Você tem um dashboard completo funcionando em menos de 10 minutos!**
