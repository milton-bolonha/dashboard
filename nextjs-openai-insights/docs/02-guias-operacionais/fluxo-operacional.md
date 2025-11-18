# Novo Fluxo · nextjs-openai-insights (Atualizado Nov/2025)

Documento atualizado do ciclo completo desde o preenchimento do formulário até as interações dentro do admin Ade. Ele substitui os esquemas antigos (`fluxo.md`, `fluxo-resumido.md`) trazendo as mudanças de novembro/2025 e atualizações recentes.

---

## Resumo rápido

- **Sessão**: cookie httpOnly `insightsWorkspaceSession` aponta para um snapshot em memória (TTL 30 min). O browser replica os últimos workspaces em `localStorage`.
- **Geração**: `POST /api/generate` monta prompts a partir do template `template_1`, chama GPT-5 via `responses.create()` API (ou fallback mock) e persiste tiles já com histórico de chat.
- **Admin**: `AdminContainer` carrega `/api/workspace`, reidrata do cache local quando a sessão expira, controla toasts auto-dismiss (5s) e gerencia seleção manual de workspaces.
- **Chat**: tiles e contatos compartilham o mesmo fluxo de AI (histórico curto, clamp, retries exponenciais). Suporte completo para modelos GPT-5 com API `responses.create()` e GPT-4 com `chat.completions.create()`.
- **UI Ade**: hover transparente, cluster de ações no canto do card, modais monocromáticos e tooltip compacta no modal doc.
- **Cores dinâmicas**: sistema de contraste automático baseado na cor de fundo escolhida, persistido em `localStorage` com `ade-base-color`. Sidebar calcula contraste baseado em `sidebarColor`, não `surfaceColor`.
- **Hidratação**: todas as renderizações condicionais são consistentes entre servidor e cliente usando `isMounted` e `suppressHydrationWarning`.

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
   - Modelos GPT-5 usam `responses.create()`, GPT-4 usam `chat.completions.create()`.
4. Monta `WorkspaceSnapshot` com tiles, notas/contatos vazios e marca `generatedAt`.
5. Persiste no cache global (`writeWorkspace`) e retorna JSON `{ success, sessionId, workspace }`.
6. Salva timestamp de geração em `localStorage` (`last-generation-time`) para polling inteligente.

Logs relevantes:

- `[api/generate] 📤 Payload`
- `[api/generate] ✅ Tiles gerados/com fallback`
- `[cookies-store] 💾 Workspace cached in memory`
- `[HomeContainer] 💾 Saved generation timestamp`

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

1. **SWR (`/api/workspace`, credenciais incluídas)** busca snapshot server-side.
   - Polling inteligente com backoff exponencial (2s → 10s) até aparecer o primeiro tile.
   - Verifica `generatedAt` do workspace e `last-generation-time` do `localStorage`.
   - Para automaticamente quando tiles são encontrados ou após 30 tentativas.
2. **Reidrata `localWorkspace`** com o último snapshot salvo no navegador.
3. **Trata sessão expirada (404)** com toast destrutivo e fallback para `localWorkspace`.
4. **Mantém lista de sessões locais** (`listStoredWorkspaces`) para trocar entre gerações.
5. **Gerenciamento de seleção manual**: quando usuário seleciona uma workspace diferente no sidebar, o sistema não sobrescreve automaticamente (usa `userSelectedSessionRef`).
6. **Sistema de cores dinâmicas**:
   - Carrega cor personalizada de `localStorage` (`ade-base-color`) antes da hidratação.
   - Calcula contraste automático baseado na cor de fundo escolhida.
   - Persiste cor imediatamente quando alterada via color picker.
   - Sidebar calcula contraste baseado em `sidebarColor`, não `surfaceColor`.
7. Prefetch `TileDetailModal`, `ContactDetailModal`, `AddContactModal`, etc. conforme o usuário interage.

---

## 5. Tema Ade · Layout e interações

- **`AdminHeaderAde`**:
  - Botões todos à direita (`Customize Background`, `Dashboards`, `Templates`, `Log in`, `Sign up`).
  - Removido `Theme Switch` (dark mode removido - contraste automático substitui).
  - Dropdowns de "Dashboards" e "Templates" têm fundo branco fixo (`#ffffff`) com texto preto (`#000000`).
  - "Manage Templates" movido para dentro do dropdown de Templates (substitui ícone Settings standalone).
  - Botão "Upgrade" usa cor de contraste dinâmica.
  - Todos os elementos clicáveis têm `cursor-pointer`.
- **`AdminSidebarAde`**:
  - Nome da company em destaque, hover transparente, ícones Lucide para Profile/Settings.
  - Contraste automático calculado baseado em `sidebarColor` (não `surfaceColor`).
  - Todas as cores de texto são dinâmicas e recalculadas quando `appearance` muda.
  - Estado `isMounted` garante renderização consistente entre servidor e cliente.
  - Suporte para collapse/expand com transições suaves.
- **`TileGridAde`**: cluster de ações (drag/refresh/delete) aparece no canto inferior direito quando o card está em hover; cursor `grab` no handle.
- **`ContactsPanelAde`**: cards seguem o layout dos tiles (nome + cargo no header, cluster de ações). Empty state com mesma largura dos cards. Botão "Add contact" usa cor de contraste dinâmica.
- **`NotesPanelAde`**: cards laranja originais (`NotesSection`), botão `Add note` com `whitespace-nowrap`, ícone de edição (lápis) que abre modal inline. Form wrapper quando não há notas.
- **`FilesPlaceholderAde`**: removeu bordas/sombra, mantém apenas tabs tipo pill + dropzone tracejada.

---

## 6. Modais e chat

### TileDetailModal (`src/components/ui/prompt-tiles/TileDetailModal.tsx`)

- Header: botão "voltar" e ícone `i` com tooltip contendo modelo, tokens, datas (ambos com `cursor-pointer`).
- Wrapper sem divisórias, cantos arredondados à esquerda.
- Chat:
  - Histórico normalizado (roles garantidamente `assistant`/`user`/`system`).
  - Botão `Copy` mostra o texto apenas no hover e herda `cursor-pointer`.
  - Timestamp menor e discreto.
  - Scroll automático para última mensagem quando histórico muda ou após envio.
  - Suporte para anexos (attachments) com preview de texto.

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

### AddPromptModal (`src/components/admin/ade/AddPromptModal.tsx`)

- Campo de descrição opcional (fallback para título se vazio).
- Checkbox "Use MAX PROMPT" para usar modelo `gpt-4` ao invés de `gpt-3.5-turbo`.
- Sem rolagem desnecessária no modal.
- Cria tiles customizados via `POST /api/workspace/tiles`.

---

## 7. APIs usadas no Admin

| Ação | Endpoint | Observações |
| --- | --- | --- |
| Reordenar tiles | `POST /api/workspace/reorder` | Recebe `order: string[]`; bloqueia se workspace não for o mais recente. |
| Criar tile customizado | `POST /api/workspace/tiles` | Cria tile a partir de prompt customizado. Valida com Zod, gera conteúdo via `generateTileContent`. |
| Regenerar tile | `POST /api/workspace/tiles/[tileId]/regenerate` | Usa `generateTileContent` e preserva `history` recente. |
| Chat tile | `POST /api/workspace/tiles/[tileId]/chat` | **Suporte GPT-5**: usa `responses.create()` para modelos `gpt-5*`, `chat.completions.create()` para GPT-4. Extrai conteúdo de `output_text` ou `output[].content[].text`. Histórico persistido imediatamente no cliente e servidor. |
| Criar contato | `POST /api/workspace/contacts` | Gera outreach inicial com `generateContactOutreach`. |
| Regenerar contato | `POST /api/workspace/contacts/[contactId]/regenerate` | Atualiza `contact.outreach`. |
| Chat contato | `POST /api/workspace/contacts/[contactId]/chat` | Usa mesma lógica de chat dos tiles. |
| Criar nota | `POST /api/workspace/notes` | Cria nova nota no workspace. |
| Editar nota | `PATCH /api/workspace/notes/[noteId]` | Atualiza conteúdo da nota. |
| Reset geral | `DELETE /api/workspace` | Limpa snapshot atual, cookie e `localStorage` (incluindo `ade-base-color`). |

**Notas importantes sobre APIs**:
- Todas as rotas usam `readWorkspace`/`updateWorkspace`; ao retornar, o cliente revalida o SWR e atualiza o cache local.
- Chat APIs retornam tile/contato atualizado com histórico completo para persistência imediata.
- Modelos GPT-5 requerem `max_completion_tokens`, GPT-4 usam `max_tokens` ou `max_output_tokens`.

---

## 8. Sistema de cores e personalização

Arquivo: `src/lib/ade-theme.ts`, `src/lib/color.ts`, `src/containers/admin/AdminContainer.tsx`

### Cores dinâmicas com contraste automático

- **Color picker**: botão no header abre color picker nativo posicionado ao lado do botão.
- **Persistência**: cor salva em `localStorage` (`ade-base-color`) e aplicada antes da hidratação via script inline em `src/app/admin/page.tsx`.
- **Cálculo de contraste**: `getContrastingTextColor()` calcula luminância e retorna preto (`#000000`) ou branco (`#ffffff`) baseado no fundo.
- **Tokens de aparência**: `computeAdeAppearanceTokens()` gera todas as cores derivadas:
  - `surfaceColor`: fundo principal (baseColor ajustado)
  - `sidebarColor`: overlay cinza semi-transparente sobre baseColor
  - `textColor`/`headingColor`: contraste automático baseado em `surfaceColor`
  - `mutedTextColor`: mistura de textColor com surfaceColor
- **Sidebar especial**: calcula contraste baseado em `sidebarColor` (não `surfaceColor`) para garantir legibilidade.
- **Reset**: quando workspace é resetado, cor personalizada também é removida do `localStorage`.

### Prevenção de erros de hidratação

- `suppressHydrationWarning` em todos os elementos com estilos dinâmicos.
- `isMounted` state garante renderização consistente entre servidor e cliente.
- Validação de cores hexadecimais antes de aplicar.
- Fallbacks consistentes para valores padrão.

## 9. Comportamento de toasts e erros

- Provider (`src/lib/state/toast-context.tsx`) encerra mensagem automaticamente (`setTimeout` 5000 ms).
- Erros comuns:
  - 404 em `/api/workspace/*` → sessão expirada. UI mostra toast destrutivo e orienta gerar novo workspace.
  - Resposta vazia da OpenAI em chat → API retorna 502 e UI mostra toast "Chat failed". Logs detalhados para debug.
  - Modelo inválido → `resolveModel()` valida contra `VALID_MODELS` e faz fallback para `gpt-4o-mini` com warning.
  - Faltam envs Cloudinary → modal de anexos informa configuração necessária (texto no rodapé).

---

## 10. Gerenciamento de sessões e workspaces

### Seleção manual vs automática

- **Seleção manual**: quando usuário clica em uma company no sidebar, `userSelectedSessionRef` marca a seleção para prevenir auto-switch.
- **Auto-switch**: sistema só troca automaticamente se não houver seleção manual ativa.
- **Preservação**: workspace local é preservado quando usuário seleciona manualmente outra sessão.
- **Limpeza**: flag de seleção manual é limpa quando nova workspace é gerada ou quando usuário volta para sessão do servidor.

### Polling inteligente

- Verifica `generatedAt` do workspace e `last-generation-time` do `localStorage`.
- Backoff exponencial: 2s → 3s → 4.5s → ... → 10s (máximo).
- Para automaticamente quando tiles são encontrados ou após 30 tentativas.
- Janela de polling aumentada para 2 minutos para workspaces recém-gerados.

## 11. Diagnósticos úteis

- **Logs no servidor**:
  - `[cookies-store] 💾 Workspace cached in memory`
  - `[workspace-browser]` silencioso (falhas de quota ignoradas).
  - `[API] /api/workspace/tiles/[tileId]/chat` logs detalhados de requisições GPT-5/GPT-4.
  - `[API] extractAssistantContent` logs estrutura de resposta para debug.
- **Console do cliente**:
  - `[HomeContainer]` logs para geração/reset.
  - `[AdminContainer]` logs de polling, seleção de workspace, cores computadas.
  - `[AdminSidebarAde]` logs de cores calculadas baseadas em `sidebarColor`.
  - `console.warn`/`console.error` em fetches quando algo falha.
- **Ferramentas**:
  - `npm run lint -w nextjs-openai-insights` garante estilo/erros TS.
  - Testes automatizados ainda não existem; QA manual recomendado (checar modais, hover, chat, cores, hidratação).

---

## 12. Modelos OpenAI e APIs

### Modelos suportados

- **GPT-5**: `gpt-5`, `gpt-5-mini`, `gpt-5-nano` (usam `responses.create()` API)
- **GPT-4**: `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `gpt-4` (usam `chat.completions.create()` API)
- **GPT-3.5**: `gpt-3.5-turbo` (usam `chat.completions.create()` API)
- **Padrão**: `gpt-4o-mini` (definido em `src/lib/ai/settings.ts`)

### Diferenças entre APIs

- **GPT-5 (`responses.create()`)**: 
  - Estrutura: `{ model, input: [], text: { format: { type: "text" }, verbosity: "medium" }, reasoning: { effort: "medium" }, tools: [], store: false, include: [...] }`
  - Resposta: `output_text` na raiz ou `output[].content[].text`
  - Parâmetro: `max_completion_tokens` (não `max_tokens`)
- **GPT-4 (`chat.completions.create()`)**: 
  - Estrutura: `{ model, messages: [], max_tokens }` ou `{ model, messages: [], max_output_tokens }` (para `gpt-4o-mini`)
  - Resposta: `choices[].message.content`
  - Parâmetro: `max_tokens` ou `max_output_tokens`

### Validação de modelos

- `resolveModel()` valida contra `VALID_MODELS` array.
- Modelos inválidos fazem fallback para `DEFAULT_MODEL` com warning no console.
- Logs detalhados mostram qual API está sendo usada.

## Referências cruzadas

- `README.md` — visão macro, setup e lista de endpoints.
- `README-admin.md` — anatomia detalhada dos temas (Ade, Classic, Dash).
- `full-report-10-11.md` — changelog do ciclo de novembro/2025.
- `fluxo-resumido.md` — fluxo anterior (para histórico).
- `docs/escalabilidade-mongodb-prisma.md` — estratégias de escalabilidade e migração futura.

---

**Última atualização**: Novembro/2025  
**Principais mudanças desde 10/11**:
- ✅ Suporte completo para modelos GPT-5 com API `responses.create()`
- ✅ Sistema de cores dinâmicas com contraste automático
- ✅ Remoção do dark mode (substituído por contraste automático)
- ✅ Persistência de cores no `localStorage` com aplicação pré-hidratação
- ✅ Melhorias no polling e gerenciamento de sessões
- ✅ Correções de hidratação com `isMounted` e `suppressHydrationWarning`
- ✅ Histórico de chat persistido imediatamente após envio
- ✅ Dropdowns brancos no header com texto preto fixo
- ✅ Sidebar com contraste automático baseado em `sidebarColor`

Pronto! Esse é o fluxo vigente depois das últimas melhorias no tema Ade. Qualquer evolução futura deve atualizar este documento e o README para manter a visão alinhada. 🚀


