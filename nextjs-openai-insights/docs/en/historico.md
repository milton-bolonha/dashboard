# Validation Scenarios and Metrics

## Home
- Validate the progressive enabling of fields (`ClassicHeroForm`) and the absence of "Please review this field." texts after review.
- Ensure that the "Connect CRM" and "Upload CSV" CTAs respect loading, disabled, and redirection states.
- Check the positioning of toasts (bottom left corner) on desktop and mobile (viewport ≥768px and 375px).
- Verify tooltips / help buttons (header and floating button) with correct routes/documentation.

## Prompts and Templates
- Unit test coverage for helpers (`processPromptVariables`, new resolvers) ensuring compatibility when `agentId`, `promptLength`, or `bulkGroup` are missing.
- Snapshot of the structures in `guest-templates.ts` and custom dashboards.
- Reusable fixtures defined in `src/test-utils/workspace-fixtures.ts` for tiles, notes, and contacts.

## Admin
- Test the selection and persistence of the Ade theme with dynamic background color and automatic contrast.
- Confirm the alignment of icons and the removal of "+" in the sidebar/header.
- Verify the standardization of the main panels (tiles, contacts, notes, files) and "Add prompt"/bulk upload buttons.

## Chat & Modals
- Reproduce the 502 error and validate the fix in the logs and UI (toast/button state).
- Complete attachment upload flow in the chat, including sending to the backend and displaying in the history.
- Ensure consistency between `TileDetailModal` and `ContactDetailModal`.

## Authentication & Guest
- Post-login/sign-up redirects, guest fallback, and server-side route protection.

## Automated Tests
- Playwright: workspace generation, custom dashboards, attachment upload, login redirect.
- Jest/RTL: form behaviors, toasts, prompt resolvers, dynamic contrast.
