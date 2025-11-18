# 🎯 Boas Práticas de Código

Este documento consolida os padrões e técnicas empregados no projeto `nextjs-openai-insights`, servindo como guia de referência para desenvolvedores.

---

## 📋 Índice

1. [Tailwind CSS](#tailwind-css)
2. [TypeScript](#typescript)
3. [React & Next.js](#react--nextjs)
4. [Containerização](#containerização)
5. [Convenções de Nomenclatura](#convenções-de-nomenclatura)
6. [Tratamento de Erros](#tratamento-de-erros)
7. [Gerenciamento de Estado](#gerenciamento-de-estado)
8. [Performance](#performance)
9. [Acessibilidade](#acessibilidade)
10. [Estrutura de Arquivos](#estrutura-de-arquivos)

---

## 🎨 Tailwind CSS

### Cursor Pointer Obrigatório

**SEMPRE** adicione `cursor-pointer` em elementos interativos (botões, links, cards clicáveis):

```tsx
// ✅ CORRETO
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
  Clique aqui
</button>

<a href="/dashboard" className="text-blue-600 hover:text-blue-700 cursor-pointer">
  Ir para Dashboard
</a>

<div onClick={handleClick} className="p-4 border rounded-lg hover:border-gray-400 cursor-pointer">
  Card clicável
</div>

// ❌ ERRADO - Sem cursor-pointer
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
  Clique aqui
</button>
```

### Estados de Hover

**SEMPRE** adicione estados `hover:` para feedback visual:

```tsx
// ✅ CORRETO
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer">
  Botão
</button>

<div className="p-4 border rounded-lg hover:border-gray-400 hover:bg-gray-50 transition cursor-pointer">
  Card
</div>

// Estados de hover com grupo
<div className="group">
  <div className="bg-gray-100 group-hover:bg-gray-200 transition cursor-pointer">
    Hover no grupo afeta este elemento
  </div>
</div>
```

### Transições

**SEMPRE** use `transition` ou `transition-all` para animações suaves:

```tsx
// ✅ CORRETO
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer">
  Botão com transição
</button>

<div className="p-4 border rounded-lg hover:scale-105 transition-all duration-200 cursor-pointer">
  Card com escala no hover
</div>
```

### Estados Desabilitados

**SEMPRE** adicione `disabled:cursor-not-allowed` e `disabled:opacity-50`:

```tsx
// ✅ CORRETO
<button
  disabled={isLoading}
  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
>
  {isLoading ? "Carregando..." : "Enviar"}
</button>
```

### Drag and Drop

Use `cursor-grab` e `active:cursor-grabbing` para elementos arrastáveis:

```tsx
// ✅ CORRETO
<div className="cursor-grab active:cursor-grabbing" {...listeners}>
  <GripVertical className="w-4 h-4" />
</div>
```

### Links e Botões

**NUNCA** deixe links sem `cursor-pointer`:

```tsx
// ✅ CORRETO
<a href="/dashboard" className="text-blue-600 hover:text-blue-700 underline cursor-pointer">
  Dashboard
</a>

<button type="button" className="text-blue-600 hover:text-blue-700 cursor-pointer">
  Ação
</button>
```

---

## 📘 TypeScript

### Interfaces vs Types

**Use `interface` para objetos e formas de dados:**

```typescript
// ✅ CORRETO - Interface para props de componente
interface AdminHeaderAdeProps {
  appearance: AdeAppearanceTokens;
  workspaceName?: string;
  onCustomizeBackground?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

// ✅ CORRETO - Interface para modelos de dados
export interface Dashboard {
  id: string;
  name: string;
  companyId: string;
  tiles: Tile[];
  createdAt: string;
  updatedAt: string;
}

// ✅ CORRETO - Type para unions e primitivos
export type TileMessageRole = "assistant" | "user" | "system";
export type RequestSize = "small" | "medium" | "large";
```

### Tipagem de Props

**SEMPRE** tipar props de componentes:

```tsx
// ✅ CORRETO
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

**SEMPRE** estender `Document` para modelos MongoDB:

```typescript
// ✅ CORRETO
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

### Validação de Entrada

**SEMPRE** validar entrada em funções de conversão:

```typescript
// ✅ CORRETO
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

Use type guards para validação de tipos:

```typescript
// ✅ CORRETO
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

### Diretivas "use client" e "use server"

**SEMPRE** marque componentes e funções apropriadamente:

```tsx
// ✅ CORRETO - Componente com interatividade
"use client";

import { useState } from "react";

export function AdminHeaderAde({ appearance }: AdminHeaderAdeProps) {
  const [isOpen, setIsOpen] = useState(false);
  // ...
}
```

```typescript
// ✅ CORRETO - Server action
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

**PREFIRA** named exports para melhor tree-shaking:

```tsx
// ✅ CORRETO
export function AdminHeaderAde({ appearance }: AdminHeaderAdeProps) {
  // ...
}

export function AdminSidebarAde({ appearance }: AdminSidebarAdeProps) {
  // ...
}

// ❌ EVITAR default exports
export default function AdminHeaderAde() {}
```

### Hooks - Ordem e Regras

**SEMPRE** siga as Rules of Hooks:

```tsx
// ✅ CORRETO - Hooks sempre no topo, na mesma ordem
export function AdminSidebarAde({ appearance }: AdminSidebarAdeProps) {
  const [collapsed, setCollapsed] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // useMemo ANTES de useEffect e early returns
  const colors = useMemo(() => {
    // ...
  }, [appearance]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Early return DEPOIS de todos os hooks
  if (!isMounted || !appearance) {
    return null;
  }

  // ...
}
```

### Early Returns

**USE** early returns para simplificar lógica:

```tsx
// ✅ CORRETO
export function AddPromptModal({
  open,
  onClose,
  onAddPrompt,
}: AddPromptModalProps) {
  if (!open) return null;

  // Resto do componente...
}

// ✅ CORRETO - Validação
function processData(data: unknown) {
  if (!data) return null;
  if (typeof data !== "object") return null;

  // Processamento...
}
```

### useMemo e useCallback

**USE** para otimização quando necessário:

```tsx
// ✅ CORRETO - useMemo para cálculos pesados
const colors = useMemo(() => {
  if (!appearance?.textColor || !appearance?.sidebarColor) {
    return fallbackColors;
  }
  return computeColors(appearance);
}, [appearance]);

// ✅ CORRETO - useCallback para handlers passados como props
const handleClick = useCallback(() => {
  // ...
}, [dependency1, dependency2]);
```

### useEffect com Cleanup

**SEMPRE** limpe subscriptions e event listeners:

```tsx
// ✅ CORRETO
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

**SEMPRE** previna hydration mismatches:

```tsx
// ✅ CORRETO - Client-only rendering
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
      {/* Conteúdo que depende de valores do cliente */}
    </div>
  );
}
```

---

## 🏗️ Containerização

### Separação de Responsabilidades

**SEMPRE** separe containers (lógica) de components (UI):

```
src/
├── containers/          # Lógica de negócio e estado
│   └── admin/
│       └── AdminContainer.tsx
└── components/          # Componentes de UI puros
    └── admin/
        └── ade/
            └── AdminHeaderAde.tsx
```

### Containers

**Containers gerenciam:**

- Estado global e local
- Lógica de negócio
- Chamadas de API
- Side effects (useEffect)
- Orquestração de componentes

```tsx
// ✅ CORRETO - Container
"use client";

export function AdminContainer() {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/workspace",
    fetchWorkspace
  );
  const [currentCompany, setCurrentCompany] =
    useState<CompanyWithDashboards | null>(null);

  // Lógica de negócio
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

**Components são:**

- Puros (recebem props, retornam JSX)
- Sem lógica de negócio complexa
- Reutilizáveis
- Fáceis de testar

```tsx
// ✅ CORRETO - Componente puro
export function AdminHeaderAde({
  appearance,
  onCustomizeBackground,
  onAddPrompt,
}: AdminHeaderAdeProps) {
  const [showDashboards, setShowDashboards] = useState(false);

  // Apenas estado de UI local
  return (
    <header>
      <button onClick={onCustomizeBackground} className="cursor-pointer">
        Customizar
      </button>
    </header>
  );
}
```

---

## 📝 Convenções de Nomenclatura

### Componentes

**PascalCase** para componentes React:

```tsx
// ✅ CORRETO
export function AdminHeaderAde() {}
export function TileBoard() {}
export function ContactDetailModal() {}
```

### Funções e Variáveis

**camelCase** para funções e variáveis:

```typescript
// ✅ CORRETO
export function loadCompaniesWithDashboards() {}
export function getCompanyById(companyId: string) {}
const currentCompany = getCompanyById("company_123");
```

### Handlers

**Prefixo `handle`** para event handlers:

```tsx
// ✅ CORRETO
const handleClick = () => {};
const handleSubmit = (event: React.FormEvent) => {};
const handleDeleteDashboard = (dashboardId: string) => {};
```

### Constantes

**UPPER_SNAKE_CASE** para constantes:

```typescript
// ✅ CORRETO
const DASHBOARDS_STORAGE_KEY = "insights_dashboards";
const DEFAULT_BASE_COLOR = "#f5f5f0";
const APPEARANCE_STORAGE_KEY = "ade-appearance-tokens";
```

### Arquivos

**kebab-case** para arquivos de componentes, **camelCase** para utils:

```
// ✅ CORRETO
AdminHeaderAde.tsx
TileBoard.tsx
dashboards-store.ts
color.ts
mongodb.ts
```

### Interfaces e Types

**PascalCase** com sufixo descritivo:

```typescript
// ✅ CORRETO
interface AdminHeaderAdeProps {}
interface TileBoardProps {}
type TileMessageRole = "assistant" | "user" | "system";
```

---

## 🛡️ Tratamento de Erros

### Try/Catch com Logs Estruturados

**SEMPRE** use logs estruturados com contexto:

```typescript
// ✅ CORRETO
try {
  const result = await db.findOne<DashboardDocument>("dashboards", filter);
  return result;
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorCode = (error as Error & { code?: number | string }).code;

  console.error("[MongoDB Store] ❌ Erro ao buscar dashboard:", {
    dashboardId: filter.id,
    userId: filter.userId,
    message: errorMessage,
    code: errorCode,
  });

  throw error;
}
```

### Fallbacks

**SEMPRE** forneça fallbacks para operações críticas:

```typescript
// ✅ CORRETO - Fallback para MongoDB
export async function loadCompaniesWithDashboardsFromMongo(
  sessionId?: string,
  userId?: string | null
): Promise<CompanyWithDashboards[]> {
  if (!userId) {
    return []; // Guests não acessam MongoDB
  }

  if (!(await isMongoAvailable())) {
    return []; // Fallback silencioso
  }

  try {
    // Tentar MongoDB
    const companies = await db.find<WorkspaceDocument>("workspaces", {
      userId,
    });
    return companies.map(convertToCompany);
  } catch (error) {
    // Log mas não falha - retorna array vazio para fallback
    console.warn("[MongoDB] ⚠️ Erro ao carregar, usando fallback:", error);
    return [];
  }
}
```

### Validação de Entrada

**SEMPRE** valide entrada antes de processar:

```typescript
// ✅ CORRETO
export function dashboardToDocument(dashboard: Dashboard): DashboardDocument {
  if (!dashboard || !dashboard.id) {
    throw new Error("Invalid dashboard: missing id");
  }
  if (!dashboard.companyId) {
    throw new Error("Invalid dashboard: missing companyId");
  }

  // Processamento seguro...
}
```

### Error Boundaries

**USE** error boundaries para componentes críticos:

```tsx
// ✅ CORRETO - Em Next.js App Router
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
      <h2>Algo deu errado!</h2>
      <button onClick={reset} className="cursor-pointer">
        Tentar novamente
      </button>
    </div>
  );
}
```

---

## 🔄 Gerenciamento de Estado

### Estado Local

**USE** `useState` para estado local simples:

```tsx
// ✅ CORRETO
const [isOpen, setIsOpen] = useState(false);
const [title, setTitle] = useState("");
```

### Estado Derivado

**USE** `useMemo` para valores computados:

```tsx
// ✅ CORRETO
const filteredTiles = useMemo(() => {
  return tiles.filter((tile) => tile.category === selectedCategory);
}, [tiles, selectedCategory]);
```

### Estado Global

**USE** Context API para estado compartilhado:

```tsx
// ✅ CORRETO
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

**USE** SWR ou React Query para dados do servidor:

```tsx
// ✅ CORRETO
const { data, error, isLoading, mutate } = useSWR<WorkspaceResponse>(
  "/api/workspace",
  fetchWorkspace,
  {
    refreshInterval: (data) => {
      // Lógica de polling condicional
      return data?.company?.tiles?.length > 0 ? 0 : 2000;
    },
  }
);
```

### Refs para Valores Mutáveis

**USE** `useRef` para valores que não causam re-render:

```tsx
// ✅ CORRETO
const pollingAttemptsRef = useRef(0);
const isUpdatingDashboardRef = useRef(false);

// Atualizar sem causar re-render
pollingAttemptsRef.current += 1;
```

---

## ⚡ Performance

### Code Splitting

**USE** dynamic imports para componentes pesados:

```tsx
// ✅ CORRETO
const HeavyComponent = dynamic(() => import("./HeavyComponent"), {
  loading: () => <div>Carregando...</div>,
  ssr: false, // Se não precisa de SSR
});
```

### Memoização

**USE** `React.memo` para componentes que recebem props estáveis:

```tsx
// ✅ CORRETO
export const TileCard = React.memo(function TileCard({ tile }: TileCardProps) {
  return <div>{tile.title}</div>;
});
```

### Lazy Loading

**USE** lazy loading para rotas e componentes:

```tsx
// ✅ CORRETO
const AdminPage = lazy(() => import("@/app/admin/page"));
```

### Debounce/Throttle

**USE** para operações frequentes:

```tsx
// ✅ CORRETO
const debouncedSearch = useMemo(
  () =>
    debounce((query: string) => {
      // Buscar...
    }, 300),
  []
);
```

---

## ♿ Acessibilidade

### ARIA Labels

**SEMPRE** adicione `aria-label` em botões sem texto:

```tsx
// ✅ CORRETO
<button
  type="button"
  onClick={handleClose}
  className="cursor-pointer"
  aria-label="Fechar modal"
>
  <X className="w-5 h-5" />
</button>
```

### Semantic HTML

**USE** elementos semânticos:

```tsx
// ✅ CORRETO
<header>
  <nav>
    <ul>
      <li><a href="/dashboard" className="cursor-pointer">Dashboard</a></li>
    </ul>
  </nav>
</header>

<main>
  <section>
    <h2>Título da Seção</h2>
    {/* Conteúdo */}
  </section>
</main>
```

### Keyboard Navigation

**GARANTA** que elementos interativos sejam acessíveis via teclado:

```tsx
// ✅ CORRETO
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
  Ação
</button>
```

---

## 📁 Estrutura de Arquivos

### Organização por Feature

```
src/
├── app/                    # Next.js App Router
│   ├── admin/
│   │   └── page.tsx
│   └── api/
│       └── workspace/
│           └── route.ts
├── components/             # Componentes de UI
│   ├── admin/
│   │   └── ade/
│   └── ui/
├── containers/            # Containers (lógica de negócio)
│   └── admin/
│       └── AdminContainer.tsx
├── lib/                   # Utilitários e helpers
│   ├── db/               # MongoDB
│   ├── storage/          # localStorage/store
│   ├── types/            # TypeScript types
│   └── color.ts          # Utilitários de cor
└── types/                # Types compartilhados
```

### Agrupamento Lógico

**AGRUPAR** arquivos relacionados:

```
components/admin/ade/
├── AdminHeaderAde.tsx
├── AdminSidebarAde.tsx
├── AdminShellAde.tsx
└── DashboardConfigModal.tsx
```

### Barrels (index.ts)

**EVITE** barrels desnecessários - prefira imports diretos:

```tsx
// ✅ CORRETO - Import direto
import { AdminHeaderAde } from "@/components/admin/ade/AdminHeaderAde";
import { AdminSidebarAde } from "@/components/admin/ade/AdminSidebarAde";

// ❌ EVITAR - Barrel desnecessário
import { AdminHeaderAde, AdminSidebarAde } from "@/components/admin/ade";
```

---

## 🔐 Segurança

### Validação de Entrada

**SEMPRE** valide entrada do usuário:

```typescript
// ✅ CORRETO
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

### Isolamento por Usuário

**SEMPRE** filtre por `userId` em queries MongoDB:

```typescript
// ✅ CORRETO - Security isolation
const dashboardDoc = await db.findOne<DashboardDocument>("dashboards", {
  id: dashboardId,
  userId, // SEMPRE filtrar por userId
});
```

### Sanitização

**SEMPRE** sanitize dados antes de renderizar:

```typescript
// ✅ CORRETO
function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, "");
}
```

---

## 📊 Logging e Observabilidade

### Logs Estruturados

**SEMPRE** use logs estruturados com contexto:

```typescript
// ✅ CORRETO
console.log(
  "[MongoDB] ✅ Conexão estabelecida",
  JSON.stringify({
    attempt: attemptLabel,
    durationMs: Date.now() - startedAt,
  })
);

console.error("[Migration] ❌ Erro ao migrar workspace:", {
  sessionId: workspace.sessionId,
  userId,
  message: errorMessage,
  code: errorCode,
});
```

### Prefixos de Contexto

**USE** prefixos para identificar origem:

```typescript
// ✅ CORRETO
console.log("[AdminContainer] ✅ Tiles encontrados");
console.warn("[MongoDB Store] ⚠️ Circuit breaker aberto");
console.error("[API] /api/workspace/tiles - Erro ao criar tile");
```

---

## ✅ Checklist de Qualidade

Antes de finalizar qualquer tarefa, verifique:

- [ ] Todos os botões/links têm `cursor-pointer`
- [ ] Todos os elementos interativos têm estados `hover:`
- [ ] Transições aplicadas onde apropriado
- [ ] Estados `disabled:` tratados corretamente
- [ ] Componentes tipados com interfaces
- [ ] Validação de entrada implementada
- [ ] Error handling com try/catch
- [ ] Logs estruturados com contexto
- [ ] `"use client"` ou `"use server"` aplicado corretamente
- [ ] Hooks na ordem correta (Rules of Hooks)
- [ ] Early returns para simplificar lógica
- [ ] ARIA labels em elementos sem texto
- [ ] Fallbacks para operações críticas
- [ ] Filtros de segurança (`userId`) em queries MongoDB

---

## 📚 Referências

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [MongoDB Node.js Driver](https://www.mongodb.com/docs/drivers/node/current/)

---

**Última atualização:** 2025-01-14
