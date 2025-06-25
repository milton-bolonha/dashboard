# 🔄 Modern Rules Migration Guide

> **Framework de migração automática: .cursorrules → .mdc + React 19/Next.js 15 patterns**

## 🎯 **OVERVIEW**

O AI Development Workspace agora inclui **migração automática** do formato legacy `.cursorrules` para o moderno formato `.mdc`, incluindo patterns específicos para **React 19** e **Next.js 15**.

## 🔄 **MIGRAÇÃO AUTOMÁTICA**

### **Detection & Migration Process**

```bash
ai-workspace setup  # Detecta e migra automaticamente
```

**O que acontece:**

1. 🔍 **Detecta** arquivos `.cursorrules` existentes
2. 📋 **Cria backup** em `.cursorrules.backup`
3. 🔄 **Converte** para formato `.mdc` moderno
4. 📚 **Gera documentação** completa
5. ✅ **Configura patterns** modernos

### **Arquivos Criados**

```
.cursor/
├── rules/
│   ├── migrated-legacy-always.mdc     # Rules migradas
│   ├── modern-analysis-process-always.mdc  # Process sistemático
│   └── react-19-nextjs-15-patterns-auto.mdc # Patterns modernos
├── migration-guide.md                 # Guia completo de migração
├── instructions.md                    # Project specification moderna
└── roadmap.md                         # Development roadmap

.cursorrules.backup                    # Backup do arquivo original
```

## 📋 **FORMATO MODERNO .mdc**

### **Legacy vs Modern**

**🚫 Legacy Format (.cursorrules):**

```
# Simple text format without metadata
System: You are a helpful assistant...
Project: This is a React project...
```

**✅ Modern Format (.mdc):**

```mdc
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
```

### **Benefits of Migration**

**🎯 Enhanced AI Understanding:**

- **🤖 Better Responses** - Metadata helps AI provide more accurate assistance
- **📐 Standardization** - Consistent with Cursor best practices
- **🧠 Context Awareness** - Better project understanding
- **👥 Team Collaboration** - Shareable, documented standards

**💪 Modern Features:**

- **Metadata frontmatter** - description, globs, alwaysApply
- **Structured content** - Clear sections and examples
- **Example patterns** - Valid and invalid usage examples
- **Type-specific rules** - Automatic application based on file types

## 🎯 **SYSTEMATIC ANALYSIS PROCESS**

### **3-Step Methodology**

O framework implementa um processo sistemático baseado nas [melhores práticas](https://decode.agency/article/cursor-guide/):

```mdc
## Before responding to any request, follow these steps:

### 1. Request Analysis
- **Task Classification**: code creation, debugging, architecture, refactoring
- **Technology Stack**: languages, frameworks, libraries involved
- **Requirements Gathering**: explicit and implicit requirements
- **Outcome Definition**: core problem and desired solution

### 2. Solution Planning
- **Step Decomposition**: logical, manageable components
- **Modularity Design**: reusability and maintainability
- **Dependency Mapping**: files, packages, services needed
- **Alternative Evaluation**: approaches and trade-offs

### 3. Implementation Strategy
- **Pattern Selection**: appropriate design patterns
- **Performance Consideration**: optimization opportunities
- **Error Handling Design**: edge cases and graceful degradation
- **Accessibility Compliance**: WCAG standards
```

### **Quality Standards Implementation**

**Code Quality Standards:**

- **Concise, readable code** with clear intent
- **Functional and declarative patterns** over imperative
- **DRY principle** consistently applied
- **Early returns** for better readability
- **Logical structure**: exports → subcomponents → helpers → types

**TypeScript Best Practices:**

- **TypeScript for all code** without `any` types
- **Interfaces over types** for object definitions
- **Avoid enums** - use const assertion objects
- **Strict mode enabled** for maximum type safety
- **`satisfies` operator** for better validation

## ⚛️ **REACT 19 & NEXT.JS 15 MODERN PATTERNS**

### **React 19 New Features Implementation**

**🆕 Form Handling with useActionState:**

```tsx
// ✅ Modern: useActionState (React 19)
import { useActionState } from "react";

async function updateProfile(prevState: any, formData: FormData) {
  try {
    const email = formData.get("email") as string;
    const name = formData.get("name") as string;

    if (!email || !name) {
      return { error: "All fields are required" };
    }

    await updateUserProfile({ email, name });
    return { success: "Profile updated successfully" };
  } catch (error) {
    return { error: "Failed to update profile" };
  }
}

function ProfileForm() {
  const [state, formAction] = useActionState(updateProfile, null);

  return (
    <form action={formAction}>
      <input name="name" type="text" required />
      <input name="email" type="email" required />
      <SubmitButton />

      {state?.error && <div className="error">{state.error}</div>}
      {state?.success && <div className="success">{state.success}</div>}
    </form>
  );
}

// ❌ Deprecated: Don't use useFormState
import { useFormState } from "react-dom"; // Avoid this
```

**🔧 Enhanced useFormStatus:**

```tsx
// ✅ New properties available in React 19
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending, data, method, action } = useFormStatus();

  return (
    <button disabled={pending} type="submit">
      {pending ? "Updating..." : "Update Profile"}
    </button>
  );
}
```

### **Next.js 15 Server Components Strategy**

**🚀 Server Components First:**

```tsx
// ✅ Default: Server Component for data fetching
import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Dashboard",
  description: "Comprehensive user analytics and insights",
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
("use client");

function InteractiveChart({ data }: { data: ChartData }) {
  const [selectedPeriod, setSelectedPeriod] = useState("week");

  return (
    <div>
      <PeriodSelector value={selectedPeriod} onChange={setSelectedPeriod} />
      <Chart data={data} period={selectedPeriod} />
    </div>
  );
}
```

### **URL State Management with nuqs**

**🎯 Modern URL State:**

```tsx
// ✅ Use 'nuqs' for URL state management
import { useQueryState } from "nuqs";

function ProductsPage() {
  const [search, setSearch] = useQueryState("search");
  const [category, setCategory] = useQueryState("category");
  const [page, setPage] = useQueryState("page", { defaultValue: 1 });
  const [sortBy, setSortBy] = useQueryState("sortBy", { defaultValue: "name" });

  // URL automatically synced: ?search=laptop&category=electronics&page=2&sortBy=price

  return (
    <div className="products-page">
      <div className="filters">
        <input
          value={search || ""}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
        />

        <select
          value={category || ""}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="electronics">Electronics</option>
          <option value="clothing">Clothing</option>
        </select>
      </div>

      <ProductsList
        search={search}
        category={category}
        page={page}
        sortBy={sortBy}
      />
    </div>
  );
}

// ❌ Avoid: Complex useState for URL synchronization
```

## 📋 **MODERN CONTEXT FILES SYSTEM**

### **instructions.md - Complete Project Specification**

```markdown
# PROJECT_TYPE Project Instructions

## Technology Stack

### Frontend Technologies

- **React 19**: Latest version with modern hooks and patterns
- **Next.js 15**: App Router with enhanced Server Components
- **TypeScript**: Strict mode for maximum type safety
- **Tailwind CSS**: Utility-first styling with design system

### Backend Technologies

- **Next.js API Routes**: Full-stack capabilities
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js or custom JWT implementation
- **Validation**: Zod for runtime type checking

### Development Tools

- **ESLint + Prettier**: Code quality and formatting
- **Jest + React Testing Library**: Comprehensive testing
- **Playwright**: End-to-end testing
- **Vercel**: Deployment and hosting

## Architecture Patterns

- **App Router Architecture**: File-based routing with layouts
- **Server-First Components**: Default to Server Components
- **Streaming and Suspense**: Progressive loading
- **API Routes**: Co-located backend functionality
- **Middleware**: Request processing and authentication

## Development Standards

### Code Quality

- **TypeScript Strict Mode**: Maximum type safety
- **ESLint + Prettier**: Automated formatting
- **Husky Pre-commit Hooks**: Quality gates
- **Conventional Commits**: Standardized messages

### Performance Standards

- **Core Web Vitals**: LCP < 2.5s, FID < 100ms, CLS < 0.1
- **Bundle Size**: Monitor and optimize chunks
- **Image Optimization**: next/image for all images
- **Code Splitting**: Lazy loading for non-critical code

### Accessibility Requirements

- **WCAG 2.1 AA Compliance**: Full accessibility support
- **Semantic HTML**: Proper heading hierarchy
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: ARIA labels and descriptions
```

### **roadmap.md - Development Roadmap**

```markdown
# Development Roadmap

## Current Sprint: Foundation & Modern Setup

**Duration**: 2 weeks
**Goal**: Establish modern development foundation

### ✅ Completed

- [x] Project initialization with modern tooling
- [x] TypeScript strict mode configuration
- [x] ESLint + Prettier team standards
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
```

## 🎬 **ADVANCED COMPOSER USAGE**

### **Strategic Context Commands**

**Core Context:**

```bash
@Files – Include specific files in context
@Folders – Include entire folder contents
@Code – Reference specific code blocks or symbols
```

**External Context:**

```bash
@Docs – Reference official documentation
@Web – Search online for latest information
@Git – Include git history and recent changes
```

**Project Context:**

```bash
@Cursor Rules – Reference project-specific rules
@Notepads – Include saved code templates
@Past Chats – Reference previous conversations
```

**Quick Context:**

```bash
#Files – Add files without explicit @Files reference
/Commands – Access open files and available commands
```

### **Progressive Context Building Strategy**

```
1. Start specific: @Code UserController.authenticate
2. Expand if needed: @Files auth/UserController.ts
3. Add related: @Folders auth/
4. Include history: @Git auth changes
5. Reference patterns: @Past Chats authentication
```

### **Effective Prompting Patterns**

```bash
✅ "Use @Code UserService.createUser and add proper error handling"
✅ "@Files components/LoginForm.tsx - convert to React 19 patterns"
✅ "@Web 'React 19 useActionState examples' then implement here"

❌ "Fix the code"
❌ "Make it better"
❌ "Add some error handling"
```

## 🎯 **BEST PRACTICES IMPLEMENTATION**

### **Rule Creation Guidelines**

- **Keep focused**: Under 500 lines per rule
- **Be composable**: Reuse rule blocks instead of duplication
- **Use concrete names**: Clear purpose and scope
- **Provide anchors**: Reference `@filename.ts` examples
- **Include examples**: Valid and invalid patterns

### **Development Workflow**

1. **Write instructions.md** before starting AI-based work
2. **Ask Cursor to confirm** understanding of tasks first
3. **Review all changes** line by line before accepting
4. **Test thoroughly** after AI-generated code
5. **Update rules** based on learnings and patterns

### **Modern Component Structure**

```tsx
// ✅ Recommended modern component structure
// 1. Imports (external libraries first, then internal)
import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// 2. Types and interfaces (co-located)
interface UserDashboardProps {
  userId: string;
  initialData?: UserData;
  onUserUpdate?: (user: UserData) => void;
}

// 3. Main component function
export function UserDashboard({
  userId,
  initialData,
  onUserUpdate,
}: UserDashboardProps) {
  // 4. Hooks (state, context, custom hooks)
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  // 5. Computed values and memoization
  const displayData = useMemo(() => {
    return optimisticUpdate || userData || initialData;
  }, [optimisticUpdate, userData, initialData]);

  // 6. Event handlers (use useCallback for performance)
  const handleEdit = useCallback(() => {
    setEditing(true);
  }, []);

  // 7. Early returns for loading and error states
  if (loading && !displayData) {
    return <UserDashboardSkeleton />;
  }

  // 8. Main render
  return <Card className="user-dashboard">{/* Component content */}</Card>;
}

// 9. Supporting components (small and related only)
function UserDashboardSkeleton() {
  return <div className="animate-pulse">Loading...</div>;
}

// 10. Type exports (if needed by other components)
export type { UserDashboardProps, UserData };
```

## 🚀 **GETTING STARTED**

### **Quick Start**

```bash
# 1. Run setup (automatic migration)
ai-workspace setup

# 2. Review migrated rules
cat .cursor/rules/migrated-legacy-always.mdc

# 3. Check migration guide
cat .cursor/migration-guide.md

# 4. Start using modern patterns
# O Cursor automaticamente aplicará as novas rules
```

### **Migration Checklist**

**From Legacy React to React 19:**

- [ ] Replace useFormState with useActionState
- [ ] Update useFormStatus usage for new properties
- [ ] Implement proper Server/Client Component split
- [ ] Add comprehensive error boundaries
- [ ] Update to modern component structure

**From Legacy Next.js to Next.js 15:**

- [ ] Migrate to App Router if using Pages Router
- [ ] Implement Server Components by default
- [ ] Add loading.tsx and error.tsx files
- [ ] Update to next/image and next/font
- [ ] Optimize performance with modern patterns

## 🎉 **RESULT**

**Congratulations!** Seu projeto agora usa:

✅ **Modern .mdc rules** com metadata inteligente  
✅ **Systematic analysis process** para todos os tasks  
✅ **React 19 & Next.js 15 patterns** implementados automaticamente  
✅ **Complete context files** com project specification  
✅ **Advanced composer usage** com strategic context building

**O framework mais avançado para desenvolvimento com Cursor AI!** 🚀
