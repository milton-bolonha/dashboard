/**
 * 🎯 Rules Modernizer - .cursorrules → .mdc Migration + Best Practices
 * Baseado nas últimas práticas documentadas e React 19/Next.js 15
 */

import fs from "fs-extra";
import path from "path";
import chalk from "chalk";

export class RulesModernizer {
  constructor(detection) {
    this.detection = detection;
    this.projectRoot = process.cwd();
    this.cursorDir = path.join(this.projectRoot, ".cursor");
  }

  /**
   * 🔄 Setup moderno com migração .cursorrules → .mdc
   */
  async modernize() {
    console.log(chalk.blue("🔄 Modernizando rules (.cursorrules → .mdc)..."));

    try {
      // 1. Verificar e migrar .cursorrules
      await this.checkAndMigrateLegacy();

      // 2. Criar modern analysis process
      await this.setupAnalysisProcess();

      // 3. Configurar React 19/Next.js 15 guidelines
      await this.setupModernFrameworks();

      // 4. Criar context files
      await this.setupContextFiles();

      console.log(chalk.green("   ✓ Rules modernizadas com sucesso"));
    } catch (error) {
      console.log(chalk.yellow("   ⚠ Rules modernization não completada"));
      console.log(chalk.gray(`     ${error.message}`));
    }
  }

  /**
   * 🔍 Verifica e migra .cursorrules legacy
   */
  async checkAndMigrateLegacy() {
    const legacyPath = path.join(this.projectRoot, ".cursorrules");

    if (await fs.pathExists(legacyPath)) {
      console.log(
        chalk.yellow("     📜 Legacy .cursorrules encontrado - migrando...")
      );

      const content = await fs.readFile(legacyPath, "utf8");

      // Backup original
      await fs.writeFile(`${legacyPath}.backup`, content);

      // Converter para .mdc
      const modernRule = `---
description: "Migrated project rules from legacy .cursorrules"
globs: ["**/*.js", "**/*.ts", "**/*.jsx", "**/*.tsx"]
alwaysApply: true
---

# Migrated Project Rules

## Legacy Content
${content}

## Modern Enhancements
- Converted to .mdc format with metadata
- Enhanced with modern development patterns
- Structured for better AI understanding

## Examples

<example>
Following established project patterns and maintaining code quality
</example>

<example type="invalid">
Ignoring project conventions or writing unclear code
</example>

> **Note**: This rule was migrated from .cursorrules. 
> Review and customize as needed.
`;

      await fs.ensureDir(path.join(this.cursorDir, "rules"));
      await fs.writeFile(
        path.join(this.cursorDir, "rules", "migrated-legacy-always.mdc"),
        modernRule
      );

      // Guia de migração
      const migrationGuide = `# 🔄 Migration Complete: .cursorrules → .mdc

## ✅ Status
Your legacy \`.cursorrules\` has been successfully migrated to modern \`.mdc\` format.

## 📋 What Changed

### Before (Legacy .cursorrules)
\`\`\`
# Simple text format
System: You are a helpful assistant...
Project: This is a React project...
\`\`\`

### After (Modern .mdc)
\`\`\`mdc
---
description: "Detailed metadata for AI understanding"
globs: ["**/*.tsx", "**/*.ts"]
alwaysApply: true
---

# Structured Rules with Examples
\`\`\`

## 🎯 Benefits of Migration
- **🤖 Enhanced AI Responses** - Better context understanding
- **📐 Standardized Format** - Consistent with Cursor best practices
- **🧠 Improved Intelligence** - Metadata helps AI decision making
- **👥 Team Collaboration** - Shareable, documented standards

## 📁 Files Created
- \`.cursor/rules/migrated-legacy-always.mdc\` - Your migrated rules
- \`.cursorrules.backup\` - Backup of original file
- \`.cursor/migration-guide.md\` - This guide

## 🚀 Next Steps
1. Review migrated rules and customize
2. Add project-specific patterns
3. Remove backup when satisfied
4. Explore modern rule features

## 📚 Learn More
- [Advanced Rules Organization](../README.md#advanced-rules-organization)
- [Modern Development Patterns](./modern-patterns.md)
`;

      await fs.writeFile(
        path.join(this.cursorDir, "migration-guide.md"),
        migrationGuide
      );

      console.log(chalk.green("     ✓ Legacy rules migrados"));
    }
  }

  /**
   * 🎯 Configura process de análise sistemático
   */
  async setupAnalysisProcess() {
    const analysisRule = `---
description: "Systematic development analysis process for all tasks"
globs: ["**/*.tsx", "**/*.ts", "**/*.jsx", "**/*.js"]
alwaysApply: true
---

# Development Analysis Process

## Core Process: Always Follow These Steps

### 1. Request Analysis
- **Task Type**: Identify if this is code creation, debugging, architecture, or refactoring
- **Technologies**: Note languages, frameworks, and libraries involved
- **Requirements**: List explicit and implicit requirements
- **Outcome**: Define the core problem and desired solution
- **Constraints**: Consider project context, performance, and security

### 2. Solution Planning
- **Break Down**: Divide into logical, manageable steps
- **Modularity**: Design for reusability and maintainability
- **Dependencies**: Identify required files, packages, and services
- **Alternatives**: Evaluate different approaches and trade-offs
- **Validation**: Plan testing strategy and success criteria

### 3. Implementation Strategy
- **Design Patterns**: Choose appropriate architectural patterns
- **Performance**: Consider optimization opportunities
- **Error Handling**: Plan for edge cases and graceful degradation
- **Accessibility**: Ensure WCAG compliance and inclusive design
- **Best Practices**: Verify code quality, security, and maintainability

## Code Quality Standards

### General Principles
- Write **concise, readable code** with clear intent
- Use **functional and declarative** programming patterns
- Follow **DRY principle** (Don't Repeat Yourself)
- Implement **early returns** for better readability
- Structure logically: exports → subcomponents → helpers → types

### Naming Conventions
- **Descriptive names** with auxiliary verbs (\`isLoading\`, \`hasError\`)
- **Event handlers** prefixed with "handle" (\`handleClick\`, \`handleSubmit\`)
- **Directories** in lowercase with dashes (\`components/auth-wizard\`)
- **Components** use named exports

### TypeScript Standards
- Use **TypeScript for all code**
- **Prefer interfaces over types** for object definitions
- **Avoid enums**; use const maps instead
- Implement **proper type safety** and inference
- Use **\`satisfies\` operator** for type validation

## Examples

<example>
Request: "Create a user authentication form"

Analysis Process Applied:
1. **Request**: React form component with validation and submission
2. **Planning**: Form state, validation rules, error handling, API integration
3. **Strategy**: Modern React patterns, accessibility, security best practices

Result: Well-structured component with proper types, validation, and UX.
</example>

<example type="invalid">
Immediately jumping to code without analysis:
- No consideration of requirements
- Missing error handling planning
- Unclear naming and structure
- No type safety consideration
</example>
`;

    await fs.ensureDir(path.join(this.cursorDir, "rules"));
    await fs.writeFile(
      path.join(this.cursorDir, "rules", "analysis-process-always.mdc"),
      analysisRule
    );

    console.log(chalk.green("     ✓ Analysis process configurado"));
  }

  /**
   * ⚛️ Configura guidelines modernas React 19/Next.js 15
   */
  async setupModernFrameworks() {
    if (this.detection.type === "react" || this.detection.type === "nextjs") {
      const modernRule = `---
description: "React 19 and Next.js 15 modern development patterns and best practices"
globs: ["app/**/*", "pages/**/*", "components/**/*", "**/*.tsx", "**/*.jsx"]
alwaysApply: false
---

# React 19 & Next.js 15 Modern Guidelines

## Component Architecture

### Server Components First (Next.js 15)
- **Favor React Server Components (RSC)** by default
- **Minimize 'use client' directives** - only for interactivity
- **Implement error boundaries** with \`error.tsx\`
- **Use Suspense for async operations** with \`loading.tsx\`
- **Optimize for Core Web Vitals** and performance metrics

## Modern State Management Patterns

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
      {state?.error && <p className="error">{state.error}</p>}
    </form>
  );
}

// ❌ Deprecated: useFormState
import { useFormState } from 'react-dom'; // Don't use
\`\`\`

### Enhanced useFormStatus (React 19)
\`\`\`tsx
// ✅ New properties available in React 19
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending, data, method, action } = useFormStatus();
  
  return (
    <button disabled={pending} type="submit">
      {pending ? 'Submitting...' : 'Submit'}
    </button>
  );
}
\`\`\`

### URL State Management
\`\`\`tsx
// ✅ Use 'nuqs' for URL state management
import { useQueryState } from 'nuqs';

function SearchPage() {
  const [search, setSearch] = useQueryState('q');
  const [page, setPage] = useQueryState('page', { defaultValue: 1 });
  
  return (
    <div>
      <input 
        value={search || ''} 
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search..."
      />
      <p>Page: {page}</p>
    </div>
  );
}

// ❌ Avoid complex useState for URL synchronization
\`\`\`

## Component Structure Best Practices

### Recommended Component Organization
\`\`\`tsx
// ✅ Optimal component structure
// 1. Imports (external first, then internal)
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';

// 2. Types and interfaces
interface UserProfileProps {
  userId: string;
  onUpdate?: () => void;
}

// 3. Main component
export function UserProfile({ userId, onUpdate }: UserProfileProps) {
  // 4. State and hooks
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 5. Event handlers
  const handleSubmit = useCallback(async () => {
    setLoading(true);
    try {
      // Implementation
      onUpdate?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [onUpdate]);
  
  // 6. Early returns
  if (loading) return <ProfileSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  
  // 7. Main render
  return (
    <div className="user-profile">
      {/* Component content */}
      <Button onClick={handleSubmit}>Update Profile</Button>
    </div>
  );
}

// 8. Subcomponents (if small and related)
function ProfileSkeleton() {
  return <div className="animate-pulse">Loading...</div>;
}

function ErrorMessage({ error }: { error: string }) {
  return <div className="error-message">{error}</div>;
}
\`\`\`

## Next.js 15 Specific Patterns

### App Router Best Practices
\`\`\`tsx
// app/dashboard/page.tsx
import { Suspense } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'User dashboard with analytics and insights'
};

export default async function DashboardPage() {
  // Server Component - can directly fetch data
  const data = await fetchDashboardData();
  
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<MetricsSkeleton />}>
        <DashboardMetrics data={data} />
      </Suspense>
    </div>
  );
}

// app/dashboard/loading.tsx
export default function Loading() {
  return <DashboardSkeleton />;
}

// app/dashboard/error.tsx
'use client';

export default function Error({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="error-boundary">
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
\`\`\`

### Performance Optimization
\`\`\`tsx
// ✅ Use next/image and next/font
import Image from 'next/image';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

// ✅ Optimize with React.memo when appropriate
const ExpensiveList = React.memo(({ items }) => {
  return (
    <div className={inter.className}>
      {items.map(item => (
        <Image
          key={item.id}
          src={item.image}
          alt={item.title}
          width={300}
          height={200}
          priority={item.priority}
        />
      ))}
    </div>
  );
});

// ✅ Use useCallback and useMemo strategically
const memoizedCallback = useCallback((id: string) => {
  handleItemAction(id);
}, [handleItemAction]);

const filteredItems = useMemo(() => {
  return items.filter(item => item.visible);
}, [items]);
\`\`\`

## Examples

<example>
Modern Next.js 15 component with React 19 features:
- Server Component for data fetching
- Client Component only where needed
- Proper TypeScript interfaces
- Modern form handling with useActionState
- Performance optimizations
- Error boundaries implemented
</example>

<example type="invalid">
Legacy patterns to avoid:
- Using useFormState instead of useActionState
- Unnecessary 'use client' everywhere
- Missing error boundaries
- No TypeScript definitions
- Poor performance patterns
- Inconsistent component structure
</example>
`;

      await fs.writeFile(
        path.join(this.cursorDir, "rules", "modern-react-patterns-auto.mdc"),
        modernRule
      );

      console.log(
        chalk.green("     ✓ Modern React/Next.js patterns configurados")
      );
    }
  }

  /**
   * 📋 Cria context files system
   */
  async setupContextFiles() {
    // instructions.md
    const instructions = `# Project Instructions

## Overview
Modern ${this.detection.type} project with best practices and latest patterns.

## Technologies Stack
${this.getTechStack()}

## Architecture
${this.getArchitecture()}

## Development Standards
- **TypeScript**: Strict mode enabled for type safety
- **Code Quality**: ESLint + Prettier + Husky pre-commit hooks
- **Testing**: Jest + React Testing Library for comprehensive coverage
- **Performance**: Core Web Vitals monitoring and optimization
- **Accessibility**: WCAG 2.1 AA compliance

## Build Process
1. \`npm install\` - Install dependencies
2. \`npm run dev\` - Development server
3. \`npm run build\` - Production build
4. \`npm run test\` - Run test suite
5. \`npm run lint\` - Code quality check

## Workflow
1. Feature branch from main
2. Implement following established patterns
3. Write tests for new functionality
4. Quality checks before commit
5. PR with detailed description
`;

    await fs.writeFile(
      path.join(this.cursorDir, "instructions.md"),
      instructions
    );

    // roadmap.md
    const roadmap = `# Development Roadmap

## Current Sprint: Foundation
**Goals**: Core setup and infrastructure

### In Progress
- [ ] Modern architecture implementation
- [ ] Authentication system
- [ ] Base UI components
- [ ] Testing framework setup

### Next Sprint: Features
- [ ] Core feature development
- [ ] API integration
- [ ] Advanced UI components
- [ ] Performance optimization

## Future Milestones
- [ ] Analytics integration
- [ ] Advanced features
- [ ] Mobile optimization
- [ ] Production deployment
`;

    await fs.writeFile(path.join(this.cursorDir, "roadmap.md"), roadmap);

    console.log(chalk.green("     ✓ Context files criados"));
  }

  getTechStack() {
    const stacks = {
      nextjs: `### Frontend
- React 19 with modern hooks and patterns
- Next.js 15 with App Router
- TypeScript for type safety
- Tailwind CSS for styling

### Backend
- Next.js API Routes
- Database integration (PostgreSQL/MongoDB)
- Authentication and authorization

### Tools
- ESLint + Prettier for code quality
- Jest + React Testing Library for testing
- Vercel for deployment`,

      react: `### Frontend
- React 19 with latest features
- TypeScript for type safety
- Vite for fast development
- Tailwind CSS for styling

### Tools
- ESLint + Prettier for code quality
- Jest + React Testing Library for testing
- Modern build tools and optimization`,

      "node-api": `### Backend
- Node.js with TypeScript
- Express.js framework
- Database ORM (Prisma/TypeORM)
- Authentication middleware

### Tools
- ESLint + Prettier for code quality
- Jest + Supertest for API testing
- Modern deployment practices`,
    };

    return stacks[this.detection.type] || stacks["node-api"];
  }

  getArchitecture() {
    const architectures = {
      nextjs: `- **App Router**: File-based routing with layouts
- **Server Components**: Default for performance
- **Client Components**: Only for interactivity
- **API Routes**: Backend functionality`,

      react: `- **Component Architecture**: Composable and reusable
- **Custom Hooks**: Shared logic extraction
- **Context + Hooks**: State management
- **Error Boundaries**: Graceful error handling`,

      "node-api": `- **Layered Architecture**: Controllers → Services → Models
- **Middleware Pattern**: Cross-cutting concerns
- **Repository Pattern**: Data access abstraction
- **Event-Driven**: Scalable communication`,
    };

    return architectures[this.detection.type] || architectures["node-api"];
  }
}

export default RulesModernizer;
