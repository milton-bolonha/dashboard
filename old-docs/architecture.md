# 🏗️ Arquitetura da Plataforma - Dashboard Engine

Este documento detalha a arquitetura técnica, o fluxo de dados e os conceitos principais do Dashboard Engine.

**Filosofia:** Simplicidade por padrão, poder como opção.

---

## 🧠 Modelo Conceitual e Fluxo de Trabalho

A arquitetura gira em torno da relação entre `Content Types`, `Sections` e `Items`, projetada para ser intuitiva.

### Fluxo Padrão (O Caminho Feliz)

O usuário não precisa entender a complexidade subjacente. Ele cria um tipo de conteúdo e o sistema faz o resto.

```mermaid
graph TD
    A[1. Usuário cria um 'Content Type'<br/>Ex: "Produtos"] --> B{2. Sistema cria automaticamente<br/>uma 'Section' espelhada}
    B --> C[3. Um link "Produtos" aparece no menu]
    C --> D[4. Usuário clica no link e adiciona<br/>seus 'Items' (produtos)]
```

**Resultado:** A experiência é direta e focada na tarefa, sem atritos.

### Fluxo Avançado (Poder Opcional)

Para controle granular, o usuário pode gerenciar `Sections` de forma independente na tela "Gerenciar Menus".

```mermaid
graph TD
    A[1. Usuário cria um 'Content Type'<br/>"Artigo", sem criar menu padrão] --> B[2. Navega para 'Gerenciar Menus']
    B --> C[3. Cria `Section` "Notícias"<br/>usando o `Content Type` "Artigo"]
    B --> D[4. Cria `Section` "Tutoriais"<br/>usando o mesmo `Content Type`]
    C & D --> E[5. Menu agora exibe "Notícias"<br/>e "Tutoriais" separadamente]
```

**Resultado:** Controle total sobre a navegação e organização do conteúdo.

---

## 🛠️ Stack e Estrutura Técnica

### Tecnologias Principais

| Camada             | Tecnologia           | Responsabilidade                                               |
| ------------------ | -------------------- | -------------------------------------------------------------- |
| **Frontend**       | Next.js (App Router) | Interface reativa (padrão Container/Component).                |
| **Backend API**    | Next.js API Routes   | Endpoints RESTful para cada entidade.                          |
| **Banco de Dados** | MongoDB              | Armazenamento das coleções (`contentTypes`, `sections`, etc.). |

### Estrutura de Pastas (`/dashboard`)

```text
/
├── app/
│   ├── api/
│   │   ├── content-types/
│   │   ├── sections/
│   │   └── system/ (users, plans)
│   └── dashboard/
│       ├── content-types/
│       └── sections/
├── components/
│   ├── ui/ (Button, Modal)
│   ├── content-types/ (Form, List)
│   └── sections/ (Form, List)
├── containers/
│   ├── ContentTypeContainer.jsx
│   └── SectionContainer.jsx
├── lib/ (db.js)
└── schemas/ (index.js)
```

---

## 💾 Relação das Coleções e API

### Diagrama de Entidade-Relacionamento

```mermaid
erDiagram
    CONTENT_TYPES { string _id PK, string name }
    SECTIONS { string _id PK, string contentTypeId FK, string name }
    ITEMS { string _id PK, string sectionId FK, object data }
    CONTENT_TYPES ||--o{ SECTIONS : "pode ser usado por"
    SECTIONS ||--o{ ITEMS : "contém"
```

### Contrato da API

| Endpoint                    | Verbo                  | Ação                                             |
| --------------------------- | ---------------------- | ------------------------------------------------ |
| `/api/content-types`        | `GET`                  | Lista todos os `Content Types`.                  |
|                             | `POST`                 | Cria um `Content Type` (e sua `Section` padrão). |
| `/api/content-types/:id`    | `GET`                  | Obtém um `Content Type`.                         |
|                             | `PUT`                  | Atualiza um `Content Type`.                      |
|                             | `DELETE`               | Deleta um `Content Type`.                        |
| `/api/sections`             | `GET`                  | Lista todas as `Sections` (uso avançado).        |
|                             | `POST`                 | Cria uma `Section` customizada.                  |
| `/api/sections/:id`         | `GET`, `PUT`, `DELETE` | Gerencia uma `Section` específica.               |
| `/api/sections/:slug/items` | `GET`, `POST`          | Gerencia `Items` de uma `Section`.               |

---

## 🎯 Próximos Passos de Implementação

### Fase Atual: CRUDs Base

- ✅ `Content Types`
- ✅ `Sections`
- ⏳ **Em andamento:** `Items`
- ⏳ **Próximo:** `Users` & `Plans`

### Roadmap Futuro

- **Controle de Acesso:** Lógica de `Roles` e `Planos` para restringir acesso a `Sections`.
- **Views Avançadas:** Implementar Kanban, Feed, etc., como opções de visualização nas `Sections`.
- **I/O Engine:** Permitir que o backend leia/escreva de/para arquivos (`.md`, `.json`) em vez de MongoDB.
- **Developer Tools:** API Keys e Webhooks para integrações externas.
