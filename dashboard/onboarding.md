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

### Etapa 1: Captura de Informações

```javascript
// Dados capturados no hero
const userContext = {
  role: "I am a sales rep at [empresa]",
  solution: "I am selling solutions for [área]",
  research: "I want to conduct research on [mercado/segmento]",
};
```

### Etapa 2: Escolha de Integração

- **Connect CRM**: Integração com Salesforce, HubSpot, etc.
- **Upload CSV**: Upload manual de dados de leads

### Etapa 3: Setup do Workspace

- Criação automática do workspace baseado nos dados capturados
- Configuração inicial de dashboards
- Tutorial interativo

### Etapa 4: Primeira Ação

- Adicionar primeira empresa
- Gerar primeiro email personalizado
- Ver primeiro dashboard funcionando

## 🛠️ Implementação Técnica

### Arquivos a Modificar/Criar

#### 1. `dashboard/app/page.js` (Landing Principal)

```javascript
// Substituir conteúdo atual por:
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <HeroSection />
      {/* Resto das seções comentadas por enquanto */}
    </div>
  );
}
```

#### 2. `dashboard/components/landing/HeroSection.jsx` (Novo)

```javascript
// Componente principal do hero com:
// - Título dinâmico com palavras rotativas
// - 3 inputs com placeholders específicos
// - 2 botões CTA
// - Lógica de captura de dados
```

#### 3. `dashboard/components/landing/OnboardingFlow.jsx` (Novo)

```javascript
// Fluxo de onboarding com:
// - Wizard de configuração
// - Integração com CRM
// - Upload de CSV
// - Setup de workspace
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
