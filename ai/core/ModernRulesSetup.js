/**
 * 🎯 Modern Rules Setup - .cursorrules → .mdc Migration + Best Practices
 * Baseado nas últimas práticas documentadas e React 19/Next.js 15
 */

import fs from "fs-extra";
import path from "path";
import chalk from "chalk";

export class ModernRulesSetup {
  constructor(detection) {
    this.detection = detection;
    this.projectRoot = process.cwd();
    this.cursorDir = path.join(this.projectRoot, ".cursor");
    this.rulesDir = path.join(this.cursorDir, "rules");
  }

  /**
   * 🔄 Setup moderno com migração .cursorrules → .mdc
   */
  async setup() {
    console.log(chalk.blue("🔄 Configurando rules modernas (.mdc format)..."));

    try {
      // 1. Migrar .cursorrules existente se houver
      await this.migrateLegacyRules();

      // 2. Criar context files system
      await this.setupContextFiles();

      // 3. Configurar analysis process
      await this.setupAnalysisProcess();

      // 4. Configurar guidelines específicas React 19/Next.js 15
      await this.setupModernFrameworkGuidelines();

      // 5. Configurar composer patterns
      await this.setupComposerPatterns();

      console.log(chalk.green("   ✓ Modern rules setup completado"));
    } catch (error) {
      console.log(
        chalk.yellow(
          "   ⚠ Modern rules setup não foi configurado completamente"
        )
      );
      console.log(chalk.gray(`     ${error.message}`));
    }
  }

  /**
   * 🔄 Migra .cursorrules legacy para .mdc format
   */
  async migrateLegacyRules() {
    const legacyRulesPath = path.join(this.projectRoot, ".cursorrules");

    if (await fs.pathExists(legacyRulesPath)) {
      console.log(
        chalk.yellow(
          "     🔄 .cursorrules detectado - migrando para .mdc format..."
        )
      );

      const legacyContent = await fs.readFile(legacyRulesPath, "utf8");

      // Criar backup
      await fs.writeFile(
        path.join(this.projectRoot, ".cursorrules.backup"),
        legacyContent
      );

      // Converter para .mdc format
      const modernRule = this.convertLegacyToMDC(legacyContent);

      await fs.writeFile(
        path.join(this.rulesDir, "migrated-rules-always.mdc"),
        modernRule
      );

      // Criar guia de migração
      const migrationGuide = `# 🔄 Migration Guide: .cursorrules → .mdc

## Status
✅ **Migration completed successfully**

## What happened?
- Your \`.cursorrules\` file was converted to modern \`.mdc\` format
- Original file backed up as \`.cursorrules.backup\`
- New rule created: \`.cursor/rules/migrated-rules-always.mdc\`

## Key Differences

### Legacy Format (.cursorrules)
\`\`\`
# Old format - no longer recommended
System: You are a helpful assistant...
Project: This is a React project...
\`\`\`

### Modern Format (.mdc)
\`\`\`mdc
---
description: "Project-specific development guidelines"
globs: ["**/*.tsx", "**/*.ts"]
alwaysApply: true
---

# Project Development Guidelines

## Critical Rules
- Clear, actionable directives
- Specific examples included
\`\`\`

## Benefits of Migration
- **🤖 Better AI customization** - More precise responses
- **📐 Standardization** - Unified coding guidelines
- **🧠 Enhanced understanding** - Better project context
- **⚡ Improved efficiency** - Less manual corrections needed
- **👥 Team collaboration** - Consistent rules for all

## Next Steps
1. Review the migrated rule at \`.cursor/rules/migrated-rules-always.mdc\`
2. Customize the rule based on your project needs
3. Delete \`.cursorrules.backup\` when satisfied
4. Remove original \`.cursorrules\` if desired

## Learn More
- [Advanced Rules Documentation](ADVANCED-CURSOR-FEATURES.md)
- [Modern Rule Templates](.cursor/templates/)
`;

      await fs.writeFile(
        path.join(this.cursorDir, "migration-guide.md"),
        migrationGuide
      );

      console.log(chalk.green("     ✓ .cursorrules migrado para .mdc format"));
    }
  }

  /**
   * 📝 Converte conteúdo legacy para formato .mdc moderno
   */
  convertLegacyToMDC(legacyContent) {
    // Extrair seções do conteúdo legacy
    const lines = legacyContent.split("\n");
    let systemPrompt = "";
    let projectInfo = "";
    let rules = [];

    lines.forEach((line) => {
      if (line.startsWith("System:")) {
        systemPrompt = line.replace("System:", "").trim();
      } else if (line.startsWith("Project:")) {
        projectInfo = line.replace("Project:", "").trim();
      } else if (line.trim() && !line.startsWith("#")) {
        rules.push(line.trim());
      }
    });

    return `---
description: "Migrated project rules from legacy .cursorrules format"
globs: ["**/*.js", "**/*.ts", "**/*.jsx", "**/*.tsx"]
alwaysApply: true
---

# Migrated Project Rules

## Project Context
${projectInfo}

## System Behavior
${systemPrompt}

## Critical Rules

${rules.map((rule) => `- ${rule}`).join("\n")}

## Examples

<example>
Following project conventions and maintaining code quality standards
</example>

<example type="invalid">
Ignoring established patterns or writing unclear code
</example>

## Migration Note
This rule was automatically migrated from .cursorrules format.
Review and customize as needed for your project.
`;
  }

  /**
   * 📋 Configura context files system
   */
  async setupContextFiles() {
    // instructions.md template
    const instructionsTemplate = `# ${this.detection.type.toUpperCase()} Project Instructions

## Project Overview
Comprehensive development guidelines for this ${this.detection.type} project.

## Features
- Core functionality implementation
- User interface components
- Data management and API integration
- Authentication and authorization
- Performance optimization

## Technologies
### Frontend
- ${this.getStackTechnologies().frontend.join(", ")}

### Backend  
- ${this.getStackTechnologies().backend.join(", ")}

### Tools & Libraries
- ${this.getStackTechnologies().tools.join(", ")}

## Project Structure
\`\`\`
${this.getProjectStructure()}
\`\`\`

## Build Steps
1. \`npm install\` - Install dependencies
2. \`npm run dev\` - Start development server
3. \`npm run build\` - Production build
4. \`npm run test\` - Run tests
5. \`npm run lint\` - Code quality check

## Development Workflow
1. Create feature branch from main
2. Implement following project patterns
3. Write tests for new functionality
4. Run quality checks before commit
5. Create pull request with description

## Quality Standards
- TypeScript for type safety
- ESLint + Prettier for code formatting
- Jest for unit testing
- Proper error handling and validation
- Performance monitoring and optimization

## Architecture Patterns
${this.getArchitecturePatterns()}
`;

    await fs.writeFile(
      path.join(this.cursorDir, "instructions.md"),
      instructionsTemplate
    );

    // roadmap.md template
    const roadmapTemplate = `# Development Roadmap

## Sprint 1: Foundation (Week 1-2)
**Goals**: Project setup and core infrastructure

### Tasks
- [ ] Environment setup and configuration
- [ ] Database schema design and migration
- [ ] Authentication system implementation
- [ ] Basic UI components and layout
- [ ] API endpoints structure

### Success Criteria
- [ ] Development environment fully operational
- [ ] Basic user authentication working
- [ ] Core UI components functional
- [ ] API foundation established

## Sprint 2: Core Features (Week 3-4)  
**Goals**: Main functionality implementation

### Tasks
- [ ] Primary feature development
- [ ] Database integration and queries
- [ ] Frontend-backend communication
- [ ] User interface completion
- [ ] Basic testing implementation

### Success Criteria
- [ ] Core features fully functional
- [ ] Data persistence working
- [ ] UI/UX requirements met
- [ ] Integration tests passing

## Sprint 3: Enhancement (Week 5-6)
**Goals**: Optimization and deployment preparation

### Tasks
- [ ] Performance optimization
- [ ] Error handling and validation
- [ ] Security implementation
- [ ] Production deployment setup
- [ ] Documentation completion

### Success Criteria
- [ ] Performance targets met
- [ ] Security audit passed
- [ ] Production deployment ready
- [ ] Documentation complete

## Future Milestones
- [ ] Advanced features implementation
- [ ] Analytics and monitoring
- [ ] Mobile responsiveness
- [ ] Scalability improvements
- [ ] User feedback integration
`;

    await fs.writeFile(
      path.join(this.cursorDir, "roadmap.md"),
      roadmapTemplate
    );

    console.log(chalk.green("     ✓ Context files criados"));
  }

  /**
   * 🎯 Configura analysis process sistemático
   */
  async setupAnalysisProcess() {
    const analysisProcessRule = `---
description: "Systematic analysis process for all development tasks"
globs: ["**/*.tsx", "**/*.ts", "**/*.jsx", "**/*.js"]
alwaysApply: true
---

# Development Analysis Process

## Before responding to any request, follow these steps:

### 1. Request Analysis
- **Determine task type**: code creation, debugging, architecture, refactoring
- **Identify technologies**: languages, frameworks, libraries involved
- **Note requirements**: explicit and implicit requirements
- **Define outcome**: core problem and desired solution
- **Consider constraints**: project context, performance, security

### 2. Solution Planning
- **Break down steps**: logical, manageable components
- **Consider modularity**: reusable, maintainable design
- **Identify dependencies**: files, packages, services needed
- **Evaluate approaches**: compare alternatives and trade-offs
- **Plan validation**: testing strategy and success criteria

### 3. Implementation Strategy
- **Choose patterns**: appropriate design patterns and architecture
- **Consider performance**: optimization opportunities and bottlenecks
- **Plan error handling**: edge cases, validation, graceful degradation
- **Ensure accessibility**: WCAG compliance and inclusive design
- **Verify best practices**: code quality, security, maintainability

## Code Quality Standards

### General Principles
- Write concise, readable code with clear intent
- Use functional and declarative programming patterns
- Follow DRY (Don't Repeat Yourself) principle
- Implement early returns for better readability
- Structure components logically: exports, subcomponents, helpers, types

### Naming Conventions
- Use descriptive names with auxiliary verbs (isLoading, hasError)
- Prefix event handlers with "handle" (handleClick, handleSubmit)
- Use lowercase with dashes for directories (components/auth-wizard)
- Favor named exports for components

### TypeScript Usage
- Use TypeScript for all code
- Prefer interfaces over types for object definitions
- Avoid enums; use const maps instead
- Implement proper type safety and inference
- Use \`satisfies\` operator for type validation

## Examples

<example>
Request: "Create a user profile component"

Analysis:
1. **Request**: React component for user profile display
2. **Planning**: Props interface, loading states, error handling
3. **Strategy**: Functional component, TypeScript, proper patterns

Implementation follows all quality standards with proper naming,
type safety, and error handling.
</example>

<example type="invalid">
Jumping straight to implementation without analysis,
missing type definitions, no error handling consideration,
unclear variable names and poor structure.
</example>
`;

    await fs.writeFile(
      path.join(this.rulesDir, "core-rules", "analysis-process-always.mdc"),
      analysisProcessRule
    );

    console.log(chalk.green("     ✓ Analysis process configurado"));
  }

  /**
   * ⚛️ Configura guidelines para React 19 e Next.js 15
   */
  async setupModernFrameworkGuidelines() {
    if (this.detection.type === "nextjs" || this.detection.type === "react") {
      const modernGuidelinesRule = `---
description: "React 19 and Next.js 15 modern development patterns"
globs: ["app/**/*", "pages/**/*", "components/**/*", "**/*.tsx", "**/*.jsx"]
alwaysApply: false
---

# React 19 & Next.js 15 Modern Guidelines

## Component Architecture

### Server Components First (Next.js)
- **Favor React Server Components (RSC)** where possible
- **Minimize 'use client' directives** - only for interactivity
- **Implement proper error boundaries** with error.tsx
- **Use Suspense for async operations** with loading.tsx
- **Optimize for Core Web Vitals** and performance

### Modern Component Structure
\`\`\`tsx
// ✅ Recommended structure
// 1. Imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// 2. Types
interface UserProfileProps {
  userId: string;
}

// 3. Component
export function UserProfile({ userId }: UserProfileProps) {
  // 4. Hooks
  const [loading, setLoading] = useState(false);
  
  // 5. Event handlers
  const handleSubmit = () => {
    // Implementation
  };
  
  // 6. Early returns
  if (loading) return <LoadingSpinner />;
  
  // 7. Render
  return (
    <div>
      {/* Component content */}
    </div>
  );
}
\`\`\`

## Modern State Management

### Form Handling with React 19
\`\`\`tsx
// ✅ Modern: useActionState (React 19)
import { useActionState } from 'react';

function ContactForm() {
  const [state, formAction] = useActionState(submitForm, null);
  
  return (
    <form action={formAction}>
      <input name="email" type="email" required />
      <button type="submit">Submit</button>
      {state?.error && <p>{state.error}</p>}
    </form>
  );
}

// ❌ Deprecated: useFormState
import { useFormState } from 'react-dom';
\`\`\`

### Enhanced useFormStatus (React 19)
\`\`\`tsx
// ✅ Enhanced properties available
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending, data, method, action } = useFormStatus();
  
  return (
    <button disabled={pending}>
      {pending ? 'Submitting...' : 'Submit'}
    </button>
  );
}
\`\`\`

### URL State Management
\`\`\`tsx
// ✅ Use 'nuqs' for URL state (recommended)
import { useQueryState } from 'nuqs';

function SearchPage() {
  const [search, setSearch] = useQueryState('q');
  const [page, setPage] = useQueryState('page', { defaultValue: 1 });
  
  return (
    <div>
      <input 
        value={search || ''} 
        onChange={(e) => setSearch(e.target.value)} 
      />
    </div>
  );
}

// ❌ Avoid: Complex useState for URL sync
\`\`\`

## Performance Best Practices

### Next.js 15 Optimization
\`\`\`tsx
// ✅ App Router patterns
import { Suspense } from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'User dashboard overview'
};

export default async function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

// ✅ Use next/image and next/font
import Image from 'next/image';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });
\`\`\`

### React Performance Patterns
\`\`\`tsx
// ✅ Optimize with React.memo judiciously
const ExpensiveComponent = React.memo(({ data }) => {
  return <ComplexVisualization data={data} />;
});

// ✅ Use useCallback and useMemo appropriately
const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);

const memoizedValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);
\`\`\`

## Error Handling

### Comprehensive Error Boundaries
\`\`\`tsx
// app/error.tsx (Next.js App Router)
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}

// app/loading.tsx
export default function Loading() {
  return <div>Loading...</div>;
}
\`\`\`

## Examples

<example>
Modern Next.js 15 component with React 19 patterns:
- Server Component by default
- Proper error and loading states
- TypeScript interfaces
- Performance optimizations
- Modern form handling with useActionState
</example>

<example type="invalid">
Using deprecated patterns:
- useFormState instead of useActionState
- Unnecessary 'use client' directives
- Missing error boundaries
- No TypeScript types
- Poor performance patterns
</example>
`;

      await fs.writeFile(
        path.join(this.rulesDir, "stack-rules", "modern-react-nextjs-auto.mdc"),
        modernGuidelinesRule
      );

      console.log(
        chalk.green("     ✓ Modern React/Next.js guidelines configurados")
      );
    }
  }

  /**
   * 🎬 Configura composer patterns avançados
   */
  async setupComposerPatterns() {
    const composerGuide = `# 🎬 Composer Advanced Usage Guide

## Modes Detalhados

### 🤖 Agent Mode (⌘.)
**Capabilities:**
- **Auto-pulls context** - Automatically gathers relevant project context
- **Executes commands** - Runs terminal commands when needed
- **Edits multiple files** - Makes changes across entire codebase
- **Best for**: Complex refactoring, multi-file changes, architectural updates

**Usage Example:**
\`\`\`
⌘. "Refactor this authentication system to use React 19 patterns"
\`\`\`

### 💬 Normal Mode
**Capabilities:**
- **File-aware** - Understands current file context
- **Context-aware** - Uses provided context effectively
- **Interactive conversation** - Iterative development process
- **Best for**: Single-file edits, explanations, focused changes

## Context Commands Reference

### Core Context
\`\`\`bash
@Files – Include specific files in context
@Folders – Include entire folder contents
@Code – Reference specific code blocks or symbols
\`\`\`

### External Context
\`\`\`bash
@Docs – Reference official documentation
@Web – Search online for latest information
@Git – Include git history and recent changes
\`\`\`

### Project Context
\`\`\`bash
@Cursor Rules – Reference project-specific rules
@Notepads – Include saved code templates
@Past Chats – Reference previous conversations
\`\`\`

### Development Context
\`\`\`bash
@Lint Errors – Include current linting issues (Chat only)
@Definitions – Find symbol definitions (Cmd K only)
\`\`\`

### Quick Context
\`\`\`bash
#Files – Add files without explicit @Files reference
/Commands – Access open files and available commands
\`\`\`

## Strategic Context Usage

### Progressive Context Building
\`\`\`
1. Start specific: @Code UserController.authenticate
2. Expand if needed: @Files auth/UserController.ts
3. Add related: @Folders auth/
4. Include history: @Git auth changes
5. Reference patterns: @Past Chats authentication
\`\`\`

### Context Optimization Tips
- **Start surgical** - Use @Code for specific symbols
- **Expand gradually** - Add @Files when broader context needed
- **Monitor context window** - Watch for condensed states
- **Use self-gathering** - Let Agent create tools when uncertain
- **Leverage past work** - @Past Chats for similar problems

## Best Practices

### Effective Prompting
\`\`\`
✅ "Use @Code UserService.createUser and add proper error handling"
✅ "@Files components/LoginForm.tsx - convert to React 19 patterns"
✅ "@Web 'React 19 useActionState examples' then implement here"

❌ "Fix the code"
❌ "Make it better"
❌ "Add some error handling"
\`\`\`

### Context File Management
- **Keep instructions.md updated** - Current project state
- **Use roadmap.md** - For planning and prioritization
- **Reference @Cursor Rules** - For consistent patterns
- **Update @Notepads** - Save useful code patterns

### Workflow Integration
1. **Plan with context**: @Past Chats + @Files for understanding
2. **Implement incrementally**: Single file → multiple files
3. **Validate changes**: @Lint Errors + testing
4. **Document patterns**: Update @Notepads and rules
5. **Share knowledge**: Update team documentation
`;

    await fs.writeFile(
      path.join(this.cursorDir, "composer-guide.md"),
      composerGuide
    );

    console.log(chalk.green("     ✓ Composer patterns configurados"));
  }

  /**
   * 🛠️ Helpers para geração de conteúdo específico do stack
   */
  getStackTechnologies() {
    const technologies = {
      nextjs: {
        frontend: ["React 19", "Next.js 15", "TypeScript", "Tailwind CSS"],
        backend: ["Next.js API Routes", "Node.js", "PostgreSQL"],
        tools: ["ESLint", "Prettier", "Jest", "Vercel"],
      },
      react: {
        frontend: ["React 19", "TypeScript", "Vite", "Tailwind CSS"],
        backend: ["Node.js", "Express", "PostgreSQL"],
        tools: ["ESLint", "Prettier", "Jest", "React Testing Library"],
      },
      "node-api": {
        frontend: ["React", "TypeScript"],
        backend: ["Node.js", "Express", "PostgreSQL", "Prisma"],
        tools: ["ESLint", "Prettier", "Jest", "Supertest"],
      },
    };

    return technologies[this.detection.type] || technologies["node-api"];
  }

  getProjectStructure() {
    const structures = {
      nextjs: `app/                  # Next.js App Router
  layout.tsx           # Root layout
  page.tsx            # Home page
  loading.tsx         # Loading UI
  error.tsx           # Error UI
components/           # Reusable components
lib/                  # Utilities and config
types/                # TypeScript definitions
public/               # Static assets`,
      react: `src/
  components/         # React components
  hooks/             # Custom hooks
  utils/             # Utility functions
  types/             # TypeScript definitions
  __tests__/         # Test files
public/              # Static assets`,
      "node-api": `src/
  controllers/       # Request handlers
  services/          # Business logic
  models/            # Data models
  routes/            # API routes
  middleware/        # Custom middleware
  utils/             # Utilities
  types/             # TypeScript definitions`,
    };

    return structures[this.detection.type] || structures["node-api"];
  }

  getArchitecturePatterns() {
    const patterns = {
      nextjs: `- **Server Components** for data fetching and static content
- **Client Components** for interactivity and user input
- **App Router** for file-based routing and layouts
- **API Routes** for backend functionality
- **Middleware** for request processing and auth`,
      react: `- **Component Composition** for reusable UI building blocks
- **Custom Hooks** for shared logic and state management
- **Context API** for global state when needed
- **Render Props** and **Higher-Order Components** sparingly
- **Error Boundaries** for graceful error handling`,
      "node-api": `- **Controller-Service-Model** architecture
- **Middleware** for cross-cutting concerns
- **Dependency Injection** for testability
- **Repository Pattern** for data access
- **Event-Driven Architecture** for scalability`,
    };

    return patterns[this.detection.type] || patterns["node-api"];
  }
}

export default ModernRulesSetup;
