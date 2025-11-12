# Cenários e Métricas de Validação

## Home
- Validar habilitação progressiva dos campos (`ClassicHeroForm`) e ausência dos textos “Please review this field.” após a revisão.
- Garantir que os CTAs “Connect CRM” e “Upload CSV” respeitam estados de loading, disabled e redirecionamento.
- Conferir posicionamento dos toasts (canto inferior esquerdo) em desktop e mobile (viewport ≥768px e 375px).
- Verificar tooltips / botões de ajuda (header e botão flutuante) com rotas/documentação corretas.

## Prompts e Templates
- Cobertura unitária para helpers (`processPromptVariables`, resolvers novos) garantindo compatibilidade quando `agentId`, `promptLength` ou `bulkGroup` estiverem ausentes.
- Snapshot das estruturas em `guest-templates.ts` e dos dashboards customizados.
- Fixtures reutilizáveis definidos em `src/test-utils/workspace-fixtures.ts` para tiles, notas e contatos.

## Admin
- Testar seleção e persistência do tema Ade com cor dinâmica do fundo e contraste automático.
- Confirmar alinhamento dos ícones e remoção dos “+” na sidebar/header.
- Verificar padronização dos painéis principal (tiles, contacts, notes, files) e botões “Add prompt”/bulk upload.

## Chat & Modais
- Reproduzir erro 502 e validar correção nos logs e na UI (toast/estado do botão).
- Fluxo completo de upload de anexos no chat, incluindo envio para o backend e exibição no histórico.
- Garantir consistência entre `TileDetailModal` e `ContactDetailModal`.

## Autenticação & Guest
- Redirecionamentos pós login/sign up, fallback guest e proteção de rotas server-side.

## Testes Automatizados
- Playwright: geração do workspace, custom dashboards, upload de anexos, login redirect.
- Jest/RTL: comportamentos do form, toasts, resolvers de prompt, contraste dinâmico.



