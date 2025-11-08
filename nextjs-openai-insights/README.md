<div align="center">

# nextjs-openai-insights

MVP inspirado no `dashboard`, mas 100% cookie-based e otimizado para Vercel. Gere tiles de insight com GPT‑5, organize notas/contatos e valide hipóteses sem depender de MongoDB ou Clerk.

</div>

---

## 🔭 Visão Geral

- **Home**: formulário minimalista reutilizando a mesma linguagem visual do dashboard.
- **Admin**: três temas disponíveis (Ade Style padrão, Classic e Dash Style) com header + sidebar + grid de tiles, além de painéis para notas e contatos.
- **Armazenamento**: cookies httpOnly (`insightsWorkspace`) com limite de 1h.
- **IA**: função serverless `ai-generate` chamando `openai.responses.create` (modelo padrão `gpt-5-mini`).
- **Notas & Contatos**: CRUD simples via rotas `/api/workspace/*`, tudo persistido no cookie.
- **Toasts & Suspense**: provider customizado + fallbacks nativos do App Router.

## 🧱 Estrutura

```
nextjs-openai-insights/
├─ src/
│  ├─ app/                            # App Router (home, admin, APIs)
│  ├─ components/                     # UI compartilhada (header, tiles, etc.)
│  ├─ containers/                     # Lógica de páginas (Home/Admin)
│  └─ lib/                            # Cookies store, providers, env, tipos
└─ README.md                          # Este guia
```

## 🚀 Rodando localmente

> Pré-requisitos: Node 18+, `OPENAI_API_KEY`.

1. Instale dependências na raiz do monorepo
   ```bash
   npm install
   ```

2. Crie `.env.local` no app (defina `OPENAI_API_KEY`)
   ```bash
   cd nextjs-openai-insights
   cp env.template.txt .env.local # ou crie manualmente
   ```

3. Rode o Next.js em modo desenvolvimento:
   ```bash
   npm run dev
   ```

4. Abra `http://localhost:3000`, preencha o formulário e confira os tiles em `/admin`.

## 🔌 Variáveis de ambiente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `OPENAI_API_KEY` | — | Obrigatória para a função serverless. |
| `OPENAI_MODEL` | `gpt-5-mini` | Modelo usado na geração dos tiles. |
| `OPENAI_MAX_OUTPUT_TOKENS` | `600` | Limite de tokens por tile. |
| `OPENAI_TEMPERATURE` | `0.7` | Temperatura padrão das respostas. |
| `NEXT_PUBLIC_APP_URL` | — | Opcional: define host público (para links/perfis). |

## 🧠 Fluxo principal

1. **HomeContainer** chama o endpoint interno `/api/generate`.
2. **Route `/api/generate`** valida a requisição, dispara as chamadas OpenAI em série (com fallback) e grava o snapshot em cookies.
3. **AdminContainer** usa SWR em `/api/workspace` para carregar snapshot.
4. **Notas/Contatos/Tiles** usam rotas REST (`/api/workspace/*`) com helper `updateWorkspace()`.

## 🛡️ Cache & consistência

- Rotas Next retornam `Cache-Control: no-store` para manter estado consistente.

## 📌 Roadmap sugerido

- Migrar armazenamento para um backend durável quando exceder 4 KB por cookie.
- Adicionar reorder/export de tiles e histórico de execuções.
- Integrar autenticação (Clerk) quando sair do MVP público.
- Extrair componentes globais para `packages/` compartilhado no monorepo.

## 📄 Licença

Uso interno. Revise antes de abrir o repositório ou compartilhar externamente.
