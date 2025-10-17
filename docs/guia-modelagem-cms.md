# 📚 Guia de Modelagem de Conteúdo (CMS) — DashMaster.PRO

Última atualização: 14/08/2025

## Objetivo

Padronizar como modelar páginas e seções no DashMaster.PRO para acelerar entrada de conteúdo e reduzir retrabalho. Segue um passo‑a‑passo operacional (editorial + técnico) com exemplos práticos.

## 1) Fundamentos

- **Estratégias de Seção**: `collection`, `singleton`, `grouping`. Veja `docs/section-strategies.md`.
- **Addons (Campos)**: `textInput`, `textarea`, `numberInput`, `dateInput`, `selectInput`, `checkboxInput`, `cloudinaryUpload`, `cloudinaryGallery`. Veja `docs/addons.md`.
- **API como verdade**: a API pública entrega JSON pronto para render (URLs Cloudinary resolvidas). Não mover lógica para o template. Veja `docs/development-guide.md` (Regra de Ouro #5) e `docs/DEBUGGING-GUIDE.md` (problema 14).

## 2) Naming e Slugs

- Workspace: nome claro + slug único. Ex.: `minha-empresa`.
- Sections: usar slugs estáveis (ex.: `landing-page`, `services`, `testimonials`).
- Items (collection): usar `slug` canônico curto (ex.: `desenvolvimento-web`).
- Evite espaços/acentos; use `kebab-case`. Conflitos de slug são únicos por workspace (há índices).

## 3) Estrutura recomendada por página

- Home (landing): `hero`, `services`, `testimonials`, `gallery`, `faq`, `cta`.
- Sobre: `hero`, `team`, `timeline`, `values`.
- Serviços: `hero`, `service-list` (collection), `cta`.
- Blog: `posts` (collection), `categories` (opcional), `cta`.
- Contato: `hero`, `contact-info`, `map`, `form` (se for do template de captação).

## 4) Criando Sections (passo a passo)

1. Crie a `Section` com a estratégia correta:
   - `singleton` para hero, header, footer, configurações.
   - `collection` para listas (serviços, posts, cidades).
   - `grouping` para páginas com itens heterogêneos (ex.: página com cards de tipos distintos).
2. Crie o `ContentType` da section mapeando os campos necessários com Addons.
3. Preencha `Items` (um para singleton; vários para collection).

## 5) Addons — Padrões por tipo de conteúdo

- Textos curtos: `textInput` (title, subtitle, labels, CTA).
- Textos longos: `textarea` (descrições, depoimentos, FAQ answer).
- Escolhas: `selectInput` (categoria, status, variante visual).
- Booleans: `checkboxInput` (featured, published).
- Números/datas: `numberInput`, `dateInput`.
- Mídia: `cloudinaryUpload` (imagem única), `cloudinaryGallery` (múltiplas imagens).
- Uploads Cloudinary: sempre via `POST /api/upload/signature` (ver docs/addons.md). Nunca expor secrets no cliente.

## 6) Exemplo de ContentType (serviço)

```json
{
  "name": "Serviço",
  "slug": "services",
  "addons": [
    { "id": "title", "name": "Título", "type": "textInput", "required": true },
    {
      "id": "description",
      "name": "Descrição",
      "type": "textarea",
      "required": true
    },
    {
      "id": "image",
      "name": "Imagem",
      "type": "cloudinaryUpload",
      "required": true,
      "config": { "folder": "services" }
    },
    {
      "id": "category",
      "name": "Categoria",
      "type": "selectInput",
      "config": {
        "options": [
          { "value": "site", "label": "Sites" },
          { "value": "seo", "label": "SEO" }
        ]
      }
    },
    { "id": "featured", "name": "Destaque", "type": "checkboxInput" }
  ]
}
```

## 7) Boas práticas de mídia (Cloudinary)

- Estruture `folder` como `workspace/section/(addon)` para manter organização automática.
- Use nomes descritivos no `public_id` (ex.: `services/otimizacao-seo/hero`).
- A API pública já converte `public_id` em URL completa (`https://res.cloudinary.com/...`).

## 8) Mapeamento para Templates

- Gatsby: ver `gatsby-landing/README.md` e `src/components/` para exemplos.
- Next: ver `next-landing/README.md` e `docs/nova-landing.md`.
- Regra: o template renderiza por `section.type`/`section.slug` e lê `items[]` sem formatar dados.

## 9) Fluxo editorial sugerido

1. Planeje páginas → liste seções → defina estratégia de cada seção.
2. Modele `ContentType` e crie `Items` com imagens.
3. Revise no preview do template local (Gatsby/Next).
4. Ajuste textos/ordem; valide SEO/OG.
5. Publique (deploy produção) e valide.

## 10) Checklist rápido

- [ ] Slugs estáveis e padronizados
- [ ] Seções com estratégia correta (singleton/collection/grouping)
- [ ] Campos essenciais definidos (textos, mídia, categorias)
- [ ] Imagens enviadas via assinatura segura
- [ ] Conteúdo global (header/footer/SEO) preenchido
- [ ] Template renderizando todas as seções

## Referências

- `docs/section-strategies.md`
- `docs/addons.md`
- `docs/development-guide.md`
- `docs/seguranca-performance.md`
- `docs/nova-landing.md`
