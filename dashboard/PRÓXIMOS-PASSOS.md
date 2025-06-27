# ⚡ **PRÓXIMOS PASSOS - DASHBOARD ENGINE**

## 🚨 **IMPLEMENTAR AGORA (Esta Semana)**

### **1. Proteções de Deleção (CRÍTICO)**

```javascript
// ❌ IMPLEMENTAR em content-types/[id]/route.js
const sectionsCount = await db.count("sections", { contentTypeId: id, userId });
if (sectionsCount > 0) {
  return NextResponse.json(
    {
      error: `Não é possível deletar. Existem ${sectionsCount} sections usando este Content Type`,
      details: { sectionsCount, action: "transfer_or_delete_sections_first" },
    },
    { status: 400 }
  );
}

// ❌ IMPLEMENTAR em sections/[id]/route.js
const itemsCount = await db.count("items", { sectionId: id, userId });
if (itemsCount > 0) {
  return NextResponse.json(
    {
      error: `Não é possível deletar. Existem ${itemsCount} items nesta section`,
      details: { itemsCount, action: "move_or_delete_items_first" },
    },
    { status: 400 }
  );
}
```

### **2. Tabela Moderna de Items**

- ✅ Arquivo `ModernItemsTable.jsx` já criado
- ❌ **FALTA:** Integrar na página `sections/[slug]/page.jsx`
- ❌ **FALTA:** Substituir lista atual pela tabela moderna

### **3. Link Obsoleto Removido**

- ✅ **FEITO:** Removido `/dashboard/dev` do menu
- ✅ **FEITO:** Arquivo duplicado `tests/users-list.test.js` removido

---

## 🎯 **IMPLEMENTAR PRÓXIMAS 2 SEMANAS**

### **4. Stripe Plans Setup**

- 📋 **AÇÃO:** Criar planos no dashboard Stripe
- 📋 **AÇÃO:** Configurar prices IDs no `stripe-plans.js`
- 📋 **AÇÃO:** Testar checkout completo

### **5. Limites de Planos (Backend)**

- 📋 **AÇÃO:** Aprimorar verificações em `planLimits.js`
- 📋 **AÇÃO:** Adicionar feedback visual no frontend
- 📋 **AÇÃO:** Prompts de upgrade automáticos

### **6. Addons Básicos Extras**

- 📋 **AÇÃO:** `dateInput` - seletor de data
- 📋 **AÇÃO:** `selectInput` - dropdown com opções
- 📋 **AÇÃO:** `checkboxInput` - checkbox simples
- 📋 **AÇÃO:** `numberInput` - input numérico

---

## 🔮 **PLANEJAMENTO FUTURO (NÃO IMPLEMENTAR AGORA)**

### **🌟 Onboarding Visual**

- 🎯 **CONCEITO:** Wizard de 5 etapas
- 🎯 **IDEIA:** Templates pré-definidos (Blog, E-commerce, Portfolio)
- 🎯 **POSSIBILIDADE:** Video explicativo + demo interativo
- 🎯 **ESTRATÉGIA:** Trial 7 dias para planos pagos

### **⚙️ Configurações Avançadas**

- 🎯 **AUTH PROVIDERS:**

  - Clerk (atual ✅)
  - Auth0 (enterprise SSO)
  - Firebase (Google ecosystem)
  - Supabase (open source)

- 🎯 **PAYMENT PROVIDERS:**

  - Stripe (atual ✅)
  - PayPal (global alternative)
  - Mercado Pago (LATAM)
  - Razorpay (Asia)

- 🎯 **INTEGRAÇÕES:**
  - Email (SendGrid, Mailgun)
  - Storage (AWS S3, Cloudinary)
  - Analytics (Google Analytics, Mixpanel)

### **🚀 Recursos Avançados**

- 🎯 **APIs & Webhooks** para integrações externas
- 🎯 **White Label** com domínio customizado
- 🎯 **Multi-tenancy** para teams
- 🎯 **Marketplace de Addons**

---

## 📊 **CLARK BILLING vs STRIPE DIRETO**

### **✅ DECISÃO: MANTER STRIPE DIRETO**

**Motivos:**

1. ✅ **Já funcional** com triangulação robusta
2. ✅ **Flexibilidade total** sobre webhooks e UX
3. ✅ **Sem vendor lock-in** adicional
4. ✅ **Controle sobre pricing** e promoções
5. ✅ **Integração com sistema de planos** já desenvolvido

**Clerk Billing seria útil se:**

- ❌ Estivéssemos começando do zero
- ❌ Não precisássemos de customização
- ❌ Quiséssemos development mais rápido

---

## 🎯 **FOCO IMEDIATO**

### **Esta Semana:**

1. 🔥 **Implementar proteções de deleção**
2. 🔥 **Integrar ModernItemsTable**
3. 🔥 **Testar todos os fluxos críticos**

### **Próximas 2 Semanas:**

1. 📈 **Setup completo de planos Stripe**
2. 📈 **Limites visuais de planos**
3. 📈 **Novos addons básicos**

### **Próximo Mês:**

1. 🚀 **APIs para integrações externas**
2. 🚀 **Import/Export de dados**
3. 🚀 **Dashboard de analytics**

---

## 💡 **OBSERVAÇÕES IMPORTANTES**

### **Sobre Onboarding:**

- 🎯 **NÃO IMPLEMENTAR AGORA** - foco na estabilidade primeiro
- 🎯 **DOCUMENTAR IDEIAS** conforme surgem
- 🎯 **Pesquisar concorrentes** (Airtable, Notion, Strapi)
- 🎯 **Definir personas** antes de criar UX

### **Sobre Configurações:**

- 🎯 **MANTER SIMPLE** por enquanto
- 🎯 **ADICIONAR COMPLEXIDADE** conforme demanda
- 🎯 **PESQUISAR CUSTOS** de múltiplos providers
- 🎯 **CONSIDERAR COMPLIANCE** (GDPR, SOC2) desde cedo

### **Sobre Monetização:**

- 💰 **Validar preços** com usuários reais
- 💰 **A/B testing** nos planos
- 💰 **Freemium strategy** bem definida
- 💰 **Enterprise tier** com features específicas

---

**🎯 LEMBRETE:** Este documento é vivo e deve ser atualizado conforme implementamos e aprendemos!
