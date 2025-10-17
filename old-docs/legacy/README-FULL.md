# Dashboard Engine — MVP

## 🚀 Visão Geral

Este é o MVP do **Dashboard Engine**, uma plataforma SaaS que permite criar dashboards, CRMs, ERPs, CMS e aplicativos administrativos com estrutura modular.

**Objetivo do MVP:**

- Vender acesso (Planos)
- Criar Content Types (Sections)
- Gerenciar Items dentro das Sections
- Cadastrar e gerenciar Users
- Cobrar usuários e gerenciar limites

---

## 🔥 Tecnologias

- Next.js (App Router)
- JavaScript (sem TypeScript)
- TailwindCSS (com Design Tokens)
- MongoDB (via Atlas ou local)
- File-based API (Next API Routes)

---

## 🗺️ Funcionalidades no MVP

| Módulo        | Descrição                                                                 |
| ------------- | ------------------------------------------------------------------------- |
| Auth          | Login, Logout, Signup, Reset Password                                     |
| Users         | CRUD de usuários                                                          |
| Plans         | CRUD de planos, controle de limite de Sections, Items e Addons            |
| Billing       | Registro manual de pagamento ou integração simples com Stripe             |
| Licenses      | Vincula Users com Planos ativos e aplica limites                          |
| Roles         | superadmin, owner, admin, editor, viewer                                  |
| Content Types | Criador de Content Types (definindo Views e Addons)                       |
| Sections      | CRUD de Sections baseado nos Content Types                                |
| Items         | CRUD de Items dentro das Sections                                         |
| Views         | ListView e GridView                                                       |
| Addons        | TextInput, Textarea, ImageUpload                                          |
| DevMode       | Ferramentas de desenvolvimento: reset de dados, limpeza, data fake        |
| UI            | Layout: Sidebar Left (Navigation), Main fluido, Sidebar Right (Inspector) |

---

## 🚫 Fora do MVP

- Export/Import
- File I/O (.md/.json)
- Git-based sync
- Logs avançados
- API Keys e Webhooks
- Marketplace de Views/Addons
- Developer Tools
- Views avançadas (Kanban, Feed, Dashboard)

---

## 📂 Estrutura de Pastas

/app/
├── dashboard/
│ ├── layout.jsx
│ ├── page.jsx
│ └── sections/
│ ├── [section]/page.jsx
│ └── [section]/edit/[id]/page.jsx
├── api/
│ ├── [section]/route.js
│ └── system/
│ ├── users/route.js
│ ├── plans/route.js
│ ├── billing/route.js
│ ├── licenses/route.js
/components/
├── ui/
├── containers/
/lib/
├── db.js
├── auth.js
├── io.js
├── utils.js
/schemas/ (json simples ou objetos js)
/hooks/
/content/ (opcional)
/utils/

yaml
Copiar
Editar

---

## 🔌 API Contract

| Endpoint               | Descrição          |
| ---------------------- | ------------------ |
| `/api/:section`        | CRUD Section       |
| `/api/:section/:id`    | Item específico    |
| `/api/:section/schema` | Schema da Section  |
| `/api/system/users`    | User Management    |
| `/api/system/plans`    | Plans              |
| `/api/system/billing`  | Billing manual     |
| `/api/system/licenses` | Licenças e Limites |

---

## 🎨 UI Layout

- Sidebar Left: Navegação
- Sidebar Right: Inspector (Propriedades e Detalhes)
- Main: Workspace fluido
- Tema: Clean, inspirado em Claude, cores leves, elegante
- Dark/Light Mode incluso

---

## 🏁 Ready to Sell:

✅ Criar usuário  
✅ Criar planos  
✅ Atribuir plano e cobrar  
✅ Criar content types  
✅ Criar sections e cadastrar dados
