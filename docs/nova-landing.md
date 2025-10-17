## Plano: Nova Landing em Next.js separada do Dashboard

### Objetivo

- **Extrair** a home atual do `dashboard` (Next.js) para um novo app isolado: `next-landing/`.
- **Conectar** essa landing à API pública do `dashmaster.pro` para conteúdo dinâmico.
- **Desacoplar** front (landing) do back (dashboard), mantendo deploy independente.

---

### Contexto atual

- Home existente em `dashboard/app/page.js` com estilos em `dashboard/app/home.css`.
- API pública headless pronta no dashboard:
  - Endpoint: `GET https://dashmaster.pro/api/public/content`
  - Auth: `Authorization: Bearer <API_KEY>` (ou público se section permitir)
  - Alternativas granulares: `GET /api/public/sections/[slug]`, `.../items`, `.../items/[itemId]`
- O projeto `gatsby-landing/` já consome essa API (útil como referência de estrutura/normalização de dados).

---

### Arquitetura proposta do `next-landing`

- Framework: **Next.js (App Router)**, React 19.
- Renderização: **Server Components** para fetch da API com `revalidate` (ISR) e fallback client-only onde necessário.
- Estilos: aproveitar `home.css` atual ou migrar para Tailwind (há `tailwind.config.js` na raiz; opcional criar config próprio do app).
- Ícones: `lucide-react` (usado na home atual). Evitar dependências de auth (`@clerk/nextjs`) na landing.
- Dados: camada `lib/public-api.ts` com funções de fetch e mapeamento para componentes da landing.

---

### Estrutura alvo

```
next-landing/
├── app/
│   ├── page.tsx              # Home (SSR + Server Components)
│   └── globals.css           # estilos globais (ou Tailwind)
├── components/
│   ├── Header.tsx
│   ├── Hero.tsx
│   ├── Sections/
│   │   ├── Monetization.tsx
│   │   ├── AccessControl.tsx
│   │   ├── Enterprise.tsx
│   │   ├── UseCases.tsx
│   │   ├── Pricing.tsx
│   │   └── Faq.tsx
│   └── Footer.tsx
├── lib/
│   ├── public-api.ts         # fetch + tipagem dos dados públicos
│   └── mapping.ts            # (opcional) adaptadores de API -> props de componentes
├── public/                   # assets estáticos (imagens, logos)
├── next.config.js
├── package.json
├── tsconfig.json (opcional)
└── .env.local                # NEXT_PUBLIC_CONTENT_API_URL / KEY
```

---

### Etapas detalhadas

1. Criar o app base `next-landing`

- Inicializar projeto Next.js (App Router) dentro da pasta `next-landing/`.
- Adicionar dependências (mesmas versões do `dashboard/package.json`):
  - `next@15.3.4`, `react@19.0.0`, `react-dom@19.0.0`
  - `lucide-react@^0.536.0`, `next-themes@^0.4.6`
  - `@clerk/nextjs@^6.23.0` (compatibilidade com os componentes da home; uso opcional)
  - Fonts: `@fontsource-variable/geologica@^5.2.6`, `@fontsource-variable/podkova@^5.2.8`, `@fontsource/poppins@^5.2.6`
  - Estilos: `tailwindcss@^4`, `@tailwindcss/postcss@^4`, `autoprefixer`

2. Migrar a Home

- Copiar o conteúdo funcional da home de `dashboard/app/page.js` (componentes internos: Header, HeroSection, etc.).
- Remover integrações de auth (`@clerk/nextjs`) e temas que dependam de estado do usuário.
- Substituir ações de CTA para rotas públicas (ex.: `/signup` no dashboard ou links externos).
- Copiar/migrar estilos de `dashboard/app/home.css` para `app/globals.css` ou manter como arquivo próprio e importar em `page.tsx`.

3. Consumo da API (Server Side)

- Criar `lib/public-api.ts` com uma função:
  - `fetchPublicContent({ signal? }): Promise<ContentResponse>` que faz `fetch(process.env.NEXT_PUBLIC_CONTENT_API_URL, { headers: { Authorization: 'Bearer ' + process.env.NEXT_PUBLIC_CONTENT_API_KEY }, next: { revalidate: 60 } })`.
- Em `app/page.tsx` (Server Component), chamar `fetchPublicContent()` e mapear os dados para os componentes. Prever fallback caso a API falhe (render estático mínimo + logs).

4. Variáveis de ambiente

- `next-landing/.env.local`:
  - `NEXT_PUBLIC_CONTENT_API_URL=https://dashmaster.pro/api/public/content`
  - `NEXT_PUBLIC_CONTENT_API_KEY=API_...` (chave pública do workspace)
- Conferir limites de rate limit e políticas de cache da API pública.

5. Mapeamento dos dados -> UI

- Padrão usado no `gatsby-landing`: página "landing-page" com itens `hero`, `boxes`, `section-1`, `section-2`, `section-3`, `testimonials`, `services`.
- Estratégia para Next:
  - Consumir `content.sections[]` e localizar a section relevante (ex.: slug `landing-page`).
  - Converter cada item em props específicas dos componentes. Centralizar a transformação em `lib/mapping.ts`.
  - Permitir layout funcional mesmo com dados parciais (feature flags e fallbacks locais).

6. Estilos e assets

- Verificar imports de imagens/ícones e mover assets estáticos para `next-landing/public/`.
- Confirmar compatibilidade de classes utilitárias com Tailwind (se adotado) ou manter CSS puro.

7. Build & Dev

- Scripts no `package.json` do `next-landing`:
  - `dev`, `build`, `start`, e opcional `lint`.
- Rodar localmente em porta diferente do dashboard (ex.: `http://localhost:4000`).

8. Deploy

- Opção A (Vercel): zero-config para Next.js + variáveis de ambiente.
- Opção B (Netlify): adaptador Next ou edge functions; configurar vars de ambiente no painel.
- Domínio: subdomínio do projeto (ex.: `landing.dashmaster.pro`) com DNS apontado para o provedor escolhido.

---

### Snippets de referência

1. `lib/public-api.ts`

```ts
export type ContentResponse = {
  sections: Array<{
    slug: string;
    name: string;
    items: Array<{ slug: string; data: Record<string, unknown> }>;
  }>;
};

export async function fetchPublicContent(): Promise<ContentResponse> {
  const url = process.env.NEXT_PUBLIC_CONTENT_API_URL;
  const key = process.env.NEXT_PUBLIC_CONTENT_API_KEY;

  if (!url) throw new Error("NEXT_PUBLIC_CONTENT_API_URL ausente");

  const res = await fetch(url, {
    headers: key ? { Authorization: `Bearer ${key}` } : undefined,
    next: { revalidate: 60 },
  });

  if (!res.ok) throw new Error(`Falha ao buscar conteúdo: ${res.status}`);
  return res.json();
}
```

2. Uso em `app/page.tsx` (Server Component)

```tsx
import { fetchPublicContent } from "@/lib/public-api";

export default async function Page() {
  let content = null;
  try {
    content = await fetchPublicContent();
  } catch (e) {
    console.error("Conteúdo público indisponível", e);
  }

  // TODO: mapear "content" em props dos componentes
  return (
    <div className="dark" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* Header, Hero, Sections, Footer */}
    </div>
  );
}
```

---

### Checklist de implementação

- [ ] Criar pasta `next-landing/` com Next (App Router)
- [ ] Adicionar dependências (next, react, lucide-react, tailwind opcional)
- [ ] Copiar layout/componentes da home atual e remover Clerk
- [ ] Migrar estilos (`home.css` -> `globals.css` ou manter arquivo dedicado)
- [ ] Criar `lib/public-api.ts` e `lib/mapping.ts`
- [ ] Configurar `.env.local` com URL/KEY da API
- [ ] Implementar mapeamento de dados -> UI (hero, sections, etc.)
- [ ] Testes locais (falhas de rede, dados parciais, revalidate)
- [ ] Preparar deploy (Vercel/Netlify) + variáveis de ambiente
- [ ] Configurar domínio e verificação pós-deploy

---

### Riscos e observações

- API pública pode exigir chave (Bearer). Verificar policies do workspace e rate limit.
- Evitar fetch no client para não expor a chave; preferir Server Components.
- CORS: sem impacto em SSR; em client, garantir headers/permits corretos.
- Diferenças de dados entre `gatsby-landing` e Next podem exigir adaptadores.
- Dependências visuais (ícones/estilos) devem ser alinhadas para evitar regressões.

---

### Cronograma sugerido

- Dia 1: Setup `next-landing`, dependências e migração da UI estática
- Dia 2: Integração da API pública + mapeamento e fallbacks
- Dia 3: Refinos visuais, QA e deploy

---

### Próximas ações imediatas

1. Criar `next-landing/` e instalar dependências.
2. Copiar componentes da home e remover Clerk.
3. Implementar `fetchPublicContent()` e wire-up inicial no `page.tsx`.
4. Conectar variáveis de ambiente e validar build local.

---

### Relatório de execução (parcial)

- Estrutura criada em `next-landing/`:

  - `package.json` com versões alinhadas ao `dashboard` (`next@15.3.4`, `react@19.0.0`, `react-dom@19.0.0`, `lucide-react@^0.536.0`, `next-themes@^0.4.6`, fontes `@fontsource-*`).
  - `next.config.js` com permissões de `images` e `experimental.reactCompiler` habilitado.
  - `app/page.tsx` criada (SSR/ISR) consumindo `lib/public-api` e render estático inicial da hero/footer.
  - `app/globals.css` com estilos base e cta-button; preparado para incorporar mais regras do `home.css` conforme migração.
  - `lib/public-api.ts` com `fetchPublicContent()` e tipagem básica.
  - `public/.gitkeep` para manter diretório de assets; assets poderão ser copiados de `dashboard/public/images` conforme necessidade.
  - `tsconfig.json` com path alias `@/*`.
  - `README.md` com instruções rápidas de uso.

- Variáveis de ambiente: `.env.local` não foi commitado (bloqueio do ignore). Criar manualmente em `next-landing/.env.local` com:

  - `NEXT_PUBLIC_CONTENT_API_URL=https://dashmaster.pro/api/public/content`
  - `NEXT_PUBLIC_CONTENT_API_KEY=API_...` (se necessário)

- Próximos passos técnicos:
  - Migrar gradualmente os componentes da home de `dashboard/app/page.js` para `next-landing/components/*`, removendo dependências de Clerk e mantendo visual idêntico.
  - Copiar imagens necessárias de `dashboard/public/images` para `next-landing/public/images`.
  - Revisar classes utilitárias e completar estilos do `home.css` original dentro do `globals.css` ou em módulo dedicado.
