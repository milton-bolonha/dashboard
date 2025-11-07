<div align="center">

# nextjs-openai-insights

MVP inspirado no `dashboard`, mas 100% cookie-based e pronto para Netlify. Gere tiles de insight com GPT‑5, organize notas/contatos e valide hipóteses sem depender de MongoDB ou Clerk.

</div>

---

## 🔭 Visão Geral

- **Home**: formulário minimalista reutilizando a mesma linguagem visual do dashboard.
- **Admin**: header + sidebar + grid de tiles, com painéis para notas e contatos.
- **Armazenamento**: cookies httpOnly (`insightsWorkspace`) com limite de 1h.
- **IA**: função serverless `ai-generate` chamando `openai.responses.create` (modelo padrão `gpt-5-mini`).
- **Notas & Contatos**: CRUD simples via rotas `/api/workspace/*`, tudo persistido no cookie.
- **Toasts & Suspense**: provider customizado + fallbacks nativos do App Router.

## 🧱 Estrutura

```
nextjs-openai-insights/
├─ netlify/functions/ai-generate.ts   # Função com prompts + rate limiting
├─ netlify.toml                       # Config de build/dev e bundler
├─ src/
│  ├─ app/                            # App Router (home, admin, APIs)
│  ├─ components/                     # UI compartilhada (header, tiles, etc.)
│  ├─ containers/                     # Lógica de páginas (Home/Admin)
│  └─ lib/                            # Cookies store, providers, env, tipos
└─ README.md                          # Este guia
```

## 🚀 Rodando localmente

> Pré-requisitos: Node 18+, Netlify CLI (`npm install -g netlify-cli`), `OPENAI_API_KEY`.

1. Instale dependências na raiz do monorepo
   ```bash
   npm install
   ```

2. Crie `.env.local` no app (defina `OPENAI_API_KEY`)
   ```bash
   cd nextjs-openai-insights
   cp .env.example .env.local # ou crie manualmente
   ```

3. Suba com o Netlify Dev (proxy de funções + Next):
   ```bash
   netlify dev
   ```

   - App → http://localhost:8888
   - Funções → /.netlify/functions/ai-generate

4. Abra a home, preencha o formulário e confira os tiles em `/admin`.

> Se optar por `npm run dev`, defina `NEXT_PUBLIC_FUNCTIONS_BASE_URL=http://localhost:8888` para apontar a função.

## 🔌 Variáveis de ambiente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `OPENAI_API_KEY` | — | Obrigatória para a função serverless. |
| `OPENAI_MODEL` | `gpt-5-mini` | Modelo usado na geração dos tiles. |
| `OPENAI_MAX_OUTPUT_TOKENS` | `600` | Limite de tokens por tile. |
| `OPENAI_TEMPERATURE` | `0.7` | Temperatura padrão das respostas. |
| `FUNCTION_RATE_LIMIT` | `30` | Limite de requests por IP em 60s. |
| `NEXT_PUBLIC_FUNCTIONS_BASE_URL` | (vazio) | Override para dev sem `netlify dev`. |

## 🧠 Fluxo principal

1. **HomeContainer** envia payload para `/api/generate`.
2. **Route `/api/generate`** valida, chama `/.netlify/functions/ai-generate` e salva cookie.
3. **AdminContainer** usa SWR em `/api/workspace` para carregar snapshot.
4. **Notas/Contatos/Tiles** usam rotas REST (`/api/workspace/*`) com helper `updateWorkspace()`.

## 🛡️ Rate limiting & cache

- Rate limiting aplicado diretamente na função Netlify (`rateLimit.windowLimit`).
- Rotas Next retornam `Cache-Control: no-store` para manter estado consistente.

## 📌 Roadmap sugerido

- Migrar armazenamento para Netlify Blobs quando exceder 4 KB por cookie.
- Adicionar reorder/export de tiles e histórico de execuções.
- Integrar autenticação (Clerk) quando sair do MVP público.
- Extrair componentes globais para `packages/` compartilhado no monorepo.

## 📄 Licença

Uso interno. Revise antes de abrir o repositório ou compartilhar externamente.
