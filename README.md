# 📘 Documentação Técnica — DashMaster.PRO (MVP)

## 🧱 Introdução Geral

O **DashMaster.PRO** é uma plataforma modular de gestão de conteúdo e experiências digitais. Como "um CMS dos CMSs", ele permite a construção de Workspaces altamente personalizados com Seções, Tipos de Conteúdo, Lógicas de Acesso, Addons e Serviços.

## 🌌 Visão Geral da Arquitetura

### Entidades Centrais

| Entidade      | Função                                                     |
| ------------- | ---------------------------------------------------------- |
| `Workspace`   | Espaço isolado de projeto e conteúdo                       |
| `Section`     | Conjunto lógico de Itens baseados em ContentTypes          |
| `ContentType` | Estrutura de campos e addons de uma Section                |
| `ViewType`    | Modo de visualização/interação (Form, Table, Kanban, etc)  |
| `Addon`       | Extensão modular para campos, lógicas ou automações        |
| `Item`        | Entrada de dado criada por usuários dentro de uma Section  |
| `Pipeline`    | Automação de eventos e ações                               |
| `Plan`        | Modelo de cobrança e controle de acesso                    |
| `Role`        | Regras de acesso vinculadas ao usuário dentro do Workspace |

### Integrações Confirmadas

- **Clerk.dev**: autenticação e gerenciamento de usuários
- **Stripe**: cobrança por plano ou addon
- **Cloudinary**: upload e gerenciamento de mídia
- **MongoDB Atlas**: banco de dados principal
- **Next.js 15 (App Router)** + **Node.js 22**
- **DeckEngine Pipelines**

---

## 🧩 Addons no MVP

### Addons de Campo (`field_addon`)

- `TextField`
- `ImageField`
- `ChoiceField`
- `MultiTextField`
- `AI_TextGeneratorField`: gera conteúdo textual com IA baseado nos dados inseridos

### Addons de Comportamento (`behavior_addon`)

- `SlugField`
- `VersionControl`

### Addons de Acesso e Cobrança

- `AccessAddon`: limita visibilidade por `Role` ou `Plan`
- `PurchaseAddonButton`: botão para aquisição de features, campos ou seções (liberações por Stripe)

---

## 👁️ ViewTypes no MVP

| Nome           | Finalidade                                           |
| -------------- | ---------------------------------------------------- |
| `FormStepView` | Interface de formulário dividido em etapas ou seções |
| `TableView`    | Interface administrativa de listagem e edição        |
| `CheckoutView` | Tela de compra de planos ou liberação de conteúdo    |
| `PDFView`      | Geração visual/exportação de conteúdo                |

---

## 🔐 Seções Pagas e Campos com Acesso Restrito

### Lógica Padrão

- **Section com flag `is_paid: true`**: só pode ser acessada após a compra do plano ou addon correspondente.
- Campos em `ContentType` podem ser marcados com restrições via `AccessAddon`, associando permissões por plano ou role.

> 🧠 Observação: campos dentro de Steps podem ser restringidos individualmente ou como conjunto, considerando a hierarquia do form como addon aninhado. Essa complexidade será refinada após o MVP.

---

#### Estrutura no DashMaster

- **Workspace**: "Autores Apaixonados"
- **Sections**:
  - `Casais`
  - `Histórias`
  - `Capítulos`
  - `Pedidos`
- **ContentTypes**:
  - `Couple`: campos de identificação
  - `LoveStory`: multi-step com campos condicionais e pagos
  - `Chapter`: campos com `AI_TextGeneratorField`
  - `OrderRequest`: formulário de pedido físico
- **Views**:
  - `FormStepView` com desbloqueios progressivos
  - `CheckoutView` para adquirir o acesso completo ao livro
  - `PDFView` para visualização e exportação
- **Planos**:
  - `Free`: acesso a primeiras etapas
  - `Plus`: acesso completo com exportação e impressão
- **Addons utilizados**:
  - `AI_TextGeneratorField`
  - `AccessAddon`
  - `PurchaseAddonButton`

---

## ✏️ Exemplo Prático: Blog com Taxonomia

Para demonstrar o uso padrão do DashMaster.PRO, o MVP inclui um exemplo nativo de blog, com taxonomia funcional.

### Estrutura

- **Workspace**: "Meu Blog"
- **Sections**:
  - `Posts`
  - `Categorias`
  - `Tags`

### ContentTypes

- `Post`: campos de título, slug, imagem, resumo, conteúdo e referências a categorias/tags
- `Category`: nome + slug
- `Tag`: nome simples

### Views

- `TableView`: gerenciamento de posts e categorias
- `FormView`: criação de novo post
- `SlugField`: usado para URLs amigáveis
- `AccessAddon`: apenas `admin` pode publicar posts

---

## 🌐 Arquitetura Headless

### ✅ **API Pública Implementada (Janeiro 2025)**

O DashMaster.PRO agora oferece uma API pública robusta que permite consumo de conteúdo por aplicações externas:

- **Endpoint Principal:** `/api/public/content`
- **Autenticação:** API Keys com Bearer token
- **Funcionalidades:**
  - Rate limiting por chave
  - Cache inteligente
  - Controle de acesso granular por seção
  - Suporte a múltiplos workspaces

### 🎯 **Caso de Uso Validado: Gatsby Landing Page**

A migração bem-sucedida do site Gatsby demonstra a maturidade da API:

- ✅ **100% headless:** Eliminação completa de conteúdo estático
- ✅ **Performance:** Cache implementado e otimizações de query
- ✅ **Escalabilidade:** Pronto para múltiplos sites/aplicações
- ✅ **Flexibilidade:** Atualização de conteúdo sem rebuild

### 🧠 **Arquitetura de Conteúdo Inteligente (Julho 2025)**

Para aprimorar a experiência de desenvolvimento e a automação, o DashMaster.PRO implementou uma arquitetura que entende a **intenção** por trás da estrutura do conteúdo. Cada "Seção" agora possui uma "Estratégia" que define seu comportamento:

- **Coleção (`collection`):** O comportamento padrão. Ideal para múltiplos itens do mesmo tipo, como posts de blog, produtos ou depoimentos. A interface renderiza uma tabela para gerenciamento.
- **Item Único (`singleton`):** Perfeito para conteúdo de configuração que só existe uma vez, como o "Header", "Footer" ou "Configurações do Site". A interface redireciona o usuário diretamente para a página de edição do único item, eliminando cliques desnecessários.
- **Agrupamento (`grouping`):** Um caso de uso avançado onde uma única Seção pode conter itens de diferentes Tipos de Conteúdo.

Esta arquitetura é suportada por um **Importador Inteligente** que analisa a estrutura de diretórios e arquivos (`.json`, `.md`) e atribui automaticamente a estratégia correta, criando Seções, Content Types e Itens em massa, e preservando a intenção original do conteúdo.

---

## 🔧 Roadmap Pós-MVP (Resumo)

- Interface visual para construção de Pipelines
- Suporte a lógica condicional entre Addons
- Addons do tipo `Analytics`, `Scheduling` e `Notification`
- Marketplace de Templates e Addons
- Versão offline e app do DashMaster.Tablet
- **Expansão do Ecosystem Headless:** Integração com frameworks adicionais

---

## 📌 Conclusão

O MVP do **DashMaster.PRO** entrega a fundação de um construtor de sistemas administrativos flexível e monetizável. Com estrutura modular, integração completa com pagamentos e IA, e exemplo real de uso com o **Autores Apaixonados**, a plataforma se posiciona como base para criadores e empreendedores desenvolverem experiências digitais com agilidade e profundidade.
