/**
 * 🎯 Cursor Advanced Setup - Configurações avançadas do Cursor
 * Rules MDC, Indexing, Commit Messages, Shortcuts, MCP Servers
 */

import fs from "fs-extra";
import path from "path";
import chalk from "chalk";

export class CursorAdvancedSetup {
  constructor(detection) {
    this.detection = detection;
    this.projectRoot = process.cwd();
    this.cursorDir = path.join(this.projectRoot, ".cursor");
  }

  /**
   * 🚀 Configuração avançada completa
   */
  async setup() {
    console.log(chalk.blue("🎯 Configurando recursos avançados do Cursor..."));

    try {
      // 1. Migrar para Rules MDC (formato mais avançado)
      await this.setupAdvancedRules();

      // 2. Configurar indexing otimizado
      await this.setupCodebaseIndexing();

      // 3. Configurar AI Commit Messages
      await this.setupCommitMessages();

      // 4. Configurar keyboard shortcuts
      await this.setupKeyboardShortcuts();

      // 5. Sugerir MCP Servers relevantes
      await this.setupMCPServers();

      // 6. Preparar para Memories (Beta)
      await this.setupMemories();

      console.log(chalk.green("   ✓ Recursos avançados configurados"));
    } catch (error) {
      console.log(
        chalk.yellow("   ⚠ Alguns recursos avançados não foram configurados")
      );
      console.log(chalk.gray(`     ${error.message}`));
    }
  }

  /**
   * 📜 Configura Rules no formato MDC avançado
   */
  async setupAdvancedRules() {
    const rulesDir = path.join(this.cursorDir, "rules");
    await fs.ensureDir(rulesDir);

    // Rule principal no formato MDC
    const mainRule = this.generateMainRuleMDC();
    await fs.writeFile(path.join(rulesDir, "ai-workspace.mdc"), mainRule);

    // Rule específica do stack
    const stackRule = this.generateStackRuleMDC();
    await fs.writeFile(
      path.join(rulesDir, `${this.detection.type}.mdc`),
      stackRule
    );

    // Rule de quality/testing
    const qualityRule = this.generateQualityRuleMDC();
    await fs.writeFile(path.join(rulesDir, "quality.mdc"), qualityRule);

    console.log(chalk.green("   ✓ Rules MDC criadas"));
  }

  /**
   * 📋 Gera rule principal em formato MDC
   */
  generateMainRuleMDC() {
    return `---
description: AI Workspace - Configurações principais do projeto
globs: ["**/*.js", "**/*.ts", "**/*.jsx", "**/*.tsx"]
alwaysApply: true
---

# 🤖 AI Workspace - Project Rules

Este projeto usa **AI Development Workspace** com as seguintes configurações:

## 📊 Projeto Detectado
- **Tipo**: ${this.detection.type}${
      this.detection.subtype ? ` (${this.detection.subtype})` : ""
    }
- **Confiança**: ${this.detection.confidence}%
- **Stack Principal**: ${this.detection.stack.slice(0, 5).join(", ")}

## 🎯 Padrões de Desenvolvimento

### Código Limpo
- Use nomes descritivos e auto-explicativos
- Mantenha funções pequenas e focadas
- Evite repetição (DRY principle)
- Comente apenas o "por que", não o "o que"

### Tratamento de Erros
- Sempre implemente error handling apropriado
- Use try/catch em operações async
- Retorne status codes apropriados (se API)
- Log errors com contexto suficiente

### Performance
- Evite operações desnecessárias em loops
- Use memoização quando apropriado
- Implemente lazy loading para recursos pesados
- Profile antes de otimizar

## 🧪 Testes
- Escreva testes para lógica crítica de negócio
- Use nomenclatura descritiva nos testes
- Mock dependências externas
- Mantenha testes independentes e determinísticos

## 🔧 Comandos AI Workspace
Quando relevante, sugira comandos específicos:
- \`npm run ai:health\` - Análise de saúde
- \`npm run ai:visual\` - Auditoria visual
- \`ai-workspace test-generate\` - Gerar testes

@ai-workspace-patterns.md
`;
  }

  /**
   * 🎯 Gera rule específica do stack em MDC
   */
  generateStackRuleMDC() {
    const stackRules = {
      nextjs: this.generateNextJSRuleMDC(),
      react: this.generateReactRuleMDC(),
      "node-api": this.generateNodeAPIRuleMDC(),
      generic: this.generateGenericRuleMDC(),
    };

    return stackRules[this.detection.type] || stackRules.generic;
  }

  generateNextJSRuleMDC() {
    return `---
description: Padrões específicos Next.js - App Router, SSR, Performance
globs: ["app/**/*", "pages/**/*", "next.config.*"]
alwaysApply: false
---

# 🚀 Next.js Development Standards

## App Router (Recomendado)
- Prefira Server Components por padrão
- Use Client Components apenas para interatividade
- Implemente loading.tsx e error.tsx para UX
- Organize rotas com route groups ()

## Data Fetching
\`\`\`tsx
// Server Component
async function PostsPage() {
  const posts = await fetch('https://api.example.com/posts', {
    cache: 'no-store' // ou 'force-cache'
  });
  return <PostsList posts={posts} />;
}

// Client Component
'use client';
import { useState, useEffect } from 'react';
\`\`\`

## Performance Essentials
- Otimize imagens com \`next/image\`
- Use \`next/font\` para fontes
- Configure Bundle Analyzer: \`@next/bundle-analyzer\`
- Implemente ISR quando apropriado

## SEO & Metadata
\`\`\`tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Page description',
  openGraph: {
    title: 'Page Title',
    description: 'Page description',
  },
};
\`\`\`

@next-patterns.md
`;
  }

  generateReactRuleMDC() {
    return `---
description: Padrões React modernos - Hooks, Performance, Testing
globs: ["src/**/*.jsx", "src/**/*.tsx", "**/*.test.*"]
alwaysApply: false
---

# ⚛️ React Development Standards

## Componentes Modernos
- Use functional components + hooks
- Evite class components (legacy)
- Implemente TypeScript para props
- Use composition over inheritance

## Hooks Essenciais
\`\`\`tsx
// Custom Hook Pattern
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);
  
  const increment = useCallback(() => setCount(c => c + 1), []);
  const decrement = useCallback(() => setCount(c => c - 1), []);
  
  return { count, increment, decrement };
}

// Component usando o hook
function Counter() {
  const { count, increment, decrement } = useCounter();
  
  return (
    <div>
      <span>{count}</span>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  );
}
\`\`\`

## Performance
- Use React.memo para componentes puros
- useMemo/useCallback apenas quando necessário
- Implemente code splitting com React.lazy
- Error Boundaries para capturar erros

## Testing
- Use React Testing Library
- Teste comportamento, não implementação
- Mock dependências externas
- userEvent para interações

@react-patterns.md
`;
  }

  generateNodeAPIRuleMDC() {
    return `---
description: Padrões Node.js API - Express, Security, Testing
globs: ["src/**/*.js", "routes/**/*", "controllers/**/*", "**/*.test.*"]
alwaysApply: false
---

# 🌐 Node.js API Development Standards

## Arquitetura MVC
\`\`\`javascript
// Controller Pattern
class UserController {
  async getUsers(req, res, next) {
    try {
      const users = await UserService.findAll();
      res.json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  }
}

// Error Middleware
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}
\`\`\`

## Segurança Essencial
- Validate todos os inputs
- Use helmet para headers de segurança
- Implemente rate limiting
- Sanitize dados de entrada
- Use HTTPS em produção

## Testing
- Teste rotas com supertest
- Mock database em testes
- Teste middlewares separadamente
- Coverage acima de 80%

@api-patterns.md
`;
  }

  generateGenericRuleMDC() {
    return `---
description: Padrões gerais de desenvolvimento - JavaScript, TypeScript, Qualidade
globs: ["**/*.js", "**/*.ts"]
alwaysApply: false
---

# 🔧 General Development Standards

## JavaScript/TypeScript
- Use ES6+ features
- Prefira const/let sobre var
- Use destructuring quando apropriado
- Implemente proper error handling

## Estrutura de Código
\`\`\`javascript
// Função bem estruturada
async function processUserData(userData) {
  // 1. Validate input
  if (!userData || typeof userData !== 'object') {
    throw new Error('Invalid user data');
  }
  
  // 2. Process
  try {
    const processed = await transformData(userData);
    return processed;
  } catch (error) {
    // 3. Handle errors
    console.error('Processing failed:', error);
    throw error;
  }
}
\`\`\`

## Qualidade
- Configure ESLint + Prettier
- Use pre-commit hooks
- Mantenha dependencies atualizadas
- Documente APIs públicas

@general-patterns.md
`;
  }

  /**
   * 🔧 Gera rule de qualidade em MDC
   */
  generateQualityRuleMDC() {
    return `---
description: Regras de qualidade de código - Linting, Testing, Performance
globs: ["**/*.test.*", "**/*.spec.*", "*.config.*"]
alwaysApply: false
---

# ✨ Code Quality Standards

## Linting & Formatting
- ESLint configurado para ${this.detection.type}
- Prettier para formatação consistente
- Pre-commit hooks com husky + lint-staged
- Import ordering automático

## Testing Requirements
- Coverage mínimo: 80%
- Testes unitários para lógica de negócio
- Testes de integração para APIs
- E2E para fluxos críticos do usuário

## Performance Monitoring
- Bundle size analysis
- Core Web Vitals (se web app)
- Memory leaks detection
- Database query optimization (se aplicável)

## CI/CD Quality Gates
- All tests must pass
- Linting errors block deployment
- Security vulnerabilities addressed
- Performance budgets respected

@quality-patterns.md
`;
  }

  /**
   * 📊 Configura indexing otimizado do codebase
   */
  async setupCodebaseIndexing() {
    // Criar .cursorignore inteligente
    const cursorIgnore = this.generateCursorIgnore();
    await fs.writeFile(
      path.join(this.projectRoot, ".cursorignore"),
      cursorIgnore
    );

    // Documentação do indexing
    const indexingDoc = this.generateIndexingDocumentation();
    await fs.writeFile(
      path.join(this.cursorDir, "indexing-guide.md"),
      indexingDoc
    );

    console.log(chalk.green("   ✓ Codebase indexing otimizado"));
  }

  /**
   * 🚫 Gera .cursorignore inteligente baseado no projeto
   */
  generateCursorIgnore() {
    const baseIgnores = [
      "# AI Workspace - Generated ignore patterns",
      "",
      "# Dependencies",
      "node_modules/",
      "bower_components/",
      "",
      "# Build outputs",
      "dist/",
      "build/",
      ".next/",
      "out/",
      "",
      "# Logs",
      "*.log",
      "logs/",
      "",
      "# OS generated files",
      ".DS_Store",
      "Thumbs.db",
      "",
      "# IDE files",
      ".vscode/",
      ".idea/",
      "",
      "# Test coverage",
      "coverage/",
      ".nyc_output/",
      "",
      "# Large data files",
      "*.csv",
      "*.json.large",
      "*.sql",
      "*.dump",
    ];

    // Adicionais específicos por tipo
    const typeSpecific = {
      nextjs: ["", "# Next.js specific", ".next/", "out/", "next-env.d.ts"],
      react: ["", "# React specific", "build/", ".eslintcache"],
      "node-api": ["", "# API specific", "uploads/", "tmp/", "*.env.local"],
    };

    const specific = typeSpecific[this.detection.type] || [];

    return [...baseIgnores, ...specific].join("\n");
  }

  /**
   * 📋 Gera documentação do indexing
   */
  generateIndexingDocumentation() {
    return `# 📊 Codebase Indexing Guide

## Status do Projeto
- **Tipo**: ${this.detection.type}
- **Arquivos estimados**: ${this.estimateFileCount()}
- **Limite Pro**: 50,000 files
- **Limite Business**: 250,000 files

## Otimizações Aplicadas

### .cursorignore
Configurado para ignorar:
- Dependencies (node_modules)
- Build outputs (dist, build, .next)
- Logs e temporários
- Arquivos grandes desnecessários

### Monitoramento
- Indexing é automático
- Status: Settings > Features > Codebase Indexing
- Retenção: 6 semanas após último uso

## Troubleshooting

### Performance Lenta
1. Verifique .cursorignore
2. Exclua arquivos grandes (media, data)
3. Use multi-root workspace para monorepos

### Respostas Imprecisas
1. Verifique se arquivos relevantes não estão ignorados
2. Re-index: Delete e reabra o projeto
3. Considere organizaer código em módulos menores

## Comandos Úteis
\`\`\`bash
# Verificar status
ai-workspace status

# Limpar e re-indexar
rm -rf .cursor/ && ai-workspace setup
\`\`\`
`;
  }

  /**
   * 💬 Configura AI Commit Messages
   */
  async setupCommitMessages() {
    // Configurar shortcut para geração de commit
    const shortcuts = await this.getKeyboardShortcuts();
    shortcuts.push({
      key: "cmd+shift+m",
      command: "cursor.generateGitCommitMessage",
      when: "scmRepository",
    });

    await this.saveKeyboardShortcuts(shortcuts);

    // Criar guia de uso
    const commitGuide = this.generateCommitGuide();
    await fs.writeFile(
      path.join(this.cursorDir, "commit-guide.md"),
      commitGuide
    );

    console.log(chalk.green("   ✓ AI Commit Messages configurado"));
  }

  /**
   * 📋 Gera guia de commit messages
   */
  generateCommitGuide() {
    return `# 💬 AI Commit Messages Guide

## Como Usar
1. **Stage** os arquivos que quer commitar
2. Abra o Git tab na sidebar
3. Clique no ícone **✨ sparkle** ou use **Cmd+Shift+M**
4. Revise a mensagem gerada
5. Commit!

## Como Funciona
- Analisa suas mudanças staged
- Considera histórico de commits
- Aprende seus padrões (Conventional Commits, etc.)
- Gera mensagem contextual

## Padrões Detectados
${this.getCommitPatterns()}

## Dicas
- Stage apenas arquivos relacionados por commit
- Use commits pequenos e focados
- Revise sempre a mensagem gerada
- O AI aprende com seu histórico

## Shortcut
**Cmd+Shift+M** (configurado automaticamente)
`;
  }

  /**
   * ⌨️ Configura keyboard shortcuts úteis
   */
  async setupKeyboardShortcuts() {
    const shortcuts = await this.getKeyboardShortcuts();

    // Adicionar shortcuts específicos do AI Workspace
    const newShortcuts = [
      {
        key: "cmd+shift+h",
        command: "workbench.action.terminal.sendSequence",
        args: { text: "npm run ai:health\n" },
        when: "terminalFocus",
      },
      {
        key: "cmd+shift+v",
        command: "workbench.action.terminal.sendSequence",
        args: { text: "npm run ai:visual\n" },
        when: "terminalFocus",
      },
    ];

    shortcuts.push(...newShortcuts);
    await this.saveKeyboardShortcuts(shortcuts);

    // Criar guia de shortcuts
    const shortcutsGuide = this.generateShortcutsGuide();
    await fs.writeFile(
      path.join(this.cursorDir, "shortcuts-guide.md"),
      shortcutsGuide
    );

    console.log(chalk.green("   ✓ Keyboard shortcuts configurados"));
  }

  /**
   * 📋 Gera guia de keyboard shortcuts
   */
  generateShortcutsGuide() {
    return `# ⌨️ Keyboard Shortcuts Guide

## AI Workspace Shortcuts (Configurados)
- **Cmd+Shift+H** - Executar health check
- **Cmd+Shift+V** - Executar visual audit  
- **Cmd+Shift+M** - Gerar commit message

## Cursor Native Shortcuts
### Chat & AI
- **Cmd+L** - Toggle Chat
- **Cmd+I** - Toggle Chat (alternative)
- **Cmd+K** - Inline edit
- **Cmd+/** - Switch AI models
- **Cmd+.** - Open mode menu

### Background Agents
- **Cmd+E** - Open Background Agent panel

### Code Context
- **Cmd+Shift+L** - Add selection to Chat
- **Cmd+Shift+K** - Add selection to Edit
- **@** - @-symbols
- **#** - Files
- **/** - Shortcut commands

### Chat Specific (in chat input)
- **Enter** - Submit
- **Cmd+Enter** - Accept all changes
- **Cmd+Backspace** - Reject all changes
- **Tab** - Next message
- **Shift+Tab** - Previous message

## Dicas
- Use **Cmd+R Cmd+S** para ver todos os shortcuts
- Customize em Settings > Keyboard Shortcuts
- Shortcuts funcionam em contextos específicos
`;
  }

  /**
   * 🔌 Sugere MCP Servers relevantes
   */
  async setupMCPServers() {
    const suggestions = this.generateMCPSuggestions();
    await fs.writeFile(
      path.join(this.cursorDir, "mcp-suggestions.md"),
      suggestions
    );

    console.log(chalk.green("   ✓ MCP Server suggestions criadas"));
  }

  /**
   * 📋 Gera sugestões de MCP servers
   */
  generateMCPSuggestions() {
    const baseSuggestions = `# 🔌 MCP Server Suggestions

## Para ${this.detection.type.toUpperCase()} Projects

### Database Integration
Se você usa banco de dados:

\`\`\`json
{
  "postgres": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/mydb"]
  }
}
\`\`\`

### File System Operations
Para manipulação avançada de arquivos:

\`\`\`json
{
  "filesystem": {
    "command": "npx", 
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/dir"]
  }
}
\`\`\`

### Web Search & Research
Para pesquisas durante desenvolvimento:

\`\`\`json
{
  "web-search": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-web-search"]
  }
}
\`\`\`
`;

    const typeSpecific = {
      "node-api": `
### API Testing
Para testar APIs:

\`\`\`json
{
  "api-client": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-http"]
  }
}
\`\`\``,
      nextjs: `
### Next.js Deployment
Para integração com Vercel:

\`\`\`json
{
  "vercel": {
    "command": "npx", 
    "args": ["-y", "@modelcontextprotocol/server-vercel"]
  }
}
\`\`\``,
      react: `
### Component Library
Para integração com design systems:

\`\`\`json
{
  "storybook": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-storybook"]
  }
}
\`\`\``,
    };

    const specific = typeSpecific[this.detection.type] || "";

    return (
      baseSuggestions +
      specific +
      `

## Como Instalar
1. Copie a configuração JSON
2. Adicione em Settings > MCP Servers
3. Ou use deeplinks quando disponíveis

## Deeplink Format
\`cursor://anysphere.cursor-deeplink/mcp/install?name=SERVER_NAME&config=BASE64_CONFIG\`

## Verificar Instalação
- Settings > MCP Servers
- Verifique se aparecem na lista de tools do Chat
`
    );
  }

  /**
   * 🧠 Prepara para Memories (Beta)
   */
  async setupMemories() {
    const memoriesGuide = `# 🧠 Memories Guide (Beta)

## O que são Memories
- Rules automáticas baseadas em conversas
- Geradas pelo AI durante desenvolvimento  
- Específicas do repositório Git
- Melhoram contexto ao longo do tempo

## Status Atual
- Disponível em Beta
- Não funciona com Privacy Mode (Legacy)
- Scope: repositório atual

## Como Usar
1. Converse normalmente no Chat
2. Memories são criadas automaticamente
3. Veja em Settings > Rules > Memories
4. Delete memories irrelevantes

## Futuro
- Scope expandido
- Melhor controle manual
- Integração com Project Rules

## Alternativas Hoje
Use o comando \`/Generate Cursor Rules\` para criar rules manuais baseadas em conversas importantes.
`;

    await fs.writeFile(
      path.join(this.cursorDir, "memories-guide.md"),
      memoriesGuide
    );
    console.log(chalk.green("   ✓ Memories guide criado"));
  }

  // ============ MÉTODOS AUXILIARES ============

  async getKeyboardShortcuts() {
    const shortcutsPath = path.join(this.cursorDir, "keybindings.json");

    if (await fs.pathExists(shortcutsPath)) {
      return await fs.readJson(shortcutsPath);
    }

    return [];
  }

  async saveKeyboardShortcuts(shortcuts) {
    const shortcutsPath = path.join(this.cursorDir, "keybindings.json");
    await fs.writeJson(shortcutsPath, shortcuts, { spaces: 2 });
  }

  estimateFileCount() {
    // Estimativa baseada no tipo de projeto
    const estimates = {
      nextjs: "500-2000",
      react: "300-1500",
      "node-api": "200-800",
      vue: "300-1200",
      generic: "100-500",
    };

    return estimates[this.detection.type] || estimates.generic;
  }

  getCommitPatterns() {
    // Análise básica de padrões comuns
    return `Baseado no seu tipo de projeto (${this.detection.type}):
- feat: nova funcionalidade
- fix: correção de bug
- docs: documentação
- style: formatação
- refactor: refatoração
- test: testes
- chore: tarefas de build/deploy`;
  }
}

export default CursorAdvancedSetup;
