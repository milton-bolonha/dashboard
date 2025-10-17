# Arquitetura: Importador de Conteúdo Estático

**Data:** 21 de julho de 2025
**Autor:** Milton e Gemini

## 1. Visão Geral e Objetivo

Para posicionar o DashMaster.PRO como uma ferramenta completa de gerenciamento de conteúdo, é essencial oferecer um caminho de migração suave para projetos existentes. Este documento detalha a arquitetura de um **Importador de Conteúdo Estático**, uma ferramenta capaz de ler uma estrutura de arquivos e pastas (como a encontrada em `gatsby-landing/content`) e traduzi-la automaticamente para a estrutura de `ContentTypes`, `Sections` e `Items` do DashMaster.

O objetivo é permitir que um usuário aponte para um diretório de conteúdo e, com o mínimo de configuração, tenha seu workspace no DashMaster preenchido com os dados, pronto para ser gerenciado ou exposto via API.

## 2. Lógica de Mapeamento (Arquivo -> Estrutura DashMaster)

A lógica central se baseia em um mapeamento intuitivo, usando a estrutura do sistema de arquivos como guia.

- **Pasta na Raiz (`/`) -> `Section`**: Cada subdiretório no nível raiz do conteúdo (ex: `/pages`, `/cities`) se tornará uma `Section` no DashMaster. O nome da pasta será usado para o `name` e `slug` da seção.
- **Arquivo em Pasta (`/pages/about-us.md`) -> `Item`**: Cada arquivo dentro de um subdiretório se tornará um `Item` dentro da `Section` correspondente. O nome do arquivo (ex: `about-us`) será o `title` e o `slug` do item.
- **Arquivo na Raiz (`/hero.json`) -> `Section` com um único `Item`**: Arquivos no nível raiz representam, geralmente, conteúdo de uma seção específica (como um herói de página inicial). O importador irá:
  1.  Criar uma `Section` com o mesmo nome do arquivo (ex: `hero`).
  2.  Criar um único `Item` dentro dessa `Section`, também com o nome `hero`.
  3.  O conteúdo do arquivo preencherá os dados deste item único.
- **Conteúdo do Arquivo (JSON/Markdown) -> `ContentType` e `Item.data`**: O conteúdo de cada arquivo é a parte mais crítica. O importador irá **inferir a estrutura** para criar um `ContentType` dinamicamente.

## 3. Arquitetura do Processo de Importação

O processo será dividido em duas fases distintas para dar ao usuário controle e visibilidade.

### Fase 1: Análise e Geração do Plano de Importação

Nesta fase, nada é escrito no banco de dados. O importador apenas lê os arquivos e gera um "plano" para aprovação do usuário.

**Interface do Usuário:** Uma nova página no Dashboard (ex: `/dashboard/import`) onde o usuário pode arrastar uma pasta ou apontar para um repositório Git.

**Processo do Backend:**

1.  **Leitura Recursiva:** O backend recebe a estrutura de arquivos e a lê recursivamente.
2.  **Inferência de `ContentType`:**
    - Para cada arquivo (`hero.json`, `about-us.md`), o importador analisa seu conteúdo.
    - Se for um JSON, ele percorre as chaves do objeto. Para cada chave-valor, ele cria uma definição de `addon` no `ContentType`. O tipo do `addon` é inferido pelo valor:
      - `"title": "Olá Mundo"` -> `addon: { name: "title", type: "textInput" }`
      - `"isActive": true` -> `addon: { name: "isActive", type: "checkboxInput" }`
      - `"image": "/path/to/img.jpg"` -> `addon: { name: "image", type: "cloudinaryUpload" }` (se o valor parecer uma URL de imagem).
      - `"items": [...]` (array de objetos) -> Isso pode ser mapeado para um `addon` do tipo "repetidor" (se tivéssemos) ou, mais simplesmente, criar `ContentTypes` e `Items` aninhados.
    - **Otimização:** O importador é inteligente. Se ele encontrar dez arquivos com a mesma estrutura de chaves (ex: todos os arquivos em `/pages/`), ele não criará dez `ContentTypes`. Ele criará **um único `ContentType`** (ex: `pages-template`) e o associará a todos.
3.  **Geração do Plano (`import-plan.json`):**
    - O resultado da análise é um grande objeto JSON que descreve exatamente o que será criado.
    - **Exemplo do Plano:**
      ```json
      {
        "contentTypesToCreate": [
          { "name": "hero", "slug": "hero", "addons": [...] },
          { "name": "pages-template", "slug": "pages-template", "addons": [...] }
        ],
        "sectionsToCreate": [
          { "name": "hero", "slug": "hero", "contentTypeName": "hero" },
          { "name": "pages", "slug": "pages", "contentTypeName": "pages-template" }
        ],
        "itemsToCreate": [
          { "title": "hero", "sectionName": "hero", "data": { ...conteúdo do hero.json... } },
          { "title": "about-us", "sectionName": "pages", "data": { ...conteúdo do about-us.md... } }
        ]
      }
      ```
4.  **Apresentação na UI:** O Dashboard recebe esse plano e o exibe de forma amigável para o usuário: "Vamos criar 2 Tipos de Conteúdo, 2 Seções e 15 Itens. Você aprova?".

### Fase 2: Execução da Importação

Se o usuário aprovar o plano, o backend executa as operações de escrita no banco de dados, na ordem correta.

1.  **Receber Plano Aprovado:** A UI envia o `import-plan.json` para um endpoint de execução (`/api/import/execute`).
2.  **Criar `ContentTypes`:** O backend percorre `contentTypesToCreate` e insere os novos `ContentTypes` no banco. Ele armazena os `_id`s gerados.
3.  **Criar `Sections`:** O backend percorre `sectionsToCreate`, encontra o `contentTypeId` correspondente que acabou de criar, e insere as `Sections` no banco, armazenando seus `_id`s.
4.  **Criar `Items`:** Finalmente, ele percorre `itemsToCreate`, encontra o `sectionId` correto e insere os `Items` no banco, preenchendo o campo `data` com o conteúdo original dos arquivos.
5.  **Feedback:** A UI é atualizada em tempo real sobre o progresso e exibe uma mensagem de sucesso no final.

## 4. Integração com o Plano de Desenvolvimento

Este importador é uma feature poderosa que se encaixa perfeitamente na nossa visão de CaaS. Proponho adicioná-lo ao nosso roadmap como uma nova "Fase".

- **Fase 1: Conexão Manual com Gatsby (Em Andamento)** - Fundamental para provar o conceito de consumo de dados.
- **Fase 2: O Importador de Conteúdo Estático (Nova Fase)** - Fundamental para a aquisição e migração de usuários.
- **Fase 3: O Publicador Automatizado (Visão de Futuro)** - O serviço de valor agregado que se beneficia das duas fases anteriores.

Esta ordem garante que resolvemos os problemas na sequência lógica: primeiro, provamos que podemos _servir_ dados; segundo, provamos que podemos _ingerir_ dados; e terceiro, automatizamos o ciclo completo.
