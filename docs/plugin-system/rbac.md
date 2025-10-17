## RBAC — Roles, Permissões e Onboarding (AI Sales Assistant)

### Perfis

- owner: controle total (conteúdo + billing + deploy + usuários).
- admin: gerencia conteúdo (templates, dashboards, contacts, tiles, bulk), convida usuários (se habilitado), sem billing/deploy.
- member: usa o core (companies, tiles, contacts, outreach, bookmarks), sem gerenciar templates/billing/deploy.
- billing_manager (opcional): acesso a billing (Customer Portal), não edita conteúdo.
- viewer (opcional): apenas leitura.

### Permissões atômicas

- Core LLM: `canRunLLM`, `canRunBulk`, `canEditTemplates`, `canEditDashboards`.
- Usuários: `canInvite`, `canManageMembers`.
- Financeiro: `canManageBilling`, `canViewBilling`.
- Deploy: `canManageDeploy`.
- Administração: `canViewAdmin`, `canViewLogs`.

### Mapeamento padrão por role

- owner: todas as permissões.
- admin: todas exceto `canManageBilling`, `canManageDeploy` (opcional habilitar por owner).
- member: `canRunLLM`, `canRunBulk` (se habilitado), pode criar seus próprios dashboards (se permitido), sem `canEditTemplates`.
- billing_manager: `canManageBilling`, `canViewBilling`.
- viewer: leitura apenas.

### Onboarding

- Assinante (novo pagante): ao criar conta/aceitar convite, vira `member` no workspace. Onboarding direciona ao core (companies, templates aplicáveis, tiles) sem acessar billing/deploy/users.
- Owner/Admin: onboarding estendido com configuração de templates, dashboard templates, convites/roles, créditos.

### Implementação

- Backend: validar sempre `x-workspace-id` + membership + permissões; negar se ausente.
- Banco: `workspaces.members[]` contém `{ userId, role, permissions }`. O backend é a verdade; Clerk metadata é cache.
- UI: esconder ações indisponíveis e exibir mensagens de permissão negada quando aplicável.
