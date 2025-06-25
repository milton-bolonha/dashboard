# Dashboard Engine — MVP

## 🚀 Visão Geral

Este é o MVP do **Dashboard Engine**, uma plataforma SaaS para criar aplicações de conteúdo (CRMs, CMSs, etc.) de forma rápida e escalável.

### Filosofia

**Simplicidade por padrão, poder como opção.** O sistema é projetado para ser intuitivo para casos de uso simples (como um blog), mas robusto o suficiente para aplicações complexas com múltiplas seções e tipos de conteúdo.

### Objetivo de Negócio do MVP

Lançar uma versão funcional que permita:

- Vender acesso a diferentes planos.
- Permitir que os usuários criem e gerenciem seus próprios tipos de conteúdo e seções.
- Cadastrar e gerenciar usuários com diferentes papéis.
- Fazer cobrança e aplicar limites de plano.

---

## 🔥 Tecnologias

- Next.js (App Router) / JavaScript (sem TypeScript)
- TailwindCSS / MongoDB / File-based API

---

## 🗺️ Funcionalidades no MVP

| Módulo              | Descrição                                                                                    |
| ------------------- | -------------------------------------------------------------------------------------------- |
| **Content Types**   | Define a estrutura dos dados (os "moldes"). **Cria uma `Section` padrão automaticamente.**   |
| **Sections**        | O menu do seu dashboard. Pode ser criado automaticamente ou manualmente para usos avançados. |
| **Items**           | Os registros de dados concretos (ex: um post de blog, um produto).                           |
| **Auth & Users**    | CRUD de usuários e controle de acesso via `Roles`.                                           |
| **Plans & Billing** | CRUD de planos, limites por plano e registro manual de pagamentos.                           |
| **Addons (MVP)**    | `TextInput`, `Textarea`, `ImageUpload`.                                                      |
| **Views (MVP)**     | `ListView`, `GridView`.                                                                      |

---

## 🔌 API & Estrutura

### API Contract

| Endpoint                     | Descrição                                  |
| ---------------------------- | ------------------------------------------ |
| `/api/content-types`         | CRUD para `Content Types`.                 |
| `/api/sections`              | CRUD para `Sections` (uso avançado).       |
| `/api/sections/[slug]/items` | CRUD para `Items` dentro de uma `Section`. |
| `/api/system/users`          | Gestão de usuários e `Roles`.              |
| `/api/system/plans`          | Gestão de `Planos` e limites.              |

### Estrutura de Pastas

A estrutura segue as convenções do Next.js App Router, com uma clara separação entre UI (`components`), lógica (`containers`), e definições (`schemas`).

---

## 🎨 UI & UX

- **Layout de 3 Colunas:** Sidebar de Navegação, Workspace Principal e Sidebar de Inspeção.
- **Tema:** Clean, inspirado em Claude, com Dark/Light Mode.
- **Fluxo Intuitivo:** O usuário cria um `Content Type` e o menu aparece. A complexidade das `Sections` fica abstraída para quem não precisa dela.

---

## 🚀 Comandos

```bash
# Instalar dependências
npm install && npm --workspace=dashboard install

# Rodar em modo de desenvolvimento
npm run dash:dev

# Rodar testes
npm --workspace=dashboard run test
```

---

## 🏁 Resultado Esperado do MVP

Um sistema funcional e vendável onde um usuário pode:

1.  Se cadastrar e escolher um plano.
2.  Criar um `Content Type` "Projetos".
3.  Ver um menu **"Projetos"** aparecer instantaneamente.
4.  Adicionar, editar e visualizar seus projetos.
