# 🚀 Plano de Landing e Onboarding - AI Sales Dashboard

## 📋 Visão Geral

Este documento define o plano completo para implementar uma landing page e sistema de onboarding otimizado para conversão, baseado na estrutura existente do `dashboardapp-main 2` e integrado com o sistema de workspace do `dashboard` atual.

## 🎯 Objetivos

- **Conversão**: Transformar visitantes em usuários ativos
- **Onboarding**: Guiar novos usuários através do setup inicial
- **Retenção**: Garantir que usuários entendam e usem o valor do produto
- **Upsell**: Preparar terreno para upgrades de planos

## 🏗️ Estrutura da Landing Page

### Hero Section (Tela Principal)

```
┌─────────────────────────────────────────────────────────┐
│                    FUNDO CINZA CLARO                    │
│                                                         │
│  🔥 Smarter Research. Faster Outreach.                  │
│     [Duplicate/Triplicate/Multiple] Selling             │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ I am a sales rep at [_________________]         │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ I am selling solutions for [________________]   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ I want to conduct research on [_____________]   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  💡 Ask WebApp research your whole territory for you   │
│                                                         │
│  [🔗 Connect CRM]  [📊 Upload CSV]                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Características do Hero

- **Fundo**: Cinza claro (#f8f9fa)
- **Título**: Preto, fonte bold
- **Palavras dinâmicas**: "Duplicate", "Triplicate", "Multiple" (rotacionando)
- **3 Inputs**: Placeholders específicos para capturar contexto do usuário
- **2 CTAs**: Botões azuis com texto branco
- **Layout**: Centralizado, ocupando tela inteira

## 🔄 Fluxo de Onboarding

### Conceito Chave: Landing = Create Workspace

**A mesma interface serve para dois propósitos:**

1. **Landing pública** (não logado): Apresentar produto + capturar interesse
2. **Create workspace** (logado sem workspace): Criar primeiro workspace

**Componente único**: `HeroSection` reutilizado em ambos contextos

### Etapa 1: Captura de Informações (Mesmo Layout)

```javascript
// Dados capturados no hero/create workspace
const userContext = {
  company: "I am a sales rep at [empresa]", // → workspace name
  solution: "I am selling solutions for [área]", // → workspace context
  research: "I want to conduct research on [mercado/segmento]", // → AI prompt
};
```

**Diferença importante:**

- **Landing**: Inputs capturam interesse, direcionam para sign up
- **Create Workspace**: Inputs criam workspace real com nome baseado na empresa

### Workspace Naming Logic

```javascript
// Nome do workspace vem do campo "sales rep at"
const workspaceName = userContext.company; // Ex: "Acme Corp"

// Validação: usuário logado não pode criar workspace com nome duplicado
const validateWorkspaceName = async (name, userId) => {
  const existing = await checkUserWorkspaces(userId, name);
  if (existing) {
    return {
      valid: false,
      message: "Você já tem um workspace com essa empresa",
    };
  }
  return { valid: true };
};
```

### Etapa 2: Escolha de Integração

- **Connect CRM**: Integração com Salesforce, HubSpot, etc.
- **Upload CSV**: Upload manual de dados de leads

**Comportamento por contexto:**

- **Landing**: Redireciona para sign up primeiro
- **Dashboard**: Cria workspace imediatamente após clicar

### Etapa 3: Setup do Workspace (Automático)

```javascript
const createWorkspaceFromInputs = async (userContext, userId) => {
  // 1. Criar workspace com nome da empresa
  const workspace = await createWorkspace({
    name: userContext.company,
    userId: userId,
    metadata: {
      solution: userContext.solution,
      researchTarget: userContext.research,
    },
  });

  // 2. Criar dashboard inicial com contexto
  const dashboard = await createInitialDashboard(workspace.id, {
    company: userContext.company,
    solution: userContext.solution,
    research: userContext.research,
  });

  // 3. Trigger pipeline de IA
  await triggerResearchPipeline(workspace.id, {
    target: userContext.research,
    solution: userContext.solution,
  });

  return { workspace, dashboard };
};
```

### Etapa 4: Primeira Ação

- Dashboard criado automaticamente
- Pipeline de IA iniciado com base no research target
- Sugestões de empresas para adicionar

## 🛠️ Implementação Técnica

### Arquivos a Modificar/Criar

#### 1. `dashboard/app/page.js` (Landing Principal)

```javascript
// Landing pública - já implementado
export default function LandingPage() {
  const { isSignedIn, user } = useUser();

  return (
    <div className="bg-white min-h-screen">
      <Header isSignedIn={isSignedIn} />
      <main>
        <HeroSection isSignedIn={isSignedIn} user={user} />
      </main>
      <Footer />
    </div>
  );
}
```

#### 2. `dashboard/app/dashboard/page.jsx` (Dashboard Principal)

```javascript
// Dashboard detecta se usuário tem workspace
export default function DashboardPage() {
  const { user } = useUser();
  const workspaces = await getUserWorkspaces(user.id);

  // Se não tem workspace, mostra tela igual à landing
  if (!workspaces || workspaces.length === 0) {
    return <CreateWorkspaceScreen user={user} />;
  }

  // Se tem workspace, mostra dashboard normal
  return <DashboardLayout workspaces={workspaces} />;
}
```

#### 3. `dashboard/components/CreateWorkspaceScreen.jsx` (Novo)

```javascript
// Mesma interface da landing, mas com lógica de criação de workspace
export default function CreateWorkspaceScreen({ user }) {
  return (
    <div className="bg-white min-h-screen">
      <Header isSignedIn={true} user={user} />
      <main>
        <HeroSection
          isSignedIn={true}
          user={user}
          mode="create-workspace" // Modo especial
        />
      </main>
      <Footer />
    </div>
  );
}
```

#### 4. Modificar `HeroSection` para aceitar dois modos

```javascript
const HeroSection = ({ isSignedIn, user, mode = "landing" }) => {
  // mode pode ser: "landing" ou "create-workspace"

  const handleConnectCRM = async () => {
    if (mode === "landing" && !isSignedIn) {
      // Redireciona para sign up
      redirectToSignUp();
    } else if (mode === "create-workspace") {
      // Cria workspace real
      await createWorkspaceFromInputs(userContext, user.id);
    }
  };

  // Resto do componente igual
};
```

### Estrutura de Dados

#### Contexto do Usuário

```javascript
const userContext = {
  // Capturado no hero
  company: string,
  role: string,
  solution: string,
  researchTarget: string,

  // Definido no onboarding
  integrationType: 'crm' | 'csv',
  crmType?: 'salesforce' | 'hubspot' | 'pipedrive',
  csvData?: File,

  // Criado automaticamente
  workspaceId: string,
  dashboardId: string
};
```

## 🎨 Design System

### Cores

- **Fundo Hero**: `#f8f9fa` (cinza claro)
- **Título**: `#000000` (preto)
- **Inputs**: `#ffffff` (branco) com borda `#e5e7eb`
- **Botões CTA**: `#2563eb` (azul) com texto branco
- **Hover**: `#1d4ed8` (azul escuro)

### Tipografia

- **Título**: Inter, 48px, font-weight: 700
- **Subtítulo**: Inter, 24px, font-weight: 500
- **Inputs**: Inter, 16px, font-weight: 400
- **Botões**: Inter, 16px, font-weight: 600

### Espaçamento

- **Padding Hero**: 80px top/bottom, 40px left/right
- **Gap entre elementos**: 32px
- **Border radius**: 8px (inputs e botões)

## 🔧 Funcionalidades Específicas

### 1. Palavras Dinâmicas

```javascript
const dynamicWords = ["duplicate", "triplicate", "multiple", "quadruple"];
// Rotação a cada 2 segundos
```

### 2. Validação de Inputs

```javascript
// Validação em tempo real
const validateInputs = () => {
  return (
    userContext.company && userContext.solution && userContext.researchTarget
  );
};
```

### 3. Integração com CRM

```javascript
// Conectar com CRMs existentes
const connectCRM = async (crmType) => {
  // Lógica de autenticação OAuth
  // Sincronização de dados
  // Criação de workspace
};
```

### 4. Upload de CSV

```javascript
// Processar CSV e criar leads
const processCSV = async (file) => {
  // Parse do arquivo
  // Validação de dados
  // Criação de workspace com leads
};
```

## 📊 Métricas de Sucesso

### Conversão

- **Taxa de conversão Hero → CTA**: Meta 15%
- **Taxa de conversão CTA → Workspace**: Meta 80%
- **Tempo médio de setup**: Meta < 5 minutos

### Onboarding

- **Taxa de conclusão do onboarding**: Meta 70%
- **Primeira ação realizada**: Meta 90%
- **Retenção D1**: Meta 60%
- **Retenção D7**: Meta 40%

## 🚀 Fases de Implementação

### Fase 1: Hero Section (Semana 1)

- [ ] Criar componente HeroSection
- [ ] Implementar palavras dinâmicas
- [ ] Adicionar 3 inputs com placeholders
- [ ] Criar 2 botões CTA
- [ ] Implementar validação básica

### Fase 2: Onboarding Flow (Semana 2)

- [ ] Criar wizard de onboarding
- [ ] Implementar integração com CRM
- [ ] Adicionar upload de CSV
- [ ] Conectar com sistema de workspace existente

### Fase 3: Otimização (Semana 3)

- [ ] Implementar analytics
- [ ] Adicionar testes A/B
- [ ] Otimizar conversão
- [ ] Refinar UX baseado em dados

### Fase 4: Expansão (Semana 4)

- [ ] Adicionar mais seções da landing
- [ ] Implementar sistema de referência
- [ ] Criar dashboard de métricas
- [ ] Preparar para scale

## 🔗 Integração com Sistema Existente

### Workspace Creation

```javascript
// Integrar com sistema atual
const createWorkspaceFromOnboarding = async (userContext) => {
  // Usar função existente de criação de workspace
  // Adicionar dados específicos do onboarding
  // Configurar dashboards iniciais
};
```

### Dashboard Setup

```javascript
// Configurar dashboards baseado no contexto
const setupInitialDashboards = (workspaceId, userContext) => {
  // Criar dashboard personalizado
  // Adicionar tiles relevantes
  // Configurar templates de email
};
```

## 📱 Responsividade

### Mobile First

- Hero ocupa 100% da altura da tela
- Inputs empilhados verticalmente
- Botões em largura total
- Fonte adaptável

### Desktop

- Layout centralizado
- Inputs em linha
- Botões lado a lado
- Espaçamento otimizado

## 🎯 Próximos Passos

1. **Implementar Hero Section** conforme especificações
2. **Criar fluxo de onboarding** integrado com sistema atual
3. **Testar conversão** e otimizar baseado em dados
4. **Expandir landing** com seções adicionais
5. **Implementar analytics** para monitoramento contínuo

---

_Este plano foi criado baseado na análise do `dashboardapp-main 2` e integração com o sistema `dashboard` atual, focando em conversão e experiência do usuário._
