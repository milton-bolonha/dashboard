# 🎯 Tarefas Gerais - DashMaster.PRO

**Última Atualização:** 05 de Agosto de 2025  
**Status:** Sistema funcionando - Foco em lançamento e melhorias

---

## 🚀 **PRIORIDADE 1: LANÇAMENTO E ESTABILIZAÇÃO**

### ✅ **SISTEMA FUNCIONANDO - CONQUISTAS RECENTES:**

- ✅ **Deploy Action funcionando 100%** - GitHub Action criada e executada com sucesso
- ✅ **Erro ENOENT resolvido** - Migração para TemplateGenerator
- ✅ **Erro Git --local resolvido** - Preservação do repositório git
- ✅ **URLs Cloudinary corrigidas** - Imagens aparecem corretamente
- ✅ **API pública funcionando** - Dados expostos corretamente
- ✅ **Funcionalidade Nuke implementada** - Reset completo de deploys

---

## 🎯 **TAREFAS ATUAIS PRIORITÁRIAS**

### 🔥 **PRIORIDADE MÁXIMA - BLOQUEADORES CRÍTICOS**

#### ✅ **PROBLEMA CRÍTICO #1: Deploy Preview vs Production**

- **Status:** **CORRIGIDO** - Inconsistência de branch identificada e corrigida
- **Problema:** GitHub Action estava fazendo "Deploy Preview" em vez de deploy de produção
- **Causa Identificada:** Inconsistência entre configurações de branch
  - `deploy-orchestrator.js` usava `master`
  - `template-generator.js` usava `main`
  - Workflow gerado com `production-branch: main` mas usuário usa `master`
- **Correções Implementadas:**
  1. ✅ Corrigido `template-generator.js` para usar `production-branch: master`
  2. ✅ Corrigido `deploy.yml` template para usar `production-branch: master`
  3. ✅ Agora todas as configurações usam `master` consistentemente
- **Próximo Passo:** Testar novo deploy para confirmar correção
- **Localização:** `dashboard/lib/deployment/template-generator.js` e `dashboard/templates/github-workflows/deploy.yml`
- **Complexidade:** Baixa (correção de configuração)
- **Prazo:** **TESTE NECESSÁRIO** - Próximas horas

#### ✅ **PROBLEMA CRÍTICO #2: URLs de Imagem Cloudinary Malformadas**

- **Status:** **RESOLVIDO** - Problema corrigido automaticamente com a correção do Deploy Preview
- **URL Problemática:** `https://windowcaulkingto-site-dotfvo.netlify.app/windowcaulkingto/landing-page/user_2zZNqqf3OlYsi0AB7KbyyqqpzpB/uploads/yliv9trde6hq8zabczyl`
- **Problema:** URLs contêm paths extras desnecessários que quebram as imagens
- **🔍 DESCOBERTAS IMPORTANTES:**
  1. **API estava funcionando corretamente:** URLs Cloudinary estavam sendo geradas corretamente
  2. **Problema era no Deploy Preview:** Site estava sendo feito como "Deploy Preview" em vez de produção
  3. **Lógica de detecção estava correta:** O problema não era na detecção, mas no deploy
- **✅ Correções Implementadas:**
  1. ✅ Melhorada lógica de detecção de public_ids (mínimo 2 barras, tamanho > 10)
  2. ✅ Corrigido uso do cloud_name correto da variável de ambiente
  3. ✅ **RESOLVIDO:** Deploy Preview vs Production corrigido
  4. ✅ **RESULTADO:** URLs agora aparecem corretamente: `https://res.cloudinary.com/dyxuhpt7j/image/upload/q_auto,f_auto/windowcaulkingto/pages-content/user_2zZNqqf3OlYsi0AB7KbyyqqpzpB/uploads/f8rvg4vtqnbkvajemsr9`
- **🎯 RESOLUÇÃO:** O problema era **Deploy Preview vs Production**, não nas imagens Cloudinary
- **Complexidade:** Baixa (era problema de configuração)
- **Prazo:** ✅ **RESOLVIDO** - 05/08/25

### 🔥 **PRIORIDADE MÁXIMA - LANÇAMENTO**

### **✅ TAREFA #1: Clonador de Workspaces - CONCLUÍDA**

- **Status:** **✅ CONCLUÍDA** - Funcionando em produção
- **Descrição:** Funcionalidade para duplicar workspaces completos
- **Especificações Implementadas:**
  - ✅ Gerar novo workspace com nome `(copy)` no final
  - ✅ Clonar todas as sections, content-types e items
  - ✅ **NÃO clonar:** deploys (não faz sentido)
  - ✅ Manter mesmos conteúdos mas com IDs únicos
  - ✅ Permitir renomeação posterior do workspace
- **UI/UX:** ✅ Implementado junto às outras funções sensíveis no settings
- **Implementação:**
  1. ✅ Definidas regras de naming conventions para workspaces
  2. ✅ Criada lógica de clonagem deep copy com rollback transacional
  3. ✅ Implementada validação de nomes únicos
  4. ✅ Interface de renomeação de workspace implementada
- **Complexidade:** Média-Alta
- **Prazo:** ✅ **CONCLUÍDO** - 05/08/25
- **Arquivos Criados:** 4 novos arquivos
- **Arquivos Modificados:** 3 arquivos existentes
- **Erros Corrigidos:** 6 problemas identificados e resolvidos
- **Status:** ✅ **FUNCIONANDO EM PRODUÇÃO**

### 🎯 **PRIORIDADE ALTA - MELHORIAS TÉCNICAS**

#### ☐ **TAREFA #2: Theme Selector Visual**

- **Status:** **PRIORIDADE ALTA** - Melhoria de UX
- **Problema:** Atualmente no modal do deploy, mas precisa ser uma página dedicada
- **Solução:**
  1. Criar rota dedicada para seleção de tema
  2. Considerar schema no DB para temas
  3. Criar componente `ThemeSelector.jsx` com cards visuais
  4. Melhorar UX de seleção de repositório customizado
- **Complexidade:** Média (trabalho de UI/UX + backend)
- **Prazo:** Próxima sprint

#### ☐ **TAREFA #3: Novo Template com Captação de Dados**

- **Status:** **ÚLTIMA TAREFA** - Lançamento
- **Descrição:** Template independente com captação de dados via form para usuários logados
- **Especificações:**
  - Template totalmente independente
  - Captação de dados dos forms
  - Salvamento no NetlifyDB
  - Clerk independente para autenticação
- **Complexidade:** Alta
- **Prazo:** Última tarefa do lançamento

#### ☐ **TAREFA #4: Novo Homepage e Texto**

- **Status:** **PRIORIDADE MÉDIA** - Melhoria de marketing
- **Problema:** Homepage atual está desatualizada, mudamos muito desde a primeira versão
- **Solução:**
  1. Criar homepage muito mais clean
  2. Atualizar texto e conteúdo
  3. Refletir o estado atual do sistema
- **Complexidade:** Média (design + conteúdo)
- **Prazo:** Próxima sprint

#### **TAREFA #5: Migração de Autenticação (6 rotas)**

- **Status:** **INVESTIGAÇÃO NECESSÁRIA** - Verificar se realmente precisa
- **Problema:** Investigar se 6 rotas ainda usam `getAuthenticatedUser()` em vez de `getCurrentAuth()`
- **Rotas Identificadas:**
  - `/api/dashboard/stats`
  - `/api/content-types/[id]`
  - `/api/billing/transactions`
  - `/api/access-keys/activate`
  - `/api/access/check`
  - `/api/access/user-permissions`
- **Investigation:** Verificar se mudamos de padrão e esquecemos de atualizar a regra
- **Complexidade:** Baixa (investigação + refatoração se necessário)
- **Prazo:** Próxima sprint

#### ☐ **TAREFA #6: Nuke com Deleção Real de Recursos**

- **Status:** **CONFIRMAÇÃO NECESSÁRIA** - Verificar estado atual
- **Problema:** Atualmente o Nuke apenas remove referências, não deleta sites Netlify e repositórios GitHub
- **Impacto:** Recursos ficam "órfãos" na Netlify e GitHub
- **Solução Necessária:**
  1. Implementar `NetlifyManager.deleteSite()` funcional
  2. Implementar `GitManager.deleteRepository()`
  3. Adicionar tratamento de erros para recursos que já foram deletados manualmente
- **Complexidade:** Média (precisa dos tokens do usuário)
- **Prazo:** Confirmar estado atual primeiro

#### ☐ **TAREFA #7: Transferência de Propriedade de Workspace**

- **Status:** **✅ IMPLEMENTADO E TESTADO** - Funcionando
- **Descrição:** Funcionalidade para transferir propriedade de workspace para outro usuário
- **Especificações:** Documentadas em `transfer-workspace.md`
- **Endpoint:** `POST /api/workspaces/[id]/transfer`
- **UI:** Componente `TransferOwnershipCard.jsx` na página de configurações
- **Segurança:** Múltiplas validações e confirmações obrigatórias
- **Complexidade:** Média
- **Prazo:** ✅ **CONCLUÍDO**

### 🎯 **PRIORIDADE MÉDIA - MELHORIAS DE UX**

#### ☐ **TAREFA #8: Sistema de Live Data Inteligente**

- **Status:** **NOVA TAREFA** - Melhoria de UX e performance
- **Descrição:** Implementar sistema de dados em tempo real com otimizações de UX para melhorar a experiência do usuário
- **Problemas a Resolver:**

  1. **Loading Excessivo:** Evitar mostrar loading toda vez que dados mudam
  2. **Inatividade do Usuário:** Detectar quando usuário está inativo e pausar atualizações
  3. **Performance:** Otimizar re-renders desnecessários
  4. **UX Fluida:** Manter interface responsiva durante atualizações

- **Implementação em Fases:**

  **🟢 FASE 1: Otimizações Básicas (Impacto Alto, Esforço Baixo)**

  - ✅ **Debounced Loading:** Delay de 300ms antes de mostrar loading
  - ✅ **useMemo/useCallback:** Otimizar re-renders nos componentes críticos
  - ✅ **Stale-While-Revalidate:** Mostrar dados antigos enquanto carrega novos
  - **Prazo:** 1-2 dias

  **🟡 FASE 2: Detecção de Inatividade (Impacto Alto, Esforço Médio)**

  - ✅ **Visibility API:** Pausar requests quando tab está inativa
  - ✅ **User Activity Tracking:** Detectar inatividade do usuário
  - ✅ **Smart Polling:** Reduzir frequência de requests em background
  - **Prazo:** 3-5 dias

  **🔴 FASE 3: Cache Avançado (Impacto Médio, Esforço Alto)**

  - ✅ **Redis Integration:** Cache serverless com Upstash Redis
  - ✅ **Cache Invalidation:** Estratégias inteligentes de invalidação
  - ✅ **Real-time Updates:** WebSockets ou Server-Sent Events
  - **Prazo:** 1-2 semanas

- **Soluções Técnicas Detalhadas:**

  1. **Debounced Loading:** `setTimeout` + `clearTimeout` para evitar loading desnecessário
  2. **React Optimizations:** `useMemo`, `useCallback`, `React.memo` nos componentes críticos
  3. **Visibility Detection:** `document.visibilitychange` + `document.hidden`
  4. **Activity Tracking:** Mouse/keyboard events + timeout para detectar inatividade
  5. **Stale Data Strategy:** Manter dados antigos visíveis durante fetch

- **⚠️ CUIDADOS E CONSIDERAÇÕES:**

  - **Não over-engineer:** Começar simples e medir impacto real
  - **Edge Cases:** Conexão lenta, múltiplas abas, troca rápida de tabs
  - **Complexidade vs Benefício:** Avaliar se WebSockets realmente agregam valor
  - **Performance:** Medir impacto antes e depois de cada fase

- **Complexidade:** Alta (UX + performance + cache)
- **Prazo:** Próxima sprint (Fase 1) → Sprint seguinte (Fase 2) → Futuro (Fase 3)

#### ☐ **TAREFA #9: Template Configurável via ENV**

- **Status:** **ON HOLD** - Baixa prioridade
- **Problema:** URL do template está hardcodada em `dashmaster-gatsby-template`
- **Solução:**
  1. Criar variável `DEFAULT_TEMPLATE_URL`
  2. Atualizar `env-template.txt`
  3. Implementar fallback no código
- **Complexidade:** Baixa
- **Prazo:** On hold - verificar se realmente necessário

#### ☐ **TAREFA #9: Validação de Tokens**

- **Status:** **INVESTIGAÇÃO NECESSÁRIA** - Verificar se já foi implementado
- **Problema:** Deploy falha silenciosamente se tokens GitHub/Netlify são inválidos
- **Solução:**
  1. Validar tokens antes de iniciar deploy
  2. Mensagens de erro mais claras
  3. Links para criação de tokens
- **Complexidade:** Média
- **Prazo:** Investigar se já foi feito

### 🎯 **PRIORIDADE BAIXA - MELHORIAS FUTURAS**

#### ☐ **TAREFA #10: Logging Estruturado**

- **Status:** **CONFUSO** - Verificar se já temos
- **Problema:** Logs de debug misturados com logs de produção
- **Solução:**
  1. Implementar níveis de log (DEBUG, INFO, ERROR)
  2. Configurar logging estruturado
  3. Dashboard de observabilidade para deploys
- **Complexidade:** Alta
- **Prazo:** Verificar se já existe

#### ☐ **TAREFA #11: Testes Automatizados (boooooring, quando der eu faço)**

- **Status:** **BAIXA PRIORIDADE** - Dívida técnica
- **Problema:** Funcionalidade Nuke e deploy não têm testes
- **Solução:**
  1. Testes unitários para `NetlifyManager`
  2. Testes de integração para `/api/deploy/nuke`
  3. Testes E2E para fluxo de deploy
- **Complexidade:** Alta
- **Prazo:** Quando der eu faço

---

## 📊 **STATUS GERAL DO PROJETO**

### ✅ **FUNCIONANDO PERFEITAMENTE:**

- Dashboard rodando em produção
- Deploy Action funcionando 100%
- API pública estável e funcional
- Imagens Cloudinary aparecendo corretamente
- Funcionalidade Nuke implementada
- TemplateGenerator funcionando
- GitHub Actions com commit e push funcionando

### 🎯 **PRÓXIMOS PASSOS:**

1. ✅ **Clonador de Workspaces (CONCLUÍDO)**
2. **Theme Selector Visual (página dedicada)**
3. **Novo Homepage e texto**
4. **Novo Template com captação de dados (última tarefa)**

### 🔮 **ROADMAP FUTURO:**

- ✅ Transferência de propriedade (concluído)
- ✅ Clonador de workspaces (concluído)
- Theme selector visual (próxima sprint)
- Novo homepage (próxima sprint)
- Novo template com captação de dados (última tarefa)
- Investigar validação de tokens
- Investigar logging estruturado
- Testes automatizados (quando der eu faço)

---

## 📋 **CHECKLIST DE QUALIDADE**

### ✅ **IMPLEMENTADO E FUNCIONANDO:**

- [x] Deploy Action funcionando 100%
- [x] Erro ENOENT resolvido
- [x] Erro Git --local resolvido
- [x] URLs Cloudinary corrigidas
- [x] API pública funcionando
- [x] Funcionalidade Nuke implementada
- [x] TemplateGenerator funcionando

### 🔄 **EM PROGRESSO:**

- [ ] ✅ Correção URLs Cloudinary (RESOLVIDO - era problema de deploy)
- [ ] ✅ Deploy Preview vs Production (RESOLVIDO - inconsistência de branch)
- [ ] ✅ Clonador de workspaces (CONCLUÍDO - funcionando em produção)
- [ ] Theme Selector Visual (página dedicada)
- [ ] Novo Homepage e texto

### 📦 **BACKLOG:**

- [ ] ✅ Transferência de propriedade (concluído)
- [ ] Nuke com deleção real (confirmar estado)
- [ ] Migração de autenticação (investigar)
- [ ] Validação de tokens (investigar)
- [ ] Logging estruturado (verificar se já existe)
- [ ] Template configurável (on hold)
- [ ] Testes automatizados (quando der eu faço)
- [ ] Novo template com captação de dados (última tarefa)

---

## 🎉 **CONQUISTAS RECENTES (05/08/25)**

### **Problemas Resolvidos:**

1. **Erro ENOENT** - Migração para TemplateGenerator
2. **Erro Git --local** - Preservação do repositório git
3. **Limpeza de arquivos** - Removendo arquivos desnecessários do template
4. **Documentação** - Guia de desenvolvimento atualizado
5. **🚨 PROBLEMA CRÍTICO RESOLVIDO:** Deploy Preview vs Production - Inconsistência de branch corrigida
6. **🚨 PROBLEMA CRÍTICO RESOLVIDO:** URLs Cloudinary Malformadas - Corrigido automaticamente com deploy
7. **🎯 FUNCIONALIDADE CRÍTICA IMPLEMENTADA:** Clonador de Workspaces - Funcionando em produção

### **Melhorias Implementadas:**

- TemplateGenerator gera workflow YAML dinamicamente
- Deploy Orchestrator usa TemplateGenerator em vez de arquivo físico
- GitHub Action funciona perfeitamente com commit e push
- Limpeza de arquivos melhorada (postcss.config.js, tailwind.config.js, static/)
- **✅ Sistema 100% funcional:** Deploy indo para produção corretamente
- **✅ Imagens Cloudinary funcionando:** URLs corretas sendo geradas
- **✅ Clonador de Workspaces:** Funcionalidade completa implementada e funcionando

---

**🎯 PRÓXIMO PASSO:** Implementar Theme Selector Visual (página dedicada) - próxima prioridade.
