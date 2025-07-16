# Plano de Ação para Lançamento do DashMaster.PRO

Este documento consolida as análises de `features-avancadas.md`, `relatorio-deckEngine.md` e `seguranca-performance.md` para definir as tarefas prioritárias para o lançamento. O foco é em segurança, performance e na ativação das funcionalidades centrais do produto.

---

## Sumário

1.  [Visão Geral e Prioridades](#1-visão-geral-e-prioridades)
2.  [Fase 1: Fundação Essencial (Core Product)](#2-fase-1-fundação-essencial-core-product)
3.  [Fase 2: Resiliência e Performance](#3-fase-2-resiliência-e-performance)
4.  [Fase 3: API Pública e Monetização](#4-fase-3-api-pública-e-monetização)
5.  [Tabela Resumo de Tarefas](#5-tabela-resumo-de-tarefas)

---

## 1. Visão Geral e Prioridades

O objetivo é lançar um produto funcional, seguro e performático. As prioridades são definidas na seguinte ordem:

1.  **Segurança e Controle de Acesso:** Garantir que os dados dos usuários estejam seguros e que as permissões funcionem conforme o planejado. Esta é a base de confiança do produto.
2.  **Resiliência e Performance:** Assegurar que o sistema seja rápido e confiável, utilizando o `deckEngine` para tarefas críticas e implementando cache onde for mais impactante.
3.  **Funcionalidades de Monetização:** Ativar a API pública e o gerenciamento de chaves, que são a principal via de monetização e crescimento.

---

## 2. Fase 1: Fundação Essencial (Core Product)

*Foco: Implementar o sistema de controle de acesso, que é a espinha dorsal da segurança e da lógica de negócios.* 

- [ ] **Implementar o `Access Engine` (Motor de Controle de Acesso)**
    - [ ] Criar a estrutura base do motor em `dashboard/lib/access-engine.js`.
    - [ ] Implementar a lógica de verificação de `Roles` (ex: `owner`, `admin`, `editor`) conforme o `sistema-controle-acesso.md`.
    - [ ] Integrar o `Access Engine` nas rotas da API para proteger os endpoints, substituindo a lógica de permissão atual.
    - [ ] Refatorar o frontend para usar o `Access Engine` (via um hook `useAccess`) para mostrar/ocultar elementos da UI.

- [ ] **Padronizar Serialização de Dados da API**
    - [ ] Criar um helper `dashboard/lib/serialization.js`.
    - [ ] A função deve converter `_id` para `id` (string) e `Date` para `ISOString`.
    - [ ] Aplicar esta função em todas as respostas da API para garantir consistência no frontend.

---

## 3. Fase 2: Resiliência e Performance

*Foco: Aumentar a confiabilidade do sistema com o `deckEngine` e garantir uma experiência de usuário rápida com cache no servidor.*

- [ ] **Integrar `deckEngine` para Webhooks do Stripe**
    - [ ] Criar um **Deck** chamado `stripe-webhook`.
    - [ ] Criar **Cartas** para cada etapa do processo: `1-parseEvent`, `2-findUser`, `3-updateUserPlan`, `4-logTransaction`.
    - [ ] Configurar um `WebhookRoute` no `deckEngine` para receber os eventos do Stripe e iniciar as "partidas".
    - [ ] Refatorar a função Netlify do webhook para atuar como um gatilho seguro, passando a lógica de processamento para o `deckEngine`.

- [ ] **Implementar Cache de Servidor com Redis**
    - [ ] Configurar uma instância de Redis (Upstash é recomendado para ambientes serverless).
    - [ ] Criar um helper `dashboard/lib/cache.js` para se conectar e gerenciar o Redis.
    - [ ] **Cache de Permissões:** Modificar o `Access Engine` para armazenar em cache as permissões compiladas dos usuários, com um TTL (ex: 5 minutos). Isso irá acelerar drasticamente as verificações de permissão.

---

## 4. Fase 3: API Pública e Monetização

*Foco: Ativar as funcionalidades que permitem a monetização e o uso do produto por desenvolvedores externos.*

- [ ] **Ativar o Gerenciamento de API Keys**
    - [ ] Implementar a lógica de validação de chaves de API (conforme `08-07-25-proximos-passos.md`).
    - [ ] Criar um middleware de autenticação para a API pública que valide a `x-api-key`.
    - [ ] Implementar o `rate-limiting` por chave, usando o cache Redis para rastrear o uso.

- [ ] **Implementar Cache na API Pública**
    - [ ] Utilizar o helper `lib/cache.js` (Redis) para armazenar em cache as respostas dos endpoints públicos (ex: `/api/public/sections/{slug}`).
    - [ ] Definir uma estratégia de invalidação de cache (ex: invalidar o cache de uma `section` quando um `item` dentro dela for atualizado).

- [ ] **(Opcional, mas recomendado) UI para Monitor de Tarefas**
    - [ ] Criar uma nova página no dashboard (`/dashboard/system/monitor`).
    - [ ] Expor o histórico de "partidas" do `deckEngine` em uma tabela, mostrando o status (`completed`, `failed`), o `deck` executado e o horário.
    - [ ] Adicionar um botão de "Tentar Novamente" para partidas que falharam.

---

## 5. Tabela Resumo de Tarefas

| Fase | Prioridade | Tarefa | Objetivo Principal | Status |
| :--- | :--- | :--- | :--- | :--- |
| **1** | 🥇 **Crítica** | Implementar `Access Engine` | Segurança e controle de acesso granular. | `[ ] To-Do` |
| **1** | 🥈 **Alta** | Padronizar Serialização | Consistência e prevenção de bugs no frontend. | `[ ] To-Do` |
| **2** | 🥇 **Crítica** | Integrar `deckEngine` (Webhooks) | Resiliência e confiabilidade no processamento de pagamentos. | `[ ] To-Do` |
| **2** | 🥈 **Alta** | Implementar Cache com Redis | Performance do dashboard e da API. | `[ ] To-Do` |
| **3** | 🥇 **Crítica** | Ativar API Keys & Rate Limiting | Habilitar a monetização e o uso da API pública. | `[ ] To-Do` |
| **3** | 🥈 **Alta** | Cache na API Pública | Performance e escalabilidade para usuários externos. | `[ ] To-Do` |
| **3** | 🥉 **Média** | UI para Monitor de Tarefas | Transparência e controle para o usuário. | `[ ] To-Do` |
