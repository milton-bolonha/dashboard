# Criar um Novo Tema - Guia Completo

Este guia explica como criar um novo tema para o sistema. Um tema é uma instância completa e independente do sistema, como "Sales Assistant", "Book Creator" ou "Construction Manager".

## O que é um Tema?

Um tema define:

- **Entidades** (ex: Company, Book, Project)
- **Campos** para cada entidade
- **Tile Templates** (prompts de AI)
- **Landing Tags** (inputs do form inicial)
- **Cores e estilos visuais**

## 1. Estrutura Básica de um Tema

```javascript
{
  id: "my-theme",           // ID único (lowercase com hífen)
  name: "My Theme",         // Nome legível
  slug: "my-theme",         // URL slug
  description: "...",       // Descrição curta
  icon: "🎨",              // Emoji ícone
  colors: {                 // Paleta de cores
    primary: "#COLOR",
    secondary: "#COLOR",
    background: "#COLOR",
    chatBubble: "#COLOR",
  },
  entities: [...],          // Array de entidades
  tileTemplates: [...],     // Array de templates de tiles
  landingTags: [...],       // Array de inputs da landing
  config: {...}             // Configurações do tema
}
```

## 2. Definir Entidades

Entidades são os objetos principais do seu tema. Exemplos:

- **Sales Assistant**: Company, Contact
- **Book Creator**: Book, Chapter, Character
- **Construction**: Project, Equipment, Worker

```javascript
entities: [
  {
    id: "project", // ID único (singular)
    name: "Project", // Nome legível
    namePlural: "Projects", // Nome plural
    icon: "🚀", // Emoji ícone
    isPrimary: true, // TRUE para entidade principal
    fields: [
      // Campos da entidade
      { id: "name", label: "Name", type: "text", required: true },
      { id: "startDate", label: "Start Date", type: "date" },
      { id: "description", label: "Description", type: "textarea" },
    ],
    children: [
      // Entidades relacionadas
      { entityId: "task", relationship: "one-to-many" },
      { entityId: "member", relationship: "one-to-many" },
    ],
  },
  {
    id: "task", // Entidade secundária
    name: "Task",
    namePlural: "Tasks",
    icon: "✅",
    isPrimary: false, // FALSE para entidades secundárias
    fields: [
      { id: "title", label: "Title", type: "text", required: true },
      { id: "status", label: "Status", type: "text" },
    ],
  },
];
```

### Tipos de Campos Suportados

- `text` - Campo de texto simples
- `textarea` - Texto longo
- `date` - Data
- `number` - Número
- `boolean` - Verdadeiro/Falso
- `url` - URL

## 3. Definir Landing Tags

Landing tags são os inputs que aparecem no formulário inicial quando o usuário cria o workspace.

```javascript
landingTags: [
  {
    id: "projectName", // ID do campo
    label: "Project Name", // Label visível
    icon: "Rocket", // Nome do ícone (lucide-react)
    placeholder: "Enter project name...",
    tooltip: "What's your project called?",
    type: "text", // text, url, textarea
    order: 1, // Ordem de exibição (1, 2, 3...)
    required: true, // Campo obrigatório?
    mapToEntity: "project", // Entidade destino (singular)
    mapToField: "name", // Campo da entidade
  },
  {
    id: "projectType",
    label: "Project Type",
    icon: "Zap",
    placeholder: "Web, Mobile, API...",
    tooltip: "What type of project?",
    type: "text",
    order: 2,
    required: true,
    mapToEntity: "project", // Mapeia para project.type
    mapToField: "type",
  },
  {
    id: "teamSize",
    label: "Team Size",
    icon: "Users",
    placeholder: "Number of people",
    tooltip: "How many team members?",
    type: "text",
    order: 3,
    required: false, // Opcional
    mapToEntity: "workspace", // Mapeia para workspace (nível raiz)
    mapToField: "teamSize",
  },
];
```

### Regras Importantes

1. **`mapToEntity`**: Nome da entidade SINGULAR (project, book, company)
2. **`mapToField`**: Deve existir nos `fields` da entidade
3. **Ordem**: Use números sequenciais (1, 2, 3...) para definir a ordem visual
4. **Required**: Pelo menos um campo deve ser `required: true`

## 4. Criar Tile Templates

Tile Templates são os prompts de AI que geram os tiles no dashboard.

```javascript
tileTemplates: [
  {
    id: "project_overview",
    title: "Project Overview",
    prompt:
      "Create a comprehensive overview for '{project.name}', a {project.type} project. Include goals, timeline, and key milestones.",
    category: "overview",
    order: 1,
    defaultSize: { w: 4, h: 2 }, // Tamanho padrão do tile
  },
  {
    id: "risk_analysis",
    title: "Risk Analysis",
    prompt:
      "Analyze potential risks and challenges for '{project.name}'. Identify top 5 risks and mitigation strategies.",
    category: "analysis",
    order: 2,
    defaultSize: { w: 4, h: 2 },
  },
  // ... mais tiles
];
```

### Variáveis nos Prompts

Use variáveis dinâmicas baseadas nas entidades:

```javascript
// ✅ CORRETO - Usar {entity.field}
prompt: "Analyze {project.name}, a {project.type} project";
prompt: "Create overview for {project.name}";

// ✅ COM VALOR PADRÃO - Se o campo for opcional
prompt: "Team size: {project.teamSize || 'not specified'}";

// ❌ ERRADO - Não usar variáveis antigas
prompt: "{target_company}"; // Não funciona!
prompt: "{company}"; // Não funciona!
```

### Categorias de Tiles

Use categorias consistentes:

- `overview` - Visão geral
- `analysis` - Análises
- `strategy` - Estratégias
- `content` - Conteúdo
- `character` - Personagens (Book)
- `structure` - Estruturas

## 5. Configurações do Tema

```javascript
config: {
  allowMultipleMainEntities: true,  // Permitir múltiplas entidades principais?
  defaultView: "grid",              // grid ou list
  features: [                       // Features habilitadas
    "ai-generation",
    "file-upload",
    "notes",
  ],
}
```

## 6. Exemplo Completo - "Project Manager" Theme

```javascript
projectManager: {
  id: "project-manager",
  name: "Project Manager",
  slug: "project",
  description: "Manage projects, tasks, and team members",
  icon: "🚀",
  colors: {
    primary: "#3B82F6",
    secondary: "#10B981",
    background: "#F0F9FF",
    chatBubble: "#DBEAFE",
  },
  entities: [
    {
      id: "project",
      name: "Project",
      namePlural: "Projects",
      icon: "🚀",
      isPrimary: true,
      fields: [
        { id: "name", label: "Project Name", type: "text", required: true },
        { id: "type", label: "Project Type", type: "text" },
        { id: "status", label: "Status", type: "text" },
        { id: "startDate", label: "Start Date", type: "date" },
      ],
      children: [
        { entityId: "task", relationship: "one-to-many" },
      ],
    },
    {
      id: "task",
      name: "Task",
      namePlural: "Tasks",
      icon: "✅",
      isPrimary: false,
      fields: [
        { id: "title", label: "Title", type: "text", required: true },
        { id: "status", label: "Status", type: "text" },
        { id: "assignedTo", label: "Assigned To", type: "text" },
      ],
    },
  ],
  tileTemplates: [
    {
      id: "project_overview",
      title: "Project Overview",
      prompt: "Create a comprehensive overview for '{project.name}', a {project.type} project starting on {project.startDate}. Include goals, timeline, and key milestones.",
      category: "overview",
      order: 1,
      defaultSize: { w: 4, h: 2 },
    },
    {
      id: "risk_analysis",
      title: "Risk Analysis",
      prompt: "Analyze potential risks and challenges for '{project.name}'. Identify top 5 risks and mitigation strategies.",
      category: "analysis",
      order: 2,
      defaultSize: { w: 4, h: 2 },
    },
    {
      id: "timeline",
      title: "Project Timeline",
      prompt: "Create a detailed timeline for '{project.name}' with key milestones, deliverables, and deadlines.",
      category: "planning",
      order: 3,
      defaultSize: { w: 4, h: 2 },
    },
  ],
  landingTags: [
    {
      id: "projectName",
      label: "Project Name",
      icon: "Rocket",
      placeholder: "Enter your project name",
      tooltip: "What's your project called?",
      type: "text",
      order: 1,
      required: true,
      mapToEntity: "project",
      mapToField: "name",
    },
    {
      id: "projectType",
      label: "Project Type",
      icon: "Zap",
      placeholder: "Web, Mobile, API...",
      tooltip: "What type of project?",
      type: "text",
      order: 2,
      required: true,
      mapToEntity: "project",
      mapToField: "type",
    },
    {
      id: "startDate",
      label: "Start Date",
      icon: "Calendar",
      placeholder: "When does it start?",
      tooltip: "Project start date",
      type: "text",
      order: 3,
      required: false,
      mapToEntity: "project",
      mapToField: "startDate",
    },
  ],
  config: {
    allowMultipleMainEntities: true,
    defaultView: "grid",
    features: ["ai-generation", "file-upload", "notes"],
  },
  isDefault: false,
  isActive: true,
}
```

## 7. Adicionar o Tema ao Sistema

### Passo 1: Adicionar em `base-themes.js`

Edite `dashboard/lib/base-themes.js` e adicione seu tema ao objeto `BASE_THEMES`:

```javascript
export const BASE_THEMES = {
  sales: {
    // ... tema sales-assistant
  },

  projectManager: {
    // ... seu tema aqui
  },

  // ... outros temas
};
```

### Passo 2: Adicionar em `ThemeContext.jsx`

Edite `dashboard/contexts/ThemeContext.jsx` e adicione ao array `FALLBACK_THEMES`:

```javascript
const FALLBACK_THEMES = [
  {
    id: "sales-assistant",
    // ... tema sales
  },
  {
    id: "project-manager",
    // ... seu tema aqui (copiar base-themes.js)
  },
];
```

### Passo 3: Adicionar cores no `DynamicHeroSection.jsx`

Se você criou novos `tagId`s, adicione as cores em `getIconColor()`:

```javascript
const getIconColor = (tagId) => {
  const colors = {
    // ... cores existentes
    projectName: { border: "#3B82F6", bg: "#DBEAFE" },
    projectType: { border: "#10B981", bg: "#D1FAE5" },
    startDate: { border: "#F59E0B", bg: "#FEF3C7" },
  };
  return colors[tagId] || { border: "#6B7280", bg: "#F3F4F6" };
};
```

## 8. System Prompt de AI

O sistema já tem suporte automático para diferentes temas. Se precisar customizar o system prompt, edite `dashboard/lib/ai-tile-generator.js`:

```javascript
function buildSystemPrompt(themeContext) {
  switch (themeContext.themeId) {
    case "project-manager":
      return `You are a project management AI assistant.
      
You help project managers plan, organize, and execute projects effectively.
      
Provide insights on:
- Project planning and timeline
- Risk management
- Team coordination
- Progress tracking

Format your answers in clear, well-structured markdown.`;

    default:
      // Fallback genérico
      return `You are a helpful AI assistant for ${
        themeContext.themeName || "workspace management"
      }.`;
  }
}
```

## 9. Testar o Novo Tema

1. **Recarregar o servidor**: `npm run dev`
2. **Acessar a landing page**: `/`
3. **Escolher seu tema** no carrossel
4. **Preencher os campos** do formulário
5. **Verificar logs** no console:
   - `🎯 Contexto gerado dinamicamente:` - Deve mostrar seu contexto
   - `📋 Usando tileTemplates do tema` - Deve usar seus tiles
6. **Verificar tiles gerados**: Devem aparecer no dashboard

## 10. Troubleshooting

### Problem: "Nenhuma entidade encontrada"

**Causa**: Entity key não está correto
**Solução**:

- Verificar se `mapToEntity` está no singular (project, book)
- Verificar se entidade foi criada em `dynamic-workspace.js`

### Problem: Variáveis não estão sendo substituídas

**Causa**: Formato errado da variável no prompt
**Solução**:

- Usar `{entity.field}` não `{variable}`
- Verificar se o campo existe na entidade

### Problem: Tiles não aparecem

**Causa**: tileTemplates não foram definidos
**Solução**:

- Adicionar `tileTemplates` array com pelo menos 3-8 tiles
- Verificar `order` está sequencial (1, 2, 3...)

### Problem: Theme não aparece na landing

**Causa**: Não adicionado em ThemeContext.jsx
**Solução**:

- Copiar tema completo para `FALLBACK_THEMES` em `ThemeContext.jsx`
- Verificar formato JSON válido

## 11. Boas Práticas

✅ **FAÇA**:

- Use IDs descritivos: `project-manager`, `book-creator`
- Mantenha nomes consistentes entre entities e landingTags
- Teste com pelo menos 5-8 tileTemplates
- Use emojis apropriados para icon
- Documente seu tema

❌ **NÃO FAÇA**:

- Não use underscores em IDs (use hífens)
- Não crie tiles com prompts muito genéricos
- Não esqueça de adicionar em ThemeContext.jsx
- Não use variáveis antigas `{target_company}`

## 12. Checklist Final

Antes de considerar seu tema completo:

- [ ] Tema adicionado em `base-themes.js`
- [ ] Tema adicionado em `ThemeContext.jsx`
- [ ] Cores adicionadas em `DynamicHeroSection.jsx` (se necessário)
- [ ] System prompt customizado (opcional)
- [ ] Pelo menos 5 tileTemplates criados
- [ ] Todos os prompts testados manualmente
- [ ] Landing tags mapeadas corretamente
- [ ] Pelo menos 1 campo required na landing
- [ ] Ícones do lucide-react verificados
- [ ] Tema testado end-to-end

## Exemplos de Referência

Consulte os temas existentes como exemplo:

- **Sales Assistant**: `dashboard/lib/base-themes.js` - linha ~3-120
- **Book Creator**: `dashboard/lib/base-themes.js` - linha ~126-310
- **Construction**: `dashboard/lib/base-themes.js` - linha ~253+

## Suporte

Em caso de dúvidas, verifique:

1. Logs do console do browser
2. Logs do servidor (terminal)
3. Estrutura dos temas existentes
4. Arquivo `NEW-THEME-GUIDE.md` (este arquivo)
