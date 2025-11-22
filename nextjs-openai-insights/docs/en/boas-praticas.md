# 🎯 Code Best Practices

This document consolidates the standards and techniques used in the `nextjs-openai-insights` project, serving as a reference guide for developers.

---

## 📋 Index

1. [Tailwind CSS](#tailwind-css)
2. [TypeScript](#typescript)
3. [React & Next.js](#react--nextjs)
4. [Containerization](#containerization)
5. [Naming Conventions](#naming-conventions)
6. [Error Handling](#error-handling)
7. [State Management](#state-management)
8. [Performance](#performance)
9. [Accessibility](#accessibility)
10. [File Structure](#file-structure)

---

## 🎨 Tailwind CSS

### Mandatory Cursor Pointer

**ALWAYS** add `cursor-pointer` to interactive elements (buttons, links, clickable cards):

```tsx
// ✅ CORRECT
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
  Click here
</button>

<a href="/dashboard" className="text-blue-600 hover:text-blue-700 cursor-pointer">
  Go to Dashboard
</a>

<div onClick={handleClick} className="p-4 border rounded-lg hover:border-gray-400 cursor-pointer">
  Clickable card
</div>

// ❌ WRONG - No cursor-pointer
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
  Click here
</button>
```

### Hover States

**ALWAYS** add `hover:` states for visual feedback:

```tsx
// ✅ CORRECT
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer">
  Button
</button>

<div className="p-4 border rounded-lg hover:border-gray-400 hover:bg-gray-50 transition cursor-pointer">
  Card
</div>

// Hover states with group
<div className="group">
  <div className="bg-gray-100 group-hover:bg-gray-200 transition cursor-pointer">
    Hovering the group affects this element
  </div>
</div>
```

### Transitions

**ALWAYS** use `transition` or `transition-all` for smooth animations:

```tsx
// ✅ CORRECT
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer">
  Button with transition
</button>

<div className="p-4 border rounded-lg hover:scale-105 transition-all duration-200 cursor-pointer">
  Card with scale on hover
</div>
```

### Disabled States

**ALWAYS** add `disabled:cursor-not-allowed` and `disabled:opacity-50`:

```tsx
// ✅ CORRECT
<button
  disabled={isLoading}
  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
>
  {isLoading ? "Loading..." : "Submit"}
</button>
```

### Drag and Drop

Use `cursor-grab` and `active:cursor-grabbing` for draggable elements:

```tsx
// ✅ CORRECT
<div className="cursor-grab active:cursor-grabbing" {...listeners}>
  <GripVertical className="w-4 h-4" />
</div>
```

### Links and Buttons

**NEVER** leave links without `cursor-pointer`:

```tsx
// ✅ CORRECT
<a href="/dashboard" className="text-blue-600 hover:text-blue-700 underline cursor-pointer">
  Dashboard
</a>

<button type="button" className="text-blue-600 hover:text-blue-700 cursor-pointer">
  Action
</button>
```

---

## 📘 TypeScript

### Interfaces vs Types

**Use `interface` for objects and data shapes:**

```typescript
// ✅ CORRECT - Interface for component props
interface AdminHeaderAdeProps {
  appearance: AdeAppearanceTokens;
  workspaceName?: string;
  onCustomizeBackground?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

// ✅ CORRECT - Interface for data models
export interface Dashboard {
  id: string;
  name: string;
  companyId: string;
  tiles: Tile[];
  createdAt: string;
  updatedAt: string;
}

// ✅ CORRECT - Type for unions and primitives
export type TileMessageRole = "assistant" | "user" | "system";
export type RequestSize = "small" | "medium" | "large";
```

### Prop Typing

**ALWAYS** type component props:

```tsx
// ✅ CORRECT
interface TileBoardProps {
  tiles: Tile[];
  variant: TileBoardVariant;
  onDeleteTile: (tileId: string) => void;
  onReorderTiles: (order: string[]) => Promise<void> | void;
  appearance?: AdeAppearanceTokens;
}

export function TileBoard({
  tiles,
  variant,
  onDeleteTile,
  onReorderTiles,
  appearance,
}: TileBoardProps) {
  // ...
}
```

### MongoDB Document Types

**ALWAYS** extend `Document` for MongoDB models:

```typescript
// ✅ CORRECT
import type { Document } from "mongodb";

export interface DashboardDocument extends Document {
  _id?: string;
  id: string;
  name: string;
  companyId: string;
  userId: string; // Required for security isolation
  createdAt: Date;
  updatedAt: Date;
}
```

### Input Validation

**ALWAYS** validate input in conversion functions:

```typescript
// ✅ CORRECT
export function dashboardToDocument(
  dashboard: Dashboard
): Omit<DashboardDocument, "_id" | "createdAt" | "updatedAt"> {
  if (!dashboard || !dashboard.id) {
    throw new Error("Invalid dashboard: missing id");
  }
  if (!dashboard.companyId) {
    throw new Error("Invalid dashboard: missing companyId");
  }

  return {
    id: dashboard.id,
    name: dashboard.name || "Unnamed Dashboard",
    companyId: dashboard.companyId,
    // ...
  };
}
```

### Type Guards

Use type guards for type validation:

```typescript
// ✅ CORRECT
function isError(error: unknown): error is Error {
  return error instanceof Error;
}

try {
  // ...
} catch (error) {
  if (isError(error)) {
    console.error(error.message);
  } else {
    console.error("Unknown error:", error);
  }
}
```

---

## ⚛️ React & Next.js

### "use client" and "use server" Directives

**ALWAYS** mark components and functions appropriately:

```tsx
// ✅ CORRECT - Component with interactivity
"use client";

import { useState } from "react";

export function AdminHeaderAde({ appearance }: AdminHeaderAdeProps) {
  const [isOpen, setIsOpen] = useState(false);
  // ...
}
```

```typescript
// ✅ CORRECT - Server action
"use server";

import { db } from "./mongodb";

export async function loadCompaniesWithDashboardsFromMongo(
  sessionId?: string,
  userId?: string | null
): Promise<CompanyWithDashboards[]> {
  // ...
}
```

### Named Exports

**PREFER** named exports for better tree-shaking:

```tsx
// ✅ CORRECT
export function AdminHeaderAde({ appearance }: AdminHeaderAdeProps) {
  // ...
}

export function AdminSidebarAde({ appearance }: AdminSidebarAdeProps) {
  // ...
}

// ❌ AVOID default exports
export default function AdminHeaderAde() {}
```

### Hooks - Order and Rules

**ALWAYS** follow the Rules of Hooks:

```tsx
// ✅ CORRECT - Hooks always at the top, in the same order
export function AdminSidebarAde({ appearance }: AdminSidebarAdeProps) {
  const [collapsed, setCollapsed] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // useMemo BEFORE useEffect and early returns
  const colors = useMemo(() => {
    // ...
  }, [appearance]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Early return AFTER all hooks
  if (!isMounted || !appearance) {
    return null;
  }

  // ...
}
```

### Early Returns

**USE** early returns to simplify logic:

```tsx
// ✅ CORRECT
export function AddPromptModal({
  open,
  onClose,
  onAddPrompt,
}: AddPromptModalProps) {
  if (!open) return null;

  // Rest of the component...
}

// ✅ CORRECT - Validation
function processData(data: unknown) {
  if (!data) return null;
  if (typeof data !== "object") return null;

  // Processing...
}
```

### useMemo and useCallback

**USE** for optimization when necessary:

```tsx
// ✅ CORRECT - useMemo for heavy calculations
const colors = useMemo(() => {
  if (!appearance?.textColor || !appearance?.sidebarColor) {
    return fallbackColors;
  }
  return computeColors(appearance);
}, [appearance]);

// ✅ CORRECT - useCallback for handlers passed as props
const handleClick = useCallback(() => {
  // ...
}, [dependency1, dependency2]);
```

### useEffect with Cleanup

**ALWAYS** clean up subscriptions and event listeners:

```tsx
// ✅ CORRECT
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    // ...
  };

  if (isOpen) {
    document.addEventListener("mousedown", handleClickOutside, true);
  }

  return () => {
    document.removeEventListener("mousedown", handleClickOutside, true);
  };
}, [isOpen]);
```

### Hydration Safety

**ALWAYS** prevent hydration mismatches:

```tsx
// ✅ CORRECT - Client-only rendering
export function AdminSidebarAde({ appearance }: AdminSidebarAdeProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !appearance) {
    return null;
  }

  return (
    <div style={{ color: appearance.textColor }}>
      {/* Content that depends on client values */}
    </div>
  );
}
```

---

## 🏗️ Containerization

### Separation of Responsibilities

**ALWAYS** separate containers (logic) from components (UI):

```
src/
├── containers/          # Business logic and state
│   └── admin/
│       └── AdminContainer.tsx
└── components/          # Pure UI components
    └── admin/
        └── ade/
            └── AdminHeaderAde.tsx
```

### Containers

**Containers manage:**

- Global and local state
- Business logic
- API calls
- Side effects (useEffect)
- Component orchestration

```tsx
// ✅ CORRECT - Container
"use client";

export function AdminContainer() {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/workspace",
    fetchWorkspace
  );
  const [currentCompany, setCurrentCompany] =
    useState<CompanyWithDashboards | null>(null);

  // Business logic
  const handleCreateCustomPrompt = useCallback(async (prompt: CustomPrompt) => {
    // ...
  }, []);

  return (
    <AdminShellAde appearance={appearanceTokens}>
      <AdminHeaderAde
        appearance={appearanceTokens}
        onAddPrompt={handleCreateCustomPrompt}
      />
      {/* ... */}
    </AdminShellAde>
  );
}
```

### Components

**Components are:**

- Pure (receive props, return JSX)
- Without complex business logic
- Reusable
- Easy to test

```tsx
// ✅ CORRECT - Pure component
export function AdminHeaderAde({
  appearance,
  onCustomizeBackground,
  onAddPrompt,
}: AdminHeaderAdeProps) {
  const [showDashboards, setShowDashboards] = useState(false);

  // Only local UI state
  return (
    <header>
      <button onClick={onCustomizeBackground} className="cursor-pointer">
        Customize
      </button>
    </header>
  );
}
```

---

## 📝 Naming Conventions

### Components

**PascalCase** for React components:

```tsx
// ✅ CORRECT
export function AdminHeaderAde() {}
export function TileBoard() {}
export function ContactDetailModal() {}
```

### Functions and Variables

**camelCase** for functions and variables:

```typescript
// ✅ CORRECT
export function loadCompaniesWithDashboards() {}
export function getCompanyById(companyId: string) {}
const currentCompany = getCompanyById("company_123");
```

### Handlers

**`handle` prefix** for event handlers:

```tsx
// ✅ CORRECT
const handleClick = () => {};
const handleSubmit = (event: React.FormEvent) => {};
const handleDeleteDashboard = (dashboardId: string) => {};
```

### Constants

**UPPER_SNAKE_CASE** for constants:

```typescript
// ✅ CORRECT
const DASHBOARDS_STORAGE_KEY = "insights_dashboards";
const DEFAULT_BASE_COLOR = "#f5f5f0";
const APPEARANCE_STORAGE_KEY = "ade-appearance-tokens";
```

### Files

**kebab-case** for component files, **camelCase** for utils:

```
// ✅ CORRECT
AdminHeaderAde.tsx
TileBoard.tsx
dashboards-store.ts
color.ts
mongodb.ts
```

### Interfaces and Types

**PascalCase** with a descriptive suffix:

```typescript
// ✅ CORRECT
interface AdminHeaderAdeProps {}
interface TileBoardProps {}
type TileMessageRole = "assistant" | "user" | "system";
```

---

## 🛡️ Error Handling

### Try/Catch with Structured Logs

**ALWAYS** use structured logs with context:

```typescript
// ✅ CORRECT
try {
  const result = await db.findOne<DashboardDocument>("dashboards", filter);
  return result;
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorCode = (error as Error & { code?: number | string }).code;

  console.error("[MongoDB Store] ❌ Error fetching dashboard:", {
    dashboardId: filter.id,
    userId: filter.userId,
    message: errorMessage,
    code: errorCode,
  });

  throw error;
}
```

### Fallbacks

**ALWAYS** provide fallbacks for critical operations:

```typescript
// ✅ CORRECT - Fallback for MongoDB
export async function loadCompaniesWithDashboardsFromMongo(
  sessionId?: string,
  userId?: string | null
): Promise<CompanyWithDashboards[]> {
  if (!userId) {
    return []; // Guests do not access MongoDB
  }

  if (!(await isMongoAvailable())) {
    return []; // Silent fallback
  }

  try {
    // Try MongoDB
    const companies = await db.find<WorkspaceDocument>("workspaces", {
      userId,
    });
    return companies.map(convertToCompany);
  } catch (error) {
    // Log but do not fail - return empty array for fallback
    console.warn("[MongoDB] ⚠️ Error loading, using fallback:", error);
    return [];
  }
}
```

### Input Validation

**ALWAYS** validate input before processing:

```typescript
// ✅ CORRECT
export function dashboardToDocument(dashboard: Dashboard): DashboardDocument {
  if (!dashboard || !dashboard.id) {
    throw new Error("Invalid dashboard: missing id");
  }
  if (!dashboard.companyId) {
    throw new Error("Invalid dashboard: missing companyId");
  }

  // Safe processing...
}
```

### Error Boundaries

**USE** error boundaries for critical components:

```tsx
// ✅ CORRECT - In Next.js App Router
// app/admin/error.tsx
"use client";

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
      <button onClick={reset} className="cursor-pointer">
        Try again
      </button>
    </div>
  );
}
```

---

## 🔄 State Management

### Local State

**USE** `useState` for simple local state:

```tsx
// ✅ CORRECT
const [isOpen, setIsOpen] = useState(false);
const [title, setTitle] = useState("");
```

### Derived State

**USE** `useMemo` for computed values:

```tsx
// ✅ CORRECT
const filteredTiles = useMemo(() => {
  return tiles.filter((tile) => tile.category === selectedCategory);
}, [tiles, selectedCategory]);
```

### Global State

**USE** Context API for shared state:

```tsx
// ✅ CORRECT
const MembershipContext = createContext<MembershipContextValue | null>(null);

export function MembershipProvider({ children }: PropsWithChildren) {
  const [isMember, setIsMember] = useState(false);

  return (
    <MembershipContext.Provider value={{ isMember, setIsMember }}>
      {children}
    </MembershipContext.Provider>
  );
}
```

### Server State

**USE** SWR or React Query for server data:

```tsx
// ✅ CORRECT
const { data, error, isLoading, mutate } = useSWR<WorkspaceResponse>(
  "/api/workspace",
  fetchWorkspace,
  {
    refreshInterval: (data) => {
      // Conditional polling logic
      return data?.company?.tiles?.length > 0 ? 0 : 2000;
    },
  }
);
```

### Refs for Mutable Values

**USE** `useRef` for values that do not cause re-renders:

```tsx
// ✅ CORRECT
const pollingAttemptsRef = useRef(0);
const isUpdatingDashboardRef = useRef(false);

// Update without causing a re-render
pollingAttemptsRef.current += 1;
```

---

## ⚡ Performance

### Code Splitting

**USE** dynamic imports for heavy components:

```tsx
// ✅ CORRECT
const HeavyComponent = dynamic(() => import("./HeavyComponent"), {
  loading: () => <div>Loading...</div>,
  ssr: false, // If SSR is not needed
});
```

### Memoization

**USE** `React.memo` for components that receive stable props:

```tsx
// ✅ CORRECT
export const TileCard = React.memo(function TileCard({ tile }: TileCardProps) {
  return <div>{tile.title}</div>;
});
```

### Lazy Loading

**USE** lazy loading for routes and components:

```tsx
// ✅ CORRECT
const AdminPage = lazy(() => import("@/app/admin/page"));
```

### Debounce/Throttle

**USE** for frequent operations:

```tsx
// ✅ CORRECT
const debouncedSearch = useMemo(
  () =>
    debounce((query: string) => {
      // Search...
    }, 300),
  []
);
```

---

## ♿ Accessibility

### ARIA Labels

**ALWAYS** add `aria-label` to buttons without text:

```tsx
// ✅ CORRECT
<button
  type="button"
  onClick={handleClose}
  className="cursor-pointer"
  aria-label="Close modal"
>
  <X className="w-5 h-5" />
</button>
```

### Semantic HTML

**USE** semantic elements:

```tsx
// ✅ CORRECT
<header>
  <nav>
    <ul>
      <li><a href="/dashboard" className="cursor-pointer">Dashboard</a></li>
    </ul>
  </nav>
</header>

<main>
  <section>
    <h2>Section Title</h2>
    {/* Content */}
  </section>
</main>
```

### Keyboard Navigation

**ENSURE** that interactive elements are accessible via keyboard:

```tsx
// ✅ CORRECT
<button
  type="button"
  onClick={handleClick}
  className="cursor-pointer"
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      handleClick();
    }
  }}
>
  Action
</button>
```

---

## 📁 File Structure

### Organization by Feature

```
src/
├── app/                    # Next.js App Router
│   ├── admin/
│   │   └── page.tsx
│   └── api/
│       └── workspace/
│           └── route.ts
├── components/             # UI Components
│   ├── admin/
│   │   └── ade/
│   └── ui/
├── containers/            # Containers (business logic)
│   └── admin/
│       └── AdminContainer.tsx
├── lib/                   # Utilities and helpers
│   ├── db/               # MongoDB
│   ├── storage/          # localStorage/store
│   ├── types/            # TypeScript types
│   └── color.ts          # Color utilities
└── types/                # Shared types
```

### Logical Grouping

**GROUP** related files:

```
components/admin/ade/
├── AdminHeaderAde.tsx
├── AdminSidebarAde.tsx
├── AdminShellAde.tsx
└── DashboardConfigModal.tsx
```

### Barrels (index.ts)

**AVOID** unnecessary barrels - prefer direct imports:

```tsx
// ✅ CORRECT - Direct import
import { AdminHeaderAde } from "@/components/admin/ade/AdminHeaderAde";
import { AdminSidebarAde } from "@/components/admin/ade/AdminSidebarAde";

// ❌ AVOID - Unnecessary barrel
import { AdminHeaderAde, AdminSidebarAde } from "@/components/admin/ade";
```

---

## 🔐 Security

### Input Validation

**ALWAYS** validate user input:

```typescript
// ✅ CORRECT
const createTileSchema = z.object({
  title: z.string().min(1, "Title is required"),
  prompt: z.string().min(1, "Prompt is required"),
  model: z.string().optional(),
});

const parseResult = createTileSchema.safeParse(body);
if (!parseResult.success) {
  return NextResponse.json(
    { error: "Invalid payload", details: parseResult.error.flatten() },
    { status: 400 }
  );
}
```

### User Isolation

**ALWAYS** filter by `userId` in MongoDB queries:

```typescript
// ✅ CORRECT - Security isolation
const dashboardDoc = await db.findOne<DashboardDocument>("dashboards", {
  id: dashboardId,
  userId, // ALWAYS filter by userId
});
```

### Sanitization

**ALWAYS** sanitize data before rendering:

```typescript
// ✅ CORRECT
function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, "");
}
```

---

## 📊 Logging and Observability

### Structured Logs

**ALWAYS** use structured logs with context:

```typescript
// ✅ CORRECT
console.log(
  "[MongoDB] ✅ Connection established",
  JSON.stringify({
    attempt: attemptLabel,
    durationMs: Date.now() - startedAt,
  })
);

console.error("[Migration] ❌ Error migrating workspace:", {
  sessionId: workspace.sessionId,
  userId,
  message: errorMessage,
  code: errorCode,
});
```

### Context Prefixes

**USE** prefixes to identify origin:

```typescript
// ✅ CORRECT
console.log("[AdminContainer] ✅ Tiles found");
console.warn("[MongoDB Store] ⚠️ Circuit breaker open");
console.error("[API] /api/workspace/tiles - Error creating tile");
```

---

## ✅ Quality Checklist

Before finishing any task, check:

- [ ] All buttons/links have `cursor-pointer`
- [ ] All interactive elements have `hover:` states
- [ ] Transitions applied where appropriate
- [ ] `disabled:` states handled correctly
- [ ] Components typed with interfaces
- [ ] Input validation implemented
- [ ] Error handling with try/catch
- [ ] Structured logs with context
- [ ] `"use client"` or `"use server"` applied correctly
- [ ] Hooks in the correct order (Rules of Hooks)
- [ ] Early returns to simplify logic
- [ ] ARIA labels on elements without text
- [ ] Fallbacks for critical operations
- [ ] Security filters (`userId`) in MongoDB queries

---

## 📚 References

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [MongoDB Node.js Driver](https://www.mongodb.com/docs/drivers/node/current/)

---

**Last updated:** 2025-01-14
