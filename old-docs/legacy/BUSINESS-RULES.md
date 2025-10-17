# 🏗️ **REGRAS DE NEGÓCIO - DASHBOARD ENGINE**

## 🚫 **REGRAS DE DELEÇÃO EM CASCATA**

### **1. Content Types**

- ❌ **BLOQUEADO**: Content Type com Sections não pode ser deletado
- ✅ **PERMITIDO**: Content Type sem Sections pode ser deletado
- 🔄 **ALTERNATIVA**: Transferir Sections para outro Content Type antes de deletar

```javascript
// Implementar verificação:
const sectionsCount = await db.count("sections", { contentTypeId: id, userId });
if (sectionsCount > 0) {
  return error(
    "Não é possível deletar. Existem {sectionsCount} sections usando este Content Type"
  );
}
```

### **2. Sections**

- ❌ **BLOQUEADO**: Section com Items não pode ser deletada
- ✅ **PERMITIDO**: Section vazia pode ser deletada
- 🔄 **ALTERNATIVA**: Mover Items para outra Section ou deletar Items primeiro

```javascript
// Implementar verificação:
const itemsCount = await db.count("items", { sectionId: id, userId });
if (itemsCount > 0) {
  return error(
    "Não é possível deletar. Existem {itemsCount} items nesta section"
  );
}
```

### **3. Items**

- ✅ **SEMPRE PERMITIDO**: Items podem ser deletados a qualquer momento
- 🗑️ **SOFT DELETE**: Marcar como `deleted: true` antes de remover definitivamente
- 📝 **LOG**: Registrar deleção para auditoria

---

## 💎 **REGRAS DE PLANOS E LIMITES**

### **Plano Gratuito (FREE)**

- ✅ Content Types: **3 máximo**
- ✅ Sections: **5 máximo**
- ✅ Items: **50 máximo**
- ✅ Addons por Content Type: **3 máximo**

### **Plano Cupido (R$ 29,90/mês)**

- ✅ Content Types: **10 máximo**
- ✅ Sections: **25 máximo**
- ✅ Items: **500 máximo**
- ✅ Addons por Content Type: **10 máximo**

### **Plano Afrodite (R$ 89,90/mês)**

- ✅ Content Types: **50 máximo**
- ✅ Sections: **100 máximo**
- ✅ Items: **5.000 máximo**
- ✅ Addons por Content Type: **20 máximo**

### **Plano Zeus (R$ 149,90/mês)**

- ♾️ **ILIMITADO**: Todos os recursos sem limites
- 🚀 **RECURSOS PREMIUM**: API avançada, webhooks, exportações

---

## 🔒 **REGRAS DE SEGURANÇA**

### **Isolamento por Usuário (Triangulação)**

- ✅ **OBRIGATÓRIO**: Todos os dados devem ter `userId`
- ✅ **VERIFICAÇÃO**: Sempre filtrar por `userId` nas consultas
- ✅ **VALIDAÇÃO**: Usuário só acessa seus próprios dados

### **Validação de Entrada**

- ✅ **SLUGS**: Únicos por usuário e contexto
- ✅ **NOMES**: Obrigatórios e com mínimo 2 caracteres
- ✅ **CONTENT TYPES**: Nome único por usuário

---

## 📊 **REGRAS DE PERFORMANCE**

### **Paginação**

- ✅ **PADRÃO**: 20 items por página
- ✅ **MÁXIMO**: 100 items por página
- ✅ **TOTAL**: Sempre incluir count total

### **Cache**

- ✅ **PLANOS**: Cache de 24h no Clerk metadata
- ✅ **SECTIONS**: Cache no contexto React
- ✅ **STATS**: Cache de 1h no dashboard

---

## 🎯 **REGRAS DE UX**

### **Feedback Visual**

- ✅ **LOADING**: Sempre mostrar estados de carregamento
- ✅ **CONFIRMAÇÃO**: Confirmar ações destrutivas
- ✅ **ERRO**: Mensagens de erro claras e acionáveis

### **Navegação**

- ✅ **BREADCRUMB**: Sempre mostrar localização atual
- ✅ **VOLTAR**: Botão de retorno em páginas de detalhe
- ✅ **ESTADOS VAZIOS**: UX especial para listas vazias

---

## 🚀 **IMPLEMENTAÇÃO PRIORITÁRIA**

### **Fase 1: Proteções Básicas**

1. ✅ Implementar verificações de deleção
2. ✅ Adicionar confirmações visuais
3. ✅ Criar sistema de soft delete

### **Fase 2: Limites de Planos**

1. ✅ Implementar verificações no backend
2. ✅ Mostrar limites no frontend
3. ✅ Upgrade prompts automáticos

### **Fase 3: Auditoria**

1. ✅ Log de todas as ações importantes
2. ✅ Histórico de mudanças
3. ✅ Relatórios de uso
