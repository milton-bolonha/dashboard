# 📋 Plano Finalizar - 14/11/2024 (ATUALIZADO Nov/2025)

> ⚠️ **NOTA**: Este documento é um plano histórico. Para ver o status real de implementação, consulte [`../01-arquitetura/status-implementacao.md`](../01-arquitetura/status-implementacao.md).

Este documento mantém o plano original, mas muitas tarefas já foram concluídas. Veja o status atual em [`../01-arquitetura/status-implementacao.md`](../01-arquitetura/status-implementacao.md).

## ✅ CONCLUÍDO

### 1. contrastMode Persistente ✅
- **Status**: Implementado e funcionando
- **Solução**: Tokens de aparência são calculados uma vez ao salvar cor e salvos no dashboard
- **Resultado**: Contraste persiste após F5, valores salvos são reutilizados ao invés de recalcular
- **Arquivos modificados**:
  - `src/containers/admin/AdminContainer.tsx` - Salva tokens ao customizar background
  - `src/components/admin/ade/AdminSidebarAde.tsx` - Usa valores salvos primeiro

### 2. Fechar Dropdowns ao Clicar Fora ✅
- **Status**: Implementado e melhorado
- **Solução**: `useEffect` com listener de `mousedown` usando capture phase
- **Resultado**: Dropdowns de Dashboards e Templates fecham corretamente ao clicar fora
- **Arquivos modificados**:
  - `src/components/admin/ade/AdminHeaderAde.tsx` - Melhorado listener de click fora

---

## 🔴 PRÓXIMOS PASSOS (Ordem de Implementação)

### FASE 1: Integração MongoDB (2-3 semanas)

#### 1.1 Preparação e Modelagem

**Objetivo**: Definir estrutura de dados e modelos MongoDB

**Tarefas**:
- [ ] Criar modelos MongoDB (`users`, `workspaces`, `tiles`, `contacts`, `notes`, `usageCounters`)
- [ ] Definir schemas e índices necessários
- [ ] Criar helpers de acesso (`lib/db/mongodb.ts` ou similar)
- [ ] Configurar conexão MongoDB (variáveis de ambiente)

**Arquivos a criar/modificar**:
- `src/lib/db/models/User.ts`
- `src/lib/db/models/Workspace.ts`
- `src/lib/db/models/Tile.ts`
- `src/lib/db/models/Contact.ts`
- `src/lib/db/models/Note.ts`
- `src/lib/db/models/UsageCounter.ts`
- `src/lib/db/mongodb.ts` - Conexão e helpers
- `.env.template` - Adicionar `MONGODB_URI`

**Critérios de sucesso**:
- Modelos definidos com tipos TypeScript
- Conexão MongoDB funcionando
- Helpers de CRUD básicos implementados

#### 1.2 Migração de APIs para MongoDB

**Objetivo**: Atualizar APIs para usar MongoDB mantendo fallback local

**Tarefas**:
- [ ] Atualizar `/api/generate` para salvar workspace no MongoDB
- [ ] Atualizar `/api/workspace` (GET) para ler do MongoDB primeiro, fallback localStorage
- [ ] Atualizar `/api/workspace/tiles` (POST) para salvar no MongoDB
- [ ] Atualizar `/api/workspace/tiles/[tileId]` (PATCH, DELETE) para MongoDB
- [ ] Atualizar `/api/workspace/tiles/[tileId]/chat` para MongoDB
- [ ] Atualizar `/api/workspace/tiles/[tileId]/regenerate` para MongoDB
- [ ] Atualizar `/api/workspace/contacts` (POST) para MongoDB
- [ ] Atualizar `/api/workspace/contacts/[contactId]` (DELETE) para MongoDB
- [ ] Atualizar `/api/workspace/contacts/[contactId]/chat` para MongoDB
- [ ] Atualizar `/api/workspace/contacts/[contactId]/regenerate` para MongoDB
- [ ] Atualizar `/api/workspace/notes` (POST) para MongoDB
- [ ] Atualizar `/api/workspace/notes/[noteId]` (PATCH, DELETE) para MongoDB
- [ ] Atualizar `/api/workspace/reorder` para MongoDB
- [ ] Manter fallback para localStorage durante transição

**Arquivos a modificar**:
- `src/app/api/generate/route.ts`
- `src/app/api/workspace/route.ts`
- `src/app/api/workspace/tiles/route.ts`
- `src/app/api/workspace/tiles/[tileId]/route.ts`
- `src/app/api/workspace/tiles/[tileId]/chat/route.ts`
- `src/app/api/workspace/tiles/[tileId]/regenerate/route.ts`
- `src/app/api/workspace/contacts/route.ts`
- `src/app/api/workspace/contacts/[contactId]/route.ts`
- `src/app/api/workspace/contacts/[contactId]/chat/route.ts`
- `src/app/api/workspace/contacts/[contactId]/regenerate/route.ts`
- `src/app/api/workspace/notes/route.ts`
- `src/app/api/workspace/notes/[noteId]/route.ts`
- `src/app/api/workspace/reorder/route.ts`

**Critérios de sucesso**:
- Todas as APIs funcionam com MongoDB
- Fallback para localStorage funciona quando MongoDB não disponível
- Dados são sincronizados corretamente

#### 1.3 Rotina de Migração de Dados

**Objetivo**: Migrar dados existentes do localStorage para MongoDB

**Tarefas**:
- [ ] Criar endpoint `/api/migrate` para migração manual
- [ ] Criar função de migração automática ao detectar upgrade/login
- [ ] Migrar workspaces do localStorage para MongoDB
- [ ] Migrar dashboards do localStorage para MongoDB
- [ ] Migrar templates customizados para MongoDB
- [ ] Validar integridade dos dados migrados
- [ ] Criar script de migração em lote (se necessário)

**Arquivos a criar/modificar**:
- `src/app/api/migrate/route.ts` - Endpoint de migração
- `src/lib/migration/migrate-localStorage-to-mongo.ts` - Lógica de migração
- `scripts/migrate-data.ts` - Script CLI para migração

**Critérios de sucesso**:
- Migração funciona sem perda de dados
- Dados migrados são válidos
- Usuários podem continuar usando normalmente após migração

#### 1.4 Instrumentação e Monitoramento

**Objetivo**: Adicionar logs e métricas para monitorar a migração

**Tarefas**:
- [ ] Adicionar logs de tempo de geração de tiles
- [ ] Adicionar logs de falhas de API
- [ ] Adicionar métricas de uso (tiles criados, contacts, notes)
- [ ] Criar dashboard de monitoramento (opcional)
- [ ] Alertas para falhas críticas

**Arquivos a criar/modificar**:
- `src/lib/monitoring/metrics.ts` - Funções de métricas
- `src/lib/monitoring/logging.ts` - Funções de logging estruturado

**Critérios de sucesso**:
- Logs estruturados funcionando
- Métricas sendo coletadas
- Falhas são detectadas e logadas

---

### FASE 2: Autenticação Clerk + Stripe (2-3 semanas)

#### 2.1 Configuração Clerk

**Objetivo**: Integrar Clerk para autenticação

**Tarefas**:
- [ ] Instalar `@clerk/nextjs`
- [ ] Configurar Clerk providers (`ClerkProvider`)
- [ ] Configurar proxy para Clerk (se necessário)
- [ ] Criar hooks customizados para usar Clerk
- [ ] Substituir membership fake pelo Clerk userId
- [ ] Atualizar `MembershipProvider` para usar Clerk

**Arquivos a criar/modificar**:
- `src/app/layout.tsx` - Adicionar ClerkProvider
- `src/lib/auth/clerk-config.ts` - Configuração Clerk
- `src/lib/state/membership-context.tsx` - Integrar Clerk userId
- `.env.template` - Adicionar `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`

**Critérios de sucesso**:
- Clerk configurado e funcionando
- Usuários podem fazer login/signup
- userId do Clerk é usado no sistema

#### 2.2 Integração Stripe Webhooks

**Objetivo**: Integrar webhooks Stripe para atualizar planos

**Tarefas**:
- [ ] Criar endpoint `/api/webhooks/stripe` para receber webhooks
- [ ] Processar evento `checkout.session.completed`
- [ ] Processar evento `customer.subscription.updated`
- [ ] Processar evento `customer.subscription.deleted`
- [ ] Atualizar plano do usuário no MongoDB
- [ ] Atualizar limites no `MembershipProvider`
- [ ] Validar assinatura Stripe (usar `stripe` package)

**Arquivos a criar/modificar**:
- `src/app/api/webhooks/stripe/route.ts` - Endpoint de webhooks
- `src/lib/stripe/webhook-handlers.ts` - Handlers de eventos
- `src/lib/stripe/stripe-config.ts` - Configuração Stripe
- `.env.template` - Adicionar `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

**Critérios de sucesso**:
- Webhooks são recebidos e processados
- Planos são atualizados no MongoDB
- Limites são refletidos no frontend

#### 2.3 Atualização de UI e Limites

**Objetivo**: Atualizar UI para mostrar usuário autenticado e respeitar limites

**Tarefas**:
- [ ] Atualizar header para mostrar usuário autenticado
- [ ] Conectar botões Login/SignUp às rotas reais do Clerk
- [ ] Atualizar `MembershipProvider` para ler limites do backend (MongoDB)
- [ ] Implementar bloqueio server-side baseado em limites
- [ ] Atualizar `useMembership` para usar dados do backend
- [ ] Mostrar status do plano no header/sidebar

**Arquivos a modificar**:
- `src/components/admin/ade/AdminHeaderAde.tsx` - Mostrar usuário, conectar botões
- `src/lib/state/membership-context.tsx` - Ler do backend
- `src/containers/admin/AdminContainer.tsx` - Usar limites do backend
- APIs - Adicionar validação de limites server-side

**Critérios de sucesso**:
- UI mostra usuário autenticado
- Botões Login/SignUp funcionam
- Limites são respeitados server-side
- Status do plano é visível

#### 2.4 Testes E2E e Documentação

**Objetivo**: Garantir que fluxo completo funciona e documentar

**Tarefas**:
- [ ] Criar testes E2E para fluxo guest → upgrade → login → uso ilimitado
- [ ] Testar migração de dados guest para autenticado
- [ ] Testar webhooks Stripe
- [ ] Atualizar `.env.template` com todas as variáveis
- [ ] Criar documentação de setup (README ou docs/)
- [ ] Documentar fluxo de autenticação
- [ ] Documentar integração Stripe

**Arquivos a criar/modificar**:
- `tests/e2e/auth-flow.spec.ts` - Testes E2E
- `docs/setup.md` - Documentação de setup
- `docs/auth-integration.md` - Documentação de autenticação
- `.env.template` - Template completo

**Critérios de sucesso**:
- Testes E2E passando
- Documentação completa
- Setup funciona seguindo docs

---

### FASE 3: Profile e Settings (Após Clerk) (1 semana)

#### 3.1 Profile Modal

**Objetivo**: Implementar modal de perfil do usuário

**Tarefas**:
- [ ] Criar `ProfileModal.tsx`
- [ ] Mostrar informações do usuário (nome, email, plano)
- [ ] Permitir editar nome (se Clerk permitir)
- [ ] Mostrar histórico de uso
- [ ] Conectar ao botão Profile no sidebar

**Arquivos a criar/modificar**:
- `src/components/admin/ade/ProfileModal.tsx` - Novo componente
- `src/components/admin/ade/AdminSidebarAde.tsx` - Conectar botão

**Critérios de sucesso**:
- Modal abre ao clicar em Profile
- Mostra informações corretas do usuário
- Edição funciona (se aplicável)

#### 3.2 Settings Modal

**Objetivo**: Implementar modal de configurações

**Tarefas**:
- [ ] Criar `SettingsModal.tsx`
- [ ] Configurações de notificações
- [ ] Configurações de privacidade
- [ ] Configurações de tema (se aplicável)
- [ ] Conectar ao botão Settings no sidebar

**Arquivos a criar/modificar**:
- `src/components/admin/ade/SettingsModal.tsx` - Novo componente
- `src/components/admin/ade/AdminSidebarAde.tsx` - Conectar botão

**Critérios de sucesso**:
- Modal abre ao clicar em Settings
- Configurações são salvas e persistidas
- UI é intuitiva

---

## ❌ NÃO SERÁ FEITO

### Items Removidos do Plano

- **Breadcrumb no Header** - Não será implementado
- **Dark Mode Toggle** - Não será implementado

---

## 📊 Cronograma Estimado

| Fase | Duração | Prioridade |
|------|---------|------------|
| FASE 1: MongoDB | 2-3 semanas | 🔴 ALTA |
| FASE 2: Clerk + Stripe | 2-3 semanas | 🔴 ALTA |
| FASE 3: Profile + Settings | 1 semana | 🟡 MÉDIA |

**Total estimado**: 5-7 semanas

---

## 🔍 Dependências entre Fases

```
FASE 1 (MongoDB)
    ↓
FASE 2 (Clerk + Stripe) - Depende de MongoDB para persistir planos
    ↓
FASE 3 (Profile + Settings) - Depende de Clerk para ter usuário autenticado
```

---

## 📝 Notas Importantes

1. **MongoDB primeiro**: É essencial ter persistência antes de autenticação, pois precisamos salvar planos e dados de usuários
2. **Fallback durante migração**: Manter localStorage funcionando durante transição para não quebrar experiência
3. **Testes incrementais**: Testar cada fase antes de avançar para próxima
4. **Variáveis de ambiente**: Documentar todas as variáveis necessárias no `.env.template`
5. **Migração de dados**: Planejar migração cuidadosamente para não perder dados de usuários

---

## 🎯 Objetivo Final

Sistema completo com:
- ✅ Persistência MongoDB (dados seguros e escaláveis)
- ✅ Autenticação Clerk (usuários reais)
- ✅ Integração Stripe (monetização)
- ✅ Limites server-side (controle de uso)
- ✅ Profile e Settings (experiência completa)

