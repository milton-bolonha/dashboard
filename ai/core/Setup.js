/**
 * 🚀 AI Workspace Setup - Classe principal
 * Configuração completa e inteligente do workspace
 */

import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import { ProjectDetector } from "./ProjectDetector.js";
import { CursorSetup } from "./CursorSetup.js";
import { BackgroundAgentSetup } from "./BackgroundAgentSetup.js";
import { CursorModes } from "./CursorModes.js";
import { Onboarding } from "./Onboarding.js";
import CustomAPISetup from "./CustomAPISetup.js";
import AdvancedRulesSetup from "./AdvancedRulesSetup.js";
import config from "../ai.config.js";

export class Setup {
  constructor(options = {}) {
    this.options = options;
    this.interactive = options.interactive !== false;
    this.force = options.force || false;
    this.skipCursor = options.skipCursor || false;
    this.skipOnboarding = options.skipOnboarding || false;

    // Detecta raiz real do workspace para que .cursor fique sempre na raiz
    this.projectRoot = Setup.findWorkspaceRoot();

    // Garante que cwd da execução seja a raiz
    if (process.cwd() !== this.projectRoot) {
      process.chdir(this.projectRoot);
    }

    this.configDir = path.join(this.projectRoot, ".ai-workspace");
    this.cursorDir = path.join(this.projectRoot, ".cursor");
    // Diretório onde as rules serão armazenadas
    this.rulesDir = path.join(this.cursorDir, "rules");
    this.outputsDir = path.join(this.projectRoot, config.outputs.baseDir);

    this.detection = null;
  }

  /**
   * 🔍 Sobe diretórios procurando .ai-workspace, .cursor ou package.json com workspaces
   */
  static findWorkspaceRoot() {
    let currentDir = process.cwd();

    while (currentDir !== path.parse(currentDir).root) {
      const hasAi = fs.existsSync(path.join(currentDir, ".ai-workspace"));
      const hasCursor = fs.existsSync(path.join(currentDir, ".cursor"));
      const pkgPath = path.join(currentDir, "package.json");
      let isMonorepoRoot = false;
      if (fs.existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
          isMonorepoRoot =
            Array.isArray(pkg.workspaces) && pkg.workspaces.includes("ai");
        } catch (_) {}
      }

      if (hasAi || hasCursor || isMonorepoRoot) {
        return currentDir;
      }

      currentDir = path.dirname(currentDir);
    }

    return process.cwd();
  }

  /**
   * 🚀 Processo principal de setup
   */
  async run() {
    try {
      console.log(chalk.blue.bold("🤖 AI Development Workspace"));
      console.log(chalk.gray("Configuração inicial inteligente\n"));

      // 1. Detectar tipo de projeto
      await this.detectProject();

      // 2. Experiência de onboarding (primeira vez)
      if (!this.skipOnboarding && (await this.isFirstTime())) {
        await this.runOnboarding();
      }

      // 3. Configurar estrutura básica
      await this.setupStructure();

      // 4. Configurar Cursor IDE
      await this.setupCursor();

      // 5. Configurar recursos avançados do Cursor
      await this.setupAdvancedCursorFeatures();

      // 6. Criar configuração local
      await this.saveConfiguration();

      // 7. Configurar scripts package.json
      await this.setupPackageScripts();

      console.log(chalk.green.bold("\n✅ Setup concluído com sucesso!"));
      console.log(chalk.cyan("\n🎯 Próximos passos:"));
      console.log(
        chalk.white("   • npm run ai:health     # Verificar saúde do projeto")
      );
      console.log(chalk.white("   • npm run ai:visual     # Análise visual"));
      console.log(chalk.white("   • ai-workspace status   # Ver status atual"));
    } catch (error) {
      console.error(chalk.red("\n❌ Erro durante setup:"), error.message);

      if (process.env.DEBUG) {
        console.error(chalk.gray(error.stack));
      }

      throw error;
    }
  }

  /**
   * 🔍 Detecta tipo de projeto
   */
  async detectProject() {
    console.log(chalk.blue("🔍 Detectando tipo de projeto..."));

    const detector = new ProjectDetector();
    this.detection = await detector.detect();

    console.log(chalk.green(`   ✓ Detectado: ${this.detection.type}`));
    if (this.detection.subtype) {
      console.log(chalk.gray(`     Subtipo: ${this.detection.subtype}`));
    }
    console.log(chalk.gray(`     Confiança: ${this.detection.confidence}%`));
  }

  /**
   * 🎓 Executa experiência de onboarding
   */
  async runOnboarding() {
    const onboarding = new Onboarding(this.detection);
    await onboarding.run();
  }

  /**
   * 🏗️ Configura estrutura básica
   */
  async setupStructure() {
    console.log(chalk.blue("🏗️ Configurando estrutura..."));

    // Criar diretórios
    const dirs = [
      this.configDir,
      this.cursorDir,
      this.rulesDir,
      path.join(this.configDir, "templates"),
      this.outputsDir,
      path.join(this.outputsDir, "screenshots"),
      path.join(this.outputsDir, "reports"),
      path.join(this.outputsDir, "logs"),
    ];

    for (const dir of dirs) {
      await fs.ensureDir(dir);
    }

    console.log(chalk.green("   ✓ Estrutura criada"));
  }

  /**
   * 🎯 Configuração completa do Cursor IDE
   */
  async setupCursor() {
    if (this.skipCursor) {
      console.log(chalk.gray("   ⏭ Cursor setup ignorado (--skip-cursor)"));
      return;
    }

    console.log(chalk.blue("🎯 Configurando Cursor IDE..."));

    try {
      // Configuração básica do Cursor
      const cursorSetup = new CursorSetup(this.detection);
      await cursorSetup.run();

      // Custom Modes
      const cursorModes = new CursorModes(this.detection);
      await cursorModes.setup();

      console.log(chalk.green("   ✓ Cursor IDE configurado"));
    } catch (error) {
      console.log(
        chalk.yellow("   ⚠ Cursor não foi configurado completamente")
      );
      console.log(chalk.gray(`     ${error.message}`));
    }
  }

  /**
   * 🚀 Configurações avançadas do Cursor (Rules MDC, Indexing, etc.)
   */
  async setupAdvancedCursorFeatures() {
    if (this.skipCursor) return;

    console.log(chalk.blue("   🎯 Configurando recursos avançados..."));

    try {
      // 1. Rules no formato MDC
      await this.setupAdvancedRules();

      // 2. Codebase indexing otimizado
      await this.setupCodebaseIndexing();

      // 3. AI Commit Messages
      await this.setupCommitMessages();

      // 4. Keyboard shortcuts
      await this.setupKeyboardShortcuts();

      // 5. MCP Server suggestions
      await this.setupMCPServers();

      // 6. Memories preparation
      await this.setupMemoriesGuide();

      // 🆕 7. Context management avançado
      await this.setupContextManagement();

      // 🆕 8. Architectural diagrams
      await this.setupArchitecturalDiagrams();

      // 🆕 9. Web development MCP servers
      await this.setupWebDevelopmentMCP();

      // 🆕 10. Large codebase strategies
      await this.setupLargeCodebaseStrategies();

      // 🆕 11. Documentation mastery
      await this.setupDocumentationStrategies();

      // 🆕 12. Custom API Keys setup
      await this.setupCustomAPIKeys();

      // 🆕 13. Advanced Rules Structure
      await this.setupAdvancedRulesStructure();

      // 🆕 14. Modern Rules Migration (.cursorrules → .mdc)
      await this.setupModernRulesMigration();

      console.log(chalk.green("   ✓ Recursos avançados configurados"));
    } catch (error) {
      console.log(
        chalk.yellow("   ⚠ Alguns recursos avançados não foram configurados")
      );
      console.log(chalk.gray(`     ${error.message}`));
    }
  }

  /**
   * 📜 Rules no formato MDC avançado
   */
  async setupAdvancedRules() {
    const rulesDir = path.join(this.cursorDir, "rules");
    await fs.ensureDir(rulesDir);

    // Rule principal MDC
    const mainRuleMDC = `---
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

    await fs.writeFile(path.join(rulesDir, "ai-workspace.mdc"), mainRuleMDC);

    // Rule específica do stack
    const stackRuleMDC = this.generateStackRuleMDC();
    await fs.writeFile(
      path.join(rulesDir, `${this.detection.type}.mdc`),
      stackRuleMDC
    );

    console.log(chalk.green("     ✓ Rules MDC criadas"));
  }

  /**
   * 🎯 Gera rule específica do stack
   */
  generateStackRuleMDC() {
    if (this.detection.type === "nextjs") {
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
\`\`\`

## Performance Essentials
- Otimize imagens com \`next/image\`
- Use \`next/font\` para fontes
- Configure Bundle Analyzer: \`@next/bundle-analyzer\`
- Implemente ISR quando apropriado

@next-patterns.md
`;
    }

    if (this.detection.type === "react") {
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
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);
  
  const increment = useCallback(() => setCount(c => c + 1), []);
  const decrement = useCallback(() => setCount(c => c - 1), []);
  
  return { count, increment, decrement };
}
\`\`\`

## Performance
- Use React.memo para componentes puros
- useMemo/useCallback apenas quando necessário
- Implemente code splitting com React.lazy

@react-patterns.md
`;
    }

    // Fallback genérico
    return `---
description: Padrões gerais de desenvolvimento
globs: ["**/*.js", "**/*.ts"]
alwaysApply: false
---

# 🔧 General Development Standards

## JavaScript/TypeScript
- Use ES6+ features
- Prefira const/let sobre var
- Use destructuring quando apropriado
- Implemente proper error handling

## Qualidade
- Configure ESLint + Prettier
- Use pre-commit hooks
- Mantenha dependencies atualizadas

@general-patterns.md
`;
  }

  /**
   * 📊 Configura codebase indexing otimizado
   */
  async setupCodebaseIndexing() {
    // .cursorignore inteligente
    const cursorIgnore = this.generateCursorIgnore();
    await fs.writeFile(
      path.join(this.projectRoot, ".cursorignore"),
      cursorIgnore
    );

    // Guia de indexing
    const indexingGuide = `# 📊 Codebase Indexing Guide

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
3. Considere organizar código em módulos menores

## Comandos Úteis
\`\`\`bash
# Verificar status
ai-workspace status

# Limpar e re-indexar
rm -rf .cursor/ && ai-workspace setup
\`\`\`
`;

    await fs.writeFile(
      path.join(this.cursorDir, "indexing-guide.md"),
      indexingGuide
    );
    console.log(chalk.green("     ✓ Codebase indexing otimizado"));
  }

  /**
   * 🚫 Gera .cursorignore inteligente
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

    // Específicos por tipo
    const typeSpecific = {
      nextjs: ["", "# Next.js specific", ".next/", "out/", "next-env.d.ts"],
      react: ["", "# React specific", "build/", ".eslintcache"],
      "node-api": ["", "# API specific", "uploads/", "tmp/", "*.env.local"],
    };

    const specific = typeSpecific[this.detection.type] || [];
    return [...baseIgnores, ...specific].join("\n");
  }

  /**
   * 💬 Configura AI Commit Messages
   */
  async setupCommitMessages() {
    // Keyboard shortcut para commit message
    const keybindings = await this.getExistingKeybindings();
    keybindings.push({
      key: "cmd+shift+m",
      command: "cursor.generateGitCommitMessage",
      when: "scmRepository",
    });

    await this.saveKeybindings(keybindings);

    // Guia de commit messages
    const commitGuide = `# 💬 AI Commit Messages Guide

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
Baseado no seu tipo de projeto (${this.detection.type}):
- feat: nova funcionalidade
- fix: correção de bug
- docs: documentação
- style: formatação
- refactor: refatoração
- test: testes
- chore: tarefas de build/deploy

## Dicas
- Stage apenas arquivos relacionados por commit
- Use commits pequenos e focados
- Revise sempre a mensagem gerada
- O AI aprende com seu histórico

## Shortcut
**Cmd+Shift+M** (configurado automaticamente)
`;

    await fs.writeFile(
      path.join(this.cursorDir, "commit-guide.md"),
      commitGuide
    );
    console.log(chalk.green("     ✓ AI Commit Messages configurado"));
  }

  /**
   * ⌨️ Configura keyboard shortcuts
   */
  async setupKeyboardShortcuts() {
    const keybindings = await this.getExistingKeybindings();

    // Shortcuts específicos do AI Workspace
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

    keybindings.push(...newShortcuts);
    await this.saveKeybindings(keybindings);

    // Guia de shortcuts
    const shortcutsGuide = `# ⌨️ Keyboard Shortcuts Guide

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

    await fs.writeFile(
      path.join(this.cursorDir, "shortcuts-guide.md"),
      shortcutsGuide
    );
    console.log(chalk.green("     ✓ Keyboard shortcuts configurados"));
  }

  /**
   * 🔌 Configura sugestões de MCP Servers
   */
  async setupMCPServers() {
    const mcpSuggestions = `# 🔌 MCP Server Suggestions

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

${this.getTypeSpecificMCPSuggestions()}

## Como Instalar
1. Copie a configuração JSON
2. Adicione em Settings > MCP Servers
3. Ou use deeplinks quando disponíveis

## Deeplink Format
\`cursor://anysphere.cursor-deeplink/mcp/install?name=SERVER_NAME&config=BASE64_CONFIG\`

## Verificar Instalação
- Settings > MCP Servers
- Verifique se aparecem na lista de tools do Chat
`;

    await fs.writeFile(
      path.join(this.cursorDir, "mcp-suggestions.md"),
      mcpSuggestions
    );
    console.log(chalk.green("     ✓ MCP Server suggestions criadas"));
  }

  /**
   * 🧠 Configura guia de Memories
   */
  async setupMemoriesGuide() {
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
    console.log(chalk.green("     ✓ Memories guide criado"));
  }

  /**
   * 💾 Salva configuração local
   */
  async saveConfiguration() {
    const config = {
      version: "1.0.0",
      created: new Date().toISOString(),
      detection: this.detection,
      options: this.options,
      structure: {
        configDir: ".ai-workspace",
        cursorDir: ".cursor",
        outputsDir: "outputs",
      },
    };

    await fs.writeJson(path.join(this.configDir, "local.json"), config, {
      spaces: 2,
    });
    console.log(chalk.green("   ✓ Configuração salva"));
  }

  /**
   * 📜 Configura scripts do package.json
   */
  async setupPackageScripts() {
    const packagePath = path.join(this.projectRoot, "package.json");

    if (await fs.pathExists(packagePath)) {
      const pkg = await fs.readJson(packagePath);

      const newScripts = {
        "ai:health": "ai-workspace health-check",
        "ai:visual": "ai-workspace visual-audit",
        "ai:setup": "ai-workspace setup",
        "ai:status": "ai-workspace status",
      };

      pkg.scripts = { ...pkg.scripts, ...newScripts };

      await fs.writeJson(packagePath, pkg, { spaces: 2 });
      console.log(chalk.green("   ✓ Scripts adicionados ao package.json"));
    }
  }

  // ============ MÉTODOS AUXILIARES ============

  async isFirstTime() {
    const configPath = path.join(this.configDir, "local.json");
    return !(await fs.pathExists(configPath));
  }

  async getExistingKeybindings() {
    const keybindingsPath = path.join(this.cursorDir, "keybindings.json");

    if (await fs.pathExists(keybindingsPath)) {
      return await fs.readJson(keybindingsPath);
    }

    return [];
  }

  async saveKeybindings(keybindings) {
    const keybindingsPath = path.join(this.cursorDir, "keybindings.json");
    await fs.writeJson(keybindingsPath, keybindings, { spaces: 2 });
  }

  estimateFileCount() {
    const estimates = {
      nextjs: "500-2000",
      react: "300-1500",
      "node-api": "200-800",
      vue: "300-1200",
      generic: "100-500",
    };

    return estimates[this.detection.type] || estimates.generic;
  }

  getTypeSpecificMCPSuggestions() {
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

    return typeSpecific[this.detection.type] || "";
  }

  /**
   * 🧠 Configura context management avançado
   */
  async setupContextManagement() {
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

## 🔧 @-Symbols - Context Cirúrgico COMPLETO

### 📁 Core Context Symbols

#### @Files - Arquivos específicos
\`\`\`
@package.json
@components/Button.tsx
@utils/validation.js
\`\`\`
- **Uso**: Referenciar arquivos específicos do projeto
- **Features**: Preview automático, chunking para arquivos longos
- **Drag & Drop**: Arraste arquivos da sidebar para adicionar
- **Autocompletion**: Cursor autocompleta conforme você digita

#### @Folders - Diretórios completos
\`\`\`
@utils/
@components/ui/
@src/services/
\`\`\`
- **Uso**: Contexto amplo de múltiplos arquivos relacionados
- **Vantagem**: Visão completa de um módulo/feature
- **Desvantagem**: Pode incluir muito contexto irrelevante

#### @Code - Símbolos específicos
\`\`\`
@LRUCachedFunction
@UserController.authenticate
@CONFIG.database.url
\`\`\`
- **Uso**: Referenciar funções, classes, variáveis específicas
- **Code Preview**: Mostra preview do código antes de adicionar
- **Keyboard Shortcuts**: Cmd+Shift+L (Chat), Cmd+Shift+K (Edit)
- **Máxima precisão**: Ideal quando você sabe exatamente o que quer

### 📚 Knowledge & Documentation Symbols

#### @Docs - Documentação e guias
\`\`\`
@README.md
@API_DOCS.md
@CONTRIBUTING.md
\`\`\`
- **Uso**: Acessar documentação do projeto
- **Contexto**: Especificações, APIs, guias de desenvolvimento

#### @Web - Recursos externos
\`\`\`
@https://docs.react.dev
@https://nextjs.org/docs
@MDN JavaScript
\`\`\`
- **Uso**: Buscar informações na web aberta
- **Funcionalidade**: Cursor pode pesquisar documentação externa
- **Muito útil**: Para bibliotecas, frameworks, padrões

#### @Cursor Rules - Rules do projeto
\`\`\`
@nextjs-patterns
@code-style
@testing-standards
\`\`\`
- **Uso**: Referenciar rules específicas do projeto
- **Contexto**: Padrões, convenções, guidelines estabelecidas

#### @Notepads - Templates e anotações
\`\`\`
@common-patterns
@troubleshooting-guide
@deployment-checklist
\`\`\`
- **Uso**: Acessar templates salvos e anotações do projeto

### 🔄 History & Changes Symbols

#### @Git - Histórico e mudanças
\`\`\`
@recent-commits
@git-diff
@branch-changes
\`\`\`
- **Uso**: Acessar histórico do Git, diffs, mudanças recentes
- **Contexto**: Entender evolução do código, debugging

#### @Recent Changes - Mudanças recentes
\`\`\`
@last-week-changes
@current-branch-diff
\`\`\`
- **Uso**: Focar nas mudanças mais recentes do projeto

#### @Past Chats - Conversas anteriores
\`\`\`
@debugging-session
@feature-implementation
\`\`\`
- **Uso**: Referenciar conversas anteriores do Composer
- **Contexto**: Manter continuidade entre sessões de desenvolvimento

### 🔧 Development Tools Symbols

#### @Lint Errors - Erros de linting (Chat only)
\`\`\`
@current-lint-errors
@typescript-errors
@eslint-warnings
\`\`\`
- **Uso**: Focar em resolver erros específicos de linting
- **Disponível**: Apenas no Chat, não no Cmd K

#### @Definitions - Definições de símbolos (Cmd K only)
\`\`\`
@function-definition
@class-definition
@interface-definition
\`\`\`
- **Uso**: Buscar definições de símbolos específicos
- **Disponível**: Apenas no Cmd K, não no Chat

#### @Link - Links para código/documentação
\`\`\`
@github-issue-123
@confluence-spec
\`\`\`
- **Uso**: Criar links para recursos externos específicos

### 🎯 Quick Context Symbols

#### #Files - Adicionar sem referenciar
\`\`\`
#package.json
#tsconfig.json
\`\`\`
- **Uso**: Adicionar arquivos ao contexto sem referenciar explicitamente
- **Diferença**: Não cria referência explícita, apenas adiciona ao contexto

#### /Commands - Arquivos ativos
\`\`\`
/open-files
/active-editor
\`\`\`
- **Uso**: Adicionar arquivos abertos e ativos ao contexto
- **Automático**: Inclui arquivos que você está trabalhando atualmente

## 🎮 Navigation & Usage

### Keyboard Navigation
- **Arrow keys**: Navegar pela lista de sugestões
- **Enter**: Selecionar sugestão
- **Tab**: Autocompletar quando possível
- **Esc**: Fechar menu de sugestões

### Smart Filtering
- Cursor filtra automaticamente baseado no que você digita
- Sugestões são rankadas por relevância
- Categorias se expandem automaticamente quando relevantes

### Best Practices por Symbol
- **@Code**: Quando você sabe exatamente qual função/classe
- **@Files**: Para contexto completo de arquivo específico  
- **@Folders**: Para entender módulos/features completas
- **@Web**: Para buscar documentação oficial externa
- **@Git**: Para debugging baseado em mudanças recentes
- **@Past Chats**: Para manter continuidade entre sessões

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
    console.log(chalk.green("     ✓ Context management guide criado"));
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

## 🚀 Template para ${this.detection.type.toUpperCase()}

${this.generateDiagramTemplate()}

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

## 🔧 Setup Mermaid Extension

1. Abra **Extensions tab** no Cursor
2. Busque por **"Mermaid"**
3. Instale a extensão oficial
4. Agora você pode preview diagramas diretamente

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
`;

    await fs.writeFile(
      path.join(this.cursorDir, "architectural-diagrams.md"),
      diagramGuide
    );
    console.log(chalk.green("     ✓ Architectural diagrams guide criado"));
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
1. Check Linear issue → 2. Update Figma design → 3. Generate code → 4. Test in browser → 5. Deploy
\`\`\`

### Debugging Workflow
\`\`\`
1. Monitor browser console → 2. Check network requests → 3. Inspect database queries → 4. Update issue status
\`\`\`

### Design-to-Code Workflow
\`\`\`
1. Access Figma designs → 2. Extract components → 3. Generate React code → 4. Test responsiveness → 5. Deploy
\`\`\`
`;

    await fs.writeFile(
      path.join(this.cursorDir, "web-development-mcp.md"),
      webDevMCP
    );
    console.log(chalk.green("     ✓ Web development MCP guide criado"));
  }

  /**
   * 📊 Gera template de diagrama específico por stack
   */
  generateDiagramTemplate() {
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
   * 📦 Configura estratégias para large codebases
   */
  async setupLargeCodebaseStrategies() {
    const decisionTree = `# 📦 Large Codebase Decision Tree

## 🎯 When to Use Each Tool

| Scenario | Files | Complexity | Best Tool | Rationale |
|----------|-------|------------|-----------|-----------|
| Fix typo/small bug | 1 | Low | **Tab** | Quick, precise, stay in flow |
| Add validation | 1 | Medium | **Cmd K** | Focused edit with context |
| New API endpoint | 2-3 | Medium | **Cmd K** | Scoped functionality |
| New feature module | 5+ | High | **Chat** | Broad context needed |
| Cross-package refactor | 10+ | High | **Chat** | Complex dependencies |
| Debug cross-module | Variable | High | **Chat** | Trace multiple layers |

## 🚀 Workflows for Large Codebases

### 🔍 Exploration Workflow
\`\`\`
1. Chat: "Help me understand how [feature] works"
2. @Folders → Include relevant modules
3. @Git → Check recent changes  
4. @Past Chats → Reference previous explorations
5. Build mental model before changes
\`\`\`

### 📋 Planning Workflow
\`\`\`
1. Ask Mode: Create detailed plan
2. Include @Past Chats context
3. Ask clarifying questions (max 3)
4. Search codebase for patterns
5. Validate approach before implementing
\`\`\`

## 🚨 Context Window Management

### Optimization Strategies
- **Fresh chats**: New chat for each major task
- **Focused context**: Only relevant files/folders
- **Iterative approach**: Build understanding progressively
- **Strategic @-symbols**: Most specific symbol possible

### When to Start Fresh Chat
- Switching feature/module
- Context window getting full
- Change in task scope
- After logical milestone
`;

    await fs.writeFile(
      path.join(this.cursorDir, "large-codebase-strategies.md"),
      decisionTree
    );

    console.log(chalk.green("     ✓ Large codebase strategies configuradas"));
  }

  /**
   * 📚 Configura estratégias completas de documentação
   */
  async setupDocumentationStrategies() {
    const documentationGuide = `# 📚 Documentation Strategy Guide

## 🌳 Documentation Decision Tree

\`\`\`
Que informação você precisa?
├── Public frameworks/libraries
│   ├── Official docs needed? → @Docs (API refs, best practices)
│   └── Community knowledge? → @Web (tutorials, comparisons)
└── Internal company info
    ├── MCP integration available? → Use existing (Confluence, Drive)
    └── Custom needed? → Build MCP server (proprietary systems)
\`\`\`

## ⚠️ Model Knowledge Cutoff Solutions

**Problem**: Models trained até data específica, missing recent updates

**Solutions**:
\`\`\`javascript
// For React 19 (released after cutoff)
@Docs React → Current official documentation
@Web "React 19 new features 2024" → Recent community updates

// For Next.js 15 features
@Docs Next.js → Latest official patterns
@Web "Next.js 15 app router changes" → Community insights

// For internal systems
MCP Internal APIs → Company-specific implementations
\`\`\`

## 💡 Mental Models por Tool

- **@Docs** → Como navegar documentação oficial (autoritativa, atual)
- **@Web** → Como pesquisar soluções na internet (múltiplas perspectivas)
- **MCP** → Como acessar documentação interna (company-specific)

## 🔍 Advanced @Web Search Patterns

### Recent Updates & Features
\`\`\`
@Web "React 19 new features 2024"
@Web "Next.js 15 app router changes"
@Web "TypeScript 5.6 latest features"
\`\`\`

### Error Resolution
\`\`\`
@Web "[exact error message] solution"
@Web "React hydration error fix 2024"
@Web "Next.js build error [specific]"
\`\`\`

### Performance & Optimization
\`\`\`
@Web "React performance optimization 2024"
@Web "Next.js bundle size optimization"
@Web "Node.js memory leak debugging"
\`\`\`

## 🎯 Validation Workflow

Always validate @Web information:
\`\`\`
1. @Web → Find solution/approach
2. @Docs → Verify official recommendation
3. @Past Chats → Check similar implementations
4. Test → Validate in your context
\`\`\`

## 🚀 Complete Documentation Workflows

### Research & Implementation
\`\`\`
1. @Web → Research recent community solutions
2. @Docs → Validate against official recommendations
3. @Past Chats → Check previous similar work
4. MCP Internal → Review company patterns
5. Implement with complete context
\`\`\`

### Living Documentation
\`\`\`
1. Generate initial docs from code
2. Update docs as code changes (@Git monitoring)
3. Add insights from conversations (@Past Chats)
4. Validate with automated tests
5. Keep in sync with implementation
\`\`\`
`;

    await fs.writeFile(
      path.join(this.cursorDir, "documentation-strategy.md"),
      documentationGuide
    );

    // @Docs patterns específicos por stack
    const docsPatterns = this.generateDocsPatterns();
    await fs.writeFile(
      path.join(this.cursorDir, "docs-patterns.md"),
      docsPatterns
    );

    console.log(chalk.green("     ✓ Documentation strategies configuradas"));
  }

  /**
   * 📖 Gera padrões @Docs específicos por stack
   */
  generateDocsPatterns() {
    const patterns = {
      nextjs: `# 🚀 Next.js @Docs Patterns

## Core @Docs Usage
\`\`\`
@Docs Next.js app router → Routing patterns, layouts
@Docs Next.js server components → SSR optimization
@Docs Next.js API routes → Backend endpoints
@Docs Next.js middleware → Request processing
@Docs Next.js deployment → Vercel optimization
\`\`\`

## Common Workflows
\`\`\`
# Setup & Configuration
@Docs Next.js getting started → Basic setup
@Docs Next.js configuration → Advanced options
@Web → Community best practices

# API Implementation
@Docs Next.js API routes → Official patterns
@Web → Real-world examples
@Past Chats → Previous API implementations
\`\`\``,

      react: `# ⚛️ React @Docs Patterns

## Core @Docs Usage
\`\`\`
@Docs React hooks → State management patterns
@Docs React context → Global state sharing
@Docs React concurrent features → Performance optimization
@Docs React testing library → Component testing
@Docs React error boundaries → Error handling
\`\`\`

## Modern Patterns
\`\`\`
# Performance Optimization
@Docs React performance → Official optimization guide
@Web → "React performance 2024 best practices"
@Code → Current component implementations
\`\`\``,

      "node-api": `# 🌐 Node.js API @Docs Patterns

## Core @Docs Usage
\`\`\`
@Docs Express.js → Web framework patterns
@Docs Node.js streams → Data processing
@Docs Node.js security → Authentication best practices
@Docs Node.js testing → API testing strategies
@Docs Node.js deployment → Production optimization
\`\`\`

## Security & Performance
\`\`\`
# Security Implementation
@Docs Node.js security → Official security guide
@Web → "Node.js security best practices 2024"
@Files → Current security middleware
\`\`\``,
    };

    return patterns[this.detection.type] || patterns["node-api"];
  }

  /**
   * 🔑 Configura Custom API Keys
   */
  async setupCustomAPIKeys() {
    const customAPISetup = new CustomAPISetup(this.detection);
    await customAPISetup.setup();
    console.log(chalk.green("     ✓ Custom API Keys configurados"));
  }

  /**
   * 📋 Configura estrutura avançada de rules organizacionais
   */
  async setupAdvancedRulesStructure() {
    const advancedRulesSetup = new AdvancedRulesSetup(this.detection);
    await advancedRulesSetup.setup();
  }

  /**
   * 🔄 Configura migração moderna de rules (.cursorrules → .mdc)
   */
  async setupModernRulesMigration() {
    console.log(chalk.blue("🔄 Configurando migração moderna de rules..."));

    try {
      // 1. Verificar e migrar .cursorrules legacy
      await this.checkAndMigrateLegacyRules();

      // 2. Criar analysis process moderno
      await this.setupModernAnalysisProcess();

      // 3. Configurar context files system
      await this.setupModernContextFiles();

      // 4. Configurar guidelines React 19/Next.js 15
      await this.setupModernFrameworkPatterns();

      console.log(chalk.green("     ✓ Modern rules migration configurada"));
    } catch (error) {
      console.log(chalk.yellow("     ⚠ Modern rules migration não completada"));
      console.log(chalk.gray(`       ${error.message}`));
    }
  }

  /**
   * 🔍 Verifica e migra .cursorrules legacy
   */
  async checkAndMigrateLegacyRules() {
    const legacyPath = path.join(this.projectRoot, ".cursorrules");

    if (await fs.pathExists(legacyPath)) {
      console.log(
        chalk.yellow("       📜 Legacy .cursorrules encontrado - migrando...")
      );

      const content = await fs.readFile(legacyPath, "utf8");

      // Backup original
      await fs.writeFile(`${legacyPath}.backup`, content);

      // Converter para .mdc moderno
      const modernRule = `---
description: "Migrated project rules from legacy .cursorrules format"
globs: ["**/*.js", "**/*.ts", "**/*.jsx", "**/*.tsx"]
alwaysApply: true
---

# Migrated Project Rules

## Project Context
Based on migrated .cursorrules content with modern enhancements.

## Original Content
${content}

## Modern Enhancements
- Converted to .mdc format with metadata
- Enhanced with structured examples
- Optimized for AI understanding

## Critical Rules
- Follow project conventions and established patterns
- Maintain code quality and consistency
- Use TypeScript for type safety
- Implement proper error handling
- Write clear, self-documenting code

## Examples

<example>
Following established project patterns:
- Consistent naming conventions
- Proper TypeScript interfaces
- Error handling implementation
- Clean, readable code structure
</example>

<example type="invalid">
Ignoring project conventions:
- Inconsistent naming
- Missing TypeScript types
- No error handling
- Unclear code structure
</example>

> **Migration Note**: This rule was automatically migrated from .cursorrules format.
> Review and customize based on your specific project needs.
`;

      await fs.writeFile(
        path.join(this.rulesDir, "migrated-legacy-always.mdc"),
        modernRule
      );

      // Guia de migração
      const migrationGuide = `# 🔄 Migration Complete: .cursorrules → .mdc

## ✅ Migration Status
Your legacy \`.cursorrules\` has been successfully migrated to modern \`.mdc\` format!

## 📋 What Changed

### Before (Legacy Format)
\`\`\`
# Simple text format without metadata
System: You are a helpful assistant...
Project: This is a React project...
\`\`\`

### After (Modern .mdc Format)
\`\`\`mdc
---
description: "Rich metadata for better AI understanding"
globs: ["**/*.tsx", "**/*.ts"] 
alwaysApply: true
---

# Structured Rules with Clear Examples

## Critical Rules
- Actionable directives
- Clear guidelines

## Examples
<example>Valid patterns</example>
<example type="invalid">Invalid patterns</example>
\`\`\`

## 🎯 Benefits of Modern Format

**Enhanced AI Understanding:**
- **🤖 Better Responses**: Metadata helps AI provide more accurate assistance
- **📐 Standardization**: Consistent with Cursor best practices
- **🧠 Context Awareness**: Better project understanding
- **👥 Team Collaboration**: Shareable, documented standards

**Modern Features:**
- **Metadata frontmatter**: description, globs, alwaysApply
- **Structured content**: Clear sections and examples
- **Example patterns**: Valid and invalid usage examples
- **Type-specific rules**: Automatic application based on file types

## 📁 Files Created

- \`.cursor/rules/migrated-legacy-always.mdc\` - Your migrated rules
- \`.cursorrules.backup\` - Backup of original file  
- \`.cursor/migration-guide.md\` - This migration guide

## 🚀 Next Steps

1. **Review migrated rules**: Customize \`migrated-legacy-always.mdc\`
2. **Add modern patterns**: Include React 19/Next.js 15 specific guidelines
3. **Create specialized rules**: Split into focused, reusable rules
4. **Remove backup**: Delete \`.cursorrules.backup\` when satisfied
5. **Explore features**: Learn about advanced rule organization

## 🎯 Modern Rule Types Available

- **Auto Rules** (\`rule-name-auto.mdc\`) - Apply based on file globs
- **Agent Rules** (\`rule-name-agent.mdc\`) - AI decides when to apply
- **Always Rules** (\`rule-name-always.mdc\`) - Always active
- **Manual Rules** (\`rule-name-manual.mdc\`) - Explicit activation

## 📚 Learn More

- [Advanced Rules Organization](../README.md#advanced-rules-organization)
- [Context Management Guide](./context-management.md)
- [Modern Development Patterns](./modern-patterns.md)

**Congratulations! Your project is now using modern Cursor rules! 🎉**
`;

      await fs.writeFile(
        path.join(this.cursorDir, "migration-guide.md"),
        migrationGuide
      );

      console.log(
        chalk.green("       ✓ Legacy .cursorrules migrado com sucesso")
      );
    }
  }

  /**
   * 🎯 Configura analysis process moderno
   */
  async setupModernAnalysisProcess() {
    const analysisRule = `---
description: "Systematic development analysis process for all coding tasks"
globs: ["**/*.tsx", "**/*.ts", "**/*.jsx", "**/*.js"]
alwaysApply: true
---

# Modern Development Analysis Process

## Core Methodology: Always Follow These Steps

### 1. Request Analysis
- **Task Classification**: Identify code creation, debugging, architecture, or refactoring
- **Technology Stack**: Note languages, frameworks, and libraries involved
- **Requirements Gathering**: List explicit and implicit requirements
- **Outcome Definition**: Define core problem and desired solution
- **Constraint Assessment**: Consider project context, performance, security

### 2. Solution Planning
- **Step Decomposition**: Break into logical, manageable components
- **Modularity Design**: Plan for reusability and maintainability
- **Dependency Mapping**: Identify files, packages, services needed
- **Alternative Evaluation**: Compare approaches and trade-offs
- **Validation Strategy**: Plan testing approach and success criteria

### 3. Implementation Strategy
- **Pattern Selection**: Choose appropriate design patterns
- **Performance Consideration**: Identify optimization opportunities
- **Error Handling Design**: Plan for edge cases and graceful degradation
- **Accessibility Compliance**: Ensure WCAG standards and inclusive design
- **Best Practice Verification**: Code quality, security, maintainability

## Modern Code Quality Standards

### General Principles
- **Write concise, readable code** with clear intent and purpose
- **Use functional and declarative patterns** over imperative approaches
- **Follow DRY principle** (Don't Repeat Yourself) consistently
- **Implement early returns** for improved readability and flow
- **Structure logically**: exports → subcomponents → helpers → types

### Naming Conventions
- **Descriptive variable names** with auxiliary verbs (\`isLoading\`, \`hasError\`)
- **Event handlers** prefixed with "handle" (\`handleClick\`, \`handleSubmit\`)
- **Directory structure** in lowercase with dashes (\`components/auth-wizard\`)
- **Component exports** use named exports for better tree-shaking

### TypeScript Best Practices
- **Use TypeScript for all code** without \`any\` types
- **Prefer interfaces over types** for object shape definitions
- **Avoid enums**; use const assertion objects instead
- **Implement proper type safety** with strict mode enabled
- **Use \`satisfies\` operator** for better type validation

### Modern React Patterns (When Applicable)
- **Favor functional components** with hooks over class components
- **Use Server Components** by default in Next.js App Router
- **Client Components** only for interactivity and user input
- **Implement proper error boundaries** with error.tsx files
- **Use Suspense boundaries** for async operations with loading.tsx

## Examples

<example>
Request: "Create a user authentication form with validation"

Applying Analysis Process:
1. **Request**: React form component with real-time validation
2. **Planning**: Form state management, validation rules, error states, API integration
3. **Strategy**: Modern React 19 patterns, accessibility, security practices

Result: Well-structured component with proper TypeScript interfaces,
comprehensive validation, error handling, and excellent user experience.
</example>

<example type="invalid">
Skipping analysis and jumping straight to implementation:
- No requirement consideration
- Missing error handling strategy  
- Unclear naming conventions
- No type safety planning
- Poor user experience design
</example>

## Quality Checklist

Before completing any task, verify:
- [ ] Analysis process followed completely
- [ ] TypeScript types properly defined
- [ ] Error handling implemented
- [ ] Accessibility considerations addressed
- [ ] Performance implications evaluated
- [ ] Testing strategy considered
- [ ] Documentation/comments added where needed
`;

    await fs.writeFile(
      path.join(
        this.rulesDir,
        "core-rules",
        "modern-analysis-process-always.mdc"
      ),
      analysisRule
    );

    console.log(chalk.green("       ✓ Modern analysis process configurado"));
  }

  /**
   * 📋 Configura context files modernos
   */
  async setupModernContextFiles() {
    // instructions.md moderno
    const modernInstructions = `# ${this.detection.type.toUpperCase()} Project Instructions

## Project Overview
Modern ${
      this.detection.type
    } application with latest best practices and patterns.

## Technology Stack

### Frontend Technologies
${this.getModernTechStack().frontend.join("\n")}

### Backend Technologies  
${this.getModernTechStack().backend.join("\n")}

### Development Tools
${this.getModernTechStack().tools.join("\n")}

## Architecture Patterns
${this.getModernArchitecture()}

## Development Standards

### Code Quality
- **TypeScript Strict Mode**: Enabled for maximum type safety
- **ESLint + Prettier**: Automated code formatting and quality
- **Husky Pre-commit Hooks**: Quality gates before commits
- **Conventional Commits**: Standardized commit message format

### Testing Strategy
- **Unit Testing**: Jest with comprehensive coverage
- **Component Testing**: React Testing Library for UI components
- **Integration Testing**: API and database integration tests
- **E2E Testing**: Playwright for critical user journeys

### Performance Standards
- **Core Web Vitals**: LCP < 2.5s, FID < 100ms, CLS < 0.1
- **Bundle Size**: Monitor and optimize chunk sizes
- **Image Optimization**: Use next/image or optimized formats
- **Code Splitting**: Lazy loading for non-critical code

### Accessibility Requirements
- **WCAG 2.1 AA Compliance**: Full accessibility support
- **Semantic HTML**: Proper heading hierarchy and landmarks
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: ARIA labels and descriptions

## Build and Deployment

### Development Workflow
1. \`npm install\` - Install all dependencies
2. \`npm run dev\` - Start development server with hot reload
3. \`npm run build\` - Create optimized production build
4. \`npm run test\` - Run complete test suite
5. \`npm run lint\` - Perform code quality checks

### Quality Gates
- All tests must pass before deployment
- ESLint errors must be resolved
- TypeScript compilation must succeed
- Performance budgets must be met
- Accessibility tests must pass

## Project Structure
\`\`\`
${this.getModernProjectStructure()}
\`\`\`

## Development Guidelines

### Component Development
- Use functional components with hooks
- Implement proper TypeScript interfaces
- Follow component composition patterns
- Add comprehensive error boundaries
- Include loading and error states

### State Management
- Use built-in React state for local state
- Implement Context + useReducer for complex state
- Consider Zustand for global client state
- Use Server State libraries (React Query/SWR) for server data

### API Integration
- Use modern fetch patterns with error handling
- Implement proper loading and error states
- Add request/response interceptors
- Include retry logic for failed requests
- Cache responses appropriately

### Security Practices
- Validate all user inputs
- Sanitize data before rendering
- Implement proper authentication flows
- Use HTTPS in production
- Follow OWASP security guidelines
`;

    await fs.writeFile(
      path.join(this.cursorDir, "instructions.md"),
      modernInstructions
    );

    // roadmap.md moderno
    const modernRoadmap = `# Development Roadmap

## Current Sprint: Foundation & Modern Setup
**Duration**: 2 weeks
**Goal**: Establish modern development foundation

### ✅ Completed
- [x] Project initialization with modern tooling
- [x] TypeScript configuration with strict mode
- [x] ESLint + Prettier setup with team standards
- [x] Modern rules migration (.cursorrules → .mdc)

### 🚧 In Progress
- [ ] Core component library development
- [ ] Authentication system with modern patterns
- [ ] Database schema design and migrations
- [ ] API layer architecture implementation

### 📋 Next Up
- [ ] Testing framework setup (Jest + RTL)
- [ ] Performance monitoring integration
- [ ] Accessibility audit and improvements
- [ ] CI/CD pipeline configuration

## Sprint 2: Core Features Implementation
**Duration**: 3 weeks
**Goal**: Implement primary application features

### Primary Features
- [ ] User management system
- [ ] Data visualization components
- [ ] Real-time updates implementation
- [ ] File upload and processing
- [ ] Advanced search functionality

### Technical Improvements
- [ ] Performance optimization
- [ ] Bundle size optimization
- [ ] Image optimization pipeline
- [ ] Caching strategy implementation

### Quality Assurance
- [ ] Comprehensive test coverage (>80%)
- [ ] E2E test scenarios
- [ ] Performance benchmarking
- [ ] Security audit

## Sprint 3: Enhancement & Polish
**Duration**: 2 weeks
**Goal**: Production readiness and optimization

### Enhancement Features
- [ ] Advanced analytics dashboard
- [ ] Mobile responsive design
- [ ] Offline functionality
- [ ] Progressive Web App features

### Production Preparation
- [ ] Production deployment setup
- [ ] Monitoring and logging
- [ ] Error tracking integration
- [ ] Performance monitoring
- [ ] Documentation completion

## Future Roadmap

### Phase 2: Advanced Features (Month 2)
- [ ] Advanced user roles and permissions
- [ ] Third-party integrations
- [ ] Advanced reporting features
- [ ] Mobile application development

### Phase 3: Scale & Optimize (Month 3)
- [ ] Microservices architecture
- [ ] Advanced caching strategies
- [ ] International localization
- [ ] Advanced analytics

### Phase 4: Innovation (Month 4+)
- [ ] AI/ML feature integration
- [ ] Advanced automation
- [ ] Platform extensibility
- [ ] Enterprise features

## Success Metrics

### Technical Metrics
- **Performance**: Core Web Vitals all green
- **Quality**: Test coverage > 80%
- **Security**: Zero critical vulnerabilities
- **Accessibility**: WCAG 2.1 AA compliance

### Business Metrics
- **User Experience**: High satisfaction scores
- **Reliability**: 99.9% uptime
- **Performance**: < 2s page load times
- **Adoption**: Target user engagement metrics

## Risk Mitigation

### Technical Risks
- **Dependency Management**: Regular updates and security patches
- **Performance**: Continuous monitoring and optimization
- **Scalability**: Architecture review and planning
- **Security**: Regular audits and penetration testing

### Timeline Risks
- **Scope Creep**: Clear requirements and change management
- **Resource Allocation**: Proper team capacity planning
- **Technical Debt**: Regular refactoring and code review
- **Quality Issues**: Comprehensive testing strategy
`;

    await fs.writeFile(path.join(this.cursorDir, "roadmap.md"), modernRoadmap);

    console.log(chalk.green("       ✓ Modern context files criados"));
  }

  /**
   * ⚛️ Configura patterns modernos para React 19/Next.js 15
   */
  async setupModernFrameworkPatterns() {
    if (this.detection.type === "react" || this.detection.type === "nextjs") {
      const modernPatternsRule = `---
description: "React 19 and Next.js 15 modern development patterns and best practices"
globs: ["app/**/*", "pages/**/*", "components/**/*", "**/*.tsx", "**/*.jsx"]
alwaysApply: false
---

# React 19 & Next.js 15 Modern Patterns

## Framework Evolution: Key Changes

### React 19 New Features
- **useActionState**: Replaces deprecated useFormState
- **Enhanced useFormStatus**: New properties (data, method, action)
- **Improved Server Components**: Better hydration and performance
- **Advanced Concurrent Features**: Better user experience

### Next.js 15 Improvements
- **Stable App Router**: Production-ready with enhanced performance
- **Improved Server Components**: Better streaming and caching
- **Enhanced Middleware**: More powerful request processing
- **Better Developer Experience**: Improved error messages and debugging

## Modern Component Architecture

### Server Components First Strategy (Next.js 15)
\`\`\`tsx
// ✅ Default: Server Component for data fetching
import { Suspense } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'User Dashboard',
  description: 'Comprehensive user analytics and insights'
};

// Server Component - runs on server, no client JS
export default async function DashboardPage() {
  // Direct database access in Server Component
  const userData = await fetchUserData();
  const analytics = await fetchAnalytics();
  
  return (
    <div className="dashboard">
      <h1>User Dashboard</h1>
      <Suspense fallback={<UserDataSkeleton />}>
        <UserDataSection data={userData} />
      </Suspense>
      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsSection data={analytics} />
      </Suspense>
    </div>
  );
}

// ✅ Client Component only when needed for interactivity
'use client';

function InteractiveChart({ data }: { data: ChartData }) {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  
  return (
    <div>
      <PeriodSelector 
        value={selectedPeriod}
        onChange={setSelectedPeriod}
      />
      <Chart data={data} period={selectedPeriod} />
    </div>
  );
}
\`\`\`

## Modern State Management Patterns

### Form Handling with React 19
\`\`\`tsx
// ✅ Modern: useActionState (React 19)
import { useActionState } from 'react';

async function updateProfile(prevState: any, formData: FormData) {
  try {
    const email = formData.get('email') as string;
    const name = formData.get('name') as string;
    
    // Validation
    if (!email || !name) {
      return { error: 'All fields are required' };
    }
    
    // API call
    await updateUserProfile({ email, name });
    return { success: 'Profile updated successfully' };
  } catch (error) {
    return { error: 'Failed to update profile' };
  }
}

function ProfileForm() {
  const [state, formAction] = useActionState(updateProfile, null);
  
  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name">Name</label>
        <input 
          id="name"
          name="name" 
          type="text" 
          required 
          className="input"
        />
      </div>
      
      <div>
        <label htmlFor="email">Email</label>
        <input 
          id="email"
          name="email" 
          type="email" 
          required 
          className="input"
        />
      </div>
      
      <SubmitButton />
      
      {state?.error && (
        <div className="error-message">{state.error}</div>
      )}
      {state?.success && (
        <div className="success-message">{state.success}</div>
      )}
    </form>
  );
}

// ✅ Enhanced useFormStatus with new properties
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending, data, method, action } = useFormStatus();
  
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="btn-primary"
    >
      {pending ? 'Updating...' : 'Update Profile'}
    </button>
  );
}

// ❌ Deprecated: Don't use useFormState
import { useFormState } from 'react-dom'; // Avoid this
\`\`\`

### URL State Management with nuqs
\`\`\`tsx
// ✅ Modern URL state management
import { useQueryState } from 'nuqs';

function ProductsPage() {
  const [search, setSearch] = useQueryState('search');
  const [category, setCategory] = useQueryState('category');
  const [page, setPage] = useQueryState('page', { defaultValue: 1 });
  const [sortBy, setSortBy] = useQueryState('sortBy', { defaultValue: 'name' });
  
  // URL state automatically synced: ?search=laptop&category=electronics&page=2&sortBy=price
  
  return (
    <div className="products-page">
      <div className="filters">
        <input 
          value={search || ''}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
        />
        
        <select 
          value={category || ''}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="electronics">Electronics</option>
          <option value="clothing">Clothing</option>
        </select>
        
        <select 
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="name">Sort by Name</option>
          <option value="price">Sort by Price</option>
          <option value="rating">Sort by Rating</option>
        </select>
      </div>
      
      <ProductsList 
        search={search}
        category={category}
        page={page}
        sortBy={sortBy}
      />
      
      <Pagination 
        currentPage={page}
        onPageChange={setPage}
      />
    </div>
  );
}

// ❌ Avoid: Complex useState for URL synchronization
const [filters, setFilters] = useState({ search: '', category: '' });
// Then manually sync with useEffect and router.push
\`\`\`

## Component Structure Best Practices

### Optimal Component Organization
\`\`\`tsx
// ✅ Recommended modern component structure
// 1. Imports (external libraries first, then internal)
import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useUserData } from '@/hooks/useUserData';

// 2. Types and interfaces (co-located with component)
interface UserDashboardProps {
  userId: string;
  initialData?: UserData;
  onUserUpdate?: (user: UserData) => void;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

// 3. Main component function
export function UserDashboard({ 
  userId, 
  initialData, 
  onUserUpdate 
}: UserDashboardProps) {
  // 4. Hooks (state, context, custom hooks)
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [optimisticUpdate, setOptimisticUpdate] = useState<UserData | null>(null);
  
  const { 
    data: userData, 
    loading, 
    error, 
    mutate 
  } = useUserData(userId, { initialData });

  // 5. Computed values and memoization
  const displayData = useMemo(() => {
    return optimisticUpdate || userData || initialData;
  }, [optimisticUpdate, userData, initialData]);

  // 6. Event handlers (use useCallback for performance)
  const handleEdit = useCallback(() => {
    setEditing(true);
  }, []);

  const handleSave = useCallback(async (newData: UserData) => {
    // Optimistic update
    setOptimisticUpdate(newData);
    setEditing(false);
    
    try {
      await mutate(newData);
      onUserUpdate?.(newData);
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticUpdate(null);
      setEditing(true);
    }
  }, [mutate, onUserUpdate]);

  const handleCancel = useCallback(() => {
    setEditing(false);
    setOptimisticUpdate(null);
  }, []);

  // 7. Early returns for loading and error states
  if (loading && !displayData) {
    return <UserDashboardSkeleton />;
  }

  if (error && !displayData) {
    return <UserDashboardError error={error} onRetry={() => mutate()} />;
  }

  if (!displayData) {
    return <UserNotFound userId={userId} />;
  }

  // 8. Main render
  return (
    <Card className="user-dashboard">
      <Card.Header>
        <div className="flex justify-between items-center">
          <h2>User Profile</h2>
          {!editing && (
            <Button onClick={handleEdit}>Edit</Button>
          )}
        </div>
      </Card.Header>
      
      <Card.Content>
        {editing ? (
          <UserEditForm 
            user={displayData}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : (
          <UserDisplayView user={displayData} />
        )}
      </Card.Content>
    </Card>
  );
}

// 9. Supporting components (small and related only)
function UserDashboardSkeleton() {
  return (
    <Card className="user-dashboard">
      <Card.Header>
        <div className="h-6 bg-gray-200 rounded animate-pulse" />
      </Card.Header>
      <Card.Content>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        </div>
      </Card.Content>
    </Card>
  );
}

function UserDashboardError({ error, onRetry }: { 
  error: Error; 
  onRetry: () => void; 
}) {
  return (
    <Card className="user-dashboard">
      <Card.Content>
        <div className="text-center">
          <p className="text-red-600">Failed to load user data</p>
          <Button onClick={onRetry} className="mt-2">
            Try Again
          </Button>
        </div>
      </Card.Content>
    </Card>
  );
}

// 10. Type exports (if needed by other components)
export type { UserDashboardProps, UserData };
\`\`\`

## Performance Optimization Patterns

### Next.js 15 Performance Best Practices
\`\`\`tsx
// ✅ Image optimization with next/image
import Image from 'next/image';

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="product-card">
      <Image
        src={product.image}
        alt={product.name}
        width={300}
        height={200}
        priority={product.featured} // Load featured images first
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ..." // Low quality placeholder
      />
      <h3>{product.name}</h3>
      <p>{product.price}</p>
    </div>
  );
}

// ✅ Font optimization with next/font
import { Inter, Roboto_Mono } from 'next/font/google';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Improve loading performance
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-roboto-mono',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={\`\${inter.className} \${robotoMono.variable}\`}>
      <body>{children}</body>
    </html>
  );
}

// ✅ Strategic React.memo usage
const ExpensiveProductList = React.memo(function ProductList({ 
  products, 
  onProductClick 
}: {
  products: Product[];
  onProductClick: (id: string) => void;
}) {
  return (
    <div className="product-grid">
      {products.map(product => (
        <ProductCard 
          key={product.id}
          product={product}
          onClick={() => onProductClick(product.id)}
        />
      ))}
    </div>
  );
});

// ✅ Optimized callbacks and memoization
function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  // Memoize expensive computations
  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return products;
    return products.filter(p => p.category === selectedCategory);
  }, [products, selectedCategory]);

  // Memoize event handlers
  const handleProductClick = useCallback((productId: string) => {
    // Handle product selection
    router.push(\`/products/\${productId}\`);
  }, [router]);

  return (
    <div>
      <CategoryFilter 
        value={selectedCategory}
        onChange={setSelectedCategory}
      />
      <ExpensiveProductList 
        products={filteredProducts}
        onProductClick={handleProductClick}
      />
    </div>
  );
}
\`\`\`

## Error Handling and Loading States

### Comprehensive Error Boundaries
\`\`\`tsx
// app/error.tsx (Next.js App Router)
'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="error-boundary">
      <div className="error-content">
        <h2>Something went wrong!</h2>
        <p className="error-message">
          {error.message || 'An unexpected error occurred'}
        </p>
        <div className="error-actions">
          <button 
            onClick={reset}
            className="btn-primary"
          >
            Try again
          </button>
          <button 
            onClick={() => window.location.href = '/'}
            className="btn-secondary"
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  );
}

// app/loading.tsx (Next.js App Router)
export default function Loading() {
  return (
    <div className="loading-container">
      <div className="spinner" />
      <p>Loading...</p>
    </div>
  );
}

// Component-level error boundary
class ComponentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="component-error">
          <p>This component failed to load.</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
\`\`\`

## Examples

<example>
Modern Next.js 15 application with React 19 features:
- Server Components for data fetching by default
- Client Components only for interactivity
- useActionState for form handling
- Enhanced useFormStatus with new properties
- URL state management with nuqs
- Proper TypeScript interfaces throughout
- Comprehensive error boundaries
- Performance optimizations with next/image and next/font
- Structured component organization
</example>

<example type="invalid">
Legacy patterns to avoid:
- Using deprecated useFormState instead of useActionState
- Adding 'use client' unnecessarily to all components
- Missing error boundaries and loading states
- No TypeScript type definitions
- Poor component structure and organization
- Inefficient state management patterns
- Missing performance optimizations
- Complex manual URL state synchronization
</example>

## Migration Checklist

### From Legacy React to React 19
- [ ] Replace useFormState with useActionState
- [ ] Update useFormStatus usage for new properties
- [ ] Implement proper Server/Client Component split
- [ ] Add comprehensive error boundaries
- [ ] Update to modern component structure

### From Legacy Next.js to Next.js 15
- [ ] Migrate to App Router if using Pages Router
- [ ] Implement Server Components by default
- [ ] Add loading.tsx and error.tsx files
- [ ] Update to next/image and next/font
- [ ] Optimize performance with modern patterns
`;

      await fs.writeFile(
        path.join(
          this.rulesDir,
          "stack-rules",
          "react-19-nextjs-15-patterns-auto.mdc"
        ),
        modernPatternsRule
      );

      console.log(
        chalk.green("       ✓ Modern React 19/Next.js 15 patterns configurados")
      );
    }
  }

  /**
   * 🛠️ Helpers para tech stack moderno
   */
  getModernTechStack() {
    const stacks = {
      nextjs: {
        frontend: [
          "- **React 19**: Latest version with modern hooks and patterns",
          "- **Next.js 15**: App Router with enhanced Server Components",
          "- **TypeScript**: Strict mode for maximum type safety",
          "- **Tailwind CSS**: Utility-first styling with design system",
        ],
        backend: [
          "- **Next.js API Routes**: Full-stack capabilities",
          "- **Database**: PostgreSQL with Prisma ORM",
          "- **Authentication**: NextAuth.js or custom JWT implementation",
          "- **Validation**: Zod for runtime type checking",
        ],
        tools: [
          "- **ESLint + Prettier**: Code quality and formatting",
          "- **Jest + React Testing Library**: Comprehensive testing",
          "- **Playwright**: End-to-end testing",
          "- **Vercel**: Deployment and hosting",
        ],
      },
      react: {
        frontend: [
          "- **React 19**: Modern hooks and concurrent features",
          "- **TypeScript**: Strict configuration for type safety",
          "- **Vite**: Fast build tool and development server",
          "- **Tailwind CSS**: Responsive design system",
        ],
        backend: [
          "- **Node.js**: Runtime environment",
          "- **Express.js**: Web application framework",
          "- **Database**: PostgreSQL with modern ORM",
          "- **API**: RESTful design with OpenAPI documentation",
        ],
        tools: [
          "- **ESLint + Prettier**: Code quality standards",
          "- **Jest + RTL**: Unit and integration testing",
          "- **Storybook**: Component development and documentation",
          "- **CI/CD**: Automated testing and deployment",
        ],
      },
    };

    return stacks[this.detection.type] || stacks.react;
  }

  getModernArchitecture() {
    const architectures = {
      nextjs: `- **App Router Architecture**: File-based routing with layouts and loading states
- **Server-First Components**: Default to Server Components, Client only for interactivity  
- **Streaming and Suspense**: Progressive loading for better user experience
- **API Routes**: Co-located backend functionality with frontend code
- **Middleware**: Request processing, authentication, and redirects`,

      react: `- **Component Composition**: Reusable, composable UI building blocks
- **Custom Hooks**: Shared logic extraction and reusability
- **Context + Reducer**: Global state management for complex state
- **Error Boundaries**: Graceful error handling and recovery
- **Code Splitting**: Lazy loading for performance optimization`,
    };

    return architectures[this.detection.type] || architectures.react;
  }

  getModernProjectStructure() {
    const structures = {
      nextjs: `app/                      # Next.js 15 App Router
├── layout.tsx             # Root layout with providers
├── page.tsx              # Homepage
├── loading.tsx           # Loading UI
├── error.tsx             # Error boundary
├── globals.css           # Global styles
├── (dashboard)/          # Route groups
│   ├── layout.tsx        # Dashboard layout
│   ├── page.tsx          # Dashboard home
│   └── settings/         # Nested routes
│       └── page.tsx      # Settings page
└── api/                  # API routes
    ├── auth/             # Authentication endpoints
    └── users/            # User management
components/               # Reusable UI components
├── ui/                   # Base UI components
│   ├── button.tsx        # Button component
│   ├── card.tsx          # Card component
│   └── input.tsx         # Input component
├── forms/                # Form components
└── layout/               # Layout components
lib/                      # Utilities and configurations
├── auth.ts              # Authentication logic
├── db.ts                # Database connection
├── utils.ts             # Utility functions
└── validations.ts       # Zod schemas
types/                    # TypeScript definitions
├── auth.ts              # Authentication types
├── user.ts              # User types
└── api.ts               # API response types
public/                   # Static assets
├── images/              # Image assets
└── icons/               # Icon files`,

      react: `src/
├── components/           # React components
│   ├── ui/              # Base UI components
│   ├── forms/           # Form components
│   ├── layout/          # Layout components
│   └── pages/           # Page-specific components
├── hooks/               # Custom React hooks
│   ├── useAuth.ts       # Authentication hook
│   ├── useApi.ts        # API integration hook
│   └── useLocalStorage.ts # Local storage hook
├── utils/               # Utility functions
│   ├── api.ts           # API client
│   ├── auth.ts          # Authentication utilities
│   └── formatting.ts   # Data formatting
├── types/               # TypeScript definitions
│   ├── user.ts          # User types
│   ├── api.ts           # API types
│   └── common.ts        # Common types
├── contexts/            # React contexts
│   ├── AuthContext.tsx  # Authentication context
│   └── ThemeContext.tsx # Theme context
├── __tests__/           # Test files
│   ├── components/      # Component tests
│   ├── hooks/           # Hook tests
│   └── utils/           # Utility tests
├── App.tsx              # Main App component
└── main.tsx             # Application entry point
public/                   # Static assets
├── images/              # Image assets
└── icons/               # Icon files`,
    };

    return structures[this.detection.type] || structures.react;
  }
}
