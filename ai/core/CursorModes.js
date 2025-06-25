/**
 * 🎯 Cursor Custom Modes Generator
 * Cria modos customizados inteligentes baseados no tipo de projeto
 */

import fs from "fs-extra";
import path from "path";

export class CursorModes {
  constructor(detection) {
    this.detection = detection;
    this.projectRoot = process.cwd();
    this.cursorDir = path.join(this.projectRoot, ".cursor");
  }

  /**
   * 🚀 Gera todos os custom modes
   */
  async generateModes() {
    await fs.ensureDir(this.cursorDir);

    const modes = [
      this.createDebugMode(),
      this.createRefactorMode(),
      this.createLearnMode(),
      this.createTestMode(),
      this.createOptimizeMode(),
      ...this.createProjectSpecificModes(),
    ];

    // Salvar arquivo modes.json
    const modesConfig = {
      version: "1.0.0",
      generated_by: "AI Development Workspace",
      project_type: this.detection.type,
      modes: modes,
    };

    const modesPath = path.join(this.cursorDir, "modes.json");
    await fs.writeJson(modesPath, modesConfig, { spaces: 2 });

    return modes;
  }

  /**
   * 🔍 Modo Debug - Investigação detalhada
   */
  createDebugMode() {
    return {
      name: "Debug AI",
      icon: "🔍",
      shortcut: "Ctrl+Shift+D",
      description: "Investigação detalhada de problemas com análise completa",
      tools: [
        "codebase",
        "read_file",
        "list_directory",
        "grep",
        "search_files",
        "terminal",
        "edit_reapply",
      ],
      settings: {
        auto_apply_edits: false,
        auto_run: false,
      },
      instructions: `Você é um expert em debugging para projetos ${
        this.detection.type
      }.

PROCESSO DE DEBUG:
1. 🔍 INVESTIGAÇÃO: Colete contexto extensivo antes de propor soluções
   - Leia arquivos relacionados ao problema
   - Analise logs e outputs de terminal
   - Busque por padrões similares no codebase
   
2. 🧠 ANÁLISE: Identifique a causa raiz
   - Trace o fluxo de execução
   - Identifique dependencies envolvidas
   - Verifique configurações relevantes
   
3. 🎯 SOLUÇÃO: Propose fixes precisos e cirúrgicos
   - Explique o problema encontrado
   - Mostre exatamente o que vai mudar
   - Inclua testes para verificar a correção

ESPECÍFICO PARA ${this.detection.type.toUpperCase()}:
${this.getDebugSpecifics()}

Sempre explique seu raciocínio antes de fazer mudanças.`,
    };
  }

  /**
   * 🔧 Modo Refactor - Melhoria de código
   */
  createRefactorMode() {
    return {
      name: "Refactor Pro",
      icon: "🔧",
      shortcut: "Ctrl+Shift+R",
      description: "Refatoração inteligente mantendo funcionalidade",
      tools: ["read_file", "edit_reapply", "codebase", "grep"],
      settings: {
        auto_apply_edits: true,
        auto_run: false,
      },
      instructions: `Você é um especialista em refatoração para ${
        this.detection.type
      }.

PRINCÍPIOS DE REFATORAÇÃO:
1. 🎯 PRESERVAR FUNCIONALIDADE: Nunca altere comportamento
2. 🧹 MELHORAR ESTRUTURA: Torne o código mais limpo e legível  
3. ✨ SEGUIR PADRÕES: Use as melhores práticas do ${this.detection.type}

FOQUE EM:
- Extrair funções e componentes reutilizáveis
- Remover duplicação de código
- Melhorar nomenclatura de variáveis/funções
- Simplificar lógica complexa
- Aplicar design patterns apropriados

ESPECÍFICO PARA ${this.detection.type.toUpperCase()}:
${this.getRefactorSpecifics()}

SEMPRE:
- Mantenha testes passando
- Preserve tipos TypeScript se existirem
- Documente mudanças significativas`,
    };
  }

  /**
   * 📚 Modo Learn - Explicações educativas
   */
  createLearnMode() {
    return {
      name: "Learn Guide",
      icon: "📚",
      shortcut: "Ctrl+Shift+L",
      description: "Explicações detalhadas e educativas",
      tools: ["codebase", "read_file", "web", "search_files"],
      settings: {
        auto_apply_edits: false,
        auto_run: false,
      },
      instructions: `Você é um mentor experiente em ${this.detection.type}.

ESTILO DE ENSINO:
1. 🎯 CONCEITOS PRIMEIRO: Explique o "por que" antes do "como"
2. 👁️ EXEMPLOS PRÁTICOS: Use código do projeto atual quando possível
3. 🔗 CONECTE IDEIAS: Relacione com conceitos já conhecidos
4. 💡 DICAS PRO: Compartilhe insights avançados

ESTRUTURA DAS EXPLICAÇÕES:
- 📋 Resumo do conceito
- 🔍 Como funciona no contexto ${this.detection.type}
- 💻 Exemplo prático com código
- ⚠️ Armadilhas comuns a evitar
- 🚀 Boas práticas recomendadas

ADAPTE PARA O NÍVEL:
- Iniciante: Explique fundamentos
- Intermediário: Foque em padrões  
- Avançado: Discuta otimizações

Sempre pergunte se algo não ficou claro!`,
    };
  }

  /**
   * 🧪 Modo Test - Geração e melhoria de testes
   */
  createTestMode() {
    return {
      name: "Test Master",
      icon: "🧪",
      shortcut: "Ctrl+Shift+T",
      description: "Criação e otimização de testes",
      tools: [
        "read_file",
        "edit_reapply",
        "codebase",
        "terminal",
        "search_files",
      ],
      settings: {
        auto_apply_edits: true,
        auto_run: true,
      },
      instructions: `Você é um especialista em testes para ${
        this.detection.type
      }.

FRAMEWORKS DETECTADOS: ${this.detection.features.testing.join(", ") || "Nenhum"}

ESTRATÉGIA DE TESTES:
1. 🎯 PRIORIDADE: Teste lógica de negócio crítica primeiro
2. 📊 COBERTURA: Vise 80%+ mas foque em qualidade
3. 🔍 TIPOS: Unit > Integration > E2E conforme necessário

PARA ${this.detection.type.toUpperCase()}:
${this.getTestingSpecifics()}

PADRÕES DE QUALIDADE:
- Testes devem ser independentes e determinísticos
- Use arrange/act/assert pattern
- Nomes descritivos que explicam o comportamento
- Mock dependencies externas
- Teste edge cases e error handling

QUANDO CRIAR TESTES:
- Novas funcionalidades
- Bugs encontrados (regression tests)
- Código complexo com muitas condições
- APIs públicas e interfaces

Execute testes após criá-los para validar.`,
    };
  }

  /**
   * ⚡ Modo Optimize - Performance e otimização
   */
  createOptimizeMode() {
    return {
      name: "Optimize Pro",
      icon: "⚡",
      shortcut: "Ctrl+Shift+O",
      description: "Otimização de performance inteligente",
      tools: ["codebase", "read_file", "edit_reapply", "terminal", "web"],
      settings: {
        auto_apply_edits: false,
        auto_run: true,
      },
      instructions: `Você é um especialista em performance para ${
        this.detection.type
      }.

METODOLOGIA DE OTIMIZAÇÃO:
1. 📊 MEDIR PRIMEIRO: Profile antes de otimizar
2. 🎯 GARGALOS: Identifique os bottlenecks reais  
3. ⚡ OTIMIZAR: Implemente melhorias mensuráveis
4. ✅ VALIDAR: Confirme melhorias com métricas

ÁREAS DE FOCO PARA ${this.detection.type.toUpperCase()}:
${this.getOptimizationSpecifics()}

TÉCNICAS DE OTIMIZAÇÃO:
- Code splitting e lazy loading
- Memoização de cálculos caros
- Otimização de re-renders
- Bundle size reduction
- Caching strategies
- Database query optimization (se aplicável)

SEMPRE:
- Mantenha legibilidade do código
- Documente otimizações não óbvias
- Considere trade-offs de manutenibilidade
- Use ferramentas de profiling

Execute testes de performance após mudanças.`,
    };
  }

  /**
   * 🎯 Modos específicos por tipo de projeto
   */
  createProjectSpecificModes() {
    const modes = [];

    switch (this.detection.type) {
      case "nextjs":
        modes.push(this.createNextJSMode());
        break;
      case "react":
        modes.push(this.createReactMode());
        break;
      case "node-api":
        modes.push(this.createAPIMode());
        break;
    }

    return modes;
  }

  /**
   * 🚀 Modo específico Next.js
   */
  createNextJSMode() {
    return {
      name: "Next.js Expert",
      icon: "🚀",
      shortcut: "Ctrl+Shift+N",
      description: "Especialista em desenvolvimento Next.js",
      tools: ["codebase", "read_file", "edit_reapply", "terminal", "web"],
      settings: {
        auto_apply_edits: true,
        auto_run: false,
      },
      instructions: `Você é um especialista Next.js ${
        this.detection.subtype === "app-router"
          ? "com App Router"
          : "com Pages Router"
      }.

FOCO PRINCIPAL:
- ${
        this.detection.subtype === "app-router"
          ? "App Router patterns"
          : "Pages Router patterns"
      }
- Server vs Client Components
- Data fetching strategies
- SEO e performance
- Deploy optimization

BEST PRACTICES:
- Use Server Components por padrão
- Client Components apenas para interatividade
- Optimize images com next/image
- Configure metadata adequadamente
- Implemente loading e error states

ESTRUTURA RECOMENDADA:
${
  this.detection.subtype === "app-router"
    ? `
app/
  layout.tsx          # Root layout
  page.tsx           # Homepage
  loading.tsx        # Loading UI
  error.tsx          # Error handling
  (routes)/          # Route groups
`
    : `
pages/
  _app.tsx           # Custom App
  _document.tsx      # Custom Document
  index.tsx          # Homepage
  api/               # API routes
`
}

Sempre considere SSR/SSG/ISR apropriados para cada página.`,
    };
  }

  /**
   * ⚛️ Modo específico React
   */
  createReactMode() {
    return {
      name: "React Master",
      icon: "⚛️",
      shortcut: "Ctrl+Shift+A",
      description: "Especialista em desenvolvimento React",
      tools: ["codebase", "read_file", "edit_reapply", "terminal"],
      settings: {
        auto_apply_edits: true,
        auto_run: false,
      },
      instructions: `Você é um especialista React moderno.

PRINCÍPIOS FUNDAMENTAIS:
- Functional components + hooks
- Composição sobre herança
- Unidirectional data flow
- Immutability
- Single Responsibility

HOOKS ESSENCIAIS:
- useState para estado local
- useEffect para side effects
- useContext para estado global simples
- useMemo/useCallback para otimizações
- Custom hooks para lógica reutilizável

PADRÕES RECOMENDADOS:
- Container/Presentational components
- Render props para lógica compartilhada
- Error boundaries para error handling
- Lazy loading com React.lazy
- Code splitting por rota

ESTRUTURA COMPONENTE:
\`\`\`tsx
// Imports
// Types/Interfaces  
// Component definition
// Styled components (se aplicável)
// Export
\`\`\`

Sempre considere performance e acessibilidade.`,
    };
  }

  /**
   * 🌐 Modo específico Node API
   */
  createAPIMode() {
    return {
      name: "API Builder",
      icon: "🌐",
      shortcut: "Ctrl+Shift+I",
      description: "Especialista em APIs Node.js",
      tools: ["codebase", "read_file", "edit_reapply", "terminal", "web"],
      settings: {
        auto_apply_edits: true,
        auto_run: true,
      },
      instructions: `Você é um especialista em APIs Node.js${
        this.detection.subtype ? ` com ${this.detection.subtype}` : ""
      }.

ARQUITETURA RECOMENDADA:
- Controllers para lógica de rotas
- Services para lógica de negócio  
- Middlewares para funcionalidades transversais
- Models para estrutura de dados
- Utils para funções auxiliares

SEGURANÇA ESSENCIAL:
- Validação de inputs
- Sanitização de dados
- Rate limiting
- CORS adequado
- Headers de segurança
- Autenticação/Autorização

ESTRUTURA DE RESPOSTA:
\`\`\`json
{
  "success": true,
  "data": {},
  "message": "Optional message",
  "meta": { "pagination": {} }
}
\`\`\`

ERROR HANDLING:
- Try/catch em handlers async
- Error middleware global
- Status codes apropriados
- Logs estruturados

Sempre implemente testes para endpoints críticos.`,
    };
  }

  // ============ ESPECIFICAÇÕES POR TIPO ============

  getDebugSpecifics() {
    const specifics = {
      nextjs: `- Verifique both client and server logs
- Analise Network tab para requests falhos
- Check build errors e hydration mismatches
- Examine getStaticProps/getServerSideProps issues`,

      react: `- Analise React DevTools para component state
- Verifique re-renders desnecessários
- Check console warnings e prop types
- Examine hook dependencies`,

      "node-api": `- Analise logs do servidor e requests
- Check middleware chain execution
- Examine database queries e connections
- Verify environment variables`,

      generic: `- Examine console logs e error messages
- Check network requests e responses
- Analyze stack traces
- Verify configuration files`,
    };

    return specifics[this.detection.type] || specifics.generic;
  }

  getRefactorSpecifics() {
    const specifics = {
      nextjs: `- Extract reusable Server Components
- Optimize data fetching patterns
- Create custom hooks para client logic
- Modularize API routes`,

      react: `- Extract custom hooks
- Create compound components
- Optimize render props patterns
- Simplify component hierarchies`,

      "node-api": `- Extract services from controllers
- Create reusable middleware
- Modularize route handlers
- Simplify database queries`,

      generic: `- Extract reusable functions
- Simplify complex conditionals
- Remove code duplication
- Improve error handling`,
    };

    return specifics[this.detection.type] || specifics.generic;
  }

  getTestingSpecifics() {
    const specifics = {
      nextjs: `- Test Server Components separately
- Mock Next.js hooks (useRouter, etc)
- Test API routes with supertest
- E2E with Playwright para user flows`,

      react: `- Use React Testing Library
- Test user interactions com userEvent
- Mock external dependencies
- Test custom hooks separately`,

      "node-api": `- Test routes com supertest
- Mock database connections
- Test middleware independently  
- Validate request/response formats`,

      generic: `- Focus em business logic
- Mock external dependencies
- Test error scenarios
- Validate inputs/outputs`,
    };

    return specifics[this.detection.type] || specifics.generic;
  }

  getOptimizationSpecifics() {
    const specifics = {
      nextjs: `- Image optimization com next/image
- Bundle analysis com @next/bundle-analyzer
- Core Web Vitals optimization
- Static generation quando possível`,

      react: `- React.memo para expensive components
- useMemo/useCallback para expensive calculations
- Code splitting com React.lazy
- Virtual scrolling para large lists`,

      "node-api": `- Database query optimization
- Caching strategies (Redis)
- Connection pooling
- Response compression`,

      generic: `- Algorithm optimization
- Memory usage reduction
- Async operations
- Bundle size reduction`,
    };

    return specifics[this.detection.type] || specifics.generic;
  }

  async setup() {
    // Alias de compatibilidade – delega para generateModes()
    return this.generateModes();
  }
}

export default CursorModes;
