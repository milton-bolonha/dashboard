# 📊 Report Geral do Sistema - 13/11/2024

## 🎯 Visão Geral

Este documento apresenta um mapeamento completo das funcionalidades do sistema por área, localização, categoria e status de implementação.

---

## 📋 Tabela de Features por Função

| Função | Local | Categoria | Status | Observações |
|--------|------|------------|--------|-------------|
| **HOME/LAYOUT** |
| Layout Principal | `nextjs-openai-insights/src/components/admin/ade/AdminShellAde.tsx` | Layout | ✅ OK | Estrutura sidebar + header + main funcionando |
| Responsividade | `AdminShellAde.tsx` | Layout | ✅ OK | Sidebar colapsável implementada |
| **FORM** |
| Form de Criação | `nextjs-openai-insights/src/components/admin/ade/AddCompanyModal.tsx` | Form | ✅ OK | Modal funcional para adicionar companies |
| Form de Contato | `nextjs-openai-insights/src/components/admin/ade/AddContactModal.tsx` | Form | ✅ OK | Modal funcional para adicionar contacts |
| Validação | Forms diversos | Form | ✅ OK | Validações básicas implementadas |
| **ENVIO E REQUISIÇÕES** |
| API Generate | `nextjs-openai-insights/src/app/api/generate/route.ts` | API | ✅ OK | Endpoint funcional para geração de tiles |
| API Workspace | `nextjs-openai-insights/src/app/api/workspace/**` | API | ✅ OK | CRUD completo de workspace |
| API Tiles | `nextjs-openai-insights/src/app/api/workspace/tiles/**` | API | ✅ OK | Regeneração, chat, CRUD de tiles |
| **REDIRECT ADMIN** |
| Redirecionamento | `nextjs-openai-insights/src/app/admin/page.tsx` | Routing | ✅ OK | Redirecionamento funcionando |
| **ADMIN - HEADER** |
| Nome da Empresa | `AdminHeaderAde.tsx` | Header | ✅ OK | Exibe nome da company selecionada |
| Links Estáticos | `AdminHeaderAde.tsx` | Header | ✅ OK | Links implementados |
| Contraste de Cor | `nextjs-openai-insights/src/lib/color.ts` | Theme | ✅ OK | Sistema global de contraste automático |
| Botão Dashboards | `AdminHeaderAde.tsx` | Header | ⚠️ PARCIAL | Dropdown funciona, mas não fecha ao clicar fora |
| Botão Templates | `AdminHeaderAde.tsx` | Header | ⚠️ PARCIAL | Dropdown funciona, mas não fecha ao clicar fora |
| Botões Login/SignUp | `AdminHeaderAde.tsx` | Header | ⚠️ PARCIAL | UI pronta, mas rotas não funcionam (Clerk não integrado) |
| Botões Cor Fixa | `AdminHeaderAde.tsx` | Header | ❌ BUG | Botões mudam de cor no hover, devem ser sempre branco/preto |
| **ADMIN - SIDEBAR** |
| Companies | `AdminSidebarAde.tsx` | Sidebar | ✅ OK | Lista e seleção funcionando |
| Contacts | `AdminSidebarAde.tsx` | Sidebar | ✅ OK | Lista e seleção funcionando |
| Profile | `AdminSidebarAde.tsx` | Sidebar | ❌ VAZIO | Botão existe mas não tem funcionalidade |
| Settings | `AdminSidebarAde.tsx` | Sidebar | ❌ VAZIO | Botão existe mas não tem funcionalidade |
| **ADMIN - MAIN** |
| AI Insight Tiles | `TileGridAde.tsx` | Main | ✅ OK | Grid de tiles funcionando |
| Tile Card Layout | `TileCard.tsx` | Main | ⚠️ PARCIAL | Precisa ajustar header (bg branco) e body (bg cinza claro) |
| Add Prompt | `AddPromptModal.tsx` | Main | ⚠️ PARCIAL | Modal existe mas falta: tamanho de requisição, max mode completo |
| Contacts Panel | `ContactsPanelAde.tsx` | Main | ✅ OK | Lista de contatos funcionando |
| Notes Panel | `NotesPanelAde.tsx` | Main | ✅ OK | Sistema de notas funcionando |
| Files & Assets | `FilesPlaceholderAde.tsx` | Main | ⚠️ PLACEHOLDER | Placeholder implementado, funcionalidade real pendente |
| **DASHBOARDS** |
| Create Blank Dashboard | `AdminHeaderAde.tsx` | Dashboard | ❌ TODO | Botão existe mas não implementado |
| Listar Dashboards | `AdminHeaderAde.tsx` | Dashboard | ⚠️ PARCIAL | Mostra apenas "Default Research Template" hardcoded |
| Persistência Dashboards | - | Database | ❌ TODO | Não há persistência real, apenas localStorage |
| **TEMPLATES** |
| Listar Templates | `DashboardConfigModal.tsx` | Template | ⚠️ MOCK | Usa dados mockados (MOCK_TEMPLATES) |
| Criar Template | `DashboardConfigModal.tsx` | Template | ⚠️ PARCIAL | UI pronta mas não persiste (apenas state local) |
| Editar Template | `DashboardConfigModal.tsx` | Template | ❌ TODO | Botão existe mas não implementado |
| Deletar Template | `DashboardConfigModal.tsx` | Template | ⚠️ PARCIAL | Remove apenas do state local |
| Layout Templates Modal | `DashboardConfigModal.tsx` | Template | ⚠️ AJUSTAR | Precisa reorganizar: criar e listar lado a lado em colunas |
| **PROMPTS E TILES** |
| Add Single Prompt | `AddPromptModal.tsx` | Prompt | ⚠️ PARCIAL | Falta: tamanho de requisição, max mode completo |
| Max Mode | `AddPromptModal.tsx` | Prompt | ⚠️ PARCIAL | Checkbox existe mas lógica GPT-5 não implementada |
| Tamanho Requisição | `AddPromptModal.tsx` | Prompt | ❌ TODO | Não existe: pequeno/médio/alto |
| Normatização Respostas | `tile-generation.ts` | Prompt | ⚠️ PARCIAL | Cada tipo trata individualmente, não há padronização |
| Qualidade Respostas | `tile-generation.ts` | Prompt | ⚠️ PARCIAL | Atualmente limitado a bullets curtos, precisa melhorar |
| **AUTENTICAÇÃO** |
| Clerk Integration | - | Auth | ❌ TODO | Não implementado (Fase 3 do roadmap) |
| Login Real | `AdminHeaderAde.tsx` | Auth | ❌ TODO | Botão não funciona |
| SignUp Real | `AdminHeaderAde.tsx` | Auth | ❌ TODO | Botão não funciona |
| Membership Provider | `membership-context.tsx` | Auth | ⚠️ FAKE | Usa localStorage, não integrado com backend |
| **BILLING E LIMITES** |
| Bloqueio de Uso | `membership-context.tsx` | Billing | ⚠️ PARCIAL | Limites implementados mas apenas local (guest mode) |
| Stripe Integration | - | Billing | ❌ TODO | Não implementado (Fase 3 do roadmap) |
| Webhooks Stripe | - | Billing | ❌ TODO | Não implementado |
| Planos | `planLimits.js` | Billing | ⚠️ PARCIAL | Estrutura existe mas não conectada ao sistema real |
| **PERSISTÊNCIA** |
| MongoDB Models | - | Database | ❌ TODO | Não implementado (Fase 2 do roadmap) |
| APIs MongoDB | - | Database | ❌ TODO | APIs ainda usam cookies/localStorage |
| Migração Dados | - | Database | ❌ TODO | Não implementado |
| Guest Workspace | `dashboard/app/api/guest/workspace/route.js` | Database | ✅ OK | Persiste em MongoDB (guest_workspaces) |
| **OUTRAS FUNCIONALIDADES** |
| Color Picker | `AdminContainer.tsx` | Theme | ✅ OK | Sistema completo de cores dinâmicas |
| Drag & Drop Tiles | `TileBoard.tsx` | UX | ✅ OK | Reordenação funcionando |
| Chat com Tiles | `api/workspace/tiles/[tileId]/chat/route.ts` | Feature | ✅ OK | Chat implementado |
| Regenerar Tile | `api/workspace/tiles/[tileId]/regenerate/route.ts` | Feature | ✅ OK | Regeneração funcionando |

---

## 🔍 Análise Detalhada por Área

### 1. HEADER - Problemas Identificados

#### Botões não devem mudar de cor
- **Localização**: `AdminHeaderAde.tsx` linhas 216-234
- **Problema**: Botões Login e SignUp mudam de cor no hover
- **Solução**: Remover classes de hover que alteram cor, manter sempre branco/preto

#### Dropdowns não fecham ao clicar fora
- **Localização**: `AdminHeaderAde.tsx` linhas 29-30, 66-111, 124-213
- **Problema**: `showDashboards` e `showTemplates` não são fechados ao clicar fora
- **Solução**: Adicionar `useEffect` com listener de click fora do elemento

### 2. MAIN - Ajustes Necessários

#### Tile Card Layout
- **Localização**: `TileCard.tsx` ou componente equivalente
- **Problema**: Layout interno não segue especificação (header branco + border bottom cinza + body cinza claro)
- **Solução**: Ajustar classes CSS do card

#### Add Prompt Modal - Funcionalidades Faltantes
- **Localização**: `AddPromptModal.tsx`
- **Faltando**:
  1. Campo de tamanho de requisição (pequeno/médio/alto)
  2. Max mode completo (trocar modelo GPT-5-mini para GPT-5)
  3. Payload diferente para max mode
- **Solução**: Adicionar select de tamanho e lógica de modelo baseado em max mode

### 3. DASHBOARDS E TEMPLATES

#### Estado Atual
- **Dashboards**: Apenas UI, sem persistência real
- **Templates**: Dados mockados, sem persistência
- **Criar Blank Dashboard**: Não implementado
- **Aplicar Template**: Não implementado

#### Arquitetura Necessária
- Definir schema de persistência (MongoDB ou localStorage durante transição)
- Criar APIs para CRUD de dashboards
- Criar APIs para CRUD de templates
- Implementar lógica de aplicação de template

### 4. SISTEMA DE PROMPTS

#### Normatização
- **Pergunta**: Estamos normatizando respostas entre diferentes tipos ou tratando cada tipo individualmente?
- **Estado Atual**: Cada tipo trata individualmente (`tile-generation.ts`)
- **Recomendação**: Criar sistema de normatização para padronizar entradas e saídas

#### Qualidade das Respostas
- **Estado Atual**: Limitação de caracteres e bullets points (teste rápido)
- **Próxima Tarefa**: Trabalhar qualidade das respostas
- **Ação**: Criar `fluxo-tiles.md` documentando engenharia de prompts

### 5. PROFILE E SETTINGS

#### Status
- **Profile**: Botão existe no sidebar mas não tem página/funcionalidade
- **Settings**: Botão existe no sidebar mas não tem página/funcionalidade
- **Ação Necessária**: Definir o que vai em cada seção e implementar

### 6. AUTENTICAÇÃO E BILLING

#### Estado Atual
- **Clerk**: Não integrado (Fase 3 do roadmap)
- **Stripe**: Não integrado (Fase 3 do roadmap)
- **Membership**: Fake (localStorage)
- **Limites**: Implementados apenas para guest mode

#### Próximos Passos (Fase 3)
- Integrar Clerk providers
- Configurar webhooks Stripe
- Atualizar MembershipProvider para ler do backend
- Implementar limites server-side

### 7. PERSISTÊNCIA

#### Estado Atual
- **Guest Workspace**: Persiste em MongoDB (`guest_workspaces` collection)
- **Workspace Real**: Não persiste (usa cookies/localStorage)
- **Dashboards**: Não persiste
- **Templates**: Não persiste

#### Próximos Passos (Fase 2)
- Modelar coleções MongoDB (users, workspaces, tiles, contacts, notes, usageCounters)
- Atualizar APIs para usar MongoDB
- Criar rotina de migração de dados

---

## 📝 Documentação Necessária

### Criar `fluxo-tiles.md`
Documentar:
- Criação de prompts
- Engenharia de prompts
- Sistema de tamanhos (pequeno/médio/alto)
- Max mode (GPT-5-mini vs GPT-5)
- Normatização de respostas

---

## 🎯 Prioridades

### Alta Prioridade
1. ✅ Corrigir botões do header (cor fixa)
2. ✅ Fechar dropdowns ao clicar fora
3. ✅ Ajustar layout do tile card (header branco + body cinza)
4. ✅ Completar Add Prompt Modal (tamanho + max mode)
5. ✅ Reorganizar layout do DashboardConfigModal (colunas lado a lado)

### Média Prioridade
6. ⚠️ Implementar Create Blank Dashboard
7. ⚠️ Implementar persistência de dashboards
8. ⚠️ Implementar persistência de templates
9. ⚠️ Criar fluxo-tiles.md
10. ⚠️ Trabalhar qualidade das respostas

### Baixa Prioridade
11. ⚠️ Definir e implementar Profile
12. ⚠️ Definir e implementar Settings
13. ⚠️ Integrar Clerk (Fase 3)
14. ⚠️ Integrar Stripe (Fase 3)
15. ⚠️ Migrar para MongoDB (Fase 2)

---

## 📊 Resumo Estatístico

- **Total de Features**: 45
- **✅ OK**: 18 (40%)
- **⚠️ Parcial/Bug**: 20 (44%)
- **❌ TODO**: 7 (16%)

---

## 🔗 Referências

- Roadmap: `.cursor/plans/road-798330f1.plan.md`
- Fluxo Atual: `novo-fluxo.md`
- Arquitetura: `generic.md`

