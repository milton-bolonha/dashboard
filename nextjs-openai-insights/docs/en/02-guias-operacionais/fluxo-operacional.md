# New Flow · nextjs-openai-insights (Updated Nov/2025)

Updated document of the complete cycle from filling out the form to interactions within the Ade admin. It replaces the old schemes (`flow.md`, `flow-summary.md`) bringing the changes from November/2025 and recent updates.

---

## Quick summary

- **Session**: httpOnly cookie `insightsWorkspaceSession` points to an in-memory snapshot (TTL 30 min). The browser replicates the last workspaces in `localStorage`.
- **Generation**: `POST /api/generate` assembles prompts from the `template_1` template, calls GPT-5 via the `responses.create()` API (or mock fallback) and persists tiles already with chat history.
- **Admin**: `AdminContainer` loads `/api/workspace`, rehydrates from the local cache when the session expires, controls auto-dismiss toasts (5s) and manages manual selection of workspaces.
- **Chat**: tiles and contacts share the same AI flow (short history, clamp, exponential retries). Full support for GPT-5 models with `responses.create()` API and GPT-4 with `chat.completions.create()`.
- **UI Ade**: transparent hover, action cluster in the corner of the card, monochrome modals and compact tooltip in the doc modal.
- **Dynamic colors**: automatic contrast system based on the chosen background color, persisted in `localStorage` with `ade-base-color`. Sidebar calculates contrast based on `sidebarColor`, not `surfaceColor`.
- **Hydration**: all conditional renderings are consistent between server and client using `isMounted` and `suppressHydrationWarning`.

---

## Pipeline Overview

```
User (Home)
  │
  ├─ fills out ClassicHeroForm
  └─ submits → HomeContainer.handleSubmit
          │
          ├─ POST /api/generate ----------------───┐
          │                                        │
          │  creates snapshot + saves to memory    │
          ▼                                        │
    JSON response { sessionId, workspace }         │
          │                                        │
          ├─ rememberSessionId + local cache       │
          └─ router.push("/admin")                 │
                                                   │
                                            Browser (/admin)
                                                   │
                            AdminContainer (SWR /api/workspace + localStorage)
                                                   │
                  ┌──────────────┬─────────────────┴──────────────┐
                  │              │                                │
           Tiles/Modal Doc   Notes Panel                    Contacts Panel
                  │              │                                │
        /api/workspace/...  /api/workspace/notes/...   /api/workspace/contacts/...
```

---

## 1. Home · Form and submission

Key file: `src/containers/home/HomeContainer.tsx`

1. `ClassicHeroForm` delivers the fields `company`, `companyWebsite`, `solution`, `researchTarget`, `researchWebsite`.
2. `handleSubmit`:
   - Blocks resubmissions (`isSubmitting`).
   - POST to `/api/generate` with a normalized payload.
   - Stores `sessionId` via `rememberSessionId` and snapshot via `saveWorkspace`.
   - Displays a progress toast and redirects to `/admin`.
3. "Reset workspace" button calls `DELETE /api/workspace` + `clearAllWorkspaces()` to clear the local cache and current session.

Toasts use `ToastProvider`; since November, warnings disappear automatically in 5 seconds.

---

## 2. `/api/generate` · Workspace assembly

File: `src/app/api/generate/route.ts`

Main steps:

1. Validates payload with `zod`.
2. Resolves template (`getGuestTemplate`) and replaces variables with `processPromptVariables`.
3. For each tile:
   - If `MOCK_OPENAI_RESPONSES=true`, uses `generateMockTileContent`.
   - Otherwise, instantiates `OpenAI` and calls `generateTileContent` (configurable batch via `BROWSER_TILE_BATCH_SIZE`).
   - Limits tokens for critical prompts (`getMaxTokensForTile`).
   - GPT-5 models use `responses.create()`, GPT-4 use `chat.completions.create()`.
4. Assembles `WorkspaceSnapshot` with tiles, empty notes/contacts and marks `generatedAt`.
5. Persists in the global cache (`writeWorkspace`) and returns JSON `{ success, sessionId, workspace }`.
6. Saves generation timestamp in `localStorage` (`last-generation-time`) for intelligent polling.

Relevant logs:

- `[api/generate] 📤 Payload`
- `[api/generate] ✅ Tiles generated/with fallback`
- `[cookies-store] 💾 Workspace cached in memory`
- `[HomeContainer] 💾 Saved generation timestamp`

---

## 3. Session and cache

File: `src/lib/cookies-store.ts`

- 30-minute TTL per session; expired sessions are cleared before each read.
- `writeWorkspace` clones the snapshot to prevent inadvertent mutation.
- `clearWorkspace` removes the cache and deletes the cookie.

On the client, `src/lib/storage/workspace-browser.ts`:

- Stores up to 5 recent sessions (`insights_workspace_{sessionId}`) + ordered index.
- `rememberSessionId` defines the last active workspace for quick opening.
- `clearAllWorkspaces` removes the index/last session (used when the user resets the app).

---

## 4. Admin Boot

File: `src/containers/admin/AdminContainer.tsx`

1. **SWR (`/api/workspace`, credentials included)** fetches the server-side snapshot.
   - Intelligent polling with exponential backoff (2s → 10s) until the first tile appears.
   - Checks `generatedAt` of the workspace and `last-generation-time` from `localStorage`.
   - Stops automatically when tiles are found or after 30 attempts.
2. **Rehydrates `localWorkspace`** with the last snapshot saved in the browser.
3. **Handles expired session (404)** with a destructive toast and fallback to `localWorkspace`.
4. **Maintains a list of local sessions** (`listStoredWorkspaces`) to switch between generations.
5. **Manual selection management**: when the user selects a different workspace in the sidebar, the system does not automatically overwrite it (uses `userSelectedSessionRef`).
6. **Dynamic color system**:
   - Loads custom color from `localStorage` (`ade-base-color`) before hydration.
   - Calculates automatic contrast based on the chosen background color.
   - Persists color immediately when changed via the color picker.
   - Sidebar calculates contrast based on `sidebarColor`, not `surfaceColor`.
7. Prefetches `TileDetailModal`, `ContactDetailModal`, `AddContactModal`, etc. as the user interacts.

---

## 5. Ade Theme · Layout and interactions

- **`AdminHeaderAde`**:
  - All buttons on the right (`Customize Background`, `Dashboards`, `Templates`, `Log in`, `Sign up`).
  - Removed `Theme Switch` (dark mode removed - automatic contrast replaces it).
  - "Dashboards" and "Templates" dropdowns have a fixed white background (`#ffffff`) with black text (`#000000`).
  - "Manage Templates" moved inside the Templates dropdown (replaces standalone Settings icon).
  - "Upgrade" button uses dynamic contrast color.
  - All clickable elements have `cursor-pointer`.
- **`AdminSidebarAde`**:
  - Company name highlighted, transparent hover, Lucide icons for Profile/Settings.
  - Automatic contrast calculated based on `sidebarColor` (not `surfaceColor`).
  - All text colors are dynamic and recalculated when `appearance` changes.
  - `isMounted` state ensures consistent rendering between server and client.
  - Support for collapse/expand with smooth transitions.
- **`TileGridAde`**: action cluster (drag/refresh/delete) appears in the bottom right corner when the card is hovered; `grab` cursor on the handle.
- **`ContactsPanelAde`**: cards follow the tile layout (name + role in the header, action cluster). Empty state with the same width as the cards. "Add contact" button uses dynamic contrast color.
- **`NotesPanelAde`**: original orange cards (`NotesSection`), `Add note` button with `whitespace-nowrap`, edit icon (pencil) that opens an inline modal. Form wrapper when there are no notes.
- **`FilesPlaceholderAde`**: removed borders/shadow, keeps only pill-type tabs + dashed dropzone.

---

## 6. Modals and chat

### TileDetailModal (`src/components/ui/prompt-tiles/TileDetailModal.tsx`)

- Header: "back" button and `i` icon with a tooltip containing the model, tokens, dates (both with `cursor-pointer`).
- Wrapper without dividers, rounded corners on the left.
- Chat:
  - Normalized history (roles guaranteed to be `assistant`/`user`/`system`).
  - `Copy` button shows the text only on hover and inherits `cursor-pointer`.
  - Smaller and discreet timestamp.
  - Automatic scroll to the last message when the history changes or after sending.
  - Support for attachments with text preview.

### ContactDetailModal (`src/components/admin/ade/ContactDetailModal.tsx`)

- Replicates the tile modal layout.
- Uses `chatHistory` saved in the contact (type added in `src/lib/types.ts`).
- API: `POST /api/workspace/contacts/[contactId]/chat`:
  - Reconstructs the prompt with a short history (`MAX_HISTORY_LENGTH=12`).
  - If `OPENAI_API_KEY` is missing or `MOCK_OPENAI_RESPONSES=true`, uses a mock.
  - Updates `contact.outreach.contactInsights` with the clamped summary.

### AddCompanyModal / AddContactModal / AttachFilesModal

- Gray monochrome palette.
- Content translated to English.
- Buttons and icons with `cursor-pointer`, including the close `X`.

### AddPromptModal (`src/components/admin/ade/AddPromptModal.tsx`)

- Optional description field (falls back to title if empty).
- "Use MAX PROMPT" checkbox to use the `gpt-4` model instead of `gpt-3.5-turbo`.
- No unnecessary scrolling in the modal.
- Creates custom tiles via `POST /api/workspace/tiles`.

---

## 7. APIs used in Admin

| Action | Endpoint | Notes |
| --- | --- | --- |
| Reorder tiles | `POST /api/workspace/reorder` | Receives `order: string[]`; blocks if the workspace is not the most recent. |
| Create custom tile | `POST /api/workspace/tiles` | Creates a tile from a custom prompt. Validates with Zod, generates content via `generateTileContent`. |
| Regenerate tile | `POST /api/workspace/tiles/[tileId]/regenerate` | Uses `generateTileContent` and preserves recent `history`. |
| Chat tile | `POST /api/workspace/tiles/[tileId]/chat` | **GPT-5 Support**: uses `responses.create()` for `gpt-5*` models, `chat.completions.create()` for GPT-4. Extracts content from `output_text` or `output[].content[].text`. History persisted immediately on the client and server. |
| Create contact | `POST /api/workspace/contacts` | Generates initial outreach with `generateContactOutreach`. |
| Regenerate contact | `POST /api/workspace/contacts/[contactId]/regenerate` | Updates `contact.outreach`. |
| Chat contact | `POST /api/workspace/contacts/[contactId]/chat` | Uses the same chat logic as the tiles. |
| Create note | `POST /api/workspace/notes` | Creates a new note in the workspace. |
| Edit note | `PATCH /api/workspace/notes/[noteId]` | Updates the note's content. |
| General reset | `DELETE /api/workspace` | Clears the current snapshot, cookie, and `localStorage` (including `ade-base-color`). |

**Important notes about APIs**:
- All routes use `readWorkspace`/`updateWorkspace`; upon return, the client revalidates the SWR and updates the local cache.
- Chat APIs return the updated tile/contact with the complete history for immediate persistence.
- GPT-5 models require `max_completion_tokens`, GPT-4 use `max_tokens` or `max_output_tokens`.

---

## 8. Color system and customization

File: `src/lib/ade-theme.ts`, `src/lib/color.ts`, `src/containers/admin/AdminContainer.tsx`

### Dynamic colors with automatic contrast

- **Color picker**: button in the header opens a native color picker positioned next to the button.
- **Persistence**: color saved in `localStorage` (`ade-base-color`) and applied before hydration via an inline script in `src/app/admin/page.tsx`.
- **Contrast calculation**: `getContrastingTextColor()` calculates luminance and returns black (`#000000`) or white (`#ffffff`) based on the background.
- **Appearance tokens**: `computeAdeAppearanceTokens()` generates all derived colors:
  - `surfaceColor`: main background (adjusted baseColor)
  - `sidebarColor`: semi-transparent gray overlay over baseColor
  - `textColor`/`headingColor`: automatic contrast based on `surfaceColor`
  - `mutedTextColor`: mix of textColor with surfaceColor
- **Special sidebar**: calculates contrast based on `sidebarColor` (not `surfaceColor`) to ensure readability.
- **Reset**: when the workspace is reset, the custom color is also removed from `localStorage`.

### Prevention of hydration errors

- `suppressHydrationWarning` on all elements with dynamic styles.
- `isMounted` state ensures consistent rendering between server and client.
- Validation of hexadecimal colors before applying.
- Consistent fallbacks for default values.

## 9. Behavior of toasts and errors

- Provider (`src/lib/state/toast-context.tsx`) automatically dismisses the message (`setTimeout` 5000 ms).
- Common errors:
  - 404 on `/api/workspace/*` → session expired. UI shows a destructive toast and guides to generate a new workspace.
  - Empty response from OpenAI in chat → API returns 502 and UI shows "Chat failed" toast. Detailed logs for debugging.
  - Invalid model → `resolveModel()` validates against `VALID_MODELS` and falls back to `gpt-4o-mini` with a warning.
  - Missing Cloudinary envs → attachments modal informs of the necessary configuration (text in the footer).

---

## 10. Session and workspace management

### Manual vs automatic selection

- **Manual selection**: when the user clicks on a company in the sidebar, `userSelectedSessionRef` marks the selection to prevent auto-switching.
- **Auto-switch**: the system only switches automatically if there is no active manual selection.
- **Preservation**: the local workspace is preserved when the user manually selects another session.
- **Cleanup**: the manual selection flag is cleared when a new workspace is generated or when the user returns to the server session.

### Intelligent polling

- Checks `generatedAt` of the workspace and `last-generation-time` from `localStorage`.
- Exponential backoff: 2s → 3s → 4.5s → ... → 10s (maximum).
- Stops automatically when tiles are found or after 30 attempts.
- Polling window increased to 2 minutes for newly generated workspaces.

## 11. Useful diagnostics

- **Server logs**:
  - `[cookies-store] 💾 Workspace cached in memory`
  - `[workspace-browser]` silent (quota failures ignored).
  - `[API] /api/workspace/tiles/[tileId]/chat` detailed logs of GPT-5/GPT-4 requests.
  - `[API] extractAssistantContent` logs response structure for debugging.
- **Client console**:
  - `[HomeContainer]` logs for generation/reset.
  - `[AdminContainer]` logs for polling, workspace selection, computed colors.
  - `[AdminSidebarAde]` logs for calculated colors based on `sidebarColor`.
  - `console.warn`/`console.error` on fetches when something fails.
- **Tools**:
  - `npm run lint -w nextjs-openai-insights` ensures style/TS errors.
  - Automated tests do not exist yet; manual QA recommended (check modals, hover, chat, colors, hydration).

---

## 12. OpenAI Models and APIs

### Supported models

- **GPT-5**: `gpt-5`, `gpt-5-mini`, `gpt-5-nano` (use `responses.create()` API)
- **GPT-4**: `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `gpt-4` (use `chat.completions.create()` API)
- **GPT-3.5**: `gpt-3.5-turbo` (use `chat.completions.create()` API)
- **Default**: `gpt-4o-mini` (defined in `src/lib/ai/settings.ts`)

### Differences between APIs

- **GPT-5 (`responses.create()`)**: 
  - Structure: `{ model, input: [], text: { format: { type: "text" }, verbosity: "medium" }, reasoning: { effort: "medium" }, tools: [], store: false, include: [...] }`
  - Response: `output_text` at the root or `output[].content[].text`
  - Parameter: `max_completion_tokens` (not `max_tokens`)
- **GPT-4 (`chat.completions.create()`)**: 
  - Structure: `{ model, messages: [], max_tokens }` or `{ model, messages: [], max_output_tokens }` (for `gpt-4o-mini`)
  - Response: `choices[].message.content`
  - Parameter: `max_tokens` or `max_output_tokens`

### Model validation

- `resolveModel()` validates against the `VALID_MODELS` array.
- Invalid models fall back to `DEFAULT_MODEL` with a warning in the console.
- Detailed logs show which API is being used.

## Cross-references

- `README.md` — macro view, setup and list of endpoints.
- `README-admin.md` — detailed anatomy of themes (Ade, Classic, Dash).
- `full-report-10-11.md` — changelog for the November/2025 cycle.
- `flow-summary.md` — previous flow (for history).
- `docs/scalability-mongodb-prisma.md` — scalability and future migration strategies.

---

**Last updated**: November 21, 2025
**Main changes since 11/10**:
- ✅ Full support for GPT-5 models with `responses.create()` API
- ✅ Dynamic color system with automatic contrast
- ✅ Removal of dark mode (replaced by automatic contrast)
- ✅ Persistence of colors in `localStorage` with pre-hydration application
- ✅ Improvements in polling and session management
- ✅ Hydration fixes with `isMounted` and `suppressHydrationWarning`
- ✅ Chat history persisted immediately after sending
- ✅ White dropdowns in the header with fixed black text
- ✅ Sidebar with automatic contrast based on `sidebarColor`

**Critical fixes (11/21/2025)**:
- ✅ **Duplicate tile generation fixed**: Streaming completely disabled, polling with session control
- ✅ **Deletion persistence fixed**: `mutate()` uncommented for workspace reload
- ✅ **"Add Prompt" modal redesigned**: Compact layout with inline Max Mode
- ✅ **Retry button removed**: Removed unimplemented functionality

See [Full Fix Report](../05-reports/report-nov-21-2025.md) for technical details.

---

## 13. Critical Fixes of November 2025

### Duplicate Tile Generation Problem (RESOLVED)

**Symptom**: Tiles were generated twice, the second generation overwriting the first, resulting in only 1 visible tile.

**Root Cause Identified**:
1. **Streaming** system (`useTileStreaming`) started even after complete batch generation
2. **Polling** synchronized tiles multiple times (3+), causing flickering

**Implemented Solution**:
```typescript
// AdminContainer.tsx line 1138
useEffect(() => {
  // CRITICAL FIX: Disable streaming completely
  console.log("[AdminContainer] ⏸️ Streaming DISABLED - using batch mode only");
  return; // Early return prevents streaming
}, [/* dependencies */]);

// AdminContainer.tsx line 122 + 167
const tilesSyncedForSessionRef = useRef<string | null>(null);

if (tilesSyncedForSessionRef.current !== data.sessionId) {
  tilesSyncedForSessionRef.current = data.sessionId;
  updateDashboard(/* ... */); // Sync only ONCE per session
}
```

**Result**: ✅ All 8 tiles load correctly, without duplication or flickering.

### Deletion Persistence Problem (RESOLVED)

**Symptom**: Deleted tiles returned after F5.

**Root Cause**: `mutate()` was commented out in `handleDeleteTile`, preventing workspace reload.

**Solution**:
```typescript
// AdminContainer.tsx line 2744
await mutate(); // Reloads workspace from the server after deletion
```

**Corrected Flow**:
1. DELETE `/api/workspace/tiles/[tileId]` → updates cookie + MongoDB
2. `mutate()` → reloads from the server
3. `refreshStoredWorkspaces()` → updates localStorage
4. ✅ Tile remains deleted after F5

### UI Improvements

**"Add New Prompt" Modal**:
- Max Mode is now inline with Request Size (30% more compact layout)
- Explanatory text removed
- Better visual hierarchy

**TileBoard**:
- Non-functional retry button removed
- Only functional actions visible (Drag, Delete)

Done! This is the current flow after the latest improvements to the Ade theme. Any future evolution should update this document and the README to keep the vision aligned. 🚀
