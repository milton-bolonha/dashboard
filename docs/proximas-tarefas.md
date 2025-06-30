# 🗺️ DashMaster PRO: Plano de Ação Estratégico

Este documento serve como nosso guia central para a evolução do **DashMaster PRO**, transformando-o de uma ferramenta funcional em uma plataforma robusta de **DaaI (Dashboard as an Infrastructure)**.

## ✅ Status Atual

- **Estilo e UI:** O problema do modo escuro foi corrigido.
- **Migração para Workspaces:** A lógica base foi implementada.
- **Organização:** Arquivos legados de documentação foram movidos para `docs/legacy`.

---

## 🚀 Pilares de Ação

Dividimos as próximas etapas em cinco pilares estratégicos para guiar nosso desenvolvimento.

### 🏛️ Pilar 1: Fundações e Qualidade Técnica (A Base Sólida)

_Garantir que a base do nosso projeto seja sólida, confiável e livre de bugs._

- [ ] **Finalizar CRUD de Workspaces:**
  - [ ] Implementar a API para **excluir** um workspace e todos os seus dados associados (cascade delete).
  - [ ] Adicionar o botão e a lógica de confirmação na interface de administração.
- [ ] **Criar Suíte de Testes de API (Nativos Node.js):**
  - [ ] Testar todos os endpoints de `workspaces`, `sections`, e `content-types`.
  - [ ] Criar testes específicos para garantir o **isolamento de dados** entre workspaces.
  - [ ] **Objetivo:** Ter confiança para fazer mudanças sem quebrar a lógica existente.
- [ ] **Automatizar Relatórios de Testes:**
  - [ ] Configurar o executor de testes para gerar um relatório em HTML/JSON (`test-report.html`).
- [ ] **Limpar o Repositório (`.gitignore`):**
  - [ ] Adicionar `*.log`, `*.env.local` e outros artefatos de build ao `.gitignore`.

---

### 🏗️ Pilar 2: Arquitetura e Escalabilidade (O Esqueleto Flexível)

_Tomar as decisões de arquitetura corretas agora para suportar o crescimento futuro._

- [ ] **Separar Aplicação (Site vs. Dashboard):** `[Arquitetura Crítica]`
  - [ ] **Planejar:** Pesquisar a melhor forma de usar o Clerk para autenticação compartilhada entre `dashmaster.pro` e `app.dashmaster.pro`.
  - [ ] **Executar:** Criar uma nova aplicação Next.js no monorepo para servir como o site de marketing.
- [ ] **Desenhar o Sistema de Roles e Permissões:** `[Arquitetura Crítica]`
  - [ ] **Definir as Roles:** `super-admin`, `admin`, `user` (acesso privado), `public` (leitura).
  - [ ] **Modelar os Dados:** Definir como as roles serão armazenadas no MongoDB e associadas aos usuários (Clerk ID) e workspaces.
  - [ ] **Refatorar API:** Implementar middleware nos endpoints para verificar as permissões.

---

### 💰 Pilar 3: Monetização e Ecossistema (O Coração do Negócio)

_Construir a infraestrutura que permite a monetização em todos os níveis._

- [ ] **Estruturar o Sistema de Planos e Limites:**
  - [ ] **API:** Criar endpoints para gerenciar planos (Basic, Pro, Unlimited) e seus limites (nº de workspaces, sections, etc.).
  - [ ] **Integração:** Conectar a criação/alteração de assinaturas no Stripe à aplicação desses limites na conta do usuário.
- [ ] **Desenvolver a Arquitetura de "Addons":**
  - [ ] **Modelagem:** Definir como um addon é representado no banco de dados, como ele é ativado por workspace e como um usuário pode "comprá-lo".
  - [ ] **API:** Criar endpoints para listar, ativar e desativar addons para um workspace.
- [ ] **Implementar "Serviços" como Entidades Monetizáveis:**
  - [ ] **Definição:** Um "Serviço" é uma ação que pode ser cobrada por uso (ex: gerar PDF, imprimir, chamar IA).
  - [ ] **Exemplo Inicial (Gerador de PDF):**
    - [ ] Criar um microserviço ou serverless function que recebe dados e gera um PDF.
    - [ ] Integrar com o Stripe para cobrança por uso.
- [ ] **Desenvolver "Pipelines" como Orquestradores:**
  - [ ] **Conceito:** Um Pipeline é uma sequência de "Serviços" acionada por um evento (ex: "após criar item, gerar PDF e enviar por email").
  - [ ] **Planejamento:** Desenhar a arquitetura para criar e executar essas cadeias de eventos.

---

### ✨ Pilar 4: Experiência do Usuário e Features Avançadas (A Magia Visível)

_Construir as funcionalidades que encantarão os usuários e darão poder aos desenvolvedores._

- [ ] **Implementar o Sistema de "Temas" e o Wizard de Configuração:**
  - [ ] **Testar o "Tema Clean" (Estilo Google Drive):** `[Prioridade Baixa]`
  - [ ] **Desenvolver o Wizard de Criação:** Permitir que o usuário escolha um "Template" (Blog, Portfólio) que pré-configura `content-types` e `sections`.
- [ ] **Desenvolver o Sistema de "Views" de Conteúdo (Componentes Especiais):**
  - [ ] **API:** A API de `sections` deverá retornar um campo `viewType` (ex: `gallery`, `faq-list`, `kanban`).
  - [ ] **Frontend:** O dashboard terá um mapeamento que renderizará um componente React específico com base no `viewType`.
  - [ ] **Marketplace de Views:** Planejar como desenvolvedores parceiros poderiam criar e (futuramente) vender "Views Premium".

---

### 📚 Pilar 5: Documentação e Developer Experience (O Multiplicador de Força)

_Tornar o projeto fácil de entender, usar e contribuir._

- [ ] **Atualizar o `README.md` Principal:**
  - [ ] Incorporar o pitch do "DashMaster PRO" e a visão de "DaaI".
- [ ] **Criar Documentação da API:**
  - [ ] Documentar os endpoints com foco no desenvolvedor frontend que irá consumir a API para criar as "Views".
- [ ] **Criar Documentação do Ecossistema:**
  - [ ] Explicar os conceitos de `Workspaces`, `Sections`, `Views`, `Addons`, `Services` e `Pipelines`.

## 🚦 Prioridades Sugeridas

1.  **Imediato:** Concluir o **Pilar 1**. Uma base sólida é essencial.
2.  **Curto Prazo:** Iniciar o planejamento da **Arquitetura Crítica** do **Pilar 2** (Roles e Separação do App).
3.  **Médio Prazo:** Iniciar o planejamento e a prototipação do **Pilar 3** (Monetização). Precisamos definir como planos e addons funcionarão na base de dados.
4.  **Contínuo:** Evoluir os Pilares 4 (UX) e 5 (Docs) à medida que os outros avançam.
