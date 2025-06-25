/**
 * 📦 Large Codebase Setup - Estratégias para codebases grandes
 * Baseado na documentação oficial do Cursor e best practices
 */

import fs from "fs-extra";
import path from "path";
import chalk from "chalk";

export class LargeCodebaseSetup {
  constructor(detection) {
    this.detection = detection;
    this.projectRoot = process.cwd();
    this.cursorDir = path.join(this.projectRoot, ".cursor");
  }

  /**
   * 🚀 Setup completo para large codebases
   */
  async setup() {
    console.log(
      chalk.blue("📦 Configurando estratégias para large codebase...")
    );

    try {
      // 1. Configurar ignore files avançados
      await this.setupAdvancedIgnoreFiles();

      // 2. Configurar domain-specific rules
      await this.setupDomainSpecificRules();

      // 3. Configurar planning workflows
      await this.setupPlanningWorkflows();

      // 4. Configurar tool selection guide
      await this.setupToolSelectionGuide();

      // 5. Configurar Global Ignore settings
      await this.setupGlobalIgnoreSettings();

      console.log(chalk.green("   ✓ Large codebase strategies configuradas"));
    } catch (error) {
      console.log(
        chalk.yellow(
          "   ⚠ Large codebase setup não foi configurado completamente"
        )
      );
      console.log(chalk.gray(`     ${error.message}`));
    }
  }

  /**
   * 🚫 Configura ignore files avançados
   */
  async setupAdvancedIgnoreFiles() {
    // .cursorignore avançado para performance
    const advancedIgnore = this.generateAdvancedCursorIgnore();
    await fs.writeFile(
      path.join(this.projectRoot, ".cursorignore"),
      advancedIgnore
    );

    // .cursorindexingignore para indexing limitado
    const indexingIgnore = this.generateCursorIndexingIgnore();
    await fs.writeFile(
      path.join(this.projectRoot, ".cursorindexingignore"),
      indexingIgnore
    );

    // Guia de ignore files
    const ignoreGuide = `# 🚫 Ignore Files Guide for Large Codebases

## 🎯 Performance vs Security

### Security Reasons
Use \`.cursorignore\` para bloquear acesso completo a:
- **API keys**: \`*.env\`, \`secrets/\`, \`config/prod/\`
- **Database credentials**: \`database.json\`, \`connection-strings.txt\`
- **Authentication tokens**: \`auth/\`, \`tokens/\`, \`*.key\`
- **Sensitive configs**: \`prod-config/\`, \`staging-secrets/\`

### Performance Reasons  
Use \`.cursorignore\` para excluir partes irrelevantes:
- **Monorepos**: Ignore outros teams/projects não relacionados
- **Legacy code**: Código antigo que não será modificado
- **Generated files**: Builds, dist, compiled assets
- **Large datasets**: CSVs, logs, media files

## 📊 .cursorignore vs .cursorindexingignore

### .cursorignore (Bloqueio Total)
- **Codebase indexing**: ❌ Não indexa
- **Tab/Chat/⌘K**: ❌ Não consegue acessar
- **@ symbols**: ❌ Não pode referenciar
- **Tool calls**: ⚠️ MCP servers ainda podem acessar

### .cursorindexingignore (Indexing Only)
- **Codebase indexing**: ❌ Não indexa  
- **Tab/Chat/⌘K**: ✅ Pode acessar se referenciado
- **@ symbols**: ✅ Pode referenciar explicitamente
- **Performance**: 🚀 Melhora indexing sem bloquear acesso

## 🏗️ Hierarchical Ignore
Enable em Settings > Features > Editor > Hierarchical Cursor Ignore

\`\`\`
project-root/
├── .cursorignore              # Rules gerais
├── frontend/
│   └── .cursorignore          # Rules específicas frontend
├── backend/
│   └── .cursorignore          # Rules específicas backend
└── shared/
    └── .cursorignore          # Rules específicas shared
\`\`\`

## 🌐 Global Ignore Files
Configure em Settings > Features > Global Cursor Ignore List

**Patterns que aplicam a todos os projetos:**
- Build outputs: \`dist/\`, \`build/\`, \`.next/\`
- Dependencies: \`node_modules/\`, \`vendor/\`
- Logs: \`*.log\`, \`logs/\`
- OS files: \`.DS_Store\`, \`Thumbs.db\`

## 🔧 Pattern Examples

### Basic Patterns
\`\`\`
# Arquivo específico
config.json

# Diretório completo
dist/

# Extensão específica
*.log

# Tudo exceto
*
!app/
\`\`\`

### Advanced Patterns
\`\`\`
# Logs em qualquer diretório
**/logs

# Arquivos temporários em qualquer nível
**/*.tmp

# Node modules em qualquer lugar
**/node_modules

# Excluir apenas desenvolvimento
!**/src
!**/tests
\`\`\`

## 📈 Performance Tips

### Para Monorepos
1. **Ignore outros teams**: \`team-a/\`, \`team-b/\`
2. **Focus no seu scope**: \`!my-team/\`, \`!shared/\`
3. **Use .cursorindexingignore**: Para código que você pode precisar referenciar ocasionalmente

### Para Codebases Legados
1. **Ignore legacy**: \`legacy/\`, \`deprecated/\`
2. **Keep interfaces**: \`!legacy/interfaces/\`, \`!legacy/types/\`
3. **Prioritize active**: Focus nos módulos em desenvolvimento ativo

## 🚨 Troubleshooting

### Test Patterns
Use git para testar patterns:
\`\`\`bash
git check-ignore -v path/to/file
\`\`\`

### Common Issues
- **Blank lines**: Ignoradas automaticamente
- **Comments**: Linhas com # são ignoradas
- **Relative paths**: Patterns são relativos ao .cursorignore
- **Order matters**: Patterns posteriores sobrescrevem anteriores

### Override .gitignore
Para não ignorar arquivo que está no .gitignore:
\`\`\`
# No .cursorignore
!important-file.log
\`\`\`
`;

    await fs.writeFile(
      path.join(this.cursorDir, "ignore-files-guide.md"),
      ignoreGuide
    );
    console.log(chalk.green("     ✓ Advanced ignore files configurados"));
  }

  /**
   * 📋 Configura domain-specific rules
   */
  async setupDomainSpecificRules() {
    const domainRulesGuide = `# 🎯 Domain-Specific Rules for Large Codebases

## 🧠 Knowledge Capture Strategy

### Onboarding Knowledge
Pergunte-se: "Que contexto eu daria para um novo desenvolvedor?"
- Arquitetura geral do sistema
- Convenções de naming específicas
- Patterns de desenvolvimento únicos
- Dependências críticas e suas configurações

### Service/Feature Boilerplate
Para adicionar novos serviços ou features:

\`\`\`mdc
---
description: Add a new ${this.detection.type} service
globs: ["services/**/*", "features/**/*"]
alwaysApply: false
---

# Adding New Service

## 1. Interface Definition
- Define service interface using proper TypeScript patterns
- Ensure dependency injection is configured
- Follow naming convention: \`ServiceNameService\`

## 2. Service Implementation  
- Extend base service class if available
- Implement proper error handling
- Add logging with consistent format
- Register as singleton in DI container

## 3. Service Integration
- Update main service registry
- Add to context/providers
- Create integration tests
- Update documentation

## 4. Common Patterns
- Use existing validation patterns
- Follow error response format
- Implement proper cleanup in dispose
- Add metrics/monitoring hooks

@existing-service-example.ts
\`\`\`

### Formatting & Convention Rules
Auto-attached para manter consistência:

\`\`\`mdc
---
description: Project formatting and naming conventions
globs: ["**/*.ts", "**/*.js", "**/*.tsx", "**/*.jsx"]
alwaysApply: true
---

# ${this.detection.type.toUpperCase()} Formatting Standards

## Package Manager
- Use ${this.getPackageManager()} for all operations
- See package.json for available scripts

## Naming Conventions
- **Files**: kebab-case (\`user-service.ts\`)
- **Functions/Variables**: camelCase (\`getUserData\`)
- **Constants**: UPPERCASE_SNAKE_CASE (\`API_BASE_URL\`)
- **Classes**: PascalCase (\`UserService\`)

## Code Style  
- Prefer \`function foo()\` over \`const foo = () =>\`
- Use \`Array<T>\` instead of \`T[]\`
- Use named exports over default exports
- Always handle errors explicitly

## Import Organization
1. External libraries
2. Internal absolute imports  
3. Relative imports
4. Type-only imports last

@style-examples.ts
\`\`\`

## 📊 Architecture Documentation Rules

### System Overview
\`\`\`mdc
---
description: System architecture and data flow
globs: ["architecture/**/*", "docs/**/*"]
alwaysApply: false
---

# ${this.detection.type} Architecture Overview

## Core Components
${this.generateArchitectureOverview()}

## Data Flow
1. Client requests enter through API Gateway
2. Authentication/Authorization middleware
3. Business logic in service layer
4. Data persistence layer
5. Response formatting and return

## Key Patterns
- **Repository Pattern**: For data access
- **Service Layer**: For business logic
- **Middleware**: For cross-cutting concerns
- **Event Sourcing**: For audit trails (if applicable)

## Integration Points
- External APIs and their rate limits
- Database connections and pooling
- Cache layers and invalidation strategies
- Message queues and event handling

@architecture-diagram.mmd
\`\`\`

## 🔧 Development Workflow Rules

### Code Review & Quality
\`\`\`mdc
---
description: Code review and quality standards
globs: ["**/*.test.*", "**/*.spec.*"]
alwaysApply: false
---

# Quality Standards

## Testing Requirements
- **Unit tests**: All business logic functions
- **Integration tests**: API endpoints and database operations  
- **E2E tests**: Critical user journeys
- **Coverage**: Minimum 80% for new code

## Code Review Checklist
- [ ] Tests cover new functionality
- [ ] Error handling is appropriate
- [ ] Performance impact considered
- [ ] Security implications reviewed
- [ ] Documentation updated

## Performance Guidelines
- **Database queries**: Use indexes, avoid N+1
- **API responses**: < 200ms for standard operations
- **Memory usage**: Monitor for leaks
- **Bundle size**: Track and optimize

@testing-examples.ts
\`\`\`

## 🚀 Team Collaboration Rules

### Communication & Documentation
\`\`\`mdc
---
description: Team communication and documentation standards
---

# Team Standards

## Decision Documentation
- **ADRs**: Architecture Decision Records for significant changes
- **RFCs**: Request for Comments for major features
- **Runbooks**: Operational procedures and troubleshooting

## Code Comments
- **Why not what**: Explain business logic, not syntax
- **TODO format**: \`// TODO(username): specific task\`
- **Deprecation**: Mark with removal timeline

## Git Practices
- **Conventional Commits**: feat, fix, docs, style, refactor, test, chore
- **Branch naming**: \`feature/ticket-number-description\`
- **PR size**: < 500 lines when possible

@team-processes.md
\`\`\`
`;

    await fs.writeFile(
      path.join(this.cursorDir, "domain-specific-rules.md"),
      domainRulesGuide
    );

    // Criar rule MDC específica para large codebase
    const largeCodebaseRule = `---
description: Large codebase development patterns and practices
globs: ["**/*"]
alwaysApply: false
---

# Large Codebase Development

## Context Strategy
- Use @Files for specific components you're working on
- Use @Folders for understanding module relationships
- Use @Git for tracking recent changes and debugging
- Use @Past Chats to maintain context between sessions

## Planning Approach
1. **Scope down**: Break large changes into smaller, focused tasks
2. **Plan first**: Use Ask mode to create detailed implementation plans
3. **Gather context**: Include relevant files, docs, and past discussions
4. **Validate approach**: Ask questions before implementing

## Tool Selection
- **Tab**: Quick, manual changes (single file)
- **Cmd K**: Focused edits in one file
- **Chat**: Multi-file changes requiring context understanding

## Best Practices
- Start new chats for new features/tasks
- Include relevant context files explicitly
- Reference similar existing patterns when possible
- Break complex changes into iterative steps

@large-codebase-patterns.md
`;

    await fs.writeFile(
      path.join(this.cursorDir, "rules", "large-codebase.mdc"),
      largeCodebaseRule
    );
    console.log(chalk.green("     ✓ Domain-specific rules criadas"));
  }

  /**
   * 📋 Configura planning workflows
   */
  async setupPlanningWorkflows() {
    const planningGuide = `# 📋 Planning Workflows for Large Codebases

## 🎯 Plan-Creation Process

### Use Ask Mode for Planning
Turn on **Ask mode** in Cursor para criar planos detalhados:

\`\`\`
**Planning Prompt Template:**

Create a plan for implementing [FEATURE_NAME] (similar to @existing-feature.ts)

Context:
- @Past Chats (my earlier exploration)
- @folder/relevant-module
- @existing-similar-implementation.ts

Requirements from [Project Management Tool]:
[paste ticket/requirement description]

Please:
1. Ask me max 3 clarifying questions if anything is unclear
2. Search the codebase for similar patterns
3. Create step-by-step implementation plan
4. Identify potential risks/dependencies
\`\`\`

### Planning Workflow Steps

#### 1. Context Gathering
- **@Past Chats**: Include previous explorations
- **@Folders**: Understand module structure  
- **@Files**: Review similar implementations
- **@Git**: Check recent related changes
- **@Docs**: Include relevant specifications

#### 2. Question & Clarification
- Let Cursor ask clarifying questions (max 3)
- Provide additional context as needed
- Validate understanding before proceeding

#### 3. Plan Creation
- Break down into manageable steps
- Identify files that need changes
- Note dependencies and integration points
- Estimate complexity and effort

#### 4. Plan Validation
- Review plan with team if needed
- Confirm approach aligns with architecture
- Identify potential blockers early

## 🔄 Implementation Workflow

### Sequential Development
\`\`\`
Ask Mode (Planning) → Agent Mode (Implementation) → Validation → Iteration
\`\`\`

### Task Breakdown Example
\`\`\`
Large Feature: "User Authentication System"

Step 1: Database Schema
- @database/migrations
- Create user table migration
- Add indexes for performance

Step 2: Core Models  
- @models/User.ts
- Define User interface
- Add validation schemas

Step 3: Authentication Service
- @services/AuthService.ts
- Implement login/logout
- Add password hashing

Step 4: API Endpoints
- @controllers/AuthController.ts
- Create REST endpoints
- Add input validation

Step 5: Integration Tests
- @tests/auth.test.ts
- Test complete flow
- Validate error cases
\`\`\`

### Context Handoff Between Steps
Quando mudar entre steps, inclua contexto relevante:

\`\`\`
**Step Transition Prompt:**

I'm moving to Step 3: Authentication Service

Previous context:
- @Step1-files (database migrations)
- @Step2-files (User models)
- @Past Chats (previous steps discussion)

Now implement:
- Authentication service with login/logout
- Follow patterns from @existing-auth-service.ts
- Use @User-model.ts interface
\`\`\`

## 🎯 Best Practices for Large Changes

### Scope Management
- **One feature per chat**: Evite mixing unrelated changes
- **File limits**: Aim for <10 files per implementation step  
- **Change size**: Keep individual changes <500 lines when possible

### Context Optimization
- **Be specific**: Use @Code for exact functions rather than @Files
- **Include examples**: Reference existing patterns with @Files
- **Show relationships**: Use @Folders to understand module connections

### Iteration Strategy
- **Validate early**: Test each step before moving to next
- **Get feedback**: Review with team at logical checkpoints
- **Adjust plan**: Modify approach based on learnings

## 🔧 Tool Selection Matrix

| Task Type | Scope | Best Tool | Why |
|-----------|-------|-----------|-----|
| Bug fix | Single function | **Tab** | Quick, precise, full control |
| Feature enhancement | Single file | **Cmd K** | Focused edits with context |
| New feature | Multiple files | **Chat** | Auto-gathers context, deep understanding |
| Refactoring | Module/package | **Chat** + planning | Complex dependencies need planning |
| Documentation | Multiple files | **Chat** | Cross-references and consistency |

### Tool Transition Strategy
\`\`\`
Planning (Ask Mode) → Implementation (Agent Mode) → Refinement (Cmd K/Tab)
\`\`\`

## 📊 Context Window Management

### Large Codebase Challenges
- **Context window limits**: ~200k tokens typical
- **File condensing**: Large files auto-condensed
- **Summarization**: Long conversations auto-summarized

### Optimization Strategies
- **Fresh chats**: Start new chat for each major task
- **Focused context**: Include only relevant files/folders
- **Iterative approach**: Build understanding progressively
- **Strategic @-symbols**: Use most specific symbol possible

### When to Start Fresh Chat
- Switching to different feature/module
- Context window getting full
- Change in task scope/direction
- After completing a logical milestone
`;

    await fs.writeFile(
      path.join(this.cursorDir, "planning-workflows.md"),
      planningGuide
    );
    console.log(chalk.green("     ✓ Planning workflows configurados"));
  }

  /**
   * 🔧 Configura tool selection guide
   */
  async setupToolSelectionGuide() {
    const toolGuide = `# 🔧 Tool Selection Guide for Large Codebases

## 🎯 Choosing the Right Tool

### Decision Matrix

| Scenario | Files | Complexity | Best Tool | Rationale |
|----------|-------|------------|-----------|-----------|
| Fix typo/small bug | 1 | Low | **Tab** | Quick, precise, stay in flow |
| Add validation to function | 1 | Medium | **Cmd K** | Focused edit with local context |
| Implement new API endpoint | 2-3 | Medium | **Cmd K** | Scoped to specific functionality |
| Add new feature module | 5+ | High | **Chat** | Needs broad context understanding |
| Refactor across packages | 10+ | High | **Chat** | Complex dependencies and relationships |
| Debug cross-module issue | Variable | High | **Chat** | Needs to trace through multiple layers |

### Tool Strengths & Limitations

#### 🏃 Tab - Lightning Fast Edits
**Strengths:**
- ⚡ **Fastest**: Immediate suggestions as you type
- 🎯 **Precise**: Exactly what you want, where you want it
- 🔄 **Flow state**: Doesn't break your coding rhythm
- 💯 **Full control**: You drive the implementation

**Best for:**
- Quick fixes and small edits
- Code you understand well
- Repetitive patterns
- When you know exactly what to change

**Limitations:**
- Single file only
- No cross-file context
- Requires you to know the solution

#### ✏️ Cmd K - Focused File Editing
**Strengths:**
- 🎯 **Scoped**: Works within one file boundary
- 🧠 **Context-aware**: Understands file structure
- ⚡ **Fast**: Quicker than Chat for single-file changes
- 🔧 **Flexible**: Handles complex within-file logic

**Best for:**
- Implementing functions/methods
- Adding features to existing classes
- Refactoring within a file
- Complex single-file logic

**Limitations:**
- Single file boundary
- Limited cross-file understanding
- Can't gather broader context automatically

#### 💬 Chat - Deep Understanding & Multi-File
**Strengths:**
- 🌐 **Multi-file**: Handles complex, cross-file changes
- 🧠 **Context gathering**: Auto-discovers relevant code
- 🔍 **Deep analysis**: Understands relationships and dependencies
- 📋 **Planning**: Can break down complex tasks

**Best for:**
- New feature implementation
- Cross-module refactoring
- Debugging complex issues
- Architecture changes
- When you need to understand before changing

**Limitations:**
- Slower than Tab/Cmd K
- Uses more context window
- Can be overkill for simple changes

## 🚀 Workflow Patterns

### Progressive Tool Usage
Start broad, get specific:

\`\`\`
1. Chat: Understand the problem and plan solution
2. Chat: Implement core logic across multiple files  
3. Cmd K: Refine individual file implementations
4. Tab: Polish and fix small issues
\`\`\`

### Context Handoff Pattern
When switching tools, maintain context:

\`\`\`
**Chat → Cmd K:**
"Based on our discussion above, implement the validateUser function in @UserService.ts following the patterns we established"

**Cmd K → Tab:**
Use Tab to quickly apply similar patterns to other files after Cmd K shows you the approach
\`\`\`

### Fresh Chat Strategy
Start new chats to maintain focus:

\`\`\`
**When to start fresh:**
- New feature/module
- Different area of codebase  
- Context window getting full
- Change in task scope

**Context bridging:**
- Use @Past Chats to reference previous work
- Include key files from previous context
- Summarize decisions made earlier
\`\`\`

## 🎯 Large Codebase Specific Strategies

### Exploration Phase (Use Chat)
\`\`\`
"Help me understand how user authentication works in this codebase"
- @auth/ folder
- @middleware/auth.ts
- @models/User.ts

Goal: Build mental model before making changes
\`\`\`

### Implementation Phase (Progressive Tools)
\`\`\`
1. Chat: "Implement OAuth2 integration following existing auth patterns"
2. Cmd K: Refine specific functions within each file
3. Tab: Add small utilities and helper functions
\`\`\`

### Debugging Phase (Strategic Chat)
\`\`\`
"Debug why users are getting 401 errors after recent auth changes"
- @Git (recent auth-related changes)
- @auth/middleware.ts
- @logs/auth-errors.log
- @tests/auth.test.ts

Let Chat trace through the flow and identify issues
\`\`\`

## 💡 Pro Tips for Large Codebases

### Context Management
- **Include relevant examples**: Use @Files to show similar patterns
- **Scope appropriately**: Don't include entire folders unless necessary
- **Use @Git**: Include recent changes when debugging
- **Reference documentation**: Use @Docs for specifications

### Communication with Tools
- **Be specific about scope**: "Only change the validation logic, don't modify the API interface"
- **Provide constraints**: "Follow the existing error handling patterns"
- **Ask for explanations**: "Explain how this change affects the auth flow"
- **Request alternatives**: "Show me 2 different approaches for this"

### Maintaining Momentum
- **Plan before implementing**: Use Ask mode to think through approach
- **Break down large tasks**: Smaller steps = better results
- **Validate incrementally**: Test each step before moving to next
- **Document decisions**: Use @Notepads to capture important decisions

### Team Collaboration
- **Share context**: Use @Past Chats to share explorations with team
- **Document patterns**: Create rules for common patterns
- **Consistent tooling**: Agree on when to use each tool
- **Knowledge transfer**: Use Chat to explain complex parts to new team members
`;

    await fs.writeFile(
      path.join(this.cursorDir, "tool-selection-guide.md"),
      toolGuide
    );
    console.log(chalk.green("     ✓ Tool selection guide criado"));
  }

  /**
   * 🌐 Configura global ignore settings
   */
  async setupGlobalIgnoreSettings() {
    const globalIgnoreGuide = `# 🌐 Global Ignore Settings for Large Codebases

## 🎯 Global vs Project Ignore

### Global Ignore (Apply to ALL projects)
Configure em: **Settings > Features > Global Cursor Ignore List**

**Common Global Patterns:**
\`\`\`
# Build outputs (all projects)
dist/
build/
.next/
out/
target/

# Dependencies (all projects)  
node_modules/
vendor/
bower_components/

# Logs (all projects)
*.log
logs/
*.log.*

# OS files (all projects)
.DS_Store
Thumbs.db
*.swp
*.swo

# IDE files (all projects)
.vscode/
.idea/
*.sublime-*

# Cache files (all projects)
.cache/
*.tmp
*.temp
\`\`\`

### Project-Specific Ignore
Configure em: **Project .cursorignore**

**Project-Specific Patterns:**
\`\`\`
# Business logic you don't want exposed
internal-apis/
sensitive-configs/

# Legacy code not relevant to current work
legacy/
deprecated/

# Generated code specific to this project
generated/
auto-generated/

# Large datasets specific to this project
data/large-files/
exports/
\`\`\`

## 🔧 Setup Instructions

### 1. Configure Global Ignore
1. Open Cursor Settings
2. Go to Features > Global Cursor Ignore List  
3. Add patterns that apply to all your projects
4. Save settings

### 2. Hierarchical Project Ignore
1. Enable: Settings > Features > Editor > Hierarchical Cursor Ignore
2. Create .cursorignore files at different levels:

\`\`\`
project-root/
├── .cursorignore              # Global project rules
├── frontend/
│   └── .cursorignore          # Frontend-specific rules  
├── backend/
│   └── .cursorignore          # Backend-specific rules
├── shared/
│   └── .cursorignore          # Shared code rules
└── docs/
    └── .cursorignore          # Documentation rules
\`\`\`

### 3. Performance Optimization
For very large codebases (>100k files):

\`\`\`
# .cursorignore
# Ignore entire codebase
*

# Only include what you work on
!my-team/
!shared/interfaces/
!shared/utils/
!docs/my-team/

# Include important configs
!package.json
!tsconfig.json
!*.config.js
\`\`\`

## 📊 Monitoring & Optimization

### Check Indexing Performance
1. Open Settings > Features > Codebase Indexing
2. Check indexing status and file count
3. Monitor for "Significantly Condensed" warnings
4. Adjust ignore patterns if needed

### Performance Indicators
- **Slow autocomplete**: Too many files indexed
- **Irrelevant suggestions**: Wrong files in context
- **Long indexing time**: Include more in ignore files
- **"Significantly Condensed"**: Files too large for context

### Optimization Strategies
1. **Start restrictive**: Ignore everything, include only what you need
2. **Monitor usage**: Add back files as needed
3. **Team collaboration**: Share ignore patterns that work
4. **Regular review**: Update patterns as codebase evolves

## 🎯 Large Codebase Patterns

### Monorepo Strategy
\`\`\`
# Root .cursorignore
# Ignore all teams except yours
team-*/
!team-frontend/
!team-shared/

# Keep important shared resources
!shared/types/
!shared/utils/
!docs/architecture/
\`\`\`

### Legacy System Strategy
\`\`\`
# Focus on active development
legacy-v1/
legacy-v2/
deprecated/

# Keep interfaces you need
!legacy-v2/interfaces/
!legacy-v2/types/

# Keep migration guides
!docs/migration/
\`\`\`

### Multi-Language Strategy
\`\`\`
# If you primarily work in one language
*.java
*.cpp
*.py

# But keep configs and docs
!*.json
!*.md
!*.yml
!*.yaml
\`\`\`

## 🚨 Best Practices

### Security Considerations
- **Never ignore security configs** unless you're sure
- **Review team ignore patterns** before adopting
- **Document sensitive patterns** in team guidelines
- **Regular security review** of ignore patterns

### Team Collaboration
- **Share effective patterns** with team
- **Document project-specific needs** in README
- **Coordinate global vs project** ignore strategies
- **Regular review and cleanup** of ignore patterns

### Maintenance
- **Review quarterly**: Remove obsolete patterns
- **Monitor performance**: Adjust based on usage
- **Team feedback**: Collect what works/doesn't work
- **Documentation**: Keep ignore strategies documented
`;

    await fs.writeFile(
      path.join(this.cursorDir, "global-ignore-settings.md"),
      globalIgnoreGuide
    );
    console.log(chalk.green("     ✓ Global ignore settings configurados"));
  }

  // ============ MÉTODOS AUXILIARES ============

  generateAdvancedCursorIgnore() {
    const baseIgnore = [
      "# AI Workspace - Advanced ignore for large codebase",
      "",
      "# Performance optimization",
      "# Ignore build outputs",
      "dist/",
      "build/",
      ".next/",
      "out/",
      "target/",
      "",
      "# Dependencies",
      "node_modules/",
      "vendor/",
      "bower_components/",
      "",
      "# Logs and temp files",
      "*.log",
      "logs/",
      "*.tmp",
      "*.temp",
      ".cache/",
      "",
      "# Large data files",
      "*.csv",
      "*.json.large",
      "*.sql",
      "*.dump",
      "data/exports/",
      "data/backups/",
      "",
      "# Generated code",
      "generated/",
      "auto-generated/",
      ".generated/",
      "",
      "# IDE and OS files",
      ".DS_Store",
      "Thumbs.db",
      "*.swp",
      "*.swo",
      ".vscode/",
      ".idea/",
    ];

    // Add project-specific ignore patterns
    const projectSpecific = this.getProjectSpecificIgnores();

    return [...baseIgnore, ...projectSpecific].join("\n");
  }

  generateCursorIndexingIgnore() {
    return `# AI Workspace - Indexing-only ignore patterns
# These files can still be accessed but won't be indexed for performance

# Large documentation files
docs/api-reference/
docs/generated/
*.pdf
*.docx

# Test fixtures and mocks
tests/fixtures/
mocks/large-datasets/
__snapshots__/

# Legacy code (keep accessible but don't index)
legacy/
deprecated/
archive/

# Large configuration files
config/development/
config/staging/
locales/

# Generated documentation
typedoc-output/
jsdoc-output/
coverage-reports/
`;
  }

  getProjectSpecificIgnores() {
    const specific = {
      nextjs: [
        "",
        "# Next.js specific",
        ".next/",
        "out/",
        "next-env.d.ts",
        ".vercel/",
      ],
      react: ["", "# React specific", "build/", ".eslintcache", "coverage/"],
      "node-api": [
        "",
        "# Node API specific",
        "uploads/",
        "tmp/",
        "*.env.local",
        "storage/",
        "sessions/",
      ],
    };

    return specific[this.detection.type] || [];
  }

  getPackageManager() {
    // Simple detection based on common files
    if (fs.existsSync(path.join(this.projectRoot, "pnpm-lock.yaml")))
      return "pnpm";
    if (fs.existsSync(path.join(this.projectRoot, "yarn.lock"))) return "yarn";
    return "npm";
  }

  generateArchitectureOverview() {
    const overviews = {
      nextjs: `
- **App Router**: Route handling and middleware
- **Server Components**: SSR and data fetching
- **Client Components**: Browser interactivity  
- **API Routes**: Backend endpoints
- **Middleware**: Authentication and request processing`,
      react: `
- **Components**: UI building blocks
- **Hooks**: State and lifecycle management
- **Context**: Global state management
- **Services**: API communication
- **Utils**: Shared utility functions`,
      "node-api": `
- **Controllers**: Request handling and routing
- **Services**: Business logic layer
- **Models**: Data structures and validation
- **Middleware**: Cross-cutting concerns
- **Database**: Data persistence layer`,
    };

    return overviews[this.detection.type] || overviews["node-api"];
  }
}

export default LargeCodebaseSetup;
