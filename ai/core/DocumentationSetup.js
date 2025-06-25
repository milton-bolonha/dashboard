/**
 * 📚 Documentation Setup - Estratégias completas de documentação
 * Baseado na documentação oficial: docs.cursor.com/editor/advanced
 */

import fs from "fs-extra";
import path from "path";
import chalk from "chalk";

export class DocumentationSetup {
  constructor(detection) {
    this.detection = detection;
    this.projectRoot = process.cwd();
    this.cursorDir = path.join(this.projectRoot, ".cursor");
  }

  /**
   * 📚 Setup completo de estratégias de documentação
   */
  async setup() {
    console.log(
      chalk.blue("📚 Configurando estratégias avançadas de documentação...")
    );

    try {
      // 1. Configurar decision tree para documentação
      await this.setupDocumentationDecisionTree();

      // 2. Configurar @Docs patterns por stack
      await this.setupDocsPatterns();

      // 3. Configurar @Web search strategies
      await this.setupWebSearchStrategies();

      // 4. Configurar MCP para documentação interna
      await this.setupInternalDocumentationMCP();

      // 5. Configurar auto-geração de documentação
      await this.setupDocumentationGeneration();

      // 6. Configurar manutenção de documentação
      await this.setupDocumentationMaintenance();

      console.log(chalk.green("   ✓ Estratégias de documentação configuradas"));
    } catch (error) {
      console.log(
        chalk.yellow(
          "   ⚠ Documentation setup não foi configurado completamente"
        )
      );
      console.log(chalk.gray(`     ${error.message}`));
    }
  }

  /**
   * 🌳 Configura decision tree para documentação
   */
  async setupDocumentationDecisionTree() {
    const decisionTreeGuide = `# 🌳 Documentation Decision Tree

## 🎯 **QUAL FERRAMENTA USAR?**

Use esta árvore de decisão para determinar rapidamente a melhor abordagem:

\`\`\`mermaid
flowchart TD
    A[Que informação você precisa?] --> B[Frameworks/libraries públicos]
    A --> C[Informação interna da empresa]
    
    B --> D[Documentação oficial necessária?]
    D -->|Sim| E[@Docs - API references, guias, best practices]
    D -->|Não| F[Conhecimento recente da comunidade?]
    F -->|Sim| G[@Web - Tutoriais, troubleshooting recente]
    F -->|Não| H[@Web - Comparações, posts da comunidade]
    
    C --> I[Integração MCP existente disponível?]
    I -->|Sim| J[MCP Existente - Confluence, Google Drive, Notion]
    I -->|Não| K[Build Custom MCP - APIs internas, sistemas proprietários]
\`\`\`

## 🧠 **MENTAL MODELS**

### @Docs → Como navegar documentação oficial
- **Use para**: API references atuais, guias getting started, best practices oficiais
- **Quando**: Você precisa de informação **autoritativa** e **atual**
- **Exemplo**: \`@Docs Next.js How do I set up dynamic routing with catch-all routes?\`

### @Web → Como pesquisar soluções na internet
- **Use para**: Tutoriais recentes, comparações, troubleshooting da comunidade
- **Quando**: Você precisa de **múltiplas perspectivas** ou **soluções recentes**
- **Exemplo**: \`@Web latest performance optimizations for React 19\`

### MCP → Como acessar documentação interna
- **Use para**: APIs internas, padrões da empresa, conhecimento proprietário
- **Quando**: Você precisa de **contexto específico da organização**
- **Exemplo**: MCP Confluence para acessar architecture docs internas

## ⚠️ **MODEL KNOWLEDGE CUTOFF**

### Por que documentação importa:
- **Training data limitado**: Modelos são treinados até data específica
- **Updates recentes**: Features lançadas após cutoff não são conhecidas
- **API changes**: Mudanças em APIs não são refletidas
- **Best practices**: Práticas podem ter evoluído desde o training

### Exemplo prático:
Se o model cutoff é início de 2024:
- ❌ **Não sabe**: Features do React 19 (lançado final 2024)
- ❌ **Não sabe**: Next.js 15 new features
- ❌ **Não sabe**: Novas APIs do TypeScript 5.6+
- ✅ **Sabe**: React 18, Next.js 14, TypeScript 5.4

## 🚀 **WORKFLOWS POR TIPO DE INFORMAÇÃO**

### 📖 **Public Framework Documentation**
\`\`\`
Cenário: Implementar feature nova em Next.js 15

1. @Docs Next.js → Documentação oficial atual
2. @Web → Tutoriais da comunidade se necessário
3. @Past Chats → Implementações similares anteriores
4. Implementar com contexto completo
\`\`\`

### 🌐 **Recent Community Knowledge**
\`\`\`
Cenário: Resolver erro específico do React 19

1. @Web → "React 19 [error message] solution"
2. @Web → GitHub issues relacionados
3. @Docs React → Verificar documentação oficial
4. Aplicar solução mais robusta
\`\`\`

### 🏢 **Internal Company Information**
\`\`\`
Cenário: Integrar com API interna da empresa

1. MCP Confluence → Architecture docs
2. MCP Internal APIs → Endpoint specifications
3. @Past Chats → Integrações similares anteriores
4. @Notepads → Padrões internos estabelecidos
\`\`\`

## 🎯 **BEST PRACTICES**

### Para @Docs:
- **Seja específico**: "Como configurar middleware" vs "documentação geral"
- **Inclua contexto**: Mencione sua stack/versão se relevante
- **Combine com @Web**: Para examples/tutorials se oficial for muito técnico

### Para @Web:
- **Use termos específicos**: Inclua versões, error messages exatos
- **Filtre por data**: "2024" ou "latest" para informação recente
- **Valide informação**: Cross-reference com @Docs quando possível

### Para MCP:
- **Configure uma vez**: Setup MCP servers para acesso contínuo
- **Organize por domínio**: Separate MCP configs por área (backend, frontend, DevOps)
- **Mantenha atualizado**: Regular sync com internal docs
`;

    await fs.writeFile(
      path.join(this.cursorDir, "documentation-decision-tree.md"),
      decisionTreeGuide
    );
    console.log(chalk.green("     ✓ Documentation decision tree criado"));
  }

  /**
   * 📖 Configura @Docs patterns por stack
   */
  async setupDocsPatterns() {
    const docsPatterns = this.generateDocsPatterns();

    const docsGuide = `# 📖 @Docs Patterns por Stack

## 🎯 **STACK-SPECIFIC @DOCS USAGE**

${docsPatterns}

## 🚀 **COMMON @DOCS WORKFLOWS**

### API Reference Workflow
\`\`\`
1. @Docs [Framework] → Find relevant API
2. Check parameters and return types
3. Look for usage examples
4. Implement with proper error handling
\`\`\`

### Setup & Configuration Workflow
\`\`\`
1. @Docs [Tool] getting started → Basic setup
2. @Docs [Tool] configuration → Advanced options  
3. @Web → Community best practices
4. Adapt to your project structure
\`\`\`

### Debugging Workflow
\`\`\`
1. @Docs [Framework] troubleshooting → Official debug guide
2. @Web → Community solutions for specific error
3. @Git → Check if recent changes caused issue
4. Apply most authoritative solution
\`\`\`

## 💡 **PRO TIPS**

### Combine @Docs with other symbols:
\`\`\`
@Docs Next.js routing
@Files app/layout.tsx
@Past Chats routing implementation

"Update my routing structure following Next.js 15 best practices"
\`\`\`

### Use @Docs for validation:
\`\`\`
@Docs React hooks rules
@Code my-custom-hook.ts

"Validate if my custom hook follows React best practices"
\`\`\`

### Cross-reference with @Web:
\`\`\`
@Docs TypeScript generics
@Web TypeScript generics real world examples

"Implement type-safe API client with proper generics"
\`\`\`
`;

    await fs.writeFile(
      path.join(this.cursorDir, "docs-patterns.md"),
      docsGuide
    );
    console.log(chalk.green("     ✓ @Docs patterns configurados"));
  }

  /**
   * 🌐 Configura @Web search strategies
   */
  async setupWebSearchStrategies() {
    const webStrategies = `# 🌐 @Web Search Strategies

## 🎯 **QUANDO USAR @WEB**

### ✅ **Use @Web para:**
- **Tutoriais recentes**: Community-generated content com examples práticos
- **Comparações**: Articles comparando diferentes approaches/libraries
- **Updates muito recentes**: Features lançadas após model cutoff
- **Troubleshooting**: GitHub issues, Stack Overflow solutions
- **Multiple perspectives**: Diferentes approaches para mesmo problema
- **Performance tips**: Benchmarks e optimizations da comunidade

### ❌ **NÃO use @Web para:**
- **Documentação oficial**: Use @Docs instead
- **Informação básica**: Se @Docs tem a resposta autoritativa
- **Informação interna**: Use MCP para company-specific docs

## 🚀 **SEARCH PATTERNS EFICAZES**

### 🔍 **Recent Updates & Features**
\`\`\`
@Web "React 19 new features 2024"
@Web "Next.js 15 app router changes"
@Web "TypeScript 5.6 latest features"
\`\`\`

### 🐛 **Error Resolution**
\`\`\`
@Web "[exact error message] solution"
@Web "React hydration error fix 2024"
@Web "Next.js build error [specific error]"
\`\`\`

### ⚡ **Performance & Optimization**
\`\`\`
@Web "React performance optimization techniques 2024"
@Web "Next.js bundle size optimization"
@Web "TypeScript compilation speed improvements"
\`\`\`

### 🔄 **Migration & Upgrades**
\`\`\`
@Web "migrate from React 18 to React 19"
@Web "Next.js 14 to 15 migration guide"
@Web "upgrade TypeScript 5.5 to 5.6"
\`\`\`

### 🆚 **Comparisons & Alternatives**
\`\`\`
@Web "React vs Vue 2024 comparison"
@Web "Next.js vs Remix performance"
@Web "TypeScript vs JavaScript benefits"
\`\`\`

## 🎯 **SEARCH OPTIMIZATION TIPS**

### Include Version Numbers:
- ✅ "React 19 suspense patterns"
- ❌ "React suspense patterns"

### Use Temporal Qualifiers:
- ✅ "latest", "2024", "recent", "new"
- ✅ "modern JavaScript techniques 2024"

### Be Specific with Stack:
- ✅ "Next.js 15 app router middleware"
- ❌ "Next.js middleware"

### Include Error Messages:
- ✅ "TypeError: Cannot read property of undefined React"
- ❌ "React error"

### Community Sources:
- ✅ "GitHub issues", "Stack Overflow"
- ✅ "React 19 GitHub issues performance"

## 🔄 **VALIDATION WORKFLOW**

Sempre valide informações do @Web:

\`\`\`
1. @Web → Encontrar solução/approach
2. @Docs → Verificar se é approach oficial/recomendado
3. @Past Chats → Check se já implementamos algo similar
4. Test → Implementar e validar em seu contexto
\`\`\`

## 💡 **COMBINING @WEB WITH OTHER SYMBOLS**

### Research → Implementation:
\`\`\`
@Web "React 19 form validation best practices"
@Docs React forms
@Files components/form.tsx
@Past Chats form implementations

"Implement modern form validation following React 19 patterns"
\`\`\`

### Error → Solution:
\`\`\`
@Web "[specific error message] fix"
@Git recent changes
@Files error-file.tsx
@Lint Errors current errors

"Fix this error using community-validated solution"
\`\`\`

### Learning → Application:
\`\`\`
@Web "advanced TypeScript patterns 2024"
@Docs TypeScript advanced types
@Code existing-types.ts

"Refactor types using modern TypeScript patterns"
\`\`\`

## 🏆 **ADVANCED @WEB TECHNIQUES**

### Multi-Step Research:
\`\`\`
Step 1: @Web "React 19 concurrent features overview"
Step 2: @Web "React 19 concurrent features examples"
Step 3: @Docs React concurrent features
Step 4: Implement with full context
\`\`\`

### Comparative Analysis:
\`\`\`
@Web "React state management 2024 comparison"
@Web "Zustand vs Redux Toolkit 2024"
@Web "React Context vs external state"

Compare and choose best approach for our use case
\`\`\`

### Trend Analysis:
\`\`\`
@Web "React development trends 2024"
@Web "JavaScript ecosystem changes 2024"
@Web "frontend framework adoption 2024"

Understand where ecosystem is heading
\`\`\`
`;

    await fs.writeFile(
      path.join(this.cursorDir, "web-search-strategies.md"),
      webStrategies
    );
    console.log(chalk.green("     ✓ @Web search strategies configuradas"));
  }

  /**
   * 🏢 Configura MCP para documentação interna
   */
  async setupInternalDocumentationMCP() {
    const mcpConfig = this.generateMCPConfig();
    const mcpGuide = `# 🏢 Internal Documentation with MCP

## 🎯 **MCP FOR INTERNAL DOCS**

Model Context Protocol conecta Cursor aos seus sistemas internos de documentação.

### 🤔 **Por que MCP importa:**
- Models não conseguem "adivinhar" convenções internas
- API documentation para serviços custom não é pública
- Business logic e domain knowledge são únicos da organização
- Compliance e security requirements variam por empresa

## 🔧 **COMMON MCP INTEGRATIONS**

### 📊 **Enterprise Platforms**

#### Confluence
\`\`\`json
{
  "mcpServers": {
    "confluence": {
      "command": "npx",
      "args": ["-y", "@mcp/confluence"],
      "env": {
        "CONFLUENCE_URL": "https://your-company.atlassian.net",
        "CONFLUENCE_TOKEN": "your-api-token"
      }
    }
  }
}
\`\`\`

**Access**: Company Confluence spaces
**Examples**: 
- Architecture documentation
- API specifications for internal services
- Coding standards and guidelines
- Process documentation

#### Google Drive
\`\`\`json
{
  "mcpServers": {
    "google-drive": {
      "command": "npx",
      "args": ["-y", "@mcp/google-drive"],
      "env": {
        "GOOGLE_CLIENT_ID": "your-client-id",
        "GOOGLE_CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
\`\`\`

**Access**: Shared documents and folders
**Examples**:
- Specification documents
- Meeting notes and decision records
- Design documents and requirements
- Team knowledge bases

#### Notion
\`\`\`json
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["-y", "@mcp/notion"],
      "env": {
        "NOTION_TOKEN": "your-integration-token"
      }
    }
  }
}
\`\`\`

**Access**: Workspace databases and pages
**Examples**:
- Project documentation
- Team wikis and knowledge bases
- Product requirements
- Technical specifications

## 🛠️ **CUSTOM MCP SERVERS**

Para necessidades únicas, você pode build custom MCP servers:

### 📚 **Internal Docs Scraper**
\`\`\`typescript
${this.generateCustomMCPExample()}
\`\`\`

### 🔧 **Custom Integrations**
- **Scrape internal websites** ou portals
- **Connect to proprietary databases**
- **Access custom documentation systems**
- **Pull from internal wikis** ou knowledge bases

## 🚀 **MCP WORKFLOWS**

### 🏗️ **Architecture Documentation**
\`\`\`
MCP Confluence → Architecture docs
@Past Chats → Previous architecture discussions
@Files → Current implementation
@Git → Recent architectural changes

"Update service architecture following our internal patterns"
\`\`\`

### 🔌 **API Integration**
\`\`\`
MCP Internal APIs → Endpoint specifications
MCP Google Drive → Integration requirements
@Files → Current API client
@Notepads → Internal API patterns

"Implement integration with internal user service API"
\`\`\`

### 📋 **Compliance & Standards**
\`\`\`
MCP Confluence → Coding standards
MCP Notion → Security requirements
@Cursor Rules → Project-specific rules
@Files → Code to validate

"Review code for compliance with company standards"
\`\`\`

## 💡 **SETUP RECOMMENDATIONS**

### 🎯 **Project .cursor/mcp.json**
Para tools específicos do projeto:
\`\`\`json
${JSON.stringify(mcpConfig.project, null, 2)}
\`\`\`

### 🌐 **Global ~/.cursor/mcp.json**
Para tools usados em todos os projetos:
\`\`\`json
${JSON.stringify(mcpConfig.global, null, 2)}
\`\`\`

## 🔒 **SECURITY BEST PRACTICES**

### Environment Variables:
- **Never commit** API keys ou tokens
- **Use .env files** para development
- **Use secure vaults** para production
- **Rotate tokens** regularmente

### Access Control:
- **Principle of least privilege**: Apenas acesso necessário
- **Team-based access**: Different tokens para different teams
- **Audit access**: Monitor what's being accessed via MCP
- **Document permissions**: Clear guidelines sobre access

## 📊 **MONITORING & MAINTENANCE**

### Performance:
- **Monitor MCP response times**
- **Cache frequently accessed docs**
- **Use appropriate transport types**
- **Optimize for team usage patterns**

### Content Freshness:
- **Regular sync** com internal systems
- **Deprecation warnings** para outdated docs
- **Version control** para documentation changes
- **Team notifications** quando docs importantes mudam
`;

    await fs.writeFile(
      path.join(this.cursorDir, "internal-documentation-mcp.md"),
      mcpGuide
    );

    // Criar configuração MCP prática
    await fs.writeFile(
      path.join(this.cursorDir, "mcp-templates.json"),
      JSON.stringify(mcpConfig, null, 2)
    );

    console.log(chalk.green("     ✓ Internal documentation MCP configurado"));
  }

  /**
   * 📝 Configura auto-geração de documentação
   */
  async setupDocumentationGeneration() {
    const generationGuide = `# 📝 Documentation Generation with Cursor

## 🎯 **GENERATING DOCS FROM CODE**

Cursor pode create documentation diretamente do seu codebase:

### 📋 **API Documentation**
\`\`\`
@Files api/routes/user.js
@Files api/models/User.js

"Generate comprehensive API documentation for the user endpoints, including:
- All endpoints with HTTP methods
- Request/response schemas
- Authentication requirements
- Error codes and messages
- Usage examples"
\`\`\`

### 💬 **JSDoc Comments**
\`\`\`
@Code UserService.createUser
@Code UserService.updateUser

"Add comprehensive JSDoc comments following TypeScript standards:
- Parameter descriptions with types
- Return type documentation
- Example usage
- Error conditions"
\`\`\`

### 📖 **README Creation**
\`\`\`
@Files package.json
@Folders src/
@Files .env.example

"Create comprehensive README.md including:
- Project description and features
- Installation and setup instructions
- Environment variables explanation
- API usage examples
- Contributing guidelines"
\`\`\`

## 💬 **GENERATING DOCS FROM CONVERSATIONS**

Suas conversas com Cursor contêm valuable intent que pode virar documentação:

### 🔧 **Problem Solving Documentation**
Após resolver problema complexo:
\`\`\`
@Past Chats authentication setup

"Summarize our authentication implementation into a step-by-step guide for the team wiki, including:
- Setup process
- Common pitfalls
- Troubleshooting steps
- Security considerations"
\`\`\`

### 🏗️ **Architecture Documentation**
Após discussion sobre architecture:
\`\`\`
@Past Chats microservices architecture

"Create architecture documentation from our discussion including:
- Service dependencies diagram
- Data flow explanation
- Deployment considerations
- Monitoring and logging strategy"
\`\`\`

### 🐛 **Debugging Guides**
Após resolver bugs complexos:
\`\`\`
@Past Chats memory leak debugging

"Create debugging guide for memory leaks including:
- Detection methods
- Common causes in our stack
- Step-by-step debugging process
- Prevention strategies"
\`\`\`

## 🚀 **DOCUMENTATION WORKFLOWS**

### 📋 **Feature Documentation Workflow**
\`\`\`
1. Implement feature with Cursor
2. @Past Chats → Capture implementation decisions
3. Generate user documentation
4. Create developer documentation  
5. Add to team knowledge base via MCP
\`\`\`

### 🔄 **API Documentation Workflow**
\`\`\`
1. @Files → Include all API files
2. Generate OpenAPI spec
3. Create usage examples
4. Add authentication docs
5. Update internal wiki via MCP
\`\`\`

### 🎯 **Onboarding Documentation Workflow**
\`\`\`
1. @Folders → Include project structure
2. @Files → Key configuration files
3. Generate setup guide
4. Create troubleshooting section
5. Add team best practices
\`\`\`

## 📊 **DOCUMENTATION TEMPLATES**

### 🔧 **Technical Specification Template**
\`\`\`markdown
# [Feature Name] Technical Specification

## Overview
[Generated from Cursor conversation]

## Architecture
[Mermaid diagram generated by Cursor]

## Implementation Details
[Code snippets and explanations]

## API Reference
[Generated from JSDoc comments]

## Testing Strategy
[Test cases and coverage]

## Deployment
[Infrastructure and deployment notes]
\`\`\`

### 📋 **Runbook Template**
\`\`\`markdown
# [Service Name] Runbook

## Service Overview
[Generated from codebase analysis]

## Common Operations
[Step-by-step procedures]

## Troubleshooting
[Generated from past debugging sessions]

## Monitoring & Alerts
[Metrics and alert configurations]

## Escalation Procedures
[Contact information and processes]
\`\`\`

## 💡 **ADVANCED GENERATION TECHNIQUES**

### 🔄 **Iterative Documentation**
\`\`\`
Step 1: Generate basic structure
Step 2: Add technical details
Step 3: Include examples and use cases
Step 4: Add troubleshooting and FAQs
Step 5: Review and refine
\`\`\`

### 🎯 **Audience-Specific Documentation**
\`\`\`
# For Developers:
@Code → Technical implementation details
@Files → Code examples and patterns

# For Users:
@Docs → User-facing features
@Web → Best practices and tutorials

# For DevOps:
@Files docker-compose.yml
@Files .github/workflows/
Infrastructure and deployment guides
\`\`\`

### 📈 **Living Documentation**
\`\`\`
1. Generate initial docs from code
2. Update docs as code changes
3. Add insights from team conversations
4. Validate accuracy with automated tests
5. Keep docs in sync with implementation
\`\`\`
`;

    await fs.writeFile(
      path.join(this.cursorDir, "documentation-generation.md"),
      generationGuide
    );
    console.log(chalk.green("     ✓ Documentation generation configurado"));
  }

  /**
   * 🔄 Configura manutenção de documentação
   */
  async setupDocumentationMaintenance() {
    const maintenanceGuide = `# 🔄 Documentation Maintenance

## 🎯 **KEEPING DOCS UP TO DATE**

Documentation becomes stale quickly. Estratégias para manter atual:

### 📅 **Regular Review Cycle**
\`\`\`
Weekly: Review docs related to recent changes
Monthly: Comprehensive documentation audit
Quarterly: Architecture and process documentation review
Annually: Complete documentation overhaul
\`\`\`

### 🔄 **Code-Driven Updates**
\`\`\`
@Git recent changes in api/
@Files api/CHANGELOG.md
@Past Chats API modifications

"Update API documentation to reflect recent changes:
- New endpoints and parameters
- Deprecated features
- Breaking changes and migration guide"
\`\`\`

### 💬 **Conversation-Driven Updates**
\`\`\`
@Past Chats troubleshooting database issues
@Notepads database-troubleshooting-guide

"Update database troubleshooting guide with new issues and solutions from recent conversations"
\`\`\`

## 🚨 **IDENTIFYING STALE DOCUMENTATION**

### 📊 **Automated Detection**
\`\`\`
@Files docs/
@Git changes since last doc update
@Web current best practices for [technology]

"Identify which documentation needs updates based on:
- Code changes since last doc update
- New best practices in the ecosystem
- Team feedback and pain points"
\`\`\`

### 🔍 **Manual Review Indicators**
- **404 links** em documentation
- **Outdated screenshots** que não match current UI
- **Version mismatches** entre docs e actual implementation
- **Team questions** about documented processes
- **Deployment failures** seguindo documented procedures

## 🛠️ **MAINTENANCE WORKFLOWS**

### 🔄 **Post-Release Documentation Update**
\`\`\`
1. @Git → Review all changes in release
2. @Files → Check affected documentation files
3. @Web → Research any new best practices
4. Update docs to reflect changes
5. MCP → Push updates to internal wiki
\`\`\`

### 📋 **Feature Documentation Lifecycle**
\`\`\`
Planning Phase:
- @Past Chats → Capture requirements discussion
- Create technical specification

Implementation Phase:
- @Code → Document implementation decisions
- Update API documentation
- Create usage examples

Testing Phase:
- Document test cases and coverage
- Create troubleshooting guides

Release Phase:
- Update user documentation
- Create migration guides if needed
- Notify team of documentation updates

Post-Release:
- Monitor for user questions
- Update based on real usage
- Add FAQ section from support tickets
\`\`\`

## 📈 **DOCUMENTATION METRICS**

### 📊 **Quality Indicators**
- **Freshness**: Last update date vs code changes
- **Completeness**: Coverage of features and APIs
- **Accuracy**: Match between docs e implementation
- **Usability**: Team feedback e usage analytics

### 🎯 **Tracking Success**
\`\`\`
@Past Chats team onboarding
@Notepads documentation feedback

"Analyze documentation effectiveness:
- Time to productivity for new team members
- Frequency of documentation-related questions
- Success rate of following documented procedures"
\`\`\`

## 🤖 **AUTOMATED MAINTENANCE**

### 📋 **Cursor-Assisted Maintenance**
\`\`\`
# Weekly documentation review prompt:
@Git changes this week
@Files docs/
@Past Chats documentation updates

"Review and update documentation for this week's changes:
1. Identify files that need doc updates
2. Suggest specific changes needed
3. Flag any breaking changes requiring migration guides"
\`\`\`

### 🔄 **Continuous Integration**
\`\`\`
# Add to CI/CD pipeline:
1. Check for outdated documentation
2. Validate code examples in docs
3. Test documented procedures
4. Generate updated API docs
5. Notify team of required updates
\`\`\`

## 💡 **ADVANCED MAINTENANCE STRATEGIES**

### 🎯 **Documentation-as-Code**
- **Version control**: Track doc changes com Git
- **Code reviews**: Review documentation changes
- **Automated testing**: Test code examples em docs
- **Deployment**: Auto-deploy doc updates

### 🔄 **Feedback Loops**
\`\`\`
@Past Chats support tickets
@Notepads common issues

"Create feedback loop for documentation improvements:
1. Analyze support ticket patterns
2. Identify documentation gaps
3. Update docs to address common issues
4. Monitor if updates reduce similar tickets"
\`\`\`

### 📊 **Documentation Analytics**
- **Usage tracking**: Which docs are accessed most
- **Search analytics**: What people search for
- **Exit points**: Where people leave documentation
- **Conversion tracking**: Docs → successful task completion

## 🏆 **BEST PRACTICES SUMMARY**

### ✅ **Do:**
- **Link docs to code**: Use @Files to maintain connection
- **Update incrementally**: Small, frequent updates
- **Use team conversations**: @Past Chats para capture knowledge
- **Validate accuracy**: Test documented procedures
- **Gather feedback**: Regular team input on doc quality

### ❌ **Don't:**
- **Let docs drift**: Regular maintenance is crucial
- **Document everything**: Focus on high-value documentation
- **Ignore user feedback**: Team pain points indicate doc issues
- **Forget migration**: Document breaking changes
- **Work in isolation**: Collaborate on documentation efforts
`;

    await fs.writeFile(
      path.join(this.cursorDir, "documentation-maintenance.md"),
      maintenanceGuide
    );
    console.log(chalk.green("     ✓ Documentation maintenance configurado"));
  }

  // ============ MÉTODOS AUXILIARES ============

  generateDocsPatterns() {
    const patterns = {
      nextjs: `### Next.js @Docs Patterns
\`\`\`
@Docs Next.js app router → Routing and layouts
@Docs Next.js API routes → Backend endpoints
@Docs Next.js server components → SSR patterns
@Docs Next.js middleware → Request processing
@Docs Next.js deployment → Vercel optimization
\`\`\``,

      react: `### React @Docs Patterns
\`\`\`
@Docs React hooks → State management patterns
@Docs React context → Global state sharing
@Docs React concurrent features → Performance optimization
@Docs React testing library → Component testing
@Docs React error boundaries → Error handling
\`\`\``,

      vue: `### Vue.js @Docs Patterns
\`\`\`
@Docs Vue composition API → Modern component patterns
@Docs Vue router → Client-side routing
@Docs Pinia → State management
@Docs Vue testing → Component and unit testing
@Docs Vue performance → Optimization techniques
\`\`\``,

      "node-api": `### Node.js API @Docs Patterns
\`\`\`
@Docs Express.js → Web framework patterns
@Docs Node.js streams → Data processing
@Docs Node.js security → Authentication and authorization
@Docs Node.js testing → API testing with Jest
@Docs Node.js deployment → Production best practices
\`\`\``,
    };

    return patterns[this.detection.type] || patterns["node-api"];
  }

  generateMCPConfig() {
    return {
      project: {
        mcpServers: {
          "project-confluence": {
            command: "npx",
            args: ["-y", "@mcp/confluence"],
            env: {
              CONFLUENCE_URL: "https://your-company.atlassian.net",
              CONFLUENCE_TOKEN: "your-project-token",
            },
          },
          "internal-docs": {
            command: "node",
            args: ["scripts/internal-docs-mcp.js"],
            env: {
              INTERNAL_API_KEY: "your-internal-api-key",
            },
          },
        },
      },
      global: {
        mcpServers: {
          "google-drive": {
            command: "npx",
            args: ["-y", "@mcp/google-drive"],
            env: {
              GOOGLE_CLIENT_ID: "your-client-id",
              GOOGLE_CLIENT_SECRET: "your-client-secret",
            },
          },
          notion: {
            command: "npx",
            args: ["-y", "@mcp/notion"],
            env: {
              NOTION_TOKEN: "your-integration-token",
            },
          },
        },
      },
    };
  }

  generateCustomMCPExample() {
    return `import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import TurndownService from "turndown";

// Create MCP server for internal documentation
const server = new McpServer({
  name: "internal-docs",
  version: "1.0.0"
});

const turndownService = new TurndownService();

// Tool to scrape internal documentation
server.tool("get_internal_doc",
  { url: z.string() },
  async ({ url }) => {
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': \`Bearer \${process.env.INTERNAL_API_KEY}\`
        }
      });
      const html = await response.text();
      
      // Convert HTML to markdown
      const markdown = turndownService.turndown(html);
      
      return {
        content: [{ type: "text", text: markdown }]
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: \`Error accessing \${url}: \${error.message}\` }]
      };
    }
  }
);

// Tool to update documentation  
server.tool("update_internal_doc",
  { 
    url: z.string(),
    content: z.string() 
  },
  async ({ url, content }) => {
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': \`Bearer \${process.env.INTERNAL_API_KEY}\`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });
      
      if (response.ok) {
        return {
          content: [{ type: "text", text: \`Documentation updated successfully at \${url}\` }]
        };
      } else {
        throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
      }
    } catch (error) {
      return {
        content: [{ type: "text", text: \`Error updating \${url}: \${error.message}\` }]
      };
    }
  }
);

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);`;
  }
}

export default DocumentationSetup;
