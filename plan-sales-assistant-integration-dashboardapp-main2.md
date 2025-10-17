## Integração com "dashboardapp-main 2" — Mapeamento e Reaproveitamento

### O que existe no "dashboardapp-main 2"

- Stack: Next.js 14 (App Router), TypeScript, Tailwind, componentes prontos.
- UI/Core:
  - `components/` com Companies (table/toolbar/edit), Contacts (table/edit), Tiles (`TileGrid`, `TileComponent`), Dashboard, OutreachGenerator.
  - Modais: AddCompanyModal, AddContactModal, BulkUploadModal, AddTileButton, FileUpload.
  - Contextos: `AuthContext`, `ThemeContext`; hook `useDashboard`.
- API Routes (presentes):
  - `app/api/ai/generate/route.ts` (geração de IA)
  - `app/api/ai/score-company/route.ts` (scoring)
  - `app/api/uploads/cloudinary/route.ts` (upload)
- Libs:
  - `lib/ai.ts` (integração AI), `lib/templates.ts` (templates), `lib/firebase.ts` (camada alternativa), `lib/mockData.ts` (dados fake), `lib/notifications.ts`.
- README descreve Prisma/Postgres/NextAuth, porém o código atual aponta para uso de `firebase.ts` e não traz `prisma.ts` → divergência de implementação (UI pronta, backend parcial/mocado).

### O que reaproveitar diretamente

- UI de tiles, grid, dashboard, companies, contacts, outreach editor.
- Modais e componentes de UI (`ui/*`).
- Estrutura de páginas (`app/*`) e providers.
- Upload via Cloudinary (rota existente) e integração básica de AI (`ai/generate`).

### O que adaptar/alinhar ao DashMaster

- Autenticação: migrar para Clerk (ou manter compat) + `getCurrentAuth()` do DashMaster.
- Multi-tenant: todas as chamadas devem enviar `x-workspace-id`; filtrar por `workspaceId`.
- Data layer: substituir `firebase.ts/mockData.ts` por `dashboard/lib/db.js` (Mongo) e coleções do plugin.
- API: mover/reestruturar para `dashboard/app/api/sales-assistant/*` e aplicar RBAC.
- LLM: unificar via `dashboard/lib/ai/` (streaming, cache, débito de créditos).
- Bulk: integrar DeckEngine para jobs e progresso; UI mantém grade atual.

### Plano de migração

1. Extrair componentes UI do `dashboardapp-main 2` para `dashboard/components/sales/*` (sem lógica de dados).
2. Reescrever hooks/contexts para consumir as novas APIs do plugin (Mongo + Clerk + workspace headers).
3. Adaptar rotas `ai/generate` para provider único e streaming (compatível com Tiles existentes).
4. Substituir fontes de dados mockadas por coleções reais (companies, contacts, tiles, templates, outreach).
5. Adicionar RBAC por rota e ocultar ações na UI conforme permissões.
6. Integrar Bulk com DeckEngine, emitindo progresso e refletindo na UI atual.

### RBAC e Onboarding

- Assinante entra como `member` no workspace (sem billing/deploy/users).
- Owner/Admin mantêm acesso às seções de configuração, billing, deploy e convites.

### Ajustes rápidos necessários

- Normalizar tipos (`types/index.ts`) para bater com os modelos Mongo (ids como strings/`ObjectId` no backend).
- Remover referências a `prisma.ts` do README ou implementar camada real quando (e se) migrar para Postgres.
