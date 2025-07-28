---
PROMPT DE REINICIALIZAÇÃO DE PROJETO: Re-arquitetura do Importador DashMaster.PRO
(Copie e cole este prompt inteiro para iniciar nosso novo chat)
---

Olá, Gemini. Você é meu assistente de programação expert. Estamos reiniciando um projeto após eu ter restaurado o código para um backup limpo e estável. Nosso objetivo é re-implementar uma arquitetura de sistema complexa que definimos juntos. Este prompt contém todo o contexto necessário para você entender a missão, a arquitetura final e o plano de ação.

## Contexto do Projeto

- **Nome:** DashMaster.PRO (um Headless CMS)
- **Tecnologias:** Backend em Next.js/MongoDB, Dashboard em Next.js/React, site consumidor em Gatsby.js.

## A Jornada Até Aqui (Resumo)

1.  Começamos tentando migrar um site Gatsby de arquivos estáticos para consumir dados da API pública do DashMaster.PRO.
2.  Rapidamente descobrimos uma limitação fundamental: o importador de conteúdo e os formulários do dashboard não conseguiam lidar com estruturas de dados aninhadas (objetos dentro de objetos) ou com arrays de objetos, resultando em erros como a exibição de `[object Object]` na UI.
3.  Nossa primeira tentativa de correção foi caótica, levando a um estado instável no sistema, com "dados fantasmas", bugs na UI e inconsistências conceituais.
4.  Diante disso, paramos, analisamos a fundo o problema e projetamos uma arquitetura final robusta. Eu (o usuário) restaurei o código para um backup anterior a essas mudanças, nos dando uma base limpa para trabalhar.

## A Arquitetura Final (Nossa Fonte da Verdade)

Esta é a arquitetura que devemos implementar. Trate-a como a especificação definitiva.

#### Filosofia Central

A base de tudo é a regra: **"Items are the iterable things."** Itens são as entidades que podem ser listadas, contadas e iteradas. Uma "Seção" no CMS pode conter um único item de configuração (Singleton) ou uma coleção de múltiplos itens (Coleção).

#### As 3 Estratégias de Importação

O importador deve analisar a estrutura de arquivos e aplicar uma das três estratégias:

1.  **Coleção (Iterável):**

    - **Gatilho:** Um diretório com múltiplos arquivos da mesma extensão (ex: `pages/*.md`) OU um único arquivo JSON cujo conteúdo raiz é um **ARRAY** `[]`.
    - **Resultado:** 1 Seção, 1 Content Type (compartilhado, nome no singular), Múltiplos Itens.
    - **UI:** A página da seção deve exibir uma tabela com os itens.

2.  **Singleton (Único):**

    - **Gatilho:** Um diretório com um único arquivo JSON/MD cujo conteúdo raiz é um **OBJETO** `{}`.
    - **Resultado:** 1 Seção, 1 Content Type, 1 único Item.
    - **UI:** A página da seção deve redirecionar automaticamente para a página de edição do único item.

3.  **Agrupamento (Heterogêneo):**
    - **Gatilho:** Um diretório com múltiplos arquivos de estruturas/tipos diferentes.
    - **Resultado:** 1 Seção, Múltiplos Content Types, Múltiplos Itens.
    - **UI:** A página da seção deve exibir uma visão de "cards", não uma tabela.

#### Arquitetura de Formulários Dinâmicos (A Solução para `[object Object]`)

Implementaremos um sistema de renderização recursiva:

- **Novos Addons:** Introduzimos os tipos de addon `group` (para objetos aninhados) e `repeater` (para arrays de objetos).
- **Fluxo de Componentes:**
  - `DynamicItemForm.jsx` (Orquestrador) -> `RecursiveFormRenderer.jsx` (Cérebro da recursão) -> `FieldRenderer.jsx` (Decide o campo a renderizar).
  - Para o addon `repeater`, o `FieldRenderer` chama o `FieldRepeater.jsx`, que gerencia a adição/remoção de sub-itens e chama o `RecursiveFormRenderer` para cada um.
- **Resultado:** Capacidade de renderizar e gerenciar formulários com qualquer nível de aninhamento.

## Seu Objetivo e Plano de Ação

- **Objetivo:** Guiar a re-implementação desta arquitetura de forma limpa, metódica e robusta, usando o código do backup como nosso ponto de partida.
- **Guia Principal:** O arquivo `new-migration-report.md` é nossa bíblia. Consulte-o sempre.
- **Nosso Primeiro Passo:** Vamos começar pela **Fase 2: Re-arquitetura do Backend**. A primeira tarefa é modificar o arquivo `dashboard/app/api/importer/analyze/route.js` para implementar a lógica que diferencia as 3 estratégias de importação e utiliza a função `inferFieldsRecursive` para detectar `groups` e `repeaters`.

Por favor, confirme que você entendeu todo o contexto e está pronto para começar com nosso primeiro passo.

# Relatório e Plano de Ação: A Re-arquitetura do Importador Inteligente

**Status:** Concluído (Documentação Final)
**Autores:** Milton, Gemini

> **Nota dos Autores:** Este é um documento vivo. Ele será nosso centro de comando e nossa única fonte de verdade durante a re-arquitetura do módulo de importação. Ele será atualizado a cada passo concluído e a cada nova descoberta.

---

## 1. Diagnóstico: O Erro `Singleton section is missing its single item`

- **Sintomas:** Ao acessar a página de uma seção recém-criada (ex: `/dashboard/sections/zumba`), a aplicação quebra com o erro `Singleton section is missing its single item`.
- **Análise Inicial (Incorreta):** A primeira suspeita era de que a lógica para criar o item inicial junto com a seção estava faltando.
- **Diagnóstico Correto (A Descoberta Decisiva):** O problema era muito mais profundo. O sistema estava **adivinhando** o "tipo" de uma seção com base na contagem de itens que ela possuía no momento. Uma seção com 0 itens era incorretamente tratada como um "singleton quebrado", quando na verdade poderia ser uma "coleção vazia". Essa lógica era inerentemente frágil.
- **A Lacuna Arquitetural:** As 3 Estratégias (Coleção, Singleton, Agrupamento) foram projetadas para o Importador, mas nunca foram transpostas para o fluxo de criação manual de seções, criando uma inconsistência fundamental no sistema.

---

## 2. A Simulação do "Caminho Mental": Redefinindo a Arquitetura

Para corrigir a fundação, simulamos a jornada do usuário passo a passo, o que revelou os requisitos exatos para uma arquitetura robusta e nos levou à solução definitiva: **parar de adivinhar e começar a declarar.**

A solução é a introdução de um campo `strategy` no próprio schema da Seção, que define explicitamente seu comportamento.

### **Cenário Simulado 1: Criando um "Blog" (Coleção)**

1.  **Criar Content Type "Post":** Nenhuma mudança necessária.
2.  **Criar Seção "Blog":** O usuário preenche o nome, seleciona o CT "Post" e, no novo campo **"Tipo de Seção"**, mantém a opção padrão: **`Coleção de Múltiplos Itens`**.
3.  **Backend:** Recebe `strategy: 'collection'` e cria a seção. Simples.
4.  **Visualizar Seção:** A página lê `section.strategy === 'collection'`, entende que é uma coleção (mesmo que vazia) e renderiza a tabela de itens com o botão "Adicionar Post". **Comportamento correto e esperado.**

### **Cenário Simulado 2: Criando as "Configurações do Header" (Singleton)**

1.  **Criar Content Type "Configuração do Header":** Nenhuma mudança.
2.  **Criar Seção "Header":** O usuário preenche o nome e, no campo **"Tipo de Seção"**, seleciona a opção **`Item Único`**.
3.  **Backend (Ação-Chave):** A rota da API recebe `strategy: 'singleton'`. Ela então:
    - Cria a Seção.
    - **Cria automaticamente um Item inicial e vazio**, vinculando-o a essa seção.
4.  **Visualizar Seção:** A página lê `section.strategy === 'singleton'`, busca o item que foi criado automaticamente e **redireciona o usuário direto para a página de edição do item**. O fluxo é direto e sem atritos.

Esta simulação validou a abordagem e refinou os requisitos do nosso plano.

---

## 3. O Plano de Ação Definitivo (Passo a Passo)

Este é o plano que será executado para implementar a arquitetura correta.

### **Fase 1: Schema (A Fundação)**

- **Status:** ✅ **Concluído**
- **Ação:** Modificar `dashboard/schemas/index.js` para adicionar `strategy: { type: 'string', enum: ['collection', 'singleton', 'grouping'], default: 'collection' }` ao `SectionSchema`.

### **Fase 2: Backend (Criação Inteligente)**

- **Status:** ✅ **Concluído**
- **Ação:** Refatorar `POST /api/sections/route.js`. A rota deverá aceitar o novo campo `strategy` e, se o valor for `'singleton'`, criar automaticamente um item inicial correspondente.

### **Fase 3: Backend (Alinhamento do Importador)**

- **Status:** ✅ **Concluído**
- **Ação:** Refatorar `dashboard/app/api/importer/analyze/route.js`. A lógica de análise de arquivos foi mantida, mas seu resultado foi simplificado para apenas **definir o campo `strategy`** no plano de importação.

### **Fase 4: Frontend (Visualização sem Adivinhação)**

- **Status:** ✅ **Concluído**
- **Ação:** Refatorar `dashboard/app/dashboard/sections/[slug]/page.jsx`. A lógica de renderização agora é baseada **exclusivamente** no campo `section.strategy`.

### **Fase 5: Frontend (Intenção Explícita do Usuário)**

- **Status:** ✅ **Concluído**
- **Ação:** Aprimorar `dashboard/components/sections/SectionForm.jsx` para incluir o novo campo de formulário **"Tipo de Seção"**, permitindo ao usuário escolher a estratégia ao criar/editar uma Seção.

### **Fase 6: Criação Unificada (A Experiência do Usuário)**

- **Status:** ✅ **Concluído**
- **Ação:** Refatorada a rota `POST /api/content-types` e o formulário `ContentTypeForm.jsx` para permitir a criação de um Content Type e sua respectiva Seção (com a estratégia correta) em um único passo, alinhando o software com a jornada real do usuário.

---

## 4. Validação e Status Atual (28/07/2025)

**Implementação Finalizada e Validada!**

Após a conclusão de todas as 6 fases do plano de re-arquitetura, o fluxo principal foi testado com sucesso pelo usuário.

- **✅ Fluxo Singleton: SUCESSO.**

  - A criação de um Content Type com a opção "Criar Seção" e estratégia "Item Único" funcionou perfeitamente.
  - O sistema criou o Content Type, a Seção e o Item inicial em uma única operação.
  - O acesso à página da seção redirecionou corretamente para a página de edição do item.
  - A página de edição carregou os dados do item sem erros.

- **✅ Fluxo Coleção: SUCESSO.**
  - A criação de seções do tipo "Coleção" foi validada. Um bug que impedia a seleção correta do Content Type no formulário foi corrigido, garantindo que o ID seja enviado corretamente à API.
  - O fluxo de criação de itens foi depurado e corrigido. Um erro que direcionava para a edição de um item com ID "new" foi resolvido unificando as lógicas de criação e edição na página de edição.
  - A visualização da lista de itens foi corrigida. Um bug de inconsistência de tipo de dado (`ObjectId` vs `String`) na API foi resolvido, garantindo que os itens sejam corretamente buscados no banco de dados.
  - A tabela de itens foi completamente reformulada, evoluindo de uma tabela estática para uma tabela "PRO" (`ModernItemsTablePro`), que agora inclui ordenação de colunas e uma UI aprimorada, alinhada com os outros componentes de gerenciamento do sistema.

O sistema agora possui uma arquitetura de seções robusta, explícita e consistente entre a criação manual e o importador de conteúdo. A causa raiz do erro `Singleton section is missing its single item` e dos problemas de validação subsequentes foi eliminada com sucesso.

- **Próximo Passo:** Implementar o `Access Engine` para controle de permissões.
