# Admin Dashboard – Guia Completo 🚀

Este documento detalha toda a arquitetura e fluxo da área administrativa do projeto `nextjs-openai-insights`. Bora mergulhar! 💻✨

---

## Visão Geral

- **Origem do layout**: inspirado no dashboard original (`dashboard/app/admin`) com adaptações para o App Router do Next.js 16.
- **Stack**: React Server Components + Client Components, SWR para data fetching, cookies para storage, Tailwind CSS para estilização rápida.
- **Persistência**: cookies HTTP-only via helpers em `src/lib/cookies-store.ts` (`readWorkspace`, `writeWorkspace`, etc.).
- **Geração de insights**: rota `POST /api/generate` invoca GPT-5 (via SDK oficial da OpenAI) e salva o snapshot no cookie.
- **Tema padrão**: **Ade Style**, com opções para alternar para **Classic** e **Dash Style** pelo switcher interno.

---

## Estrutura de Pastas

```
src/
  components/
    admin/
      AdminThemeSwitcher.tsx         // Seletor de temas
      ade/                           // Componentes do tema Ade Style
      dash/                          // Componentes do tema Dash Style
      AdminShellClassic.tsx          // Shell do tema Classic
      ...
  containers/
    admin/
      AdminContainer.tsx             // Orquestrador principal (Client Component)
      ade/                           // Containers do tema Ade Style
      dash/                          // Containers do tema Dash Style
      components/                    // Peças do tema Classic
```

### Tema Ade Style (default)

Arquivos em `src/components/admin/ade` e `src/containers/admin/ade`.

- **AdminShellAde**: controla layout geral (sidebar + header + main).
- **AdminSidebarAde**: replica o menu do dashboard legacy (Earn Credits, Companies, Contacts).
- **AdminHeaderAde**: seções de dashboards/templates, toggles e botões de ação.
- **TileGridAde / NotesPanelAde / ContactsPanelAde / FilesPlaceholderAde**: versão “fidélissima” com cards, seções e placeholders iguais ao bundle HTML original.

### Tema Dash Style

Arquivos em `src/components/admin/dash` e `src/containers/admin/dash`.

- Visual inspirado no ChatGPT: cards sem borda, layout corrido, fundo cinza.
- Sidebar minimalista com contadores.
- Notes/Contacts com formulários integrados aos endpoints `/api/workspace/*`.

### Tema Classic

Arquivos em `src/components/admin/*.tsx` (sem subpastas) + `src/containers/admin/components`.

- Primeira versão do redesign, com grid clássico, métricas responsivas e placeholders.

---

## Fluxo de Dados

1. **Carregamento inicial**  
   `AdminContainer` usa `useSWR("/api/workspace")` para puxar o snapshot armazenado em cookie.

2. **Mudança de tema**  
   `AdminThemeSwitcher` muda o valor no contexto (`AdminThemeProvider`). Persistência em `localStorage` (`admin-theme`), com fallback seguro para usuários antigos (`chatgpt` → `dash`).

3. **Ações de tiles/notas/contatos**

   - Delete de tile: `DELETE /api/workspace/tiles/:tileId`
   - Criação/remover nota: `POST/DELETE /api/workspace/notes`
   - Criação/remover contato: `POST/DELETE /api/workspace/contacts`
     Todas as rotas manipulam o cookie e retornam snapshot atualizado.

4. **Gerar nova rodada de insights**  
   `HomeContainer` dispara `POST /api/generate`. Ao concluir, redireciona para `/admin` (SWR revalida).

5. **Limpeza do workspace**  
   Botão “Limpar” chama `DELETE /api/workspace`. Cookies são resetados com snapshot vazio.

---

## Componentização

- **Containers**: lidam com fetch, mutation, transições (React 19 `useTransition`) e toasts.
- **Components**: responsável apenas pelo visual. Cada tema possui a sua própria versão.
- **Contextos**:
  - `AdminThemeProvider`: expõe `theme`, `setTheme`, `isClassic`, `isDash`, `isAde`.
  - `ToastProvider`: gerencia notificações visuais.

---

## Experiência do Usuário

- **Ade Style (padrão)**: full-fidelity com sidebar e header completinhos, cards como no HTML legacy.
- **Classic**: grid com métricas, inspirado no redesign da home.
- **Dash Style**: layout sem bordas, fluxo contínuo “ChatGPT-like”.

Todos os temas compartilham o mesmo backend e ações, trocando apenas a camada de apresentação.

---

## Toques Finais & Roadmap

- ✅ Temas intercambiáveis com persistência local.
- ✅ Logging detalhado em `/api/generate` e containers.
- ✅ Estrutura preparada para novas integrações (ex.: Cloudinary).
- 🛠️ Possíveis próximos passos:
  - Implementar modal real para upload no placeholder do Ade Style.
  - Adicionar status real aos botões “Dashboards/Templates”.
  - Expandir funil de exportação (PDF/CSV) direto do cookie.

---

Pronto! Agora você tem um guia completão sobre o admin. Se quiser evoluir algo, só chamar! 😎💡
