## AI Sales Dashboard — Multi‑Tenant Research & Outreach Tool

### 1) Overview

Multi-tenant dashboard for company research and AI-powered outreach generation. Users save reusable prompt templates, run research in bulk, view answers as interactive tiles, manage contacts and generate contextual emails/call scripts. Built to be installed as a plugin on top of an existing multi‑tenant platform.

### 2) Core Stack

- Frontend: Next.js 15 (App Router) + Tailwind
- Backend: Node.js (APIs in App Router) + MongoDB (via dashboard/lib/db.js)
- Auth: Clerk (JWT fallback, protected middleware)
- Infra: Vercel or Netlify
- Payments: Stripe (Customer Portal + webhooks → credits/plans per workspace)
- AI Engine: OpenAI (streaming + cache) [extensible to Anthropic]
- Storage: Cloudinary (uploads/files)
- Jobs: DeckEngine (queue/bulk with concurrency and idempotency)

### 3) Screens / UX (feature‑by‑screen)

3.1 Landing / Onboarding

- Goal: capture user/company context and start research.
- Fields: “I am a sales rep at”, “I sell…”, “I want to research…”.
- CTAs: Upload CSV (companies), Connect CRM (optional), Start territory research.
- Outcome: creates a workspace (or joins an existing one) and seeds first company/dashboard.

  3.2 Company Dashboard (e.g., “Greenwich Industries”)

- Header: company name, quick actions (Add Contact, Bulk Upload Prompts, Ask Your Own Prompts).
- Sidebar: Profile, Settings, Contact Outreach.
- Interactive block: free‑form question box (context‑aware prompts).
- Purpose: central place to view AI research results per company.

  3.3 Tiles / Prompts Interaction

- Trello‑style grid: drag‑and‑drop, resizable tiles.
- Each tile: question → summarized answer (streamed), history, “provide answer in note form”.
- Bulk upload prompts: run N prompts on one or multiple companies.
- Bulk grid view: rows = companies, columns = prompts/templates.

  3.4 Contacts & Outreach

- Add contacts (name + job title; LinkedIn optional).
- Contact Insights tile: auto‑notes (pain points, triggers, responsibilities) using company + title.
- Outreach tiles: email and call script auto‑generated using context (company tiles, contact insights, notes, files).
- Side‑by‑side editor: left (context), right (AI draft), refinement commands (max words, bullets, focus topic).
- Bookmarks: save approved versions for reuse.

  3.5 Notes & Files

- Notes list and editor (e.g., “Call Notes 21/9”).
- File uploads (PDF/DOCX/CSV, call recordings) via Cloudinary.
- Context panel visible next to AI drafts.

  3.6 Profile & Settings

- User profile: name, email, avatar.
- Workspace settings: RBAC, credit limits, plans (Stripe integration), invites.
- Actions: Manage Billing, Invite Users, API Keys.

  3.7 Admin / Job Monitor (DeckEngine)

- Job list with id/status/progress/timing.
- Error logs and retries.
- Filters by workspace, date and job type (bulk/single).

### 4) Core Functionality (condensed)

- Trello‑style board; tiles are draggable/resizable and persist layout/background.
- Interactive AI refinement inside tiles (follow‑up Q&A on the tile back is optional).
- Dynamic context switching when changing company.
- Fast streaming responses; caching of results by (workspace + company + template + vars).
- Mobile‑responsive UI.
- Data isolation per workspace.
- Prompt and dashboard reusability.
- Extensibility (plugin/modular core).
- Performance: streaming, caching, batching.

### 5) RBAC (roles & onboarding)

- owner: full control (content + billing + deploy + users).
- admin: content (templates/dashboards/contacts/tiles/bulk/invites), no billing/deploy.
- member: uses core (tiles/bulk if enabled, contacts/outreach), no templates/billing/deploy.
- billing_manager (optional): billing only (Customer Portal).
- viewer (optional): read‑only of approved resources.
- Backend enforcement: every API checks `x-workspace-id`, membership and fine‑grained permissions. UI only reflects server decisions.
- Subscriber onboarding: new paying users join as `member` with guided tour to the core app only (no billing/users/deploy).
- Enforced in backend via x-workspace-id + membership + permissions.

### 6) Data Model (workspace‑scoped, MongoDB)

- companies { \_id, workspaceId, name, domain, url, tags[], createdAt, updatedAt }
- dashboards { \_id, workspaceId, companyId, name, layout, templateRef, createdAt, updatedAt }
- templates { \_id, workspaceId, name, prompt, variables[], tags[], createdAt, updatedAt }
- tiles { \_id, workspaceId, companyId, dashboardId, templateId, result, status, lastRun, history[], usage }
- contacts { \_id, workspaceId, companyId, name, title, email, notes, createdAt }
- outreach { \_id, workspaceId, companyId, contactId, type: "email|call|linkedin", draft, final, revisions[], createdAt }
- bookmarks { \_id, workspaceId, entity: "outreach|tile", refId, title, snapshot, createdAt }
- files { \_id, workspaceId, companyId?, dashboardId?, url, type, size, meta, createdAt }
- jobLogs { \_id, workspaceId, type, status, payload, trace, createdAt }
- credits { \_id, workspaceId, plan, quota, consumed, resetsAt, updatedAt }

### 7) APIs (plugin namespace)

- Templates: `GET/POST/PUT/DELETE /api/sales-assistant/templates`
- Companies/Dashboards: `GET/POST /api/sales-assistant/companies`, `GET /dashboards?companyId=`
- Tiles (single): `POST /api/sales-assistant/tiles/run` (LLM streaming + cache)
- Tiles (bulk): `POST /api/sales-assistant/tiles/bulk` (DeckEngine queue)
- Contacts/Insights: `POST /api/sales-assistant/contacts`, `POST /contacts/insights`
- Outreach: `POST /api/sales-assistant/outreach/generate|edit|bookmark`
- Credits: `GET /api/sales-assistant/credits`, `POST /credits/debit`
- Headers: always send `x-workspace-id`.

### 8) AI Strategy (speed, cost, quality)

- Prompt execution with streaming and cache keyed by (workspace + company + template + vars).
- Token budgeting and credit deduction per call.
- Bulk handled by DeckEngine (jobs with progress and concurrency control).
- Context-aware: company, contacts, notes, files, and training inputs.
- Streaming everywhere; incremental UI rendering with per‑tile progress.
- Cache key: `(workspaceId, companyId, templateId, hash(vars,prompt))` with TTL and invalidation on edit.
- Token budgeting and idempotent credits debit; deny run when insufficient balance.
- Bulk via DeckEngine with concurrency control and stable progress reporting.
- Provider abstraction: OpenAI first, extensible to Anthropic/others.

### 9) Integrations

- Stripe: Customer Portal + webhooks → update workspace plan/credits.
- Clerk: auth, sessions; backend trust on DB membership/permissions.
- Cloudinary: uploads and file management.
- (Optional) CRM connectors for company import; (Optional) Sentry/Logflare for monitoring.

### 9.1) Integration Notes

- Reuse UI from dashboardapp-main 2 (TileGrid/Companies/Contacts/Outreach) connected to the endpoints above.
- Replace mocks/Firebase with Mongo (dashboard/lib/db.js).
- Consolidate AI logic in dashboard/lib/ai/ (streaming/cache/credits).
- Bulk powered by DeckEngine (jobs, progress, idempotency).

### 10) Environment (minimum)

- Clerk: `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_CLERK_FRONTEND_API`
- MongoDB: `MONGODB_URI`, `MONGODB_DB_NAME`
- OpenAI: `OPENAI_API_KEY`
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- Cloudinary: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### 11) Roadmap (4 weeks)

- Week 1: Plugin installer; Mongo models; Templates/Companies/Dashboards (APIs + base UI); deploy/env vars. V0.1 with single execution saving tile.
- Week 2: LLM streaming + cache + credits; bulk via DeckEngine; progress UI; 1..N companies functional.
- Week 3: Contacts/Insights; Outreach (editor/bookmarks); Dashboard Templates; Stripe→credits in UI.
- Week 4: Admin/logs/retries; observability (optional); light tests; documentation and runbooks.

### 12) Acceptance Criteria (condensed)

- Secure login and onboarding; workspace created/selected.
- Add companies (manual/CSV/CRM) auto‑generates dashboards with preset tiles.
- Switch/clone/save dashboards; context (notes/files) persisted.
- Tiles: drag/resizing, streaming answers, editable and persisted.
- Contacts: added with AI‑generated insights; outreach drafts generated/refined/bookmarked.
- Subscriptions/credits: tracked and enforced; warnings near limits.
- Referrals (optional): invite flow and crediting.
- Landing connected; optional waiting list; production deploy.
- Full code delivered with documentation.

### 13) Performance/Quality Requirements

- Streaming in all LLM executions.
- Cache per key with TTL and invalidation on edit.
- Rate limiting per user/workspace/route.
- Structured logs and jobLogs for auditing.
