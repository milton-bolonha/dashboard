# Próximos Passos para o Dashboard

Este documento delineia as próximas tarefas críticas para a evolução, estabilização e manutenção do projeto. Ele inclui **Avisos de Arquitetura e Segurança** baseados em desafios enfrentados anteriormente.

---

## 🏛️ Fase 0: Pilares de Estabilidade e Boas Práticas (LEIA ANTES DE CODAR)

Antes de adicionar novas funcionalidades, é crucial internalizar estes princípios para evitar a reintrodução de bugs complexos.

- **Aviso de Segurança #1: Autenticação Centralizada.**
- **Aviso de Segurança #2: Autorização de Admin.**
- **Aviso de Arquitetura #1: Queries ao Banco de Dados.**
- **Aviso de Arquitetura #2: Funções de Biblioteca Robustas.**

---

## 🚀 Fase 1: Tarefas Críticas para o Lançamento (MVP)

O foco total aqui é no que é **essencial** para lançar o produto com sua lógica de negócio principal funcionando.

### 1. Sistema de Acesso, Planos e Permissões (Core do Negócio)

- **Ação: Desenvolver Sistema de Roles e Permissões**
  - **Diretriz:** Definir e modelar as roles (`super-admin`, `admin`, `user`) e como elas restringem o acesso em toda a API.
- **Ação: Validar e Implementar Bloqueios de Planos**
  - **Status:** CRUD de Planos/Workspaces feito.
  - **Diretriz:** Testar rigorosamente se os limites dos planos (nº de workspaces, etc.) estão sendo aplicados e se o acesso a funcionalidades pagas está bloqueado para usuários de planos inferiores.
- **Ação: Incluir Planos e Addons no Stripe**
  - **Diretriz:** Cadastrar os produtos e preços no Stripe para preparar a integração de pagamentos.
- **Ação: Testar Liberação de Acesso via Chave**
  - **Status:** CRUD de chaves de acesso feito.
  - **Diretriz:** Validar o fluxo do lado do cliente para garantir que a ativação de uma chave concede o acesso esperado.

### 2. Funcionalidades Essenciais para o Usuário

- **Ação: Desenvolver Forms Multi-Steps**
  - **Diretriz:** Planejar e implementar a UI e a lógica de API para formulários com múltiplos passos, uma funcionalidade chave para o lançamento.
- **Ação: Finalizar Autenticação de API via API Keys**
  - **Diretriz:** Garantir que um sistema externo pode se autenticar de forma segura usando as chaves geradas, testando os endpoints principais.

### 3. Validação e Deploy

- **Ação: Executar Ciclo de Testes Manuais**
  - **Objetivo:** Garantir que a experiência do usuário e a lógica de negócio estão 100% funcionais.
  - **Documento de Referência:** `docs/07-07-23-tarefas-semana.md`
- **Ação: Separar Aplicação (Split Home e Dashboard)**
  - **Objetivo:** Ter um site de marketing e a aplicação em domínios separados.
  - **Diretriz:** Planejar a estratégia de autenticação compartilhada com o Clerk e executar a separação.
- **Ação: Integração nos Domínios Oficiais**
  - **Diretriz:** Publicar e testar a aplicação nos domínios finais de produção.

---

## 🛠️ Fase 2: Estabilidade e Qualidade de Código (Pós-MVP)

Com as funcionalidades críticas no lugar, o foco muda para garantir que a aplicação seja robusta e fácil de manter.

- **Ação: Criar Suíte de Testes Automatizados (E2E)**
  - **Ferramenta Sugerida:** Playwright ou Cypress.
- **Ação: Implementar `DEBUG_MODE` Global**
  - **Objetivo:** Facilitar a depuração sem poluir os logs de produção.
- **Ação: Refatorar e Corrigir `lib/access-keys.js`**
  - **Objetivo:** Limpar o workaround e centralizar a lógica de listagem, conforme "Problema Recorrente 8".
- **Ação: Puxar Infos de API na Home de Outro Site**
  - **Objetivo:** Criar um caso de uso real para a API, como prova de conceito.
- **Ação: Auditoria Completa das Rotas de API**
  - **Objetivo:** Garantir que todas as rotas seguem os novos padrões de segurança e arquitetura.

---

## 📖 Fase 3: Documentação e Governança

Manter a documentação atualizada é crucial para a escalabilidade da equipe e do projeto.

- **Ação: Criar Guia de Testes para QA (Manual)**
  - **Objetivo:** Fornecer um roteiro claro para validar manualmente as principais funcionalidades.
- **Ação: Manter o `DEBUGGING-GUIDE.md` Atualizado**
  - **Cultura:** Sempre que um novo bug significativo for resolvido, adicionar a solução à base de conhecimento.
