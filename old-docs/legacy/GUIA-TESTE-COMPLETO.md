# 🧪 GUIA COMPLETO DE TESTE - Sistema Stripe + Clerk

## 🎯 **OBJETIVO**

Testar a triangulação completa: **Stripe → Clerk → API → Frontend**

## 🚀 **PRÉ-REQUISITOS**

### ✅ **Serviços Rodando:**

- [ ] Dashboard Next.js: `npm run dev` (porta 3000)
- [ ] Servidor Webhook: `node test-webhook-server.js` (porta 4242)
- [ ] Stripe Listener: `stripe listen --forward-to localhost:4242/webhook`

### ✅ **Variáveis Configuradas em `.env.local`:**

- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...`
- [ ] `CLERK_SECRET_KEY=sk_test_...`
- [ ] `STRIPE_SECRET_KEY=sk_test_...`

## 🧪 **TESTES BÁSICOS**

### **1. Teste de Login e Dashboard**

```bash
# 1. Acesse http://localhost:3000
# 2. Clique "Entrar" e faça login com Clerk
# 3. Vá para /dashboard
# 4. Verifique se carrega sem erro do TopBar
```

**✅ Esperado:** Dashboard carrega sem erros

### **2. Teste de Verificação de Planos**

```bash
# No dashboard, clique "Verificar Agora"
```

**✅ Esperado:**

- Spinner aparece
- Dados carregam (mesmo que vazios)
- Sem erro 500

### **3. Teste de API Direta**

```bash
curl http://localhost:3000/api/billing/verify-user
```

**✅ Esperado:** JSON com `plans`, `billing`, `source`

## 🎣 **TESTES DE WEBHOOK**

### **1. Checkout Completado (Principal)**

```bash
stripe trigger checkout.session.completed
```

**✅ Esperado:**

- Logs no servidor webhook: "🎣 Webhook recebido"
- Evento processado: "checkout.session.completed"
- Triangulação simulada executada

### **2. Invoice Paga**

```bash
stripe trigger invoice.paid
```

**✅ Esperado:**

- Evento de subscription processado
- Logs de atualização

### **3. Subscription Cancelada**

```bash
stripe trigger customer.subscription.deleted
```

**✅ Esperado:**

- Evento de cancelamento processado
- Logs de remoção

## 🔍 **TESTES AVANÇADOS**

### **1. Teste com Customer ID**

```bash
# Criar customer de teste
stripe customers create --email="teste@exemplo.com" --name="Usuario Teste"

# Trigger com customer específico
stripe trigger checkout.session.completed --add customer=$(stripe customers list --limit=1 --format=json | jq -r '.data[0].id')
```

### **2. Teste de Planos Específicos**

```bash
# Configurar Price ID no mapeamento
# Editar config/stripe-plans.js:
# price_test_123: "cupido"

# Testar com price específico
stripe trigger checkout.session.completed --add price=price_test_123
```

### **3. Teste de Webhook com Signature**

```bash
# Pegar webhook secret do listener
# Configurar no .env.local:
# STRIPE_WEBHOOK_SECRET=whsec_xxx
```

## ⚠️ **PROBLEMAS COMUNS**

### **Webhook não recebe eventos:**

```bash
# Verificar se listener está rodando
ps aux | grep stripe

# Reiniciar listener
stripe listen --forward-to localhost:4242/webhook
```

### **Erro 500 na API:**

```bash
# Verificar logs do servidor Next.js
# Verificar variáveis de ambiente
cat .env.local
```

### **TopBar undefined:**

```bash
# Verificar import/export
# Reiniciar servidor
npm run dev
```

### **Clerk unauthorized:**

```bash
# Verificar chaves no .env.local
# Certificar que são chaves de TEST (pk_test_, sk_test_)
```

## 📊 **LOGS IMPORTANTES**

### **Servidor Webhook:**

```
🎣 Webhook recebido de Stripe CLI
📨 Evento Stripe: checkout.session.completed
🔄 Simulando triangulação Stripe → Clerk → API
✅ Webhook processado com sucesso
```

### **Stripe Listener:**

```
Ready! Your webhook signing secret is 'whsec_xxx'
2024-01-15 10:30:00  --> checkout.session.completed [evt_xxx]
2024-01-15 10:30:00  <-- [200] POST http://localhost:4242/webhook
```

### **Next.js Dashboard:**

```
🔍 Verificando planos para usuário: user_xxx
✅ Cache ainda válido, retornando dados existentes
🔄 Cache expirado, verificando no Stripe...
```

## 🎯 **FLUXO COMPLETO DE TESTE**

### **Cenário: Usuário Compra Plano**

1. **Setup:**

   ```bash
   # Terminal 1: Dashboard
   npm run dev

   # Terminal 2: Webhook server
   node test-webhook-server.js

   # Terminal 3: Stripe listener
   stripe listen --forward-to localhost:4242/webhook
   ```

2. **Executar:**

   ```bash
   # Terminal 4: Trigger evento
   stripe trigger checkout.session.completed
   ```

3. **Verificar:**
   - Logs em todos os terminais
   - Dashboard atualiza planos
   - API retorna novos dados

## 🏆 **CRITÉRIOS DE SUCESSO**

### ✅ **Sistema Básico Funcionando:**

- [ ] Login com Clerk
- [ ] Dashboard carrega
- [ ] API responde
- [ ] Webhook recebe eventos

### ✅ **Triangulação Funcional:**

- [ ] Stripe trigger → Webhook
- [ ] Webhook → Logs processamento
- [ ] API → Dados atualizados
- [ ] Frontend → Planos exibidos

### ✅ **Pronto para Produção:**

- [ ] Todas as chaves configuradas
- [ ] Webhook com signature
- [ ] MongoDB conectado
- [ ] Deploy na Netlify

## 🚀 **PRÓXIMOS PASSOS**

Depois dos testes básicos funcionando:

1. **Configurar MongoDB** para persistência real
2. **Deploy na Netlify** para ambiente de produção
3. **Configurar webhook produção** no Stripe Dashboard
4. **Testar com dados reais** (pequenas quantias)

---

**🎉 Se todos os testes passarem, seu sistema está 100% funcional!**
