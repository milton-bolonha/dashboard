/**
 * 🎯 Cursor Setup - Configuração automática do Cursor IDE
 * Gera rules, notepads e configurações otimizadas por tipo de projeto
 */

import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import config from "../ai.config.js";
import { CursorModes } from "./CursorModes.js";
import { BackgroundAgentSetup } from "./BackgroundAgentSetup.js";

export class CursorSetup {
  constructor(detection) {
    this.detection = detection;
    this.projectRoot = process.cwd();
    this.cursorDir = path.join(this.projectRoot, ".cursor");
  }

  /**
   * 🚀 Processo principal de configuração do Cursor
   */
  async run() {
    console.log(chalk.blue("🎯 Configurando Cursor IDE..."));

    try {
      // 1. Criar estrutura .cursor
      await this.createCursorStructure();

      // 2. Gerar rules customizadas
      await this.generateRules();

      // 3. Criar notepads de templates
      await this.createNotepads();

      // 4. Configurar documentação
      await this.setupDocs();

      // 5. Criar configuração de settings (se aplicável)
      await this.createCursorSettings();

      // 6. Configurar custom modes (Beta)
      await this.setupCustomModes();

      // 7. Configurar background agents environment
      await this.setupBackgroundAgents();

      console.log(chalk.green("✅ Cursor configurado com sucesso!"));
    } catch (error) {
      console.error(
        chalk.red("❌ Erro na configuração do Cursor:"),
        error.message
      );
      throw error;
    }
  }

  /**
   * 📁 Cria estrutura de diretórios .cursor
   */
  async createCursorStructure() {
    const dirs = [
      this.cursorDir,
      path.join(this.cursorDir, "rules"),
      path.join(this.cursorDir, "notepads"),
    ];

    for (const dir of dirs) {
      await fs.ensureDir(dir);
    }
  }

  /**
   * 📜 Gera rules customizadas baseadas no projeto
   */
  async generateRules() {
    const rulesPath = path.join(this.cursorDir, "rules");

    // Rule base para todos os projetos
    const baseRule = this.generateBaseRule();
    await fs.writeFile(path.join(rulesPath, "base.md"), baseRule);

    // Rule específica do tipo de projeto
    const projectRule = this.generateProjectRule();
    await fs.writeFile(
      path.join(rulesPath, `${this.detection.type}.md`),
      projectRule
    );

    // Rule de qualidade de código
    const qualityRule = this.generateQualityRule();
    await fs.writeFile(path.join(rulesPath, "quality.md"), qualityRule);

    console.log(chalk.green(`   ✓ Rules criadas para ${this.detection.type}`));
  }

  /**
   * 📋 Cria notepads com templates e padrões
   */
  async createNotepads() {
    const notepadsPath = path.join(this.cursorDir, "notepads");

    // Notepad de padrões do projeto
    const patternsNotepad = this.generatePatternsNotepad();
    await fs.writeFile(
      path.join(notepadsPath, `${this.detection.type}-patterns.md`),
      patternsNotepad
    );

    // Notepad de comandos comuns
    const commandsNotepad = this.generateCommandsNotepad();
    await fs.writeFile(
      path.join(notepadsPath, "ai-commands.md"),
      commandsNotepad
    );

    // Notepad de troubleshooting
    const troubleshootingNotepad = this.generateTroubleshootingNotepad();
    await fs.writeFile(
      path.join(notepadsPath, "troubleshooting.md"),
      troubleshootingNotepad
    );

    console.log(chalk.green("   ✓ Notepads criados"));
  }

  /**
   * 📚 Configura documentação automática
   */
  async setupDocs() {
    const docsConfig = config.cursor.docs[this.detection.type];

    if (docsConfig) {
      // Criar arquivo de configuração de docs para o Cursor
      const docsConfigPath = path.join(this.cursorDir, "docs.json");
      const docsData = {
        sources: docsConfig.map((url) => ({
          url,
          name: this.getDocName(url),
        })),
      };

      await fs.writeJson(docsConfigPath, docsData, { spaces: 2 });
      console.log(chalk.green("   ✓ Documentação configurada"));
    }
  }

  /**
   * ⚙️ Cria configurações do Cursor (se aplicável)
   */
  async createCursorSettings() {
    const settingsPath = path.join(this.cursorDir, "settings.json");

    const settings = {
      rules: {
        enableAutoApply: true,
        preferredRules: [
          `.cursor/rules/${this.detection.type}.md`,
          ".cursor/rules/base.md",
          ".cursor/rules/quality.md",
        ],
      },
      chat: {
        defaultMode: "agent",
        autoRefresh: true,
        largeContext: true,
      },
      features: {
        cursorTab: true,
        autoImport: true,
        iterateOnLints: true,
      },
    };

    await fs.writeJson(settingsPath, settings, { spaces: 2 });
    console.log(chalk.green("   ✓ Settings do Cursor configurados"));
  }

  /**
   * 📜 Gera rule base aplicável a todos os projetos
   */
  generateBaseRule() {
    return `# 🤖 AI Workspace - Base Rules

## Princípios Gerais

Você é um assistente de desenvolvimento especializado em ${this.detection.type}. Siga estas diretrizes:

### 🎯 Código Limpo
- Escreva código legível e bem documentado
- Use nomes descritivos para variáveis e funções
- Mantenha funções pequenas e focadas em uma responsabilidade
- Evite repetição de código (DRY principle)

### 🔧 Boas Práticas
- Sempre inclua tratamento de erros apropriado
- Use async/await em vez de callbacks quando possível
- Implemente validação de entrada para funções públicas
- Adicione comentários explicativos para lógica complexa

### 🧪 Testes
- Considere testabilidade ao escrever código
- Prefira testes unitários para lógica de negócio
- Use mocks para dependências externas
- Mantenha testes simples e focados

### 📦 Estrutura
- Organize arquivos em estrutura lógica
- Use imports/exports de forma consistente
- Mantenha dependências atualizadas
- Documente APIs públicas

### 🚀 Performance
- Evite operações custosas desnecessárias
- Use lazy loading quando apropriado
- Otimize renderizações (se aplicável)
- Monitore uso de memória
`;
  }

  /**
   * 🎯 Gera rule específica do tipo de projeto
   */
  generateProjectRule() {
    const rules = {
      nextjs: this.generateNextJSRule(),
      react: this.generateReactRule(),
      vue: this.generateVueRule(),
      "node-api": this.generateNodeAPIRule(),
      generic: this.generateGenericRule(),
    };

    return rules[this.detection.type] || rules.generic;
  }

  generateNextJSRule() {
    return `# 🚀 Next.js Development Rules

## Arquitetura Next.js

### App Router (Recomendado)
- Use App Router para novos projetos (app/ directory)
- Prefira Server Components quando possível
- Use Client Components apenas quando necessário (interatividade)
- Implemente loading.tsx e error.tsx em rotas importantes

### Roteamento
- Use file-based routing do App Router
- Organize rotas em grupos com ()
- Use [...slug] para rotas dinâmicas
- Implemente middleware.ts para lógica de roteamento avançada

### Data Fetching
- Use fetch() nativo com cache: 'force-cache' ou 'no-store'
- Implemente revalidation adequada para dados dinâmicos
- Use generateStaticParams para páginas estáticas
- Considere Incremental Static Regeneration (ISR) quando apropriado

### Performance
- Otimize imagens com next/image
- Use next/font para otimização de fontes
- Implemente code splitting com dynamic imports
- Configure Bundle Analyzer para monitorar tamanho

### SEO & Metadata
- Use generateMetadata para metadata dinâmica
- Implemente structured data quando aplicável
- Configure sitemap.xml e robots.txt
- Use Open Graph e Twitter Cards

### TypeScript
- Configure strict mode no tsconfig.json
- Use tipos específicos do Next.js quando disponíveis
- Implemente interfaces para props de componentes
- Use satisfies operator para type safety

### Exemplo de Estrutura:
\`\`\`
app/
  layout.tsx          # Layout raiz
  page.tsx           # Página inicial
  loading.tsx        # Loading UI
  error.tsx          # Error UI
  globals.css        # Estilos globais
  api/
    route.ts         # API routes
  (dashboard)/       # Route group
    layout.tsx
    page.tsx
\`\`\`
`;
  }

  generateReactRule() {
    return `# ⚛️ React Development Rules

## Componentes React

### Functional Components
- Sempre use functional components com hooks
- Evite class components (legacy)
- Use TypeScript para definir props
- Implemente PropTypes como fallback se não usar TS

### Hooks
- Use hooks no topo do componente
- Siga as regras dos hooks (não em loops/condições)
- Crie custom hooks para lógica reutilizável
- Use useCallback/useMemo para otimizações quando necessário

### Estado
- Use useState para estado local simples
- Use useReducer para estado complexo
- Considere Context API para estado global simples
- Use bibliotecas como Zustand/Redux para estado complexo

### Efeitos
- Use useEffect adequadamente
- Sempre limpe efeitos (cleanup)
- Especifique dependências corretamente
- Separe efeitos por responsabilidade

### Performance
- Use React.memo para componentes puros
- Implemente lazy loading com React.lazy
- Evite criação desnecessária de objetos/funções em render
- Use Error Boundaries para capturar erros

### Estrutura
\`\`\`
src/
  components/
    ui/              # Componentes base (Button, Input)
    layout/          # Layout components (Header, Sidebar)
    features/        # Componentes específicos de features
  hooks/             # Custom hooks
  contexts/          # React contexts
  utils/             # Funções utilitárias
  types/             # TypeScript types
  __tests__/         # Testes
\`\`\`

### Testing
- Use React Testing Library para testes de componente
- Teste comportamento, não implementação
- Use userEvent para simulação de interações
- Mockei dependências externas adequadamente
`;
  }

  generateNodeAPIRule() {
    return `# 🌐 Node.js API Development Rules

## Arquitetura API

### Express.js (se aplicável)
- Use middleware pattern para funcionalidades transversais
- Implemente error handling global
- Use helmet para segurança básica
- Configure CORS adequadamente

### Estrutura de Rotas
- Organize rotas por domínio/feature
- Use controllers para lógica de negócio
- Implemente middlewares de validação
- Separe lógica de apresentação da lógica de negócio

### Error Handling
- Use try/catch em handlers async
- Implemente error middleware global
- Retorne status codes apropriados
- Log errors detalhadamente para debugging

### Validação
- Valide todos os inputs (body, params, query)
- Use bibliotecas como Joi, Zod ou express-validator
- Sanitize dados de entrada
- Implemente rate limiting

### Segurança
- Use HTTPS em produção
- Implemente autenticação/autorização adequada
- Validate/escape inputs para prevenir injection
- Use variáveis de ambiente para secrets

### Database
- Use connection pooling
- Implemente migrations para mudanças de schema
- Use transações para operações críticas
- Adicione índices apropriados

### Estrutura:
\`\`\`
src/
  routes/            # Definições de rotas
  controllers/       # Lógica de controllers
  middleware/        # Middlewares customizados
  models/           # Modelos de dados
  services/         # Lógica de negócio
  utils/            # Utilitários
  config/           # Configurações
  __tests__/        # Testes
\`\`\`

### Testing
- Teste rotas com supertest
- Use mocks para banco de dados em testes
- Implemente testes de integração
- Configure CI/CD para testes automatizados
`;
  }

  generateVueRule() {
    return `# 🟢 Vue.js Development Rules

## Componentes Vue

### Composition API
- Prefira Composition API para novos projetos
- Use <script setup> para sintaxe mais limpa
- Organize lógica em composables reutilizáveis
- Use ref() e reactive() adequadamente

### Templates
- Use v-for com :key sempre
- Prefira computed properties para dados derivados
- Use v-show para toggles frequentes, v-if para condicionais
- Mantenha templates limpos e legíveis

### Reatividade
- Entenda diferença entre ref() e reactive()
- Use toRefs() ao destructuring reactive objects
- Implemente watchers com cleanup quando necessário
- Use watchEffect() para efeitos automáticos

### Estrutura
\`\`\`
src/
  components/
    ui/              # Componentes base
    layout/          # Layout components  
    features/        # Componentes de features
  composables/       # Composables reutilizáveis
  stores/           # Pinia stores
  router/           # Vue Router config
  views/            # Páginas/views
  utils/            # Utilitários
\`\`\`
`;
  }

  generateGenericRule() {
    return `# 🔧 Generic Project Rules

## Desenvolvimento Geral

### JavaScript/TypeScript
- Use ES6+ features quando possível
- Prefira const/let sobre var
- Use destructuring para arrays/objects
- Implemente proper error handling

### Estrutura de Projeto
- Mantenha estrutura de pastas consistente
- Use naming conventions claras
- Organize imports de forma lógica
- Documente configurações importantes

### Qualidade de Código
- Configure linter (ESLint)
- Use formatter (Prettier)
- Implemente pre-commit hooks
- Mantenha código coverage adequado
`;
  }

  /**
   * 🔧 Gera rule de qualidade de código
   */
  generateQualityRule() {
    return `# ✨ Code Quality Rules

## Linting & Formatting

### ESLint
- Configure regras adequadas para ${this.detection.type}
- Use extends de configs populares
- Configure regras de acessibilidade se aplicável
- Rode linter no CI/CD

### Prettier
- Configure formatação consistente
- Use no editor com format on save
- Configure import ordering
- Mantenha config compartilhada no projeto

### Git Hooks
- Use husky para pre-commit hooks
- Rode linter antes de commits
- Configure conventional commits se aplicável
- Use lint-staged para arquivos staged apenas

## Testing

### Cobertura
- Mantenha cobertura acima de 80%
- Foque em lógica crítica de negócio
- Use mutation testing para validar qualidade
- Configure thresholds no CI

### Tipos de Teste
- Unit tests: funções e lógica isolada
- Integration tests: interação entre modules
- E2E tests: fluxos críticos do usuário
- Visual regression: se aplicável

## Documentation

### README
- Mantenha README atualizado
- Inclua instruções de setup
- Documente APIs principais
- Adicione badges de status

### Code Comments
- Comente o "por que", não o "o que"
- Use JSDoc para funções públicas
- Mantenha comentários atualizados
- Remova comentários obsoletos
`;
  }

  /**
   * 📋 Gera notepad de padrões do projeto
   */
  generatePatternsNotepad() {
    const patterns = {
      nextjs: this.generateNextJSPatterns(),
      react: this.generateReactPatterns(),
      "node-api": this.generateNodeAPIPatterns(),
      generic: this.generateGenericPatterns(),
    };

    return patterns[this.detection.type] || patterns.generic;
  }

  generateNextJSPatterns() {
    return `# 🚀 Next.js Common Patterns

## Server Components
\`\`\`tsx
// app/posts/page.tsx
async function PostsPage() {
  const posts = await fetch('https://api.example.com/posts', {
    cache: 'no-store' // ou 'force-cache'
  }).then(res => res.json());

  return (
    <div>
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
\`\`\`

## Client Components
\`\`\`tsx
'use client';
import { useState } from 'react';

export function InteractiveButton() {
  const [count, setCount] = useState(0);
  
  return (
    <button onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </button>
  );
}
\`\`\`

## API Routes
\`\`\`tsx
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const posts = await getPosts();
    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}
\`\`\`

## Metadata
\`\`\`tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Page description',
  openGraph: {
    title: 'Page Title',
    description: 'Page description',
  },
};
\`\`\`
`;
  }

  generateReactPatterns() {
    return `# ⚛️ React Common Patterns

## Custom Hook
\`\`\`tsx
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);
  
  const increment = useCallback(() => setCount(c => c + 1), []);
  const decrement = useCallback(() => setCount(c => c - 1), []);
  const reset = useCallback(() => setCount(initialValue), [initialValue]);
  
  return { count, increment, decrement, reset };
}
\`\`\`

## Context Pattern
\`\`\`tsx
const ThemeContext = createContext<{
  theme: 'light' | 'dark';
  toggleTheme: () => void;
} | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const toggleTheme = useCallback(() => {
    setTheme(t => t === 'light' ? 'dark' : 'light');
  }, []);
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
\`\`\`

## Error Boundary
\`\`\`tsx
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}
\`\`\`
`;
  }

  generateNodeAPIPatterns() {
    return `# 🌐 Node.js API Patterns

## Middleware Pattern
\`\`\`javascript
// Error handling middleware
function errorHandler(err, req, res, next) {
  console.error(err.stack);
  
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }
  
  res.status(500).json({ error: 'Internal Server Error' });
}

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}
\`\`\`

## Controller Pattern
\`\`\`javascript
class PostController {
  async getAllPosts(req, res, next) {
    try {
      const posts = await PostService.findAll();
      res.json(posts);
    } catch (error) {
      next(error);
    }
  }

  async createPost(req, res, next) {
    try {
      const post = await PostService.create(req.body);
      res.status(201).json(post);
    } catch (error) {
      next(error);
    }
  }
}
\`\`\`

## Service Pattern
\`\`\`javascript
class PostService {
  static async findAll() {
    return await Post.find().populate('author');
  }

  static async create(data) {
    const post = new Post(data);
    return await post.save();
  }

  static async findById(id) {
    const post = await Post.findById(id);
    if (!post) {
      throw new Error('Post not found');
    }
    return post;
  }
}
\`\`\`
`;
  }

  generateGenericPatterns() {
    return `# 🔧 Generic Patterns

## Async/Await Pattern
\`\`\`javascript
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}
\`\`\`

## Error Handling
\`\`\`javascript
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

function handleError(error) {
  if (error.isOperational) {
    // Log and handle operational errors
    console.error('Operational error:', error.message);
  } else {
    // Log and exit for programming errors
    console.error('Programming error:', error);
    process.exit(1);
  }
}
\`\`\`
`;
  }

  /**
   * 📋 Gera notepad de comandos AI
   */
  generateCommandsNotepad() {
    return `# 🤖 AI Workspace Commands

## Comandos Básicos

### Health Check
\`@ai health-check\` - Verifica saúde geral do projeto
- Analisa performance, errors, dependencies
- Gera relatório com métricas importantes
- Sugere otimizações baseadas na análise

### Visual Audit
\`@ai visual-audit\` - Análise visual completa
- Captura screenshots automáticos
- Detecta componentes e layout
- Analisa acessibilidade visual
- Gera relatório com insights

### Test Generation
\`@ai test-generate\` - Gera testes automaticamente
- Analisa código existente
- Cria testes unitários e de integração
- Sugere cenários de teste adicionais
- Configura framework de teste se necessário

## Comandos Avançados

### TDD Cycle
\`@ai tdd-cycle [feature]\` - Ciclo completo TDD
- Gera testes para nova feature
- Implementa código mínimo para passar
- Refatora mantendo testes verdes
- Documenta processo

### Performance Audit
\`@ai performance\` - Análise de performance
- Mede métricas Core Web Vitals
- Identifica gargalos
- Sugere otimizações específicas
- Monitora melhorias

### Security Scan
\`@ai security\` - Scan de segurança básico
- Verifica dependências vulneráveis
- Analisa configurações de segurança
- Sugere melhorias de segurança
- Gera relatório de conformidade

## Comandos por Stack

### Next.js
- \`@ai next-audit\` - Auditoria específica Next.js
- \`@ai next-optimize\` - Otimizações Next.js
- \`@ai next-deploy\` - Checklist de deploy

### React
- \`@ai react-audit\` - Auditoria React
- \`@ai component-analyze\` - Análise de componentes
- \`@ai hooks-optimize\` - Otimização de hooks

### Node API
- \`@ai api-audit\` - Auditoria de API
- \`@ai endpoints-test\` - Testes de endpoints
- \`@ai api-docs\` - Geração de documentação

## Dicas de Uso

### Context Sharing
Use \`@project-context\` para compartilhar contexto do projeto:
- Informações sobre arquitetura atual
- Padrões e convenções estabelecidas
- Dependências e configurações

### Iterative Development
Combine comandos para workflow iterativo:
1. \`@ai health-check\` - Estado atual
2. \`@ai test-generate\` - Cobertura de testes
3. \`@ai tdd-cycle new-feature\` - Nova funcionalidade
4. \`@ai visual-audit\` - Validação visual
5. \`@ai performance\` - Verificação final
`;
  }

  /**
   * 📋 Gera notepad de troubleshooting
   */
  generateTroubleshootingNotepad() {
    return `# 🔧 Troubleshooting Guide

## Problemas Comuns

### Projeto não detectado corretamente
**Sintoma**: AI Workspace detecta tipo errado
**Solução**:
1. Verificar se package.json existe e tem dependências corretas
2. Executar \`npm run ai:setup --force\` para forçar nova detecção
3. Verificar se arquivos de configuração estão presentes

### Portas não detectadas
**Sintoma**: Nenhuma porta ativa encontrada
**Solução**:
1. Iniciar servidor de desenvolvimento
2. Verificar se servidor está rodando na porta esperada
3. Executar \`npm run ai:health\` para nova verificação

### Cursor rules não funcionam
**Sintoma**: Rules não são aplicadas nos prompts
**Solução**:
1. Verificar se arquivos estão em \`.cursor/rules/\`
2. Recarregar Cursor IDE
3. Verificar configurações do Cursor em Settings

## Debug por Stack

### Next.js
\`\`\`bash
# Verificar configuração
cat next.config.js

# Verificar build
npm run build

# Verificar tipo de router
ls app/ || ls pages/
\`\`\`

### React
\`\`\`bash
# Verificar dependências React
npm list react react-dom

# Verificar scripts
npm run start --dry-run

# Verificar bundler
cat package.json | grep -E "(vite|webpack)"
\`\`\`

### Node API
\`\`\`bash
# Verificar servidor
curl http://localhost:3000/health

# Verificar logs
npm run start 2>&1 | grep -i error

# Verificar dependências
npm list express fastify koa
\`\`\`

## Logs e Debugging

### Habilitar logs detalhados
\`\`\`bash
DEBUG=ai-workspace:* npm run ai:health
\`\`\`

### Verificar outputs
\`\`\`bash
# Screenshots
ls -la outputs/screenshots/

# Relatórios
ls -la outputs/reports/

# Logs
tail -f outputs/logs/ai-workspace.log
\`\`\`

### Limpar cache
\`\`\`bash
# Limpar outputs antigos
npm run ai:clean

# Forçar nova detecção
rm -rf .ai-workspace/config/
npm run ai:setup
\`\`\`

## Problemas de Performance

### Screenshots lentos
- Verificar se Puppeteer está atualizado
- Usar headless mode
- Reduzir viewport se necessário

### Detecção lenta
- Verificar tamanho do projeto
- Excluir node_modules da análise
- Usar .aiignore para arquivos grandes

### Muitos logs
- Ajustar nível de log em ai.config.js
- Configurar rotação de logs
- Limpar logs antigos regularmente

## Suporte

### Coleta de informações
Antes de reportar issues, colete:

\`\`\`bash
# Informações do sistema
node --version
npm --version

# Informações do projeto
cat package.json | head -20

# Logs do AI Workspace
cat outputs/logs/latest.log | tail -50

# Configuração atual
cat .ai-workspace/config/local.json
\`\`\`

### Repositório de Issues
- GitHub: https://github.com/ai-dev-workspace/core/issues
- Use template de issue apropriado
- Inclua informações de sistema e logs
- Descreva passos para reproduzir
`;
  }

  /**
   * 🎯 Configura custom modes do Cursor
   */
  async setupCustomModes() {
    try {
      const modesGenerator = new CursorModes(this.detection);
      const modes = await modesGenerator.generateModes();

      console.log(chalk.green(`   ✓ ${modes.length} custom modes criados`));
      console.log(chalk.gray("     • Debug AI, Refactor Pro, Learn Guide"));
      console.log(chalk.gray("     • Test Master, Optimize Pro"));
      console.log(chalk.gray(`     • ${this.detection.type} Expert`));
    } catch (error) {
      console.log(
        chalk.yellow("   ⚠ Custom modes não configurados (recurso beta)")
      );
      console.log(chalk.gray(`     Erro: ${error.message}`));
    }
  }

  /**
   * 🤖 Configura environment para background agents
   */
  async setupBackgroundAgents() {
    try {
      const agentSetup = new BackgroundAgentSetup(this.detection);
      const environment = await agentSetup.generateEnvironment();

      // Salvar documentação
      const docPath = path.join(this.cursorDir, "background-agent-setup.md");
      const documentation = agentSetup.generateDocumentation();
      await fs.writeFile(docPath, documentation);

      console.log(chalk.green("   ✓ Background agents configurados"));
      console.log(chalk.gray(`     • Environment para ${this.detection.type}`));
      console.log(chalk.gray("     • Portas e terminais automáticos"));
    } catch (error) {
      console.log(chalk.yellow("   ⚠ Background agents não configurados"));
      console.log(chalk.gray(`     Erro: ${error.message}`));
    }
  }

  /**
   * 🏷️ Extrai nome da documentação da URL
   */
  getDocName(url) {
    if (url.includes("nextjs.org")) return "Next.js Docs";
    if (url.includes("react.dev")) return "React Docs";
    if (url.includes("vuejs.org")) return "Vue.js Docs";
    if (url.includes("expressjs.com")) return "Express.js Docs";
    return "Documentation";
  }
}

export default CursorSetup;
