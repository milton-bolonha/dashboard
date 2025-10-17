# 📋 **TAREFAS PARA MILTON**

## 🎯 **TAREFAS PRIORITÁRIAS DESTA SEMANA**

### **1. 💳 Setup Stripe Products (URGENTE)**
```bash
# 1. Acesse: https://dashboard.stripe.com/products
# 2. Criar produtos conforme nossa estrutura:

BASIC_PLAN:
- Nome: "Dashboard Basic"
- Preço: R$ 29/mês
- Product ID: prod_basic_dash
- Price ID: price_basic_monthly

PRO_PLAN:
- Nome: "Dashboard Pro" 
- Preço: R$ 79/mês
- Product ID: prod_pro_dash
- Price ID: price_pro_monthly

ENTERPRISE_PLAN:
- Nome: "Dashboard Enterprise"
- Preço: R$ 199/mês
- Product ID: prod_enterprise_dash
- Price ID: price_enterprise_monthly
```

### **2. 🔐 Configurar Webhook Stripe**
```bash
# URL do webhook: https://seu-dominio.com/api/stripe-webhook
# Eventos necessários:
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_succeeded
- invoice.payment_failed
```

### **3. ⚙️ Variáveis de Ambiente**
```env
# Adicionar no .env.local:
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Product IDs (após criar no Stripe):
STRIPE_PRODUCT_BASIC=prod_basic_dash
STRIPE_PRODUCT_PRO=prod_pro_dash
STRIPE_PRODUCT_ENTERPRISE=prod_enterprise_dash
```

---

## 🚀 **TAREFAS SECUNDÁRIAS**

### **4. 🏗️ Deploy & Monitoramento**
- [ ] Deploy no Vercel/Netlify
- [ ] Configurar domínio personalizado
- [ ] Setup Sentry ou monitoring

### **5. 📊 Analytics Setup**
- [ ] Google Analytics 4
- [ ] Hotjar ou similar para UX tracking

---

## ✅ **CHECKLIST RÁPIDO**

- [ ] Produtos criados no Stripe ✋ **FAZ PRIMEIRO**
- [ ] Webhook configurado 
- [ ] .env.local atualizado
- [ ] Teste de pagamento em modo sandbox
- [ ] Deploy realizado
- [ ] Domínio configurado

---

**🎯 Tempo estimado:** 2-3 horas
**📞 Dúvidas:** Chama aí que ajudo!
