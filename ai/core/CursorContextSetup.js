/**
 * 🧠 Cursor Context Setup - Gerenciamento avançado de contexto
 * @-symbols, Architectural Diagrams, Self-gathering Context, MCP específicos
 */

import fs from "fs-extra";
import path from "path";
import chalk from "chalk";

export class CursorContextSetup {
  constructor(detection) {
    this.detection = detection;
    this.projectRoot = process.cwd();
    this.cursorDir = path.join(this.projectRoot, ".cursor");
  }

  /**
   * 🚀 Setup completo de context management
   */
  async setup() {
    console.log(chalk.blue("🧠 Configurando context management avançado..."));

    try {
      // 1. Guias de @-symbols
      await this.setupContextGuides();

      // 2. Architectural diagrams com Mermaid
      await this.setupArchitecturalDiagrams();

      // 3. Self-gathering context patterns
      await this.setupSelfGatheringPatterns();

      // 4. MCP servers específicos para web dev
      await this.setupWebDevelopmentMCP();

      // 5. Context optimization rules
      await this.setupContextOptimization();

      console.log(chalk.green("   ✓ Context management configurado"));
    } catch (error) {
      console.log(
        chalk.yellow(
          "   ⚠ Context management não foi configurado completamente"
        )
      );
      console.log(chalk.gray(`     ${error.message}`));
    }
  }

  /**
   * 📋 Configura guias de @-symbols e context menu
   */
  async setupContextGuides() {
    const contextGuide = `# 🧠 Context Management Guide

## 🎯 Tipos de Contexto

### Intent Context (O que você quer)
- **System prompts**: Instruções de alto nível
- **Task descriptions**: "Turn that button from blue to green"
- **Rules**: Padrões e convenções do projeto
- **Prescritivo**: Define o comportamento desejado

### State Context (O que existe)
- **Error messages**: Logs e stack traces
- **Code chunks**: Arquivos e funções relevantes
- **Images**: Screenshots e mockups
- **Console output**: Runtime behavior
- **Descritivo**: Descreve o estado atual

## 🔧 @-Symbols - Context Cirúrgico

### @code - Símbolos específicos
\`\`\`
@LRUCachedFunction
@UserController.authenticate
@CONFIG.database.url
\`\`\`
**Uso**: Quando você sabe exatamente qual função/variável é relevante
**Vantagem**: Máxima precisão
**Desvantagem**: Requer conhecimento detalhado do codebase

### @file - Arquivos específicos
\`\`\`
@cache.ts
@components/Button.tsx
@utils/validation.js
\`\`\`
**Uso**: Você sabe qual arquivo ler/editar, mas não onde exatamente
**Vantagem**: Contexto completo do arquivo
**Desvantagem**: Pode incluir código irrelevante

### @folder - Diretórios completos
\`\`\`
@utils/
@components/ui/
@src/services/
\`\`\`
**Uso**: Múltiplos arquivos em uma pasta são relevantes
**Vantagem**: Contexto amplo
**Desvantagem**: Muito contexto pode diluir o foco

## 🚨 Estados de Context Window

### ✅ Normal
Arquivo incluído completamente no contexto.

### 📝 Condensed
Arquivo muito grande - inclui apenas:
- Function signatures
- Class definitions
- Method headers
- Estrutura principal

### 📄 Significantly Condensed
Arquivo enorme - apenas nome do arquivo mostrado.

### ⚠️ Not Included
Arquivo muito grande para incluir, mesmo condensado.

## 💡 Dicas de Otimização

### Evitar Summarization
1. **Inicie nova conversa** para tarefas diferentes
2. **Use modelos** com context window maior
3. **Inclua menos contexto explícito** - deixe o agent decidir
4. **Switch para MAX mode** quando possível

### Context Strategy
1. **Start surgical**: Use @code para símbolos específicos
2. **Expand gradually**: Adicione @file se precisar de mais contexto
3. **Go broad**: Use @folder apenas quando necessário
4. **Let agent search**: Permita busca automática quando apropriado

## 🔄 Self-Gathering Context Pattern

### Debugging Dinâmico
\`\`\`javascript
// Adicione prints estratégicos
console.log('🔍 Debug - user data:', userData);
console.log('🔍 Debug - validation result:', isValid);

// Execute e deixe o Agent analisar a saída
npm run dev
npm test
\`\`\`

### Runtime Analysis
1. **Add debugging statements** nos pontos críticos
2. **Run code/tests** usando terminal
3. **Let Agent read output** e decidir próximos passos
4. **Iterate** baseado no comportamento real

## 📊 Context Window Management

### Typical Sizes
- **Claude 3.5 Sonnet**: ~200k tokens
- **GPT-4**: ~128k tokens
- **Claude 3.7 Sonnet**: ~200k tokens

### Token Usage Tips
- 1 token ≈ 0.75 words
- 1 line of code ≈ 5-15 tokens
- Large files can consume 1000s of tokens

## 🎯 Best Practices

### DO
✅ Be specific with @-symbols
✅ Start new conversations for new tasks  
✅ Use intent + state context together
✅ Let Agent gather context when uncertain
✅ Include runtime behavior when debugging

### DON'T
❌ Include massive files unnecessarily
❌ Continue long conversations indefinitely
❌ Provide only intent without state context
❌ Use @folder when @file would suffice
❌ Forget to check context window status
`;

    await fs.writeFile(
      path.join(this.cursorDir, "context-management.md"),
      contextGuide
    );
    console.log(chalk.green("     ✓ Context guides criados"));
  }

  /**
   * 📊 Configura architectural diagrams com Mermaid
   */
  async setupArchitecturalDiagrams() {
    const diagramGuide = `# 📊 Architectural Diagrams Guide

## 🎯 Por que Diagramas?

Diagramas clarificam:
- **Flow control**: Como requests fluem pelo sistema
- **Data lineage**: Rastreamento de dados de input a output  
- **Component interaction**: Como partes se comunicam
- **System structure**: Visão geral da arquitetura

## 🔧 Tipos de Diagrama Mermaid

### 1. Flowchart - Lógica e Sequências
\`\`\`mermaid
flowchart TD
    A[User Input] --> B{Validation}
    B -->|Valid| C[Process Data]
    B -->|Invalid| D[Show Error]
    C --> E[Save to DB]
    E --> F[Return Success]
\`\`\`

### 2. Sequence Diagram - Interações
\`\`\`mermaid
sequenceDiagram
    participant U as User
    participant S as Server
    participant D as Database
    
    U->>S: Submit Form
    S->>D: Save Entry
    D-->>S: Success
    S-->>U: Confirmation
\`\`\`

### 3. Class Diagram - Estrutura de Objetos
\`\`\`mermaid
classDiagram
    class User {
        +string name
        +string email
        +authenticate()
        +authorize()
    }
    
    class Order {
        +number total
        +Date created
        +process()
    }
    
    User "1" -- "many" Order
\`\`\`

### 4. Graph TD - Mapas Direcionais
\`\`\`mermaid
graph TD
    API[API Gateway]
    AUTH[Auth Service]
    USER[User Service]
    DB[(Database)]
    
    API --> AUTH
    API --> USER
    USER --> DB
    AUTH --> DB
\`\`\`

## 🚀 Estratégia de Diagramação

### 1. Start Small
- Escolha **uma função, rota ou processo**
- Peça ao Cursor: "Diagram this function using Mermaid"
- Foque em uma parte específica primeiro

### 2. Build Up (C4 Model)
- **Level 1**: Low-level components (funções, classes)
- **Level 2**: Mid-level systems (módulos, services)  
- **Level 3**: High-level application (arquitetura geral)

### 3. Combine & Refine
- Merge diagramas menores em visões maiores
- Abstraia detalhes conforme necessário
- Mantenha foco no objetivo

## 💡 Prompts Efetivos

### Flow Control
\`\`\`
"Show me how requests go from the controller to the database in a Mermaid flowchart"
\`\`\`

### Data Lineage  
\`\`\`
"Trace this userData variable from where it enters to where it ends up, using Mermaid sequence diagram"
\`\`\`

### Component Structure
\`\`\`
"Give me a component-level view of this ${
      this.detection.type
    } service using Mermaid class diagram"
\`\`\`

### Full System Map
\`\`\`
"Create a high-level architecture diagram of our ${
      this.detection.type
    } application using Mermaid graph"
\`\`\`

## 🔧 Setup Mermaid Extension

1. Abra **Extensions tab** no Cursor
2. Busque por **"Mermaid"**
3. Instale a extensão oficial
4. Agora você pode preview diagramas diretamente

## 📋 Templates por Stack

${this.generateDiagramTemplates()}

## 🎯 Best Practices

### DO
✅ Start with specific, small diagrams
✅ Use appropriate diagram type for the purpose
✅ Include start and end points clearly
✅ Ask Cursor to explain complex flows
✅ Iterate and refine diagrams

### DON'T  
❌ Try to diagram everything at once
❌ Mix different abstraction levels
❌ Create overly complex single diagrams
❌ Forget to specify Mermaid format
❌ Include irrelevant implementation details

## 🚀 Advanced Patterns

### Dynamic Diagrams
\`\`\`
"Generate a sequence diagram showing how our error handling works, include the actual error flow from our logs"
\`\`\`

### Interactive Analysis
\`\`\`
"Create a flowchart of this function, then show me where performance bottlenecks might occur"
\`\`\`

### Documentation Generation
\`\`\`
"Generate architectural diagrams for our API documentation, include all major endpoints"
\`\`\`
`;

    await fs.writeFile(
      path.join(this.cursorDir, "architectural-diagrams.md"),
      diagramGuide
    );
    console.log(chalk.green("     ✓ Architectural diagrams guide criado"));
  }

  /**
   * 🔄 Configura self-gathering context patterns
   */
  async setupSelfGatheringPatterns() {
    const selfGatheringGuide = `# 🔄 Self-Gathering Context Patterns

## 🎯 Conceito

Self-gathering context permite que o **Agent crie ferramentas temporárias** para coletar mais informações dinamicamente. Especialmente efetivo em workflows human-in-the-loop.

## 🔧 Debugging Dinâmico Pattern

### 1. Instrumentação Automática
\`\`\`javascript
// O Agent pode adicionar automaticamente:
console.log('🔍 DEBUG - Input received:', input);
console.log('🔍 DEBUG - Validation result:', validationResult);
console.log('🔍 DEBUG - Database query:', query);
console.log('🔍 DEBUG - Final output:', output);
\`\`\`

### 2. Execução e Análise
\`\`\`bash
# Agent roda automaticamente:
npm run dev
npm test
node debug-script.js
\`\`\`

### 3. Interpretação de Output
O Agent lê a saída do terminal e decide próximos passos baseado no comportamento real.

## 🚀 Patterns por Stack

### ${this.detection.type.toUpperCase()} Specific Patterns

${this.generateSelfGatheringPatterns()}

## 💡 Prompts Efetivos

### Debugging Investigation
\`\`\`
"Add debugging statements to track this variable flow, run the code, and analyze what's happening"
\`\`\`

### Performance Analysis
\`\`\`
"Instrument this function with timing logs, run it with sample data, and identify bottlenecks"
\`\`\`

### Error Tracing
\`\`\`
"Add error handling and logging to this flow, reproduce the error, and trace the root cause"
\`\`\`

### State Investigation
\`\`\`
"Add state dumps at key points, run through the user flow, and show me what's changing"
\`\`\`

## 🔧 Tools Creation Patterns

### 1. Temporary Debug Scripts
\`\`\`javascript
// debug-user-flow.js
const { processUser } = require('./userService');

async function debugUserFlow() {
  console.log('🔍 Starting user flow debug...');
  
  const testUser = { id: 1, name: 'Test User' };
  console.log('🔍 Input:', testUser);
  
  const result = await processUser(testUser);
  console.log('🔍 Result:', result);
  
  console.log('🔍 Debug complete!');
}

debugUserFlow();
\`\`\`

### 2. State Monitoring
\`\`\`javascript
// state-monitor.js
let stateChanges = [];

function logState(point, data) {
  stateChanges.push({
    point,
    data: JSON.parse(JSON.stringify(data)),
    timestamp: new Date().toISOString()
  });
  console.log(\`🔍 STATE[\${point}]:\`, data);
}

// Export para uso em outros arquivos
module.exports = { logState, stateChanges };
\`\`\`

### 3. Test Data Generation
\`\`\`javascript
// generate-test-data.js
function generateTestData(type) {
  const generators = {
    user: () => ({ id: Math.random(), name: \`User\${Date.now()}\` }),
    order: () => ({ id: Math.random(), total: Math.random() * 100 }),
    // ... mais geradores
  };
  
  return generators[type]();
}

console.log('🔍 Test data:', generateTestData('user'));
\`\`\`

## 🔍 Runtime Context Patterns

### Network Request Monitoring
\`\`\`javascript
// Interceptar todas as requests
const originalFetch = global.fetch;
global.fetch = (...args) => {
  console.log('🌐 FETCH:', args[0]);
  return originalFetch(...args).then(response => {
    console.log('🌐 RESPONSE:', response.status);
    return response;
  });
};
\`\`\`

### Database Query Logging
\`\`\`javascript
// Para Prisma/ORM
const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' }
  ]
});

prisma.$on('query', (e) => {
  console.log('🗄️ QUERY:', e.query);
  console.log('🗄️ PARAMS:', e.params);
});
\`\`\`

### Memory Usage Tracking
\`\`\`javascript
// memory-tracker.js
function trackMemory(label) {
  const used = process.memoryUsage();
  console.log(\`🧠 MEMORY[\${label}]:\`);
  for (let key in used) {
    console.log(\`  \${key}: \${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB\`);
  }
}
\`\`\`

## 🎯 Human-in-the-Loop Workflow

### 1. Agent Propõe Instrumentação
Agent sugere adicionar logs/debugging específicos.

### 2. Human Review
Você revisa o código antes da execução.

### 3. Execute & Analyze
Agent roda o código e analisa a saída.

### 4. Iterate
Baseado nos resultados, Agent propõe próximos passos.

## 🚨 Safety Considerations

### DO
✅ Review generated debugging code before execution
✅ Use temporary files for debugging scripts
✅ Clean up debugging statements after investigation
✅ Monitor resource usage during debugging
✅ Use meaningful debug labels

### DON'T
❌ Run debugging code in production
❌ Leave debug statements in final code
❌ Log sensitive information (passwords, tokens)
❌ Create infinite loops in debugging code
❌ Forget to remove temporary files

## 📊 Integration with Context Management

O self-gathering context trabalha em conjunto com:
- **@-symbols**: Para focar em áreas específicas
- **Rules**: Para manter padrões de debugging
- **MCP**: Para acessar ferramentas externas
- **Architectural diagrams**: Para visualizar o que foi descoberto
`;

    await fs.writeFile(
      path.join(this.cursorDir, "self-gathering-context.md"),
      selfGatheringGuide
    );
    console.log(chalk.green("     ✓ Self-gathering context patterns criados"));
  }

  /**
   * 🌐 Configura MCP servers específicos para web development
   */
  async setupWebDevelopmentMCP() {
    const webDevMCP = `# 🌐 Web Development MCP Servers

## 🎯 Overview

MCP (Model Context Protocol) servers específicos para desenvolvimento web que integram diretamente com ferramentas essenciais.

## 📊 Project Management

### Linear Integration
\`\`\`json
{
  "Linear": {
    "command": "npx",
    "args": ["-y", "mcp-remote", "https://mcp.linear.app/sse"]
  }
}
\`\`\`

**Funcionalidades:**
- ✅ Listar issues do projeto
- ✅ Criar novas issues
- ✅ Atualizar status de issues
- ✅ Conectar código com tarefas

**Prompts Úteis:**
\`\`\`
"List all issues related to this project"
"Create a new issue for this bug I found"
"Update the status of issue #123 to in progress"
\`\`\`

### Jira (Alternative)
Para projetos que usam Jira, configure um servidor MCP customizado.

## 🎨 Design Integration

### Figma MCP Server
\`\`\`json
{
  "Figma": {
    "url": "http://127.0.0.1:3845/sse"
  }
}
\`\`\`

**Setup Required:**
1. Install Figma Dev Mode MCP Server
2. Configure local server (port 3845)
3. Authenticate with Figma account

**Funcionalidades:**
- ✅ Access design files directly in Cursor
- ✅ Extract design tokens and measurements
- ✅ Generate code from Figma components
- ✅ Sync design system updates

**Prompts Úteis:**
\`\`\`
"Show me the designs from the current Figma selection"
"Generate React components from this Figma design"
"Extract color palette from this design file"
\`\`\`

## 🌐 Browser Tools

### Browser MCP Server
\`\`\`json
{
  "BrowserTools": {
    "command": "npx",
    "args": ["-y", "@browsertools/mcp-server"]
  }
}
\`\`\`

**Setup:** https://browsertools.agentdesk.ai/installation

**Funcionalidades:**
- ✅ Monitor console logs
- ✅ Track network requests
- ✅ Inspect DOM elements
- ✅ Performance monitoring
- ✅ Error tracking

**Prompts Úteis:**
\`\`\`
"Check the console logs for any errors"
"Monitor network requests during this user flow"
"Inspect the performance of this page load"
\`\`\`

## 📦 Package Management

### NPM Registry MCP
\`\`\`json
{
  "NPMRegistry": {
    "command": "npx",
    "args": ["-y", "mcp-npm-registry"]
  }
}
\`\`\`

**Funcionalidades:**
- ✅ Search packages
- ✅ Check version information
- ✅ Security vulnerability scanning
- ✅ Dependency analysis

## 🗄️ Database Integration

### Database MCP Servers
\`\`\`json
{
  "PostgreSQL": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/mydb"]
  },
  "MongoDB": {
    "command": "npx", 
    "args": ["-y", "mcp-mongodb", "mongodb://localhost:27017/mydb"]
  }
}
\`\`\`

## 🔧 Development Tools

### Git Integration
\`\`\`json
{
  "Git": {
    "command": "npx",
    "args": ["-y", "mcp-git"]
  }
}
\`\`\`

### Docker MCP
\`\`\`json
{
  "Docker": {
    "command": "npx",
    "args": ["-y", "mcp-docker"]
  }
}
\`\`\`

## 🚀 Deployment & Hosting

### Vercel MCP (para Next.js)
\`\`\`json
{
  "Vercel": {
    "command": "npx",
    "args": ["-y", "mcp-vercel"]
  }
}
\`\`\`

### AWS MCP
\`\`\`json
{
  "AWS": {
    "command": "npx",
    "args": ["-y", "mcp-aws"]
  }
}
\`\`\`

## 📊 Analytics & Monitoring

### Google Analytics MCP
\`\`\`json
{
  "Analytics": {
    "command": "npx",
    "args": ["-y", "mcp-google-analytics"]
  }
}
\`\`\`

## 🔧 Setup Instructions

### 1. Add to MCP Settings
1. Open Cursor Settings
2. Go to MCP Servers
3. Add server configuration
4. Reload server if needed

### 2. Authenticate
Most servers require authentication:
- Follow browser prompts
- Enter API keys when requested
- Grant necessary permissions

### 3. Verify Installation
Check MCP settings to see available tools for each server.

## 💡 Usage Patterns

### Tight Feedback Loop
\`\`\`
1. Check Linear issue → 2. Update Figma design → 3. Generate code → 4. Test in browser → 5. Deploy to Vercel
\`\`\`

### Debugging Workflow
\`\`\`
1. Monitor browser console → 2. Check network requests → 3. Inspect database queries → 4. Update issue status
\`\`\`

### Design-to-Code Workflow
\`\`\`
1. Access Figma designs → 2. Extract components → 3. Generate React code → 4. Test responsiveness → 5. Deploy
\`\`\`

## 🎯 Best Practices

### DO
✅ Start with essential integrations (Linear, Figma, Browser)
✅ Authenticate properly with each service
✅ Use specific prompts that mention the tool
✅ Monitor server status in MCP settings
✅ Combine multiple MCP servers for workflows

### DON'T
❌ Install too many MCP servers at once
❌ Forget to reload servers after configuration
❌ Share authentication tokens in prompts
❌ Rely solely on MCP - combine with manual verification
❌ Ignore server errors in MCP settings

## 🚨 Troubleshooting

### Server Not Working
1. Check MCP settings for server status
2. Try "Reload" server option
3. Verify authentication
4. Check server logs
5. Re-install server if needed

### Authentication Issues
1. Clear browser cache
2. Re-authenticate with service
3. Check API key permissions
4. Verify server URL

### Missing Tools
1. Verify server is running
2. Check server documentation
3. Update server to latest version
4. Contact server maintainer
`;

    await fs.writeFile(
      path.join(this.cursorDir, "web-development-mcp.md"),
      webDevMCP
    );
    console.log(chalk.green("     ✓ Web development MCP guide criado"));
  }

  /**
   * ⚡ Configura context optimization rules
   */
  async setupContextOptimization() {
    const optimizationRules = `---
description: Context optimization strategies for efficient AI coding
globs: ["**/*"]
alwaysApply: false
---

# ⚡ Context Optimization Rules

## 🎯 Context Strategy

### When to use @-symbols:
- **@code**: Know exact function/variable name
- **@file**: Need full file context but not sure where
- **@folder**: Multiple related files needed

### When to let Agent search:
- Exploring unfamiliar codebase
- Need related patterns discovery
- Investigating cross-file dependencies

## 🧠 Memory Management

### Avoid context window overflow:
- Start new conversations for different tasks
- Use condensed view for large files
- Let Agent summarize when needed
- Switch to models with larger context windows

### Optimize context relevance:
- Be specific about what you want to achieve
- Include error messages and stack traces
- Provide both intent and state context
- Use architectural diagrams for complex flows

## 🔄 Self-Gathering Patterns

### Debugging workflow:
1. Add strategic console.log statements
2. Run code/tests via terminal
3. Let Agent analyze output
4. Iterate based on runtime behavior

### Investigation approach:
- Create temporary debugging scripts
- Monitor state changes at key points
- Track performance metrics
- Capture network requests and responses

## 🎨 Design-to-Code Context

### When working with designs:
- Reference Figma components via MCP
- Include design system documentation
- Use component library rules
- Maintain consistency with existing patterns

### Component reuse strategy:
- Always check existing ui components first
- Create new components by composing existing ones
- Ask human when missing components found
- Document new patterns in rules

## 📊 Architectural Context

### Diagram strategy:
- Start with specific component/function
- Use appropriate Mermaid diagram type
- Build from low-level to high-level view
- Combine related diagrams into system map

### Flow documentation:
- Map data flow from input to output
- Show error handling paths
- Include async operations clearly
- Document side effects and state changes
`;

    await fs.writeFile(
      path.join(this.cursorDir, "rules", "context-optimization.mdc"),
      optimizationRules
    );
    console.log(chalk.green("     ✓ Context optimization rules criadas"));
  }

  // ============ MÉTODOS AUXILIARES ============

  /**
   * 📊 Gera templates de diagramas específicos por stack
   */
  generateDiagramTemplates() {
    const templates = {
      nextjs: `
### Next.js Architecture Template
\`\`\`mermaid
graph TD
    Client[Client Browser]
    Router[App Router]
    Page[Page Component]
    Layout[Layout Component]
    API[API Route]
    DB[(Database)]
    
    Client --> Router
    Router --> Layout
    Layout --> Page
    Page --> API
    API --> DB
\`\`\``,
      react: `
### React Component Flow Template
\`\`\`mermaid
flowchart TD
    Props[Props] --> Component[React Component]
    Component --> State[Local State]
    Component --> Effect[useEffect]
    Effect --> API[API Call]
    API --> State
    State --> Render[Re-render]
\`\`\``,
      "node-api": `
### Node.js API Template
\`\`\`mermaid
sequenceDiagram
    participant C as Client
    participant R as Router
    participant M as Middleware
    participant Ctrl as Controller
    participant S as Service
    participant DB as Database
    
    C->>R: HTTP Request
    R->>M: Route Match
    M->>Ctrl: Process Request
    Ctrl->>S: Business Logic
    S->>DB: Data Query
    DB-->>S: Result
    S-->>Ctrl: Response
    Ctrl-->>C: HTTP Response
\`\`\``,
    };

    return templates[this.detection.type] || templates.react;
  }

  /**
   * 🔄 Gera patterns de self-gathering específicos por stack
   */
  generateSelfGatheringPatterns() {
    const patterns = {
      nextjs: `
### Next.js Debug Patterns
\`\`\`javascript
// Debugging Server Components
console.log('🔍 Server Component render:', { props, searchParams });

// Debugging API Routes
console.log('🔍 API Route called:', req.method, req.url);
console.log('🔍 Request body:', await req.json());

// Debugging Client Components
'use client';
console.log('🔍 Client Component state:', state);
\`\`\``,
      react: `
### React Debug Patterns
\`\`\`javascript
// Debugging Hooks
useEffect(() => {
  console.log('🔍 Effect triggered:', dependencies);
}, [dependencies]);

// Debugging State Updates
const [state, setState] = useState(initialState);
const debugSetState = (newState) => {
  console.log('🔍 State update:', { from: state, to: newState });
  setState(newState);
};

// Debugging Props Changes
useEffect(() => {
  console.log('🔍 Props changed:', props);
}, [props]);
\`\`\``,
      "node-api": `
### Node.js API Debug Patterns
\`\`\`javascript
// Debugging Middleware
app.use((req, res, next) => {
  console.log('🔍 Request:', req.method, req.path, req.body);
  next();
});

// Debugging Controllers
async function userController(req, res) {
  console.log('🔍 Controller input:', req.params, req.body);
  const result = await userService.process(req.body);
  console.log('🔍 Controller output:', result);
  res.json(result);
}

// Debugging Database Queries
const result = await db.query(sql, params);
console.log('🔍 DB Query:', sql, params, 'Result:', result.rowCount);
\`\`\``,
    };

    return patterns[this.detection.type] || patterns.react;
  }
}

export default CursorContextSetup;
