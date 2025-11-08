# 🎃 Plano de Ação - Halloween 31/10

## Meta: Finalizar Admin (Header + Main + Sidebar) + Integração Home 100%

## 📊 Estado Atual (Baseado no report-30-10.md)

### ✅ Conquistas Já Implementadas

- Sistema SSE completo com buffer inteligente
- Criação automática de workspace guest
- Integração SSE → UI de tiles
- Ordenação determinística por orderIndex
- Singleton global SSE Manager
- Sistema de fallback de autenticação guest

### 🔴 Bugs Críticos Identificados

1. **Nome da Company sempre "Preview Company"**

   - `initialItems` só tem `orderIndex`, sem campos do form
   - Company temporária criada sem nome real
   - Impacto: UX ruim, dados incorretos

2. **EventSource SSE falhando**

   - Conexão não estabelecida
   - Eventos não chegando ao frontend
   - Impacto: Tiles não aparecem em tempo real

3. **Cards não renderizando corretamente**

   - Tiles não aparecem ou aparecem incorretos
   - Placeholders não são substituídos
   - Impacto: UI quebrada

4. **404 em Notes/Files para company temporária**

   - Componentes tentam buscar dados inexistentes
   - Impacto: Logs de erro (não crítico)

5. **Variáveis malformadas nos prompts**
   - `[object Object]` aparecendo em prompts
   - `undefined` em vários lugares
   - Impacto: Respostas da IA ruins

---

## 🎯 Plano de Execução - 4 Fases

### ⚡ FASE 1: Correções Críticas (Prioridade MÁXIMA)

**Tempo estimado: 1-2h**

#### 1.1 Corrigir Estrutura dos Items no Job ✅ PARCIALMENTE RESOLVIDO

**Problema**: `initialItems` só tem `orderIndex`, sem campos do form

**Ações**:

- [ ] Verificar `IAFormsPresenterClassic.jsx` - logar `inputs` antes de `setItemsBuilder`
- [ ] Verificar `IAFormsContainer.jsx` - logar `itemsPayload` completo antes de enviar
- [ ] Verificar `/api/prompt-jobs/[jobId]/run` - garantir que items completos são salvos
- [ ] Garantir que `itemsBuilder()` recebe `inputs` preenchidos
- [ ] Adicionar validação: não permitir submit se inputs vazios

**Arquivos**:

- `dashboard/components/landing/iaforms/IAFormsPresenterClassic.jsx`
- `dashboard/components/landing/IAFormsContainer.jsx`
- `dashboard/app/api/prompt-jobs/[jobId]/run/route.js`

**Critério de sucesso**: `initialItems[0]` deve ter `researchTarget`, `company`, `solution`, etc.

#### 1.2 Corrigir Conexão SSE ✅ PARCIALMENTE RESOLVIDO

**Problema**: EventSource falhando, eventos não chegam

**Ações**:

- [ ] Testar endpoint SSE via curl: `curl -N "http://localhost:3000/api/streams/jobs/{jobId}?guest_id={guestId}&token={token}"`
- [ ] Verificar logs do servidor quando SSE é chamado
- [ ] Verificar formato SSE (`event:`, `data:`)
- [ ] Verificar se `sse:connected` é emitido
- [ ] Corrigir problema de reconexão infinita (já implementado parcialmente)
- [ ] Adicionar tratamento de erro mais robusto no `useSSE`

**Arquivos**:

- `dashboard/hooks/useSSE.js`
- `dashboard/app/api/streams/jobs/[jobId]/route.js`
- `dashboard/lib/sse-manager.js`

**Critério de sucesso**: Conexão SSE estabelecida, eventos chegando, tiles aparecendo

#### 1.3 Corrigir Extração de Nome da Company

**Problema**: Company sempre "Preview Company"

**Ações**:

- [ ] Buscar nome da company de `initialItems[0].researchTarget` primeiro
- [ ] Fallback para `jobInfo.initialItems[0].researchTarget`
- [ ] Fallback para URL params (se disponível)
- [ ] Criar company real no workspace quando job inicia (não temporária)
- [ ] Remover criação de company temporária desnecessária

**Arquivos**:

- `dashboard/containers/AdminDashboardContainer.jsx`
- `dashboard/app/api/prompt-jobs/[jobId]/run/route.js`
- `dashboard/app/api/guest/workspace/route.js`

**Critério de sucesso**: Company mostra nome real do form, não "Preview Company"

---

### 🎨 FASE 2: Renderização de Cards/Tiles (Prioridade ALTA)

**Tempo estimado: 1-2h**

#### 2.1 Verificar Estrutura de Tiles Recebidos

**Ações**:

- [ ] Verificar formato dos tiles vindos do SSE (`job:result-completed`)
- [ ] Garantir que tiles têm `id`, `title`, `excerpt`, `orderIndex`
- [ ] Verificar mapeamento de `result` → `tile` em `AdminDashboardContainer`
- [ ] Garantir que `tilesWithIds` está correto no `SortableTilesGrid`

**Arquivos**:

- `dashboard/containers/AdminDashboardContainer.jsx` (listeners SSE)
- `dashboard/components/ui/SortableTilesGrid.jsx`
- `dashboard/components/ui/DraggableTile.jsx`
- `dashboard/components/ui/Tile.jsx`

**Critério de sucesso**: Tiles renderizam com título, conteúdo e métricas corretas

#### 2.2 Corrigir Substituição de Placeholders

**Ações**:

- [ ] Verificar que placeholders são criados com `orderIndex` correto
- [ ] Garantir que `job:result-completed` substitui placeholder na posição correta
- [ ] Verificar que `tilesWithIds.length` é usado para calcular loading tiles
- [ ] Garantir que não há duplicação de tiles

**Arquivos**:

- `dashboard/containers/AdminDashboardContainer.jsx` (listener `job:result-completed`)
- `dashboard/components/ui/SortableTilesGrid.jsx`

**Critério de sucesso**: Placeholders são substituídos por tiles reais na ordem correta

#### 2.3 Corrigir Componente Tile

**Ações**:

- [ ] Verificar que `Tile.jsx` recebe props corretas (`title`, `excerpt`, `metrics`)
- [ ] Garantir que excerpt é extraído corretamente do `answer` ou `content`
- [ ] Verificar renderização de métricas (tokens, tempo, etc.)
- [ ] Garantir que delete funciona

**Arquivos**:

- `dashboard/components/ui/Tile.jsx`
- `dashboard/components/ui/DraggableTile.jsx`

**Critério de sucesso**: Cards aparecem com design correto, dados completos

---

### 🏗️ FASE 3: Admin Header + Sidebar (Prioridade MÉDIA)

**Tempo estimado: 1-2h**

#### 3.1 Header - Funcionalidades Básicas

**Ações**:

- [ ] Verificar breadcrumb mostra nome correto da company
- [ ] Garantir que templates são carregados corretamente (com guest_id)
- [ ] Adicionar ColorPicker no header (conforme plano)
- [ ] Adicionar Dark Mode toggle no header
- [ ] Garantir que dropdowns funcionam (Dashboards, Templates)

**Arquivos**:

- `dashboard/components/layout/Header.jsx`
- `dashboard/components/ui/ColorPicker.jsx` (criar se não existir)

**Critério de sucesso**: Header funcional com todas as ações básicas

#### 3.2 Sidebar - Navegação e Seleção

**Ações**:

- [ ] Verificar que sidebar lista companies corretamente
- [ ] Garantir que seleção de company atualiza `selectedCompany`
- [ ] Adicionar indicador visual de company selecionada
- [ ] Garantir que sidebar não faz requisições desnecessárias
- [ ] Adicionar loading state na sidebar

**Arquivos**:

- `dashboard/components/layout/Sidebar.jsx`
- `dashboard/containers/AdminDashboardContainer.jsx`

**Critério de sucesso**: Sidebar navega entre companies sem erros

#### 3.3 Integração Header + Sidebar + Main

**Ações**:

- [ ] Garantir que mudança de company atualiza header (breadcrumb)
- [ ] Garantir que mudança de company atualiza grid de tiles
- [ ] Verificar que estado está sincronizado entre componentes
- [ ] Adicionar error boundaries

**Arquivos**:

- `dashboard/app/admin/page.jsx`
- `dashboard/containers/AdminDashboardContainer.jsx`

**Critério de sucesso**: Mudança de company atualiza tudo corretamente

---

### 🔗 FASE 4: Integração Home → Admin (Prioridade ALTA)

**Tempo estimado: 1h**

#### 4.1 Fluxo Completo Home → Admin

**Ações**:

- [ ] Verificar que Home cria job corretamente com `initialItems` completos
- [ ] Verificar que redirecionamento funciona (`/admin?job_id=...&guest_id=...&token=...`)
- [ ] Garantir que Admin detecta `job_id` e conecta ao SSE automaticamente
- [ ] Verificar que workspace é criado automaticamente se não existe
- [ ] Garantir que cookie `guest_id` é setado corretamente

**Arquivos**:

- `dashboard/components/landing/IAFormsContainer.jsx`
- `dashboard/components/landing/iaforms/IAFormsPresenterClassic.jsx`
- `dashboard/containers/AdminDashboardContainer.jsx`
- `dashboard/app/api/guest/workspace/route.js`

**Critério de sucesso**: Fluxo completo funciona sem erros

#### 4.2 Correções de Variáveis Malformadas

**Ações**:

- [ ] Verificar que `buildLegacyContext` está sendo chamado corretamente
- [ ] Garantir que prompts não têm `[object Object]` ou `undefined`
- [ ] Testar geração de tiles e verificar prompts gerados
- [ ] Corrigir qualquer problema restante de normalização

**Arquivos**:

- `dashboard/lib/theme-context-mapper.js` ✅ JÁ CORRIGIDO
- `dashboard/lib/prompt-optimizer.js` ✅ JÁ CORRIGIDO
- `dashboard/lib/ai-tile-generator-optimized.js` ✅ JÁ CORRIGIDO

**Critério de sucesso**: Prompts gerados não têm variáveis malformadas

#### 4.3 Tratamento de Company Temporária

**Ações**:

- [ ] Esconder Notes/Files quando company é temporária (`id.startsWith('temp_')`)
- [ ] Ou criar company real no workspace quando job inicia
- [ ] Remover logs de erro 404 desnecessários

**Arquivos**:

- `dashboard/components/ui/NotesEditor.jsx`
- `dashboard/components/ui/FilesManager.jsx`
- `dashboard/containers/AdminDashboardContainer.jsx`

**Critério de sucesso**: Sem erros 404 em Notes/Files

---

## 📋 Checklist de Validação Final

### ✅ Testes Funcionais

- [ ] **Home → Admin**

  - [ ] Preencher form na Home
  - [ ] Submeter e verificar redirecionamento
  - [ ] Verificar que workspace é criado automaticamente
  - [ ] Verificar que company tem nome correto (não "Preview Company")
  - [ ] Verificar que SSE conecta automaticamente

- [ ] **Renderização de Tiles**

  - [ ] Placeholders aparecem antes dos tiles
  - [ ] Tiles são substituídos na ordem correta (`orderIndex`)
  - [ ] Cards têm título, conteúdo e métricas corretos
  - [ ] Grid não "pula" quando novos tiles chegam
  - [ ] Loading tiles desaparecem quando todos tiles estão prontos

- [ ] **SSE em Tempo Real**

  - [ ] Eventos `job:status` são recebidos
  - [ ] Eventos `job:result-completed` são recebidos
  - [ ] Tiles aparecem em tempo real (sem F5)
  - [ ] Progresso é atualizado corretamente

- [ ] **Header**

  - [ ] Breadcrumb mostra nome correto
  - [ ] Templates são carregados
  - [ ] Dropdowns funcionam
  - [ ] ColorPicker funciona (se implementado)
  - [ ] Dark Mode funciona (se implementado)

- [ ] **Sidebar**

  - [ ] Lista companies corretamente
  - [ ] Seleção funciona
  - [ ] Indicador visual de seleção
  - [ ] Não faz requisições desnecessárias

- [ ] **Integração**
  - [ ] Mudança de company atualiza header
  - [ ] Mudança de company atualiza grid
  - [ ] Estado sincronizado entre componentes
  - [ ] Sem erros no console

### ✅ Testes de Qualidade

- [ ] **Performance**

  - [ ] Sem polling desnecessário quando há `job_id`
  - [ ] SSE não reconecta infinitamente
  - [ ] Componentes não re-renderizam desnecessariamente

- [ ] **UX**

  - [ ] Loading states aparecem imediatamente
  - [ ] Transições suaves
  - [ ] Mensagens de erro amigáveis
  - [ ] Feedback visual adequado

- [ ] **Código**
  - [ ] Logs excessivos removidos ou convertidos para `console.debug`
  - [ ] Código limpo e organizado
  - [ ] Sem variáveis não usadas
  - [ ] Comentários claros onde necessário

---

## 🚀 Ordem de Execução Recomendada

1. **Primeiro**: Fase 1 (Correções Críticas)

   - Sem isso, nada funciona direito
   - Foco em items e SSE

2. **Segundo**: Fase 2 (Renderização)

   - Garantir que tiles aparecem corretamente
   - Sem isso, UX está quebrada

3. **Terceiro**: Fase 4 (Integração Home → Admin)

   - Garantir fluxo completo funciona
   - Testar end-to-end

4. **Por último**: Fase 3 (Header + Sidebar)
   - Melhorias de UX
   - Funcionalidades extras

---

## 🐛 Debug Rápido - Comandos Úteis

```bash
# Testar SSE endpoint diretamente
curl -N "http://localhost:3000/api/streams/jobs/{jobId}?guest_id={guestId}&token={token}"

# Verificar estrutura dos items do job
curl "http://localhost:3000/api/prompt-jobs/{jobId}?guest_id={guestId}" | jq '.initialItems[0]'

# Verificar workspace guest
curl "http://localhost:3000/api/guest/workspace?guest_id={guestId}" | jq '.workspace.companies[0].name'

# Verificar results do job
curl "http://localhost:3000/api/prompt-jobs/{jobId}/results?guest_id={guestId}" | jq '.items[0]'
```

---

## 📝 Notas Importantes

### ⚠️ Atenção Especial

1. **Variáveis de Contexto**: Não confundir `classic` (não existe) com `sales-assistant` (tema real)
2. **Company vs Companies**: Ainda há ambiguidade transitória - código usa `company/companies` mas sistema é genérico
3. **Theme ID**: Hero clássico sempre usa `sales-assistant`, hero dinâmico pode escolher qualquer tema
4. **Templates**: `tpl_classic_default` e `tpl_dynamic_default` são IDs de template/UI, não theme IDs

### ✅ Correções Já Aplicadas (Confirmar Funcionamento)

1. ✅ Normalização de contexto dinâmico → legado (`buildLegacyContext`)
2. ✅ Detecção robusta de Sales Assistant (por ID, estrutura ou fallback)
3. ✅ Validação de strings para evitar `[object Object]`
4. ✅ Limite de reconexões SSE (3 tentativas máx)
5. ✅ Logs convertidos para `console.debug` (reduzir ruído)

### 🔍 Pontos de Atenção Durante Debug

- Verificar timing: `itemsBuilder()` pode ser chamado antes de `inputs` estar preenchido
- Verificar estado do EventSource: `readyState` pode indicar problema
- Verificar formato SSE: deve ter `event:` e `data:` em linhas separadas
- Verificar sincronização: `selectedCompany` e `workspace` devem estar sincronizados

---

---

## 🚀 FASE 5: Funcionalidades do Workflow Completo (Prioridade ALTA - Pós-Halloween)

**Tempo estimado: 8-12h**

### 5.1 CSV Upload para Companies

**Problema**: Workflow requer upload de CSV para adicionar múltiplas companies

**Ações**:

- [ ] Criar componente `CSVUploadModal.jsx` para upload de arquivos CSV
- [ ] Criar API `/api/guest/upload-csv` para processar CSV
- [ ] Validar formato CSV (colunas: name, website, industry, etc.)
- [ ] Processar CSV e criar múltiplas companies em batch
- [ ] Gerar tiles automaticamente para cada company do CSV
- [ ] Mostrar progresso de upload e criação
- [ ] Adicionar botão "Upload CSV" no modal de Add Company

**Arquivos**:

- `dashboard/components/ui/CSVUploadModal.jsx` (criar)
- `dashboard/app/api/guest/upload-csv/route.js` (criar)
- `dashboard/components/ui/AddCompanyModal.jsx` (modificar)

**Critério de sucesso**: Upload CSV cria múltiplas companies automaticamente

### 5.2 Integração CRM (HubSpot, Salesforce)

**Problema**: Workflow requer conexão com CRM para importar companies

**Ações**:

- [ ] Criar sistema de OAuth para HubSpot
- [ ] Criar sistema de OAuth para Salesforce
- [ ] Criar API `/api/guest/connect-crm` para iniciar OAuth flow
- [ ] Criar API `/api/guest/sync-crm` para sincronizar companies
- [ ] Adicionar botão "Connect CRM" no modal de Add Company
- [ ] Mapear campos do CRM para estrutura de companies
- [ ] Gerar tiles automaticamente após sync

**Arquivos**:

- `dashboard/lib/crm-oauth.js` (criar)
- `dashboard/app/api/guest/connect-crm/route.js` (criar)
- `dashboard/app/api/guest/sync-crm/route.js` (criar)
- `dashboard/components/ui/CRMConnectModal.jsx` (criar)

**Critério de sucesso**: Usuário pode conectar CRM e importar companies

### 5.3 Dashboard Views Reutilizáveis

**Problema**: Workflow requer que prompts/tiles possam ser salvos como "dashboard view" reutilizável

**Ações**:

- [ ] Criar schema para `dashboard_views` no MongoDB
- [ ] Criar API `/api/guest/dashboard-views` (GET, POST, PUT, DELETE)
- [ ] Adicionar botão "Save as Dashboard View" no header
- [ ] Modal para salvar configuração atual (tiles, prompts, layout)
- [ ] Sistema de aplicação automática de dashboard view para novas companies
- [ ] Lista de dashboard views disponíveis no header dropdown
- [ ] Compartilhamento de dashboard views entre usuários (futuro)

**Arquivos**:

- `dashboard/app/api/guest/dashboard-views/route.js` (criar)
- `dashboard/components/ui/SaveDashboardViewModal.jsx` (criar)
- `dashboard/components/layout/Header.jsx` (modificar)

**Critério de sucesso**: Usuário pode salvar e reutilizar configurações de dashboard

### 5.4 Tile Principal para Perguntas de Alto Nível

**Problema**: Workflow requer tile principal para perguntas de alto nível

**Ações**:

- [ ] Criar componente `MainQuestionTile.jsx` diferente dos tiles normais
- [ ] Tile principal aparece sempre no topo do grid
- [ ] Campo de input grande para perguntas
- [ ] Resposta gerada via IA aparece abaixo
- [ ] Botão "Pin as New Tile" para salvar resposta como tile separado
- [ ] Integrar com sistema de tiles existente

**Arquivos**:

- `dashboard/components/ui/MainQuestionTile.jsx` (criar)
- `dashboard/components/ui/SortableTilesGrid.jsx` (modificar)
- `dashboard/lib/ai-tile-generator.js` (modificar)

**Critério de sucesso**: Tile principal funciona para perguntas de alto nível

### 5.5 Sistema de Replies em Tiles

**Problema**: Workflow requer que reps possam responder tiles para refinar respostas

**Ações**:

- [ ] Adicionar campo de input de reply no componente `Tile.jsx`
- [ ] Criar API `/api/guest/tiles/[tileId]/reply` para processar reply
- [ ] Sistema de contexto: reply + tile original → nova resposta
- [ ] Opções: "Replace Tile" ou "Save as New Tile"
- [ ] Modal de confirmação antes de substituir tile
- [ ] Histórico de replies (opcional, futuro)

**Arquivos**:

- `dashboard/components/ui/Tile.jsx` (modificar)
- `dashboard/components/ui/DraggableTile.jsx` (modificar)
- `dashboard/app/api/guest/tiles/[tileId]/reply/route.js` (criar)
- `dashboard/lib/ai-tile-generator.js` (modificar)

**Critério de sucesso**: Usuário pode responder tile e escolher substituir ou criar novo

### 5.6 Integração de Arquivos Contextuais nos Prompts

**Problema**: Workflow requer que arquivos uploadados sejam integrados nos prompts de IA

**Ações**:

- [ ] Criar sistema de processamento de arquivos (PDF, transcripts)
- [ ] Extrair texto de PDFs usando biblioteca de PDF parsing
- [ ] Criar API `/api/guest/files/[fileId]/extract` para extrair conteúdo
- [ ] Armazenar conteúdo extraído junto com metadata do arquivo
- [ ] Modificar `ai-tile-generator.js` para incluir contexto de arquivos
- [ ] Incluir resumo de arquivos relevantes nos prompts de tiles
- [ ] Sistema de busca por arquivos (qual arquivo usar para qual tile)

**Arquivos**:

- `dashboard/lib/file-processor.js` (criar)
- `dashboard/app/api/guest/files/[fileId]/extract/route.js` (criar)
- `dashboard/lib/ai-tile-generator.js` (modificar)
- `dashboard/lib/theme-context-mapper.js` (modificar)

**Critério de sucesso**: Arquivos são integrados automaticamente nos prompts de IA

### 5.7 Account Scoring Automático

**Problema**: Workflow requer que IA avalie automaticamente ICP fit de cada account

**Ações**:

- [ ] Criar schema para ICP (Ideal Customer Profile) no workspace
- [ ] Criar API `/api/guest/icp` para definir ICP
- [ ] Criar função `calculateAccountScore()` usando IA
- [ ] Gerar score automático ao criar/adicionar company
- [ ] Atualizar score quando novos dados chegam (tiles, files, contacts)
- [ ] Visualização de score (A, B, C, D) na lista de companies
- [ ] Filtro por score na sidebar

**Arquivos**:

- `dashboard/lib/account-scorer.js` (criar)
- `dashboard/app/api/guest/icp/route.js` (criar)
- `dashboard/app/api/guest/companies/[companyId]/score/route.js` (criar)
- `dashboard/components/layout/Sidebar.jsx` (modificar)

**Critério de sucesso**: Cada company tem score automático de ICP fit

### 5.8 Enriquecimento de Contacts com LinkedIn

**Problema**: Workflow requer enriquecimento automático de contacts usando LinkedIn URLs

**Ações**:

- [ ] Criar função `enrichContactFromLinkedIn()` usando IA
- [ ] Quando contact é adicionado com LinkedIn URL, fazer scraping/enriquecimento
- [ ] Extrair: role, company, experience, education, skills
- [ ] Gerar Contact Insights Tile automaticamente após enriquecimento
- [ ] Atualizar contact com dados enriquecidos
- [ ] Fallback para dados manuais se LinkedIn não disponível

**Arquivos**:

- `dashboard/lib/contact-enricher.js` (criar)
- `dashboard/app/api/guest/add-contact/route.js` (modificar)
- `dashboard/lib/contact-outreach-generator.js` (modificar)

**Critério de sucesso**: Contacts são enriquecidos automaticamente com dados do LinkedIn

---

## 🎯 Meta Final do Dia (Halloween)

Ao final do dia, esperamos ter:

1. ✅ Admin totalmente funcional (Header + Main + Sidebar)
2. ✅ Integração Home → Admin funcionando 100%
3. ✅ Tiles renderizando corretamente como cards
4. ✅ SSE funcionando e eventos chegando
5. ✅ Company com nome correto (não "Preview Company")
6. ✅ Sem variáveis malformadas nos prompts
7. ✅ UX fluida e profissional

---

## 🎯 Meta Final - Workflow Completo (Pós-Halloween)

Ao final de todas as fases, esperamos ter:

1. ✅ CSV Upload funcionando
2. ✅ Integração CRM (HubSpot, Salesforce)
3. ✅ Dashboard Views reutilizáveis
4. ✅ Tile principal para perguntas
5. ✅ Sistema de replies em tiles
6. ✅ Integração de arquivos contextuais
7. ✅ Account Scoring automático
8. ✅ Enriquecimento de contacts com LinkedIn

---

## 📊 Métricas de Sucesso

- **Tempo de carregamento inicial**: < 2s
- **Latência SSE**: < 500ms entre evento e UI
- **Taxa de sucesso de conexão SSE**: > 95%
- **Tiles renderizados corretamente**: 100%
- **Erros no console**: 0 (ou apenas warnings esperados)

---

**Criado em**: 31/10/2025  
**Prioridade**: 🔥 CRÍTICA  
**Estimativa total**: 4-6 horas de trabalho focado (Halloween) + 8-12h (Workflow Completo)

**Boa sorte! 🎃 Vamos finalizar esse admin hoje!**
