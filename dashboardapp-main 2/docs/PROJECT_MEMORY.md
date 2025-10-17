# Project Memory (Architecture + Behavior Snapshot)

This document captures how the app is structured today so new work stays consistent.

## Overview
React/Next.js app with a collapsible left sidebar, a responsive header, and a main content area that switches between:
- Dashboard tiles for a selected company
- A Companies view (fixed-width list inside main content)

Firestore is the primary data source. A server route proxies OpenAI to generate tile content.

## Key Files
- `src/components/Dashboard.tsx`
  - App shell: header, left sidebar, content switching (`viewMode: 'dashboard' | 'companies'`).
  - Sidebar: brand (“Deel”), close button, Companies and Contacts sections (no add buttons), user section.
  - Header: width synced with content; breadcrumbs hidden when no company or in Companies view; dashboard switcher hidden when no company.
  - Collapsible sidebar: content and header shift using `lg:ml-80`.
  - Companies view: constrained `max-w-md` list with Search/Sort/Add Company controls beneath the title.
  - Data subscriptions:
    - Companies: live snapshot by `userId`.
    - Dashboards: live snapshot by `userId` + `companyId`; default “Dashboard Template 1” auto-created if none.
    - Tiles: live snapshot by `userId` + `companyId` + `dashboardId`.
- `src/components/TileComponent.tsx`
  - Each tile (prompt/note/file/event). For ad‑hoc (`__bulk__`) tiles: compact prompt input with send/attach icons.
  - Prevents bubbling of key/click events to avoid page “reload” behavior.
  - History subscription: loads `tiles/{tileId}/history` for persistent Q/A; shows spinner while loading.
- `src/components/TileGrid.tsx`
  - Drag-and-drop grid of tiles; stops event propagation from the grid container.
- `src/components/AddCompanyModal.tsx`
  - `variant="quick"` (only Name + optional URL) and `variant="full"` (extended fields & CSV mode).
- `src/lib/templates.ts`
  - Template prompt definitions, especially Template 1 (8 prompts).
- `src/types/index.ts`
  - Types for `Dashboard`, `Tile`, etc.
- `src/app/api/ai/generate/route.ts`
  - Server-side route to call OpenAI (or fall back to a mock). Expects `OPENAI_API_KEY` in env.

## Default Onboarding Flow
1) User adds/selects a company.
2) If the company has no dashboards, create default dashboard: “Dashboard Template 1”.
3) Seed 8 tiles from Template 1 and immediately generate content for each tile via `/api/ai/generate` (with mock fallback). Persist content and a `history` entry for each tile.
4) Tiles subscribe and render as content arrives.

## Sidebar & Header Behavior
- Sidebar hidden by default; header menu button opens it.
- When sidebar opens, header’s menu button hides; a close button appears at the sidebar’s top-right.
- Header margins mirror content margins so the header width always matches the content width.

## Companies View
- Triggered by clicking “Companies” in the sidebar header.
- Fixed width (`max-w-md`), left-aligned within content.
- Controls (Search, Sort, Add Company) under the title with icons.
- Clicking a company selects it and returns to dashboard view.

## Tiles UX Details
- Typing in tile prompt: handled in a local form; Enter submits without bubbling events.
- History spinner during initial history load.
- Tile backgrounds: render white; dashboard tiles have gray “chrome”.

## Environment & Config
- Requires Firestore config in `src/lib/firebase` and `OPENAI_API_KEY` for the AI route.
- Dark mode classes present but header uses white background by default per UI spec.

## Known Conventions
- Firestore collections:
  - `companies` by `userId`
  - `dashboards` by `userId` + `companyId`
  - `tiles` by `userId` + `companyId` + `dashboardId`
  - `tiles/{tileId}/history` for Q/A log

## Quick Runbook
- Add a company (Quick Add modal) → default dashboard + template tiles auto-create → tiles auto-generate responses.
- Use Bulk Upload to create ad‑hoc prompt tiles.
- Toggle the sidebar using the header button; close from the sidebar top-right.

## Recent UX Updates
- Collapsible sidebar with brand row (“Deel”) and close button.
- Header width synced to content; no header border.
- Companies view with fixed width & icon controls; list items larger and bold.
- Removed add buttons from sidebar Companies/Contacts headers.

---
This file is the project “memory.” Update it when flows or structure change.


