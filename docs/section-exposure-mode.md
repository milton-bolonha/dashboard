## 📘 Modo de Exposição de Seções (exposureMode)

Controla como a API pública do Headless CMS expõe itens de uma Section.

### Objetivo

- Permitir que uma Section do tipo collection exponha todos os itens ou apenas 1 item, conforme uma política clara e configurável.

### Escopo

- Aplica-se somente a Sections com `strategy = "collection"`.
- `singleton`: ignora (já é 1 item por definição).
- `grouping`: não suportado (e não planejado para este recurso).

### Nomenclatura e Campos (proposta)

- `exposureMode: "all" | "single"` (padrão: `all`).
- `exposureSelection: "random" | "latest"` (usado somente quando `exposureMode = "single"`).
  - Futuro (não implementar agora): `"featured"` (requer flag no item) e `"weighted"` (ver definição de weight abaixo).

#### Onde fica

- Campo novo no `SectionSchema`.

```json
{
  "strategy": "collection",
  "exposureMode": "all",
  "exposureSelection": "random"
}
```

### Semântica da API Pública

Considere a rota atual de conteúdo público (ex.: `/api/public/content?section=posts`).

- Quando `exposureMode = "all"`:

  - Comportamento atual: retorna a lista completa (respeitando filtros/ordenação já existentes).

- Quando `exposureMode = "single"`:
  - `exposureSelection = "random"`: retornar exatamente 1 item aleatório da coleção.
    - Implementação sugerida (MongoDB): agregação com `$sample: { size: 1 }`.
  - `exposureSelection = "latest"`: retornar exatamente 1 item mais recente.
    - Implementação sugerida: `sort: { createdAt: -1 }` + `limit: 1`.

Observações:

- Não introduzir cache neste momento.
- Para ambientes de produção, a aleatoriedade poderá causar variações entre requisições — comportamento aceitável por ora.

### Override por Query (opcional — futuro)

Útil para depuração ou frontends que precisem variar a exposição sem mudar a configuração da Section. Desativado por padrão; quando habilitado, os seguintes parâmetros podem ser aceitos:

- `exposure=all|single`
- `selection=random|latest` (válido somente para `exposure=single`)

Exemplos (futuro, se habilitado):

- `/api/public/content?section=posts&exposure=single&selection=random`
- `/api/public/content?section=posts&exposure=single&selection=latest`

Não é paginação. Pode coexistir com paginação quando `exposure=all` (ex.: `?page=1&limit=10`). Quando `exposure=single`, sempre retorna exatamente 1 item.

### “Weighted” — O que é e como seria usado (futuro)

Weighted random (sorteio ponderado) permite favorecer alguns itens com maior probabilidade.

- Conceito: cada item recebe um peso numérico (ex.: `exposureWeight`), quanto maior o peso, maior a chance de ser escolhido.
- Implementação (futuro):
  - Alternativa A (simples): buscar N itens e sortear client-side com algoritmo ponderado.
  - Alternativa B (DB): manter um campo de peso e usar uma estratégia aproximada (ex.: replicação por faixas, não priorizada agora).
- Status: somente documentado como possibilidade. Não implementar agora.

### UI — Configuração no SectionForm

- Exibir o bloco “Modo de Exposição (API)” somente quando `strategy = collection`:
  - Campo seletor: `exposureMode`: `Todos os itens (all)` | `Apenas 1 item (single)`
  - Se `single`: campo `exposureSelection`: `Aleatório (random)` | `Mais recente (latest)`

### Backward Compatibility

- Padrão `exposureMode = all` assegura compatibilidade com o comportamento atual.

### Exemplo

```json
{
  "name": "Posts",
  "slug": "posts",
  "strategy": "collection",
  "exposureMode": "single",
  "exposureSelection": "random"
}
```

API (resultado esperado):

- `/api/public/content?section=posts` → retorna exatamente 1 post aleatório.

```json
{
  "section": "posts",
  "items": [{ "id": "abc123", "title": "Post aleatório" }]
}
```

### Decisões

- Nome escolhido: `exposureMode` (modo de exposição pública de itens).
- Aplica-se somente a `strategy = collection`.
- Sem cache por ora.
- Overrides por query ficam como opção futura.
