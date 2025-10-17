# ✅ Checklist de Deploy — DashMaster.PRO

Última atualização: 14/08/2025

Objetivo: garantir deploy de produção consistente (não preview), com tokens válidos, template correto e verificação pós‑deploy.

## 1) Pré‑deploy

- **Tokens prontos**:
  - [ ] GitHub PAT (escopo `repo`, classic)
  - [ ] Netlify Personal Access Token
- **Ambiente do template**:
  - [ ] Gatsby: `.env.local` com `GATSBY_API_URL`, `GATSBY_API_KEY`, `GATSBY_CLOUDINARY_CLOUD_NAME`
  - [ ] Next: `.env.local` com `NEXT_PUBLIC_CONTENT_API_URL`, `NEXT_PUBLIC_CONTENT_API_KEY`
- **Seleção de Template**:
  - [ ] Escolher tema em “Theme Selector” (ou repo customizado)
  - [ ] Confirmar branch de produção (usar `master` onde aplicável)
- **Validação de tokens (recomendado)**:
  - [ ] Teste rápido de validade (ping em APIs GitHub/Netlify)

## 2) Iniciar Deploy (Dashboard)

1. Acessar Deploy > “Iniciar Deploy”.
2. Informar tokens (GitHub/Netlify).
3. (Opcional) Marcar “Usar repositório customizado” e informar URL.
4. Confirmar e acompanhar histórico.

## 3) Pós‑deploy imediato

- [ ] Site publicado como PRODUÇÃO (não Deploy Preview)
- [ ] Páginas abrem sem erros 404/500
- [ ] Imagens Cloudinary carregam (URLs completas `https://res.cloudinary.com/...`)
- [ ] Metas SEO/OG corretas (title/description/og:image)
- [ ] Sitemap/robots OK (se aplicável)
- [ ] GTM/Analytics enviando eventos

## 4) Problemas comuns e correções

- Deploy foi Deploy Preview, não produção:
  - Causa: branch inconsistente (`main` vs `master`).
  - Ação: alinhar branch em `template-generator`/workflow para `master` quando necessário.
- Imagens quebradas:
  - Causa: public_id não resolvido no template.
  - Ação: a API pública converte o `public_id` em URL completa (ver `docs/DEBUGGING-GUIDE.md` problema 14). Não tratar no frontend.
- Erro Git `--local` em Actions:
  - Causa: remoção do `.git` do repo do usuário.
  - Ação: preservar `.git` e clonar template em `/tmp` (ver `docs/development-guide.md` Regra de Ouro #7).
- ENOENT template ausente (em produção):
  - Ação: sempre usar TemplateGenerator (não ler arquivo físico). Ver `docs/development-guide.md` Regra de Ouro #6.

## 5) Segurança e performance (essenciais)

- Autenticação centralizada no backend (`getCurrentAuth()`), nunca duplicar lógica.
- DB via `lib/db.js` (pool/reuso). Índices para filtros por `workspaceId`, `userId`, `status`.
- Cache básico ok; considerar Redis (Upstash) para produção.

## 6) Verificação final

- [ ] Histórico de deploy com status “sucesso”
- [ ] DNS/domínio apontado e HTTPS válido
- [ ] Páginas principais navegáveis (Home, Serviços, Sobre, Contato)
- [ ] Checklist de SEO concluído

Referências: `README.md` (raiz), `docs/development-guide.md`, `docs/DEBUGGING-GUIDE.md`, `docs/seguranca-performance.md`.
