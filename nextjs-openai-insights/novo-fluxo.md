# Novo Fluxo · nextjs-openai-insights (10/11/2025)

Documento atualizado do ciclo completo desde o preenchimento do formulário até as interações dentro do admin Ade. Ele substitui os esquemas antigos (`fluxo.md`, `fluxo-resumido.md`) trazendo as mudanças de novembro/2025.

---

## Resumo rápido

- **Sessão**: cookie httpOnly `insightsWorkspaceSession` aponta para um snapshot em memória (TTL 30 min). O browser replica os últimos workspaces em `localStorage`.
- **Geração**: `POST /api/generate` monta prompts a partir do template `template_1`, chama GPT-5 (ou fallback mock) e persiste tiles já com histórico de chat.
- **Admin**: `AdminContainer` carrega `/api/workspace`, reidrata do cache local quando a sessão expira e controla toasts auto-dismiss (5 s).
- **Chat**: tiles e contatos compartilham o mesmo fluxo de AI (histórico curto, clamp, retries exponenciais).
- **UI Ade**: hover transparente, cluster de ações no canto do card, modais monocromáticos e tooltip compacta no modal doc.

---

## Visão Geral do Pipeline

```
Usuário (Home)
  │
  ├─ preenche formulário ClassicHeroForm
  └─ envia → HomeContainer.handleSubmit
          │
          ├─ POST /api/generate ----------------───┐
          │                                        │
          │  cria snapshot + grava em memória      │
          ▼                                        │
    resposta JSON { sessionId, workspace }         │
          │                                        │
          ├─ rememberSessionId + cache local       │
          └─ router.push("/admin")                 │
                                                   │
                                            Navegador (/admin)
                                                   │
                            AdminContainer (SWR /api/workspace + localStorage)
                                                   │
                  ┌──────────────┬─────────────────┴──────────────┐
                  │              │                                │
           Tiles/Modal Doc   Notas Panel                    Contatos Panel
                  │              │                                │
        /api/workspace/...  /api/workspace/notes/...   /api/workspace/contacts/...
```

---

## 1. Home · Formulário e submissão

Arquivo-chave: `src/containers/home/HomeContainer.tsx`

1. `ClassicHeroForm` entrega os campos `company`, `companyWebsite`, `solution`, `researchTarget`, `researchWebsite`.
2. `handleSubmit`:
   - Bloqueia reenvios (`isSubmitting`).
   - POST em `/api/generate` com payload normalizado.
   - Armazena `sessionId` via `rememberSessionId` e snapshot via `saveWorkspace`.
   - Exibe toast de progresso e redireciona para `/admin`.
3. Botão “Reset workspace” chama `DELETE /api/workspace` + `clearAllWorkspaces()` para limpar cache local e sessão atual.

Toasts usam `ToastProvider`; desde novembro os avisos desaparecem automaticamente em 5 segundos.

---

## 2. `/api/generate` · Montagem do workspace

Arquivo: `src/app/api/generate/route.ts`

Passos principais:

1. Valida payload com `zod`.
2. Resolve template (`getGuestTemplate`) e substitui variáveis com `processPromptVariables`.
3. Para cada tile:
   - Se `MOCK_OPENAI_RESPONSES=true`, usa `generateMockTileContent`.
   - Caso contrário, instancia `OpenAI` e chama `generateTileContent` (batch configurável via `BROWSER_TILE_BATCH_SIZE`).
   - Limita tokens para prompts críticos (`getMaxTokensForTile`).
4. Monta `WorkspaceSnapshot` com tiles, notas/contatos vazios e marca `generatedAt`.
5. Persiste no cache global (`writeWorkspace`) e retorna JSON `{ success, sessionId, workspace }`.

Logs relevantes:

- `[api/generate] 📤 Payload`
- `[api/generate] ✅ Tiles gerados/com fallback`
- `[cookies-store] 💾 Workspace cached in memory`

---

## 3. Sessão e cache

Arquivo: `src/lib/cookies-store.ts`

- TTL de 30 minutos por sessão; sessões expiradas são limpas antes de cada leitura.
- `writeWorkspace` clona o snapshot para evitar mutação inadvertida.
- `clearWorkspace` remove cache e apaga o cookie.

No cliente, `src/lib/storage/workspace-browser.ts`:

- Guarda até 5 sessões recentes (`insights_workspace_{sessionId}`) + índice ordenado.
- `rememberSessionId` define o último workspace ativo para abertura rápida.
- `clearAllWorkspaces` remove índice/última sessão (usado quando o usuário reseta o app).

---

## 4. Boot do Admin

Arquivo: `src/containers/admin/AdminContainer.tsx`

1. SWR (`/api/workspace`, credenciais incluídas) busca snapshot server-side.
   - Poll 3s até aparecer o primeiro tile; depois desativa.
2. Reidrata `localWorkspace` com o último snapshot salvo no navegador.
3. Trata sessão expirada (404) com toast destrutivo e fallback para `localWorkspace`.
4. Mantém lista de sessões locais (`listStoredWorkspaces`) para trocar entre gerações.
5. Prefetch `TileDetailModal`, `ContactDetailModal`, `AddContactModal`, etc. conforme o usuário interage.

---

## 5. Tema Ade · Layout e interações

- `AdminHeaderAde`: botões todos à direita (`Theme Switch`, `Customize`, `Dashboards`, `Templates`, `Log in`, `Sign up`).
- `AdminSidebarAde`: nome da company em destaque, hover transparente, ícones Lucide para Profile/Settings, sem label “ACTIONS”.
- `TileGridAde`: cluster de ações (drag/refresh/delete) aparece no canto inferior direito quando o card está em hover; cursor `grab` no handle.
- `ContactsPanelAde`: cards seguem o layout dos tiles (nome + cargo no header, cluster de ações, sem “View outreach >”). Empty state com mesma largura dos cards.
- `NotesPanelAde`: cards laranja originais (`NotesSection`), botão `Add note` com `whitespace-nowrap`, ícone de edição (lápis) que abre modal inline.
- `FilesPlaceholderAde`: removeu bordas/sombra, mantém apenas tabs tipo pill + dropzone tracejada.

---

## 6. Modais e chat

### TileDetailModal (`src/components/ui/prompt-tiles/TileDetailModal.tsx`)

- Header: botão “voltar” e ícone `i` com tooltip contendo modelo, tokens, datas (ambos com `cursor-pointer`).
- Wrapper sem divisórias, cantos arredondados à esquerda.
- Chat:
  - Histórico normalizado (roles garantidamente `assistant`/`user`/`system`).
  - Botão `Copy` mostra o texto apenas no hover e herda `cursor-pointer`.
  - Timestamp menor e discreto.

### ContactDetailModal (`src/components/admin/ade/ContactDetailModal.tsx`)

- Replica o layout do modal de tile.
- Usa `chatHistory` salvo no contato (tipo adicionado em `src/lib/types.ts`).
- API: `POST /api/workspace/contacts/[contactId]/chat`:
  - Reconstroi o prompt com histórico curto (`MAX_HISTORY_LENGTH=12`).
  - Se `OPENAI_API_KEY` ausente ou `MOCK_OPENAI_RESPONSES=true`, utiliza mock.
  - Atualiza `contact.outreach.contactInsights` com o resumo clampado.

### AddCompanyModal / AddContactModal / AttachFilesModal

- Paleta monocromática cinza.
- Conteúdo traduzido para inglês.
- Botões e ícones com `cursor-pointer`, inclusive o `X` de fechar.

---

## 7. APIs usadas no Admin

| Ação | Endpoint | Observações |
| --- | --- | --- |
| Reordenar tiles | `POST /api/workspace/reorder` | Recebe `order: string[]`; bloqueia se workspace não for o mais recente. |
| Regenerar tile | `POST /api/workspace/tiles/[tileId]/regenerate` | Usa `generateTileContent` e preserva `history` recente. |
| Chat tile | `POST /api/workspace/tiles/[tileId]/chat` | Compartilha helper com o modal doc. |
| Criar contato | `POST /api/workspace/contacts` | Gera outreach inicial com `generateContactOutreach`. |
| Regenerar contato | `POST /api/workspace/contacts/[contactId]/regenerate` | Atualiza `contact.outreach`. |
| Chat contato | `POST /api/workspace/contacts/[contactId]/chat` | Novo em nov/2025, descrito acima. |
| Editar nota | `PATCH /api/workspace/notes/[noteId]` | Adicionado para suportar ícone de lápis no painel. |
| Reset geral | `DELETE /api/workspace` | Limpa snapshot atual e cookie. |

Todas as rotas usam `readWorkspace`/`updateWorkspace`; ao retornar, o cliente revalida o SWR e atualiza o cache local.

---

## 8. Comportamento de toasts e erros

- Provider (`src/lib/state/toast-context.tsx`) encerra mensagem automaticamente (`setTimeout` 5000 ms).
- Erros comuns:
  - 404 em `/api/workspace/*` → sessão expirada. UI mostra toast destrutivo e orienta gerar novo workspace.
  - Resposta vazia da OpenAI em chat → API retorna 502 e UI mostra toast “Chat failed”.
  - Faltam envs Cloudinary → modal de anexos informa configuração necessária (texto no rodapé).

---

## 9. Diagnósticos úteis

- Logs no servidor:
  - `[cookies-store] 💾 Workspace cached in memory`
  - `[workspace-browser]` silencioso (falhas de quota ignoradas).
- Console do cliente:
  - `[HomeContainer]` logs para geração/reset.
  - `console.warn`/`console.error` em fetches quando algo falha.
- Ferramentas:
  - `npm run lint -w nextjs-openai-insights` garante estilo/erros TS.
  - Testes automatizados ainda não existem; QA manual recomendado (checar modais, hover, chat).

---

## Referências cruzadas

- `README.md` — visão macro, setup e lista de endpoints.
- `README-admin.md` — anatomia detalhada dos temas (Ade, Classic, Dash).
- `full-report-10-11.md` — changelog do ciclo de novembro/2025.
- `fluxo-resumido.md` — fluxo anterior (para histórico).

Pronto! Esse é o fluxo vigente depois das últimas melhorias no tema Ade. Qualquer evolução futura deve atualizar este documento e o README para manter a visão alinhada. 🚀


