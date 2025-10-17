# Regras de Negócio - Sistema de Planos

## Visão Geral

O sistema de planos define os diferentes níveis de acesso e limites que os usuários podem ter na plataforma. Cada plano tem características específicas que determinam o que um usuário pode fazer.

## Estrutura de um Plano

### Informações Básicas

- **Nome**: Nome do plano (ex: "Básico", "Pro", "Enterprise")
- **Slug**: Identificador único do plano (gerado automaticamente)
- **Descrição**: Descrição detalhada do plano
- **Preço**: Valor mensal do plano
- **Moeda**: Moeda do preço (padrão: BRL)

### Estados do Plano

- **Ativo**: Se o plano está disponível para novos usuários
- **Padrão**: Se é o plano atribuído automaticamente a novos usuários

### Limites de Recursos

- **maxWorkspaces**: Número máximo de workspaces
- **maxMembers**: Número máximo de membros por workspace
- **maxSections**: Número máximo de seções por workspace
- **maxItems**: Número máximo de itens por seção
- **maxStorage**: Armazenamento máximo em bytes
- **maxApiCalls**: Número máximo de chamadas API por mês

## Regras de Negócio

### 1. Criação de Planos

#### Validações Obrigatórias

- ✅ Nome deve ser único
- ✅ Slug deve ser único (gerado automaticamente)
- ✅ Preço deve ser >= 0
- ✅ Todos os limites devem ser >= -1 (-1 = ilimitado)

#### Geração Automática de Slug

```javascript
// Exemplo: "Plano Premium" → "plano-premium"
function slugify(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}
```

### 2. Plano Padrão

#### Regras

- **Único**: Apenas um plano pode ser padrão por vez
- **Obrigatório**: Deve sempre existir um plano padrão
- **Automático**: Novos usuários recebem o plano padrão automaticamente
- **Ativo**: Plano padrão deve estar ativo

#### Comportamento

- Ao marcar um plano como padrão, o anterior é desmarcado
- Não é possível desmarcar o último plano padrão
- Planos inativos não podem ser padrão

### 3. Planos Ativos

#### Regras

- **Visibilidade**: Apenas planos ativos aparecem nas opções de upgrade
- **Proteção**: Usuários com planos inativos mantêm acesso
- **Reativação**: Planos podem ser reativados a qualquer momento

### 4. Limites de Recursos

#### Valores Especiais

- **-1**: Ilimitado (sem restrições)
- **0**: Não permitido (bloqueado)
- **N > 0**: Limite específico

#### Hierarquia de Limites

1. **Hard Limits**: Limites técnicos da plataforma
2. **Plan Limits**: Limites definidos no plano
3. **User Limits**: Limites específicos do usuário (overrides)

### 5. Upgrades e Downgrades

#### Regras de Upgrade

- ✅ Sempre permitido para planos superiores
- ✅ Efeito imediato
- ✅ Histórico mantido
- ✅ Sincronização com billing

#### Regras de Downgrade

- ⚠️ Verificar se uso atual não excede novos limites
- ⚠️ Pode requerer limpeza de dados
- ⚠️ Aviso ao usuário sobre perda de funcionalidades
- ⚠️ Período de carência para reverter

## Cenários de Uso

### 1. Novo Usuário

```
Fluxo:
1. Usuário se cadastra
2. Sistema atribui plano padrão automaticamente
3. Usuário pode fazer upgrade posteriormente
```

### 2. Upgrade via Chave de Acesso

```
Fluxo:
1. Usuário insere chave de acesso
2. Sistema valida chave e plano de destino
3. Upgrade é aplicado imediatamente
4. Limites são atualizados
```

### 3. Upgrade via Billing

```
Fluxo:
1. Usuário escolhe plano na página de billing
2. Pagamento é processado
3. Webhook confirma pagamento
4. Sistema atualiza plano do usuário
```

### 4. Downgrade por Cancelamento

```
Fluxo:
1. Usuário cancela assinatura
2. Sistema agenda downgrade para fim do período
3. Usuário mantém acesso até data de expiração
4. Downgrade é aplicado automaticamente
```

## Validações de Limites

### Verificação em Tempo Real

- **Criação**: Verificar limites antes de criar recursos
- **Atualização**: Verificar limites antes de atualizar
- **Importação**: Verificar limites antes de importar dados

### Exemplo de Validação

```javascript
async function validatePlanLimits(userId, action, resourceType) {
  const user = await getUserWithPlan(userId);
  const currentUsage = await getCurrentUsage(userId);
  const planLimits = user.plan.limits;

  switch (resourceType) {
    case "workspace":
      if (
        planLimits.maxWorkspaces !== -1 &&
        currentUsage.workspaces >= planLimits.maxWorkspaces
      ) {
        throw new Error("Limite de workspaces excedido");
      }
      break;
    // ... outros casos
  }
}
```

## Monitoramento e Alertas

### Métricas por Plano

- **Usuários ativos**: Quantos usuários estão em cada plano
- **Receita**: Receita gerada por plano
- **Uso médio**: Uso médio de recursos por plano
- **Conversão**: Taxa de conversão entre planos

### Alertas de Limite

- **80% do limite**: Aviso de proximidade do limite
- **95% do limite**: Alerta crítico
- **100% do limite**: Bloqueio de novas criações

## Integração com Billing

### Sincronização

- **Stripe**: Produtos e preços sincronizados
- **Webhooks**: Atualizações em tempo real
- **Reconciliação**: Verificação periódica de consistência

### Mapeamento

```javascript
// config/stripe-map.js
const stripePlanMap = {
  basic: "price_1234567890",
  pro: "price_0987654321",
  enterprise: "price_1122334455",
};
```

## Troubleshooting

### Problemas Comuns

#### "Limite excedido"

- Verificar uso atual vs. limites do plano
- Considerar upgrade de plano
- Verificar se há recursos não utilizados

#### "Plano não encontrado"

- Verificar se plano existe e está ativo
- Verificar mapeamento com sistema de billing
- Verificar se usuário tem plano atribuído

#### "Sincronização falhou"

- Verificar conexão com Stripe
- Verificar configuração de webhooks
- Executar sincronização manual

### Logs de Debug

```javascript
// Exemplo de log de debug
logDebug("Plan validation", {
  userId,
  planSlug: user.plan.slug,
  currentUsage,
  planLimits,
  action,
  resourceType,
});
```

## Futuras Melhorias

### Planejadas

- [ ] Planos com recursos à la carte
- [ ] Planos com limites temporais
- [ ] Planos com desconto por volume
- [ ] Planos corporativos com negociação

### Consideradas

- [ ] Planos freemium com limitações
- [ ] Planos com trial gratuito
- [ ] Planos com recursos sazonais
- [ ] Planos com limites por região

## Arquivos Relacionados

### Backend

- `/dashboard/app/api/admin/plans/route.js` - CRUD de planos
- `/dashboard/app/api/admin/plans/[id]/route.js` - Operações específicas
- `/dashboard/lib/plans.js` - Lógica de negócio
- `/dashboard/lib/plan-check.js` - Validação de limites

### Frontend

- `/dashboard/app/dashboard/admin/plans/page.jsx` - Interface de gestão
- `/dashboard/components/billing/PlanCard.js` - Componente de plano
- `/dashboard/hooks/useUserPlanVerification.js` - Hook de verificação

### Configuração

- `/dashboard/config/plans.yml` - Configuração de planos
- `/dashboard/config/stripe-plans.js` - Mapeamento Stripe
- `/dashboard/config/stripe-map.js` - IDs dos produtos
