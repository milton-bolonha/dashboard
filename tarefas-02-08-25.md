# 🎯 Tarefas para Evolução da Plataforma - 02/08/25

**Objetivo:** Evoluir a arquitetura de deploy para um modelo orientado a eventos (Webhooks), implementar funcionalidades críticas de recuperação de falhas (Nuke) e aprimorar a experiência do usuário (UX) com interfaces mais intuitivas.

---

## 🏛️ 1. Decisão de Arquitetura: Evoluir de Polling para Webhooks

Atualmente, nossa UI de deploy utiliza **Polling** para verificar o status de um deploy, perguntando ao nosso backend a cada 5 segundos "Já terminou?". Isso funciona, mas não é o ideal.

Sua análise está perfeita. Devemos migrar para uma arquitetura com **Webhooks**.

- **Com Polling (Estado Atual):**

  - **Usuário:** "Como está?"
  - **Nosso Backend:** _consulta o GitHub_ "30% completo."
  - _(10 segundos depois)_
  - **Usuário:** "E agora?"
  - **Nosso Backend:** _consulta o GitHub_ "Ainda 30% completo."
  - _(10 segundos depois)_
  - **Usuário:** "E agora?"
  - **Nosso Backend:** _consulta o GitHub_ "60% completo."

- **Com Webhooks (Estado Futuro):**
  - **GitHub:** _RING!_ "Olá, backend. A Action chegou em 30%!"
  - **Nosso Backend:** "Valeu!" _(avisa a UI imediatamente)_
  - **GitHub:** _RING!_ "Olá, backend. Agora estou em 60%!"
  - **Nosso Backend:** "Valeu!" _(avisa a UI imediatamente)_

### Vantagens do Webhook

- **⚡ Instantâneo:** A UI é notificada em segundos, não minutos.
- **💰 Eficiente:** Reduz drasticamente o número de chamadas de API desnecessárias.
- **📈 Escalável:** O modelo funciona para 1 ou 1000 deploys simultâneos sem sobrecarregar nosso sistema.

### O Desafio dos Webhooks

1.  **URL Pública:** O GitHub precisa de um endpoint público no nosso sistema para enviar as notificações. Para desenvolvimento local, isso exigirá uma ferramenta de tunelamento como o `ngrok`.
2.  **Segurança:** Precisamos validar que cada notificação vem de fato do GitHub, usando um "segredo" compartilhado.
3.  **Resiliência:** Se nosso servidor estiver offline quando o GitHub ligar, a notificação pode ser perdida. Precisamos de uma estratégia para isso.

**Decisão Final:** A migração para Webhooks é a prioridade arquitetural. Manteremos o Polling como um **fallback** (plano B), garantindo uma experiência robusta.

---

## 🚀 2. Tarefas de Implementação Prioritárias

### ☐ **TAREFA #1: Implementar o Fluxo de Deploy com Webhooks**

- **Objetivo:** Substituir o polling como método primário de atualização de status.
- **Plano de Ação:**
  1.  **Backend:**
      - Criar um novo endpoint: `POST /api/deploy/webhook`.
      - Este endpoint receberá o status final (`success` ou `failure`) da GitHub Action.
      - **Segurança:** A rota deve validar um `secret` enviado pela Action para garantir que a requisição é legítima.
      - Ao receber um status válido, o backend atualizará o registro do `Deployment` no MongoDB para `concluido` ou `falhou`.
  2.  **GitHub Action (`deploy.yml`):**
      - No final do workflow, adicionar um passo que faz uma chamada `curl` para o nosso novo endpoint de webhook.
      - A chamada enviará o resultado do job e o `secret` de validação.
  3.  **Frontend (`deploy/page.jsx`):**
      - A UI continuará fazendo o polling, mas com uma inteligência adicional.
      - O loop de polling agora irá parar assim que o status mudar para `concluido` ou `falhou` (o que será feito pelo webhook).
      - Isso nos dá o melhor dos dois mundos: atualizações rápidas via webhook e a garantia de atualização via polling caso o webhook falhe.

### ☐ **TAREFA #2: Implementar Funcionalidade "Nuke" (Reset Completo)**

- **Problema:** Conforme `tarefas-01-08-25.md`, não há forma de resetar um deploy que deu errado.
- **Solução:**
  1.  **UI (`deploy/page.jsx`):** Adicionar um botão "🗑️ Resetar Deploy" na área "Site Configurado". O botão deve ser perigoso e acionar múltiplos modais de confirmação.
  2.  **Backend:** Criar o endpoint `POST /api/deploy/nuke`.
      - **Ações:**
        - Deleta o site correspondente na Netlify via API.
        - Deleta o repositório no GitHub via API.
        - Remove o objeto `netlifyDeployment` do documento do workspace no MongoDB.
        - Deleta todo o histórico de `deployments` associado ao workspace.
  3.  **Segurança:** A UI deve exigir que o usuário digite o nome do workspace para confirmar a ação, como uma camada final de proteção contra cliques acidentais.

---

## ✨ 3. Melhorias de UX e Próximos Passos

### ☐ **TAREFA #3: Implementar "Theme Selector" Visual**

- **Problema:** A seleção de template via checkbox e input de texto (`tarefas-01-08-25.md`) é funcional, mas pouco intuitiva.
- **Solução:**
  1.  **Componente (`ThemeSelector.jsx`):** Criar um componente visual com cartões.
  2.  **Opções:**
      - **Cartão 1:** "Template Padrão DashMaster" (com uma imagem/ícone representativo).
      - **Cartão 2:** "Repositório Customizado" (com um ícone de "link" ou "código").
  3.  **Comportamento:** A seleção de um cartão atualiza o estado. O input para a URL do repositório customizado só aparece se o segundo cartão for selecionado.

### ☐ **TAREFA #4: Tornar o Template Padrão Configurável**

- **Objetivo:** Desacoplar o nome do repositório template (`dashmaster-gatsby-template`) do código.
- **Plano de Ação:**
  1.  **Backend:** No `deploy-orchestrator.mjs`, a referência ao template deve vir de uma variável de ambiente (ex: `process.env.DEFAULT_TEMPLATE_URL`).
  2.  **Documentação:** Atualizar o `env-template.txt` para incluir a nova variável.
  3.  **Fallback:** Se a variável não estiver definida, o sistema deve usar um valor padrão codificado para não quebrar.

---

## 🔄 4. Tarefas em Andamento (Contexto)

### ☑️ **TAREFA #5: Criar Repositório `dashmaster-gatsby-template`**

- **Status:** Em Andamento (atribuído ao usuário).
- **Descrição:** Criar um repositório público no GitHub com este nome e popular com o conteúdo da pasta `gatsby-landing`.
- **Ação para Nós:** Após a criação, configurar a `DEFAULT_TEMPLATE_URL` (Tarefa #4).

---

## ✅ 5. Checklist de Implementação

- [ ] **Arquitetura de Deploy:**
  - [ ] Criar endpoint de webhook (`/api/deploy/webhook`).
  - [ ] Modificar GitHub Action para chamar o webhook.
  - [ ] Aprimorar lógica de polling no frontend para atuar como fallback.
- [ ] **Funcionalidades Críticas:**
  - [ ] Adicionar botão "Resetar Deploy" na UI.
  - [ ] Implementar modais de confirmação múltipla.
  - [ ] Criar endpoint `nuke` no backend.
- [ ] **Melhorias de UX:**
  - [ ] Criar componente visual `ThemeSelector.jsx`.
  - [ ] Integrar o seletor de tema na página de deploy.
- [ ] **Configuração:**
  - [ ] Ler nome do template de variável de ambiente.
  - [ ] Atualizar `env-template.txt`.
