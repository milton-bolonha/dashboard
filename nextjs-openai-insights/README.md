# nextjs-openai-insights · Admin Ade Refresh (Nov/2025)

MVP baseado em Next.js 16 App Router que gera tiles de insight com GPT-5, salva tudo em cache de sessão via cookies httpOnly e entrega uma área administrativa full-fidelity no tema **Ade** com notas, contatos, arquivos e chat contextual.

---

## Visão Geral

- **Home (`/`)**: formulário clássico recolorido que dispara a geração do workspace via `/api/generate`.
- **Admin (`/admin`)**: tema Ade refinado (monocromático cinza) com header, sidebar, tiles, contatos, notas e uploads.
- **Sessões**: snapshots ficam em memória (TTL 30 min) e o cookie `insightsWorkspaceSession` referencia o workspace ativo.
- **IA**: tiles, regenerações e chats usam `openai.responses.create` (modelo padrão `gpt-5-mini`) com fallback de conteúdo mock.
- **Interações**: drag-and-drop (dnd-kit), toasts auto-dismiss, modais com layout unificado e chat que replica a experiência dos tiles nos contatos.

---

## Principais Atualizações · Novembro/2025

- Header Ade simplificado com CTAs `Log in`/`Sign up` alinhados à direita e sem rótulos redundantes.
- Sidebar Ade sem emojis, com ícones Lucide, hover transparente e apenas o nome da company em destaque.
- Cards de tiles e contatos com cluster flutuante de ações (drag, regenerate, delete) e cursores configurados.
- `TileDetailModal` redesenhado: tooltip compacto para metadados, copy button visível só no hover e timestamps menores.
- `ContactDetailModal` ganhou chat completo, histórico persistido e UI espelhando o modal dos tiles.
- Painel de notas com cards laranja originais, botão de editar e formulário compacto alinhado à grade.
- Modais (`AddCompany`, `AddContact`, `AttachFiles`) migraram para a paleta cinza, texto em inglês e cursores consistentes.
- Toast provider agora encerra notificações automaticamente após 5s.

Consulte `full-report-10-11.md` e `novo-fluxo.md` para a linha do tempo detalhada e o fluxo atualizado.

---

## Stack e Arquitetura

| Camada       | Destaques                                                                                                   |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| UI           | App Router + Server/Client Components, Tailwind, framer-motion local para transições simples.               |
| Estado       | `AdminThemeProvider`, `ToastProvider`, `useTransition` para tarefas async, SWR para `/api/workspace`.       |
| Persistência | Cache em memória (Map global) + cookie httpOnly + `localStorage` como fallback/rehydrate.                   |
| IA           | Helpers em `src/lib/ai/tile-generation.ts` unificam geração/regeneração e chat (tiles e contatos).          |
| Infra        | APIs Next (`/api/generate`, `/api/workspace/**`, `/api/workspace/contacts/**`, etc.) com logs estruturados. |

### Diagrama 10.11

```
Home (form) → POST /api/generate → cookies-store.ts grava snapshot
                 ↓
        redirect /admin
                 ↓
    AdminContainer monta UI
      ├─ useGuestWorkspace → /api/workspace
      └─ useJobStreaming (tiles) ou ações locais (contatos/notas)
```

Para o passo-a-passo completo, veja `novo-fluxo.md`.

---

## Estrutura de Pastas

```
nextjs-openai-insights/
├─ src/
│  ├─ app/                       # Páginas e rotas API
│  ├─ components/                # UI compartilhada (landing/admin/tiles)
│  ├─ containers/                # Lógica das páginas (Home/Admin)
│  ├─ lib/                       # Stores, tipos, helpers de IA e state global
│  └─ styles/                    # Tailwind globals
├─ README.md
├─ README-admin.md               # Guia aprofundado só do Admin
├─ full-report-10-11.md          # Recorte das mudanças mais recentes
└─ novo-fluxo.md                 # Fluxo operacional atualizado
```

---

## Como Rodar

Pré-requisitos: Node 18+, chave da OpenAI e (opcional) configuração Cloudinary para anexos.

```bash
# 1. Instale dependências na raiz do monorepo
npm install

# 2. Configure variáveis de ambiente
cd nextjs-openai-insights
cp env.template.txt .env.local
# preencha OPENAI_API_KEY e demais variáveis, inclusive Cloudinary se usar uploads

# 3. Suba o app
npm run dev
```

Abra `http://localhost:3000`, gere um workspace e navegue até `/admin` para testar o tema Ade.

---

## Variáveis de Ambiente

| Variável                               | Padrão       | Uso                                                  |
| -------------------------------------- | ------------ | ---------------------------------------------------- |
| `OPENAI_API_KEY`                       | —            | Obrigatória para todas as chamadas de IA.            |
| `OPENAI_MODEL`                         | `gpt-5-mini` | Modelo principal dos tiles/chats.                    |
| `OPENAI_MAX_OUTPUT_TOKENS`             | `600`        | Limite de tokens por requisição.                     |
| `OPENAI_TEMPERATURE`                   | `0.7`        | Temperatura padrão das respostas.                    |
| `NEXT_PUBLIC_APP_URL`                  | —            | Link público usado em componentes sociais.           |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`    | —            | Necessário para habilitar upload no modal de anexos. |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | —            | Preset do widget Cloudinary (opcional).              |

Sem a configuração Cloudinary os uploads permanecem bloqueados, porém o dropzone e a UX continuam disponíveis.

---

## Fluxos-Chave

- **Geração inicial**: `HomeContainer` → `/api/generate` → `cookies-store.ts`.
- **Regenerar tiles**: `TileBoard` → `/api/workspace/tiles/[tileId]/regenerate`.
- **Chat em tiles**: `TileDetailModal` → `/api/workspace/tiles/[tileId]/chat`.
- **Chat em contatos**: `ContactDetailModal` → `/api/workspace/contacts/[contactId]/chat`.
- **Notas**: `NotesPanelAde` → `POST /api/workspace/notes` e `PATCH/DELETE /api/workspace/notes/[noteId]`.
- **Upload (mock)**: `AttachFilesModal` abre widget Cloudinary quando as variáveis públicas estão configuradas.

Todos os handlers usam `cookies-store.ts` para garantir consistência na sessão atual.

---

## UX do Tema Ade

- Paleta monocromática cinza (botões sólidos ou outline preto/branco).
- Hover transparente na sidebar, ícones Lucide para Profile/Settings.
- Cartões com cluster flutuante no canto inferior direito (drag/refresh/delete).
- Chat com copy button discreto (mostra texto só ao passar o mouse) e timestamps menores.
- Modais com cabeçalhos limpos, tooltip com metadados no ícone `i` e cursores configurados para todos os controles.
- Toasts auto-dismiss (5s) e reaproveitamento do provider customizado.

---

## APIs Disponíveis

| Método       | Rota                                       | Descrição                                       |
| ------------ | ------------------------------------------ | ----------------------------------------------- |
| POST         | `/api/generate`                            | Cria novo workspace e popula os tiles iniciais. |
| GET          | `/api/workspace`                           | Retorna snapshot atual (usa cookie).            |
| POST         | `/api/workspace/tiles`                     | Adiciona tile mock (usado por testes).          |
| DELETE       | `/api/workspace/tiles/[tileId]`            | Remove um tile.                                 |
| POST         | `/api/workspace/tiles/[tileId]/regenerate` | Recria conteúdo do tile.                        |
| POST         | `/api/workspace/tiles/[tileId]/chat`       | Continua chat do tile (detalhes).               |
| POST         | `/api/workspace/contacts`                  | Cria contato e gera outreach inicial.           |
| POST         | `/api/workspace/contacts/[contactId]/chat` | Chat contextual do contato.                     |
| DELETE       | `/api/workspace/contacts/[contactId]`      | Remove contato.                                 |
| POST         | `/api/workspace/notes`                     | Cria nota.                                      |
| PATCH/DELETE | `/api/workspace/notes/[noteId]`            | Edita ou remove nota.                           |

Todas retornam o snapshot atualizado para reidratar o cliente via SWR/localStorage.

---

## Referências

- `full-report-10-11.md` — changelog completo das entregas mais recentes.
- `README-admin.md` — foco em arquitetura e temas do Admin.
- `novo-fluxo.md` — diagrama e detalhamento do fluxo operacional após o refresh de novembro.
- `fluxo-resumido.md` (histórico) — versão anterior do pipeline de geração.

---

Mantemos a licença de uso interno. Revise antes de compartilhar externamente.
