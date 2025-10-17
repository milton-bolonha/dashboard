## Instalador/Reinstalador — AI Sales Assistant

### Scripts

- `dashboard/scripts/install-sales-assistant.js`

  - Verifica conexão com MongoDB.
  - Cria coleções: companies, dashboards, templates, tiles, contacts, outreach, bookmarks, files, jobLogs, credits.
  - Cria índices sugeridos.
  - Seeds: templates básicos (ex.: "Resumo 75 palavras", "Competidores").
  - Permissões default no workspace: `canRunLLM`, `canManageTemplates` (owner/admin).

- `dashboard/scripts/uninstall-sales-assistant.js`
  - Remoção segura das coleções do plugin (opção: dry-run).

### CLI

- `npm run plugin:install`
- `npm run plugin:uninstall`

### Notas

- Não remover coleções do CMS existente.
- Validar `x-workspace-id` para seeds por workspace quando aplicável.
