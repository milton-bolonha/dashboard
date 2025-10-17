# 📊 Dashboard Engine

> Interface administrativa para gerenciamento de usuários, planos e transações

## 🚀 Início Rápido

```bash
npm install
npm run setup    # Configura .env.local
npm run dev      # http://localhost:3000
```

## ⚙️ Configuração

```env
# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
STRIPE_SECRET_KEY=sk_test_...
MONGODB_URI=mongodb://... # Opcional
```

## 🎯 Funcionalidades

### **👤 Para Usuários**

- **Login/Signup**: Via Clerk integrado
- **Planos**: Visualização de planos ativos no top bar
- **Customer Portal**: Acesso direto via Stripe

### **👑 Para Admins**

- **Dashboard**: Visão geral do sistema
- **Billing**: Lista de transações/invoices pagas
- **Users**: Gerenciamento de usuários
- **Content**: Gerenciamento de tipos e seções

## 🔄 Lógica de Negócio

### **Fluxo de Compra:**

1. **Stripe**: Criação de produtos/planos
2. **Frontend**: URLs de compra integradas
3. **Checkout**: Usuário compra via Stripe
4. **Webhook**: Triangulação automática
5. **Dashboard**: Acesso liberado automaticamente

### **Triangulação:**

```
Stripe (Payment) → Clerk (Auth) → MongoDB (Data) → Dashboard (UI)
```

## 🧪 Testes

```bash
npm test                 # Todos os testes
npm run test:corrections # Testes das correções
```

## 📚 Documentação

- **[Correções Técnicas](../docs/dashboard/CORREÇÕES-IMPLEMENTADAS.md)**
- **[Arquitetura Geral](../docs/architecture.md)**

## 🛠️ Comandos

```bash
npm run dev      # Desenvolvimento
npm run build    # Build produção
npm run test     # Executar testes
npm run lint     # Verificar código
```

**Dashboard Engine** - Sistema completo de administração com triangulação automática
