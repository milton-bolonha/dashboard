# IAForms Plugin — Guia

Este documento descreve a arquitetura do IAForms (server-driven) que unifica Hero clássico e dinâmico via `heroType`, integra com `deckEngine` e canais SSE/WS para geração em stream de prompts (single e batch).

## Conceitos

- IAFormsContainer (Server-first): carrega theme/tags/template, define escopo (home/admin) e expõe actions.
- Presenters: Classic (tema fixo), Dynamic (seletor de tema inicial), Alt (extensões futuras).
- Ordenação determinística: `orderIndex` do template guia placeholders e tiles finais.
- Isolamento guest: stream key `guest:{guestId}:job:{jobId}`.

## Endpoints (resumo)

- `POST /api/prompt/run` — single (efêmero)
- `POST /api/prompt-jobs` — criar job
- `GET /api/prompt-jobs/[jobId]` — status
- `POST /api/prompt-jobs/[jobId]/run|pause|resume|cancel` — controle

## Próximos

- Endpoint SSE de stream por job/guest
- Results/Export
- Server Actions no IAForms
