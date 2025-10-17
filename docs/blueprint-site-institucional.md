# 🧩 Blueprint — Site Institucional (Headless)

Última atualização: 14/08/2025

Objetivo: fornecer um modelo base de páginas/seções/campos para publicar um site institucional usando o DashMaster.PRO com mínimo atrito.

## Páginas sugeridas

- Home (landing)
- Serviços
- Sobre
- Blog
- Contato
- (Opcional) Cidades/Unidades (coleção)

## Seções e campos (por página)

### Home

- `hero` (singleton)
  - title (text), subtitle (textarea), ctaText (text), backgroundImage (cloudinaryUpload)
- `services` (collection)
  - title (text), description (textarea), image (cloudinaryUpload), category (select), featured (checkbox)
- `testimonials` (collection)
  - author (text), avatar (cloudinaryUpload), quote (textarea)
- `gallery` (singleton)
  - images (cloudinaryGallery), caption (text opcional)
- `faq` (collection)
  - question (text), answer (textarea)
- `cta` (singleton)
  - title (text), subtitle (textarea), buttonText (text), buttonUrl (text)

### Serviços

- `service-list` (collection) — mesmo schema de `services` da home
- `cta` (singleton)

### Sobre

- `hero` (singleton)
- `team` (collection): name, role, avatar, bio
- `timeline` (collection): year, title, description
- `values` (collection): title, description, icon (opcional)

### Blog

- `posts` (collection): title, excerpt, coverImage, slug, publishedAt, category

### Contato

- `contact-info` (singleton): address, phone, email, openingHours, mapEmbedUrl
- `form` (singleton, opcional): copy/labels (se template captar dados)

## Addons recomendados

- Textos: `textInput`, `textarea`
- Estruturais: `selectInput`, `checkboxInput`, `numberInput`, `dateInput`
- Mídia: `cloudinaryUpload`, `cloudinaryGallery`

## Convenções

- Slugs em `kebab-case`.
- `collection` para listas; `singleton` para hero/configurações; `grouping` para páginas heterogêneas.
- Pastas Cloudinary por workspace/section: `workspace/section/(addon)`.

## JSON de exemplo (home minimal)

```json
{
  "globalData": {
    "siteName": "Minha Empresa Inc.",
    "header": {
      "logoUrl": "brand/logo",
      "menuItems": [{ "label": "Home", "link": "/" }]
    },
    "footer": { "year": 2025 }
  },
  "pageData": {
    "title": "Página Inicial",
    "slug": "home",
    "sections": [
      {
        "sectionId": "hero-1",
        "type": "hero",
        "items": [
          {
            "_id": "item-hero-1",
            "title": "Construímos o Futuro",
            "subtitle": "Soluções inovadoras.",
            "ctaButtonText": "Fale Conosco",
            "backgroundImage": "landing/hero"
          }
        ]
      },
      {
        "sectionId": "services",
        "type": "services",
        "items": [
          {
            "_id": "svc-1",
            "imageUrl": "services/dev-web",
            "title": "Desenvolvimento Web"
          },
          { "_id": "svc-2", "imageUrl": "services/seo", "title": "SEO" }
        ]
      }
    ]
  }
}
```

## SEO e Analytics

- Preencher title/description por página; gerar `og:image` (Cloudinary) e sitemap.
- Habilitar GTM/Analytics (plugin no template Gatsby ou script no Next).

## Workflow recomendado

1. Criar workspace e dados globais (header/footer/brand).
2. Criar sections conforme acima; definir ContentTypes com addons.
3. Inserir items e imagens (assinatura segura de upload).
4. Testar no template local (Gatsby/Next) e ajustar.
5. Fazer deploy de produção e validar (checklist de deploy).

## Referências

- `docs/guia-modelagem-cms.md`
- `docs/addons.md`
- `gatsby-landing/README.md`
- `docs/nova-landing.md`
