# 🚀 MVP-NOW.md: O Plano de Lançamento em 7 Dias (Versão Final Revisada)

Este documento define o caminho para lançar um MVP funcional e **testável do ponto de vista de negócio** do DashMaster PRO.

---

## 📍 Onde Estamos Agora

- **Forças:**
  - ✅ **Autenticação Sólida:** A integração com Clerk funciona.
  - ✅ **CRUD de Workspace:** O ciclo de vida da entidade principal é confiável.
  - ✅ **Ambiente de Teste Estruturado:** A base para testes de API foi criada.
- **Fraquezas Críticas:**
  - ⛔ **Sem Diferenciação de Usuários:** O sistema não distingue um usuário gratuito de um pagante, tornando o modelo de negócio impossível de validar.

---

## 🗺️ O Caminho para o MVP: Checklist de Lançamento (Com Business Logic)

### 🎯 Objetivo 1: Finalizar a Base Técnica

- [x] **CRUD Completo de Workspace:** API e UI para criar, ler e deletar workspaces. _(Status: Concluído)_
- [x] **Configurar e Estabilizar Testes:** Ambiente e mock de autenticação. _(Status: Concluído)_

### 🎯 Objetivo 2: Implementar Controle de Acesso Mínimo (Roles & Planos)

_Esta é a prioridade máxima. Sem isso, o produto não é um MVP viável._

- [ ] **Modelagem de Dados do Usuário:**
  - [ ] Definir no `Clerk` o uso do `publicMetadata` para armazenar o plano do usuário. Ex: `{ "plan": "free" }`.
  - [ ] Garantir que novos usuários recebam o plano `"free"` por padrão no momento do cadastro.
- [ ] **Lógica de Bloqueio na API:**
  - [ ] Criar um `helper` ou `middleware` de verificação, ex: `checkPlan(requiredPlan)`.
  - [ ] Aplicar o bloqueio em uma rota crítica da API. **Exemplo:** A rota `POST /api/sections` deve retornar erro 403 (Forbidden) se um usuário no plano `"free"` tentar criar mais de 3 seções.
- [ ] **Lógica de Bloqueio na UI:**
  - [ ] Criar um `hook` `usePlan()` que retorna o plano do usuário atual a partir do `useUser()` do Clerk.
  - [ ] Usar o hook para desabilitar visualmente o botão "Nova Seção" e mostrar uma mensagem de "Upgrade necessário" quando o limite do plano "free" for atingido.

### 🎯 Objetivo 3: Garantir a Confiabilidade e Lançar

- [ ] **Escrever Testes para Controle de Acesso:**
  - [ ] Criar um `plan.test.js` para testar a lógica de bloqueio da API, simulando um usuário "free" tentando exceder o limite.
- [ ] **Executar e Validar a Suíte de Testes:** Rodar `npm test` e corrigir todos os testes que falharem.
- [ ] **Realizar um "Bug Day":** Testar o fluxo completo como um usuário "free" e um "pago".
- [ ] **Lançar!**

---

## ⚡ Próximo Passo Imediato e Detalhado

**Tarefa:** Implementar a **Modelagem de Dados do Usuário** no Clerk.

1.  **Decisão:** Vamos usar o campo `publicMetadata` do objeto de usuário do Clerk para armazenar o plano. O formato será `{ "plan": "free" }` ou `{ "plan": "pro" }`.
2.  **Ação:** Precisamos garantir que, quando um novo usuário se cadastra, esse metadado seja definido como `"free"` por padrão. Isso geralmente é feito ouvindo o webhook `user.created` do Clerk ou em uma função da nossa API que é chamada após a conclusão do sign-up.
3.  **Investigação:** O primeiro passo é localizar no código onde a sincronização de usuários do Clerk acontece (provavelmente em `api/sync/clerk-users` ou similar) para adicionar essa lógica. Se não existir, precisamos criá-la.

Com isso, teremos a base de dados necessária para começar a construir a lógica de bloqueio.
