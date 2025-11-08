# Tarefas — 14/08/2025

## Dentro do repositório (engenharia)

1. Theme Selector visual (alta)

- Página dedicada no dashboard, cards com preview dos temas (Gatsby, Next) e opção de repo customizado.
- Schema opcional de `Theme` no DB.
- Impacto: melhora UX do deploy, reduz atrito.

2. Novo homepage/posicionamento (alta)

- Atualizar textos e seções no site institucional (usar `Instituto-Organizacionista/site/texto-website.md`).
- Foco: fábrica de sites + CMS headless + segurança/performance.

3. Template “captação” (form + NetlifyDB) (alta)

- Criar template independente com formulário autenticado (Clerk), salvando em NetlifyDB.
- Requisitos: envs, páginas de login/conta, privacy.

4. Access Engine + cache (média)

- Consolidar engine de permissões (roles/plans/features/addons) e cachear permissões compiladas (Upstash Redis).

5. Marketplace de addons (média)

- Adotar manifesto (`addon.manifest.json`) e migrar 2 addons nativos: `cloudinaryUpload`, `cloudinaryGallery`.
- Implementar `markdown` (field) e `sendgridEmail` (integration + rota `/api/integrations/sendgrid/send`).

6. Validação de tokens no deploy (média)

- Validar GitHub/Netlify antes de iniciar; mensagens claras e links de criação.

7. Nuke com deleção real (média)

- Implementar `NetlifyManager.deleteSite()` e `GitManager.deleteRepository()` com tratamento de erros idempotente.

8. Logging estruturado e testes (média/baixa)

- Níveis de log, formatação estruturada, testes unitários para deploy/Nuke, integração para `/api/deploy/nuke`.

## Fora do repositório (conteúdo, vendas, operação)

1. Guia de modelagem e inserção de conteúdo (alta)

- Usar o capítulo “Guia” do `readme-2.md` como base e transformar em checklist visual no dashboard.

2. Catálogo e pricing

- Consolidar `Instituto-Organizacionista/pricing/tabela-skus-addons-comissoes.md` em página pública.
- Definir SKUs por template e addons pagos.

3. Programa de afiliados

- Publicar landing e materiais (`afiliados/`).
- Workflow: inscrição → aprovação → links → comissionamento.

4. Páginas públicas e kit de mídia

- Montar páginas públicas com textos da pasta `midia/` e `site/`.

5. Onboarding de clientes

- Criar playbook de importação (JSON/Markdown) e migração (WordPress) com vídeo curto.

6. Pitch e kit investidor (rápido)

- ✅ Lapidar `pitch-deck.md` e `pitch-final.md` (feito hoje).
- Criar `KIT-INVESTIDOR/README.md` com links (PDF, contatos, métricas, CTA de reunião).
- Preparar versão PDF (deck curto + appendix) quando números forem preenchidos.

## Guia rápido: modelar e inserir conteúdo no CMS (operacional)

1. Criar Workspace (nome/slug) e preencher dados globais (header/footer/SEO/GTM).
2. Mapear páginas → listar seções → criar `Section` + `ContentType` por seção.
3. Adicionar addons: campos essenciais + mídia (Cloudinary) por assinatura segura.
4. Criar `Items` com dados finais; conferir slugs/títulos.
5. Validar na API pública; ajustar componentes no template por `section.type`.
6. Publicar (deploy produção) e revisar SEO/links/imagens.

## Dependências/Configs

- Dashboard: Clerk (keys), MongoDB, Stripe, Cloudinary.
- Templates: API URL + API Key; Cloudinary cloud name (Gatsby).
- Deploy: GitHub PAT (escopo `repo`), Netlify token.

## Observações

- Não mover lógica para o frontend de templates; deixar a API preparar dados (URLs, serialização).
- Manter branch de produção consistente (evitar Deploy Preview); confirmar nas Actions.
