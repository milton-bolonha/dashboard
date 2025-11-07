## Fluxo GPT-5 Minimal

### Visão Geral

- Migramos o deck engine para usar `gpt-5-mini` como modelo padrão.
- O objetivo é reduzir TTFT e manter respostas concisas com modo _minimal_.
- O modelo e seus ajustes ficam centralizados em `config/deck-engine.js`.

### Configuração

- `getDeckModelConfig()` retorna `{ model, reasoningEffort, verbosity }`.
- Valores atuais: `model: gpt-5-mini`, `reasoningEffort: low`, `verbosity: concise` (ignorados pelo provider quando a chamada usa Chat Completions, já que o endpoint ainda não aceita `reasoning`/`verbosity`).
- Para alterar, basta editar as constantes no próprio arquivo (sem dotenv necessário).

### Execução

- `app/api/prompt-jobs/route.js` e `app/api/prompt/run/route.js` usam o modelo padrão ao criar jobs.
- `IAFormsContainer` envia o mesmo modelo ao disparar jobs pela Home.
- `deck-engine-runner-openai` faz warmup opcional, chama o provider com os parâmetros de reasoning/verbosity e registra métricas (`ttftMs`, `completionMs`, `persistMs`).
- `generateCompletion` anexa `reasoning` e `verbosity` nos parâmetros da API do OpenAI.

### Fallback e Retentativas

- Quando o modelo não retorna conteúdo, o runner tenta novamente (até 3 vezes) já com limites de tokens por tile.
- Se mesmo assim falhar, persistimos um texto de fallback para manter 8 tiles no workspace.

### Como Ajustar

- Para usar outro modelo, edite `DECK_ENGINE_MODEL` em `config/deck-engine.js`.
- Ajuste também `DECK_ENGINE_REASONING_EFFORT` e `DECK_ENGINE_VERBOSITY` conforme a doc do modelo.
- É possível desativar o warmup definindo `DECK_ENGINE_ENABLE_WARMUP=false` ou alterando `DECK_ENGINE_WARMUP_*`.
