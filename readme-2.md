# DashMaster.PRO — Visão Consolidada, Produtos, Tecnologia e Guia de Conteúdo

## Visão Geral

O DashMaster.PRO é uma plataforma modular de gestão de conteúdo e experiências digitais com deploy automatizado. Posição: “um CMS dos CMSs” — você modela Workspaces, Sections e Content Types, e a plataforma entrega API pública, dashboard administrativo e uma fábrica de sites estáticos via GitHub Actions + Netlify.

- **Core**: CMS headless, multi‑tenancy, API pública com cache, controle de acesso, planos e addons.
- **Deploy**: um clique para criar repositório no GitHub do cliente, build com GitHub Actions e publicação na Netlify.
- **Templates**: `gatsby-landing/` (Gatsby 5) validado em produção; `next-landing/` para cenários com App Router.
- **Pipelines**: `deckEngine/` para orquestração de tarefas e fluxos (conceito Decks/Cartas/Partidas/Arenas).

## Produtos e Serviços

- **Plataforma DashMaster.PRO**: Dashboard (Next.js 15) + API pública + controle de acesso + billing (Stripe) + mídia (Cloudinary).
- **Fábrica de Sites**: Fluxo de deploy automatizado com templates prontos e suporte a repositórios customizados.
- **Templates Frontend**:
  - `gatsby-landing/`: SSG performático, SEO, imagens, Tailwind.
  - `next-landing/`: exemplo mínimo consumindo a API pública.
- **DeckEngine (pipelines)**: motor para automações e jobs internos.
- **Addons (campos/integrações)**: text/textarea/number/date/select/checkbox, `cloudinaryUpload`, `cloudinaryGallery`. Propostas: `markdown`, `richText`, `sendgridEmail`, `relation`.
- **Operação e Conteúdo (Instituto Organizacionista)**: playbooks comerciais, afiliados, pricing/planos, políticas, mídia/branding, site/pitch.
- **Serviços potenciais**: implantação de sites headless, migração de conteúdo (WordPress/MD/JSON), mentoria de conteúdo e SEO, capacitação de afiliados, integrações (Cloudinary, SendGrid, Stripe).

## Tecnologias

- **Frontend**: Next.js 15 (React 19, App Router), Tailwind 4; Gatsby 5 no template.
- **Backend**: Node.js 22, MongoDB Atlas, Clerk (auth), Stripe (pagamentos), Cloudinary (mídia).
- **Infra/Deploy**: GitHub Actions, Netlify. TemplateGenerator gera workflows/config de forma dinâmica.
- **Boas práticas implementadas**: autenticação centralizada (`getCurrentAuth()`), acesso a dados via `lib/db.js`, API como única fonte da verdade, preservação de `.git` em Actions, serialização consistente e correções de segurança/performance.
- **Planejados**: Upstash Redis (cache distribuído), Access Engine consolidado, marketplace de addons, templates adicionais (Nuxt/Astro/Next full), WebSockets/SSE.

## Arquitetura Funcional (Resumo)

- **Entidades**: `Workspace`, `Section`, `ContentType`, `Item`, `Pipeline`, `Plan`, `Role`, `Deployment`.
- **ViewTypes**: `FormStepView`, `TableView`, `GroupingView`, `CheckoutView`, `PDFView`.
- **Addons**: campos e integrações; mapeados a planos via `plans.yml` e `lib/plans.js`.
- **API Pública**: `/api/public/content` com API Key e rate limit por chave; entrega JSON limpo e com URLs Cloudinary processadas.

## Casos Validados e Estado

- ✅ CMS headless com API pública e cache básico.
- ✅ Deploy automatizado (GitHub Actions + Netlify) em produção.
- ✅ `gatsby-landing/` 100% headless, imagens Cloudinary OK.
- ✅ Clonador de Workspaces e transferência de propriedade.
- ✅ Correções críticas: ENOENT (TemplateGenerator), Git `--local`, Deploy Preview vs Production, URLs Cloudinary.
- 🔄 Em desenvolvimento: Command Palette, personalização via IA, templates adicionais, analytics avançado.

## Guia: Modelagem e Inserção de Conteúdos no CMS

Este guia ajuda a estruturar qualquer site/landing usando o DashMaster.PRO.

1. Planejamento rápido

- Defina objetivo da página (ex: captação, autoridade, vendas) e páginas necessárias (home, serviços, cidades, blog, contato).
- Liste seções por página (hero, provas sociais, galeria, serviços, CTA, FAQs, contato).

2. Workspace e Branding

- Crie o `Workspace` (nome/slug) e preencha dados globais (siteName, domínio, header/footer, redes, GTM/SEO).

3. Sections e Content Types

- Para cada página, crie uma `Section` com um `ContentType` que reflita a estrutura de dados (campos e grupos).
- Addons recomendados: `textInput`, `textarea`, `selectInput`, `numberInput`, `dateInput`, `checkboxInput`, `cloudinaryUpload`, `cloudinaryGallery`.

4. Itens (conteúdo)

- Crie `Items` por seção. Exemplo:
  - `hero`: title, subtitle, ctaText, backgroundImage (Cloudinary).
  - `services`: array de cards (image/title/description).
  - `testimonials`: autor/foto/depoimento.
  - `gallery`: `cloudinaryGallery` com captions.
  - `faq`: pares pergunta/resposta.

5. Boas práticas de mídia

- Suba imagens via assinatura segura (`/api/upload/signature`). Use pastas por workspace/section.
- Nomeie public_ids descritivamente; a API já converte para URL completa (`https://res.cloudinary.com/...`).

6. Consumo no Template

- Garanta variáveis `.env` do template:
  - Gatsby: `GATSBY_API_URL`, `GATSBY_API_KEY`, `GATSBY_CLOUDINARY_CLOUD_NAME`.
  - Next: `NEXT_PUBLIC_CONTENT_API_URL`, `NEXT_PUBLIC_CONTENT_API_KEY`.
- No frontend, renderize por `section.type` → componente correspondente. Mantenha o template “burro”: sem lógica de formatação.

7. SEO e Metas

- Preencha metadados por página (title/description/og). Use `Seo` centralizado no template; gere sitemap.

8. Checklist de publicação

- [ ] Conteúdo global (header/footer/menus) concluído
- [ ] Páginas e seções mapeadas para componentes
- [ ] Imagens em Cloudinary com alt text
- [ ] Teste de API pública (status/limites)
- [ ] Deploy de produção (não preview)
- [ ] Validação de links, GTM e metas sociais

## Fluxo de Deploy (resumo)

1. No Dashboard, iniciar deploy e inserir tokens:

- GitHub (escopo `repo`, classic)
- Netlify (Personal Access Token)

2. Opcional: apontar para `gatsby-landing/` ou repo customizado.
3. Acompanhar histórico de deploys; confirmar branch de produção.

## Documentação útil neste repo

- `README.md` (raiz): visão completa e status.
- `docs/`: addons, segurança/performance, debugging, estratégias de seção, guia de desenvolvimento.
- `gatsby-landing/README.md`: como rodar e estruturar dados.
- `next-landing/README.md`: variáveis e start.
- `deckEngine/README.md`: introdução ao motor de pipelines.
- `Instituto-Organizacionista/`: textos comerciais, pricing, afiliados, políticas e branding.

## Roadmap curto (prioridades)

- Theme Selector visual (página dedicada, cards de tema, UX de repo customizado).
- Novo homepage/posicionamento (texto clean, foco no “fábrica de sites + CMS headless”).
- Novo template com captação de dados (form + NetlifyDB + Clerk independente).
- Access Engine e cache Redis para permissões/real‑time.
- Marketplace de addons (manifest, 2 addons nativos: `markdown`, `sendgridEmail`).
- Validação de tokens antes do deploy e Nuke com deleção real (Netlify/GitHub).
- Logging estruturado e testes para deploy/Nuke.

## Como contribuir

- Padrões: autenticação centralizada, `lib/db.js`, API como fonte da verdade, TemplateGenerator para arquivos dinâmicos.
- Scripts úteis (raiz): `dash:dev`, `dash:build`, `landing:dev`, `setup:superadmin`.

—

Se você está tocando tudo sozinho há anos: vamos reduzir carga. Concentre-se em conteúdo e vendas; eu mantenho o checklist técnico, estrutura de CMS e automatizações de deploy.
