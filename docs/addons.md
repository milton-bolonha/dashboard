## 🧩 Guia de Addons — DashMaster.PRO

Este documento consolida tudo sobre o sistema de Addons: conceitos, tipos existentes, onde vivem no código, como são renderizados, rotas relacionadas e um passo a passo para criar novos addons.

### Visão Geral

- **O que são Addons**: extensões modulares usadas principalmente para definir campos extras em `ContentType` (formulários, listas, galerias), além de viabilizar integrações específicas.
- **Onde ficam**: o array `addons` pertence ao `ContentType` (persistido no MongoDB) e cada item descreve um campo/feature com `id`, `name`, `type`, `required`, `config`, `placeholder`, `helpText` e `validation`.
- **Cobrança e acesso**: addons podem ser mapeados para planos/benefícios no arquivo `dashboard/config/plans.yml` e consultados por `dashboard/lib/plans.js` (`getAddon`). Há também o conceito de `FeatureSchema` (tipo "addon") usado pelo mecanismo de acesso.

### Estrutura de Dados (resumo do Schema)

Cada `ContentType` contém:

```json
{
  "name": "string",
  "slug": "string",
  "addons": [
    {
      "id": "string",
      "name": "string",
      "type": "textInput|textarea|imageUpload|cloudinaryUpload|cloudinaryGallery|dateInput|selectInput|numberInput|checkboxInput",
      "required": false,
      "config": {},
      "placeholder": "string",
      "helpText": "string",
      "validation": {
        "minLength": 0,
        "maxLength": 999,
        "pattern": "regex",
        "required": false
      }
    }
  ]
}
```

Observação: o `FeatureSchema` também reconhece `type: "addon"` para fins de controle de acesso/monetização, mas o foco deste guia é o uso em `ContentType`.

### Tipos de Addon existentes (implementados)

- **textInput**: campo de texto curto.
- **textarea**: texto longo (multilinha).
- **numberInput**: número com `min`, `max`, `step` em `config`.
- **dateInput**: data.
- **selectInput**: lista de opções; `config.options = [{ value, label }]`.
- **imageUpload**: upload de imagem simples (local handling básico na UI do dashboard).
- **cloudinaryUpload**: upload único via Cloudinary com assinatura segura.
- **cloudinaryGallery**: galeria (múltiplas imagens) via Cloudinary com assinatura segura.
- **checkboxInput**: caixa de seleção booleana.

Notas importantes:

- O render da UI é centralizado em `dashboard/components/sections/FieldRenderer.jsx` e mapeia `addon.type` → componente correspondente (incluindo `CloudinaryUploadField` e `CloudinaryGalleryField`).
- `ContentTypeForm` permite configurar cada addon (placeholder, helpText, e configurações específicas por tipo; ex.: opções do `selectInput`, limites do Cloudinary, etc.).

### UI e Renderização

- Arquivo: `dashboard/components/sections/FieldRenderer.jsx`

  - Mapeia `textInput`, `textarea`, `numberInput`, `dateInput`, `selectInput`, `cloudinaryUpload`, `cloudinaryGallery` e `checkboxInput` para inputs React apropriados.
  - Para Cloudinary, injeta `workspaceSlug` e `sectionSlug` para organização em pastas.

- Arquivos Cloudinary:

  - `dashboard/components/ui/CloudinaryUploadField.jsx`: upload único, estados de upload, preview e remoção.
  - `dashboard/components/ui/CloudinaryGalleryField.jsx`: múltiplos uploads, progressivo, remoção individual e limite por quantidade.

- Formulário de criação/edição de ContentTypes:
  - `dashboard/components/content-types/ContentTypeForm.jsx`: adiciona/remover addons, define tipo, placeholder, helpText e configurações específicas por tipo (ex.: `options` no `selectInput`, `maxFileSize`, `folder`, `maxImages` para Cloudinary, etc.).

### Rotas e Integrações Relacionadas

- `POST /api/upload/signature` — arquivo: `dashboard/app/api/upload/signature/route.js`
  - **Finalidade**: gerar assinatura segura para upload no Cloudinary.
  - **Autenticação**: via Clerk (necessário `userId`).
  - **Body esperado**:
    ```json
    {
      "folder": "uploads|gallery|...",
      "workspaceSlug": "string",
      "sectionSlug": "string",
      "addonFolder": "string"
    }
    ```
  - **Resposta**:
    ```json
    {
      "signature": "string",
      "timestamp": 1730000000,
      "apiKey": "string",
      "folder": "workspace/section/userId/(addon)",
      "cloudName": "string"
    }
    ```
  - **Env vars necessárias**:
    - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
    - `CLOUDINARY_API_KEY`
    - `CLOUDINARY_API_SECRET`

### Planos, Addons Pagos e Acesso

- Leitura de planos e addons: `dashboard/lib/plans.js` (`getPlan`, `getAddon`) baseado em `dashboard/config/plans.yml`.
- O `Access Engine` considera features/addons para liberar permissões.
- Exemplos e regras de negócio: `docs/regras-de-negocio/addons.md` e trechos em `docs/sistema-controle-acesso.md` (exemplos de addons pagos e integrações).

### Exemplos práticos

1. Exemplo de `ContentType` com addons comuns:

```json
{
  "name": "Produto",
  "slug": "products",
  "addons": [
    {
      "id": "titulo",
      "name": "Título",
      "type": "textInput",
      "required": true,
      "placeholder": "Ex.: Camiseta Azul"
    },
    {
      "id": "descricao",
      "name": "Descrição",
      "type": "textarea",
      "required": true
    },
    {
      "id": "preco",
      "name": "Preço",
      "type": "numberInput",
      "required": true,
      "config": { "min": 0, "step": 0.01 }
    },
    {
      "id": "categoria",
      "name": "Categoria",
      "type": "selectInput",
      "required": true,
      "config": {
        "options": [
          { "value": "roupas", "label": "Roupas" },
          { "value": "acessorios", "label": "Acessórios" }
        ]
      }
    },
    {
      "id": "imagem",
      "name": "Imagem Principal",
      "type": "imageUpload",
      "required": true
    },
    {
      "id": "galeria",
      "name": "Galeria",
      "type": "cloudinaryGallery",
      "required": false,
      "config": {
        "folder": "produtos",
        "maxImages": 10,
        "maxFileSize": 10485760
      }
    },
    {
      "id": "publicado",
      "name": "Publicado",
      "type": "checkboxInput",
      "required": false
    }
  ]
}
```

2. Exemplo de `ContentType` com `cloudinaryUpload` e organização por workspace/section:

```json
{
  "name": "Post do Blog",
  "slug": "blog-posts",
  "addons": [
    {
      "id": "conteudo",
      "name": "Conteúdo",
      "type": "textarea",
      "required": true
    },
    {
      "id": "dataPublicacao",
      "name": "Data de Publicação",
      "type": "dateInput",
      "required": true
    },
    {
      "id": "capa",
      "name": "Capa (Cloudinary)",
      "type": "cloudinaryUpload",
      "required": false,
      "config": { "folder": "capas" }
    }
  ]
}
```

Na UI do dashboard, ao renderizar formulários de item, os componentes Cloudinary chamarão `POST /api/upload/signature` com `workspaceSlug` e `sectionSlug`, e a API organizará os uploads na pasta `workspace/section/userId/(addonFolder)`.

### Como criar um novo Addon (campo)

Passo a passo recomendado para adicionar um novo tipo de campo (ex.: `colorPicker`):

1. **Schema**

   - Atualize o enum de `type` em `ContentTypeSchema.fields.addons.items.type.enum` para incluir `"colorPicker"`.
   - Se precisar de configurações, defina quais chaves espera em `addon.config`.

2. **UI de Configuração (Studio)**

   - Em `dashboard/components/content-types/ContentTypeForm.jsx`, adicione uma `<option>` no seletor de tipos.
   - Crie o bloco de configurações específicas quando `addon.type === "colorPicker"` (ex.: formato, paleta, alpha etc.).

3. **Renderização do Campo**

   - Em `dashboard/components/sections/FieldRenderer.jsx`, adicione um `case "colorPicker"` e retorne o novo componente de input.
   - Crie o componente em `dashboard/components/ui/ColorPickerField.jsx` (ou similar) com API consistente: props `{ addon, value, onChange, path, workspaceSlug, sectionSlug }`.

4. **APIs adicionais (se necessário)**

   - Se o addon integrar com serviço externo, crie a rota em `dashboard/app/api/...` e documente o body/response.
   - Use autenticação centralizada e siga as regras de segurança do projeto.

5. **Planos e Cobrança (opcional)**

   - Se o addon for pago, configure `dashboard/config/plans.yml` e, se aplicável, o mapeamento Stripe (`dashboard/config/stripe-map.js`).
   - Garanta que o `Access Engine` reconheça a feature/addon para liberar uso.

6. **Testes**

   - Adicione testes de presença do novo tipo (similar a `dashboard/tests/addons-core.test.js`).
   - Se houver rota nova, inclua testes de integração em `dashboard/tests`.

7. **Docs**
   - Atualize este `addons.md` com o novo tipo e exemplos de uso.

### Boas práticas

- **Não confiar na UI para permissões**: decisões de acesso são feitas no backend. A UI apenas renderiza campos e responde a permissões do servidor.
- **Validação consistente**: se usar `validation` (min/max/pattern), valide no frontend e backend.
- **Placeholders e Help Text** melhoram a UX e estão suportados nativamente.
- **Cloudinary**: sempre use a rota de assinatura; não exponha `api_secret` no cliente.
- **Tipos novos**: mantenha a API de props consistente entre campos para simplificar o `FieldRenderer`.

### Referências úteis

- Schema e features: `dashboard/schemas/index.js`
- Render dos campos: `dashboard/components/sections/FieldRenderer.jsx`
- Campos Cloudinary: `dashboard/components/ui/CloudinaryUploadField.jsx`, `dashboard/components/ui/CloudinaryGalleryField.jsx`
- Form de ContentType (configuração de addons): `dashboard/components/content-types/ContentTypeForm.jsx`
- Rota de assinatura Cloudinary: `dashboard/app/api/upload/signature/route.js`
- Planos/Addons: `dashboard/lib/plans.js` e `dashboard/config/plans.yml`
- Documentos: `docs/regras-de-negocio/addons.md`, `docs/projeto-cloudinary.md`, `README.md` (seção "Addons Disponíveis")
- Notas de Section: `section-strategies.md` e `section-exposure-mode.md` (exposição de itens é responsabilidade da Section, não do Addon)

### Avaliação da Organização Atual (curta)

- **Pontos fortes**: schema claro em `ContentType.addons`; UI consistente via `FieldRenderer`; integração Cloudinary madura; formulário de configuração amigável; testes básicos para tipos core.
- **Oportunidades**: padronizar metadados do addon (categoria, escopo, dependências, versão), declarar compatibilidade com estratégias de seção, JSON Schema de `config`, versionamento, manifest para marketplace, hooks (validação/salvamento) e lint de addons.

### Taxonomia e Compatibilidade por Seção (proposta)

Para preparar o marketplace e evitar addons instalados em contextos inadequados, cada addon deve declarar sua compatibilidade com estratégias de seção:

- **Escopo de Seção (`scope`)**: `"singleton" | "collection" | "group" | "repeater" | "any"` (padrão: `any`).
- **Repetibilidade (`repeatable`)**: `boolean` indicando se pode ser usado múltiplas vezes no mesmo nó.
- **Nesting (`allowNesting`)**: `boolean` indicando se pode ser usado dentro de `group`/`repeater`.

Esses campos não mudam o comportamento atual, mas guiam o Studio e validações do futuro marketplace. Carece de 'ok' do dev e precisa ser verificado.

### Manifesto do Addon (proposta para marketplace)

Definição mínima sugerida para um arquivo `addon.manifest.json` por addon (nativo ou de terceiros):

```json
{
  "id": "cloudinary-upload",
  "name": "Cloudinary Upload",
  "version": "1.0.0",
  "type": "field",
  "category": "media",
  "scope": "any",
  "repeatable": false,
  "allowNesting": true,
  "compatibility": {
    "minDashboardVersion": "0.2.0"
  },
  "configSchema": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "properties": {
      "folder": { "type": "string" },
      "maxFileSize": { "type": "integer" },
      "maxImages": { "type": "integer" },
      "options": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "value": { "type": "string" },
            "label": { "type": "string" }
          },
          "required": ["value"]
        }
      }
    }
  },
  "pricing": {
    "model": "free|one_time|recurring|usage_based",
    "stripePriceId": null
  },
  "dependencies": {
    "env": [
      "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
      "CLOUDINARY_API_KEY",
      "CLOUDINARY_API_SECRET"
    ],
    "permissions": []
  },
  "assets": {
    "icon": "icon.svg",
    "screenshots": ["screenshot-1.png"]
  }
}
```

Observações:

- `type`: `"field" | "behavior" | "view" | "integration"`.
- `configSchema` padroniza o editor e validações no Studio.
- `pricing` e `stripePriceId` conectam com `plans.yml` e `lib/plans.js`.

### Roadmap do Marketplace (MVP sugerido)

- **Estrutura**: criar diretório `dashboard/addons/` com addons nativos cada um em subpasta contendo `addon.manifest.json`, `README.md`, `index.jsx` (UI) e opcional `route.js` (API).
- **Instalação**: Studio lê manifestos e lista addons disponíveis (nativos e de terceiros via catálogo remoto).
- **Validação**: ao adicionar um addon ao `ContentType`, validar `scope`, `repeatable`, `allowNesting` e `configSchema`.
- **Execução**: `FieldRenderer` continua como camada de apresentação; rotas/integrações expostas por addon ficam em `app/api/addons/<addon>/...` quando necessário.
- **Licenciamento**: mapeamento entre `manifest.pricing` → `plans.yml` via `getAddon(slug)`.
- **Telemetria Optional**: evento de uso por addon (para analytics do marketplace).

### Próximos Addons (sugestões curadas)

- **Campos (field)**

  - `richText` (TipTap/ProseMirror) com toolbar customizável e output HTML/JSON.
  - `markdown` com preview ao vivo.
  - `colorPicker` com paleta e alpha.
  - `tagInput` com autocomplete e criação rápida.
  - `phoneInput` com validação internacional.
  - `urlSlug` (evolução do `SlugField` já citado) com validação e preview da rota.
  - `relation` (referência) para vincular itens de outra Section.
  - `addressAutocomplete` (Google Places/Mapbox).
  - `fileUpload` (S3/Cloudflare R2) complementar ao Cloudinary (imagens).
  - `videoUpload` (Mux) com thumbnail automático.

- **Comportamento (behavior)**

  - `versionControl` (já citado): snapshots e restore.
  - `computedFormula`: campos derivados com funções (SUM, CONCAT, IF...).
  - `conditionalVisibility`: exibição baseada em regras.
  - `webhookTrigger` (on create/update/delete) com retries e logs.

- **Views (view)**

  - `kanban` (citada): colunas por status/label.
  - `calendar`: datas e prazos.
  - `gantt`: planejamento de projetos.
  - `gallery`: visualização de mídia.

- **Integrações (integration)**
  - `sendgridEmail` (campos: to, subject, templateId, dynamicData) com rota `POST /api/integrations/sendgrid/send` e chave via env/secret.
  - `typeformEmbed`/`formsIntegration`: coleta dados externos por embed e sincronização.
  - `googleDrivePicker`/`dropboxPicker`: seleção de arquivos.
  - `analyticsCounter` (Google Analytics/GTAG): contador simples e eventos customizados.
  - `stripePriceSelector`: seleção de planos/addons com checkout integrado.

### Planejamento de Adoção (sem mudanças de código agora)

1. Documentar oficialmente o Manifesto no `addons.md` (feito aqui) e adotar gradualmente em addons nativos (Cloudinary pode ganhar um `addon.manifest.json`).
2. Adicionar campos de compatibilidade (`scope`, `repeatable`, `allowNesting`) no manifesto e validar no Studio (próximo passo de implementação).
3. Definir `configSchema` para tipos atuais (textInput/textarea/select/number/etc.) para padronizar o editor de config.
4. Criar diretório `dashboard/addons/` e migrar pelo menos 2 addons nativos para o formato (ex.: `cloudinaryUpload`, `cloudinaryGallery`).
5. Implementar 2 integrações simples hoje: `sendgridEmail` (rota + campo) e `markdown` (field puro, sem rota).

### Checklist rápido para novos addons

- Manifesto preenchido (id, version, type, scope, pricing, dependencies).
- `configSchema` definido para guiar a UI.
- Compatibilidade com estratégias de seção indicada.
- Testes básicos (render + validação de config + rotas se houver).
- Documentação curta (`README.md`) com exemplos.
