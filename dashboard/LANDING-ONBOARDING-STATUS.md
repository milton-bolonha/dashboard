# 🎨 Landing Page & Onboarding - Status Completo

**Data:** 20/10/2025  
**Branch:** ai-sales-2  
**Cliente pediu:** Pixel perfect

---

## ✅ O QUE JÁ ESTÁ FUNCIONANDO

### 🎯 Fluxo de Onboarding (100% Funcional)

- ✅ Query params (/?rep=X&solution=Y&target=Z)
- ✅ localStorage para preservar contexto
- ✅ Auto-preenchimento dos inputs via URL
- ✅ Redirect para sign-up com `?onboarding=true`
- ✅ Auto-criação de workspace após login
- ✅ DeckEngine pipeline executando corretamente
- ✅ Limpeza automática de contexto após sucesso

### 🎨 UX Progressivo - Inputs (⚠️ PRECISA ATUALIZAR - Cliente pediu 4º input)

- ✅ Sistema de 4 estados de ícones:
  - 🔘 Cinza (desabilitado)
  - 🔵 Azul (ativo, sem conteúdo válido)
  - ✅ Verde checkmark (campo validado)
  - ➡️ Verde com seta CLICÁVEL (submit principal)
- ⚠️ Progressão automática **ATUAL:** (input 1 → 2 → 3) **NOVA:** (1 → 2 → 3 → 4)
- ✅ Validação de 3 caracteres mínimos (exceto URL - validação específica)
- ✅ Enable/disable automático
- ✅ Loading state durante envio
- ✅ Feedback visual instantâneo

### 🔄 Validação de Workspaces (100% Funcional)

- ✅ Detecção de nomes duplicados (case-insensitive)
- ✅ Modal `WorkspaceDuplicateModal` com 3 opções:
  - ✅ "Ir para esse workspace" (funcional)
  - 🚧 "Adicionar como company" (disabled - Week 3)
  - ✅ "Cancelar" (funcional)
- ✅ Validação client-side no `CreateWorkspaceScreen`
- ✅ Validação server-side em `/api/workspaces`

### 🗄️ Schemas & APIs (100% Funcional)

- ✅ WorkspaceSchema com campos:
  - `type` (cms | sales-assistant)
  - `onboarding` (contexto capturado)
  - `salesContext` (pipeline status)
  - `credits` (AI quota)
- ✅ POST /api/workspaces integrado com validação + pipeline

---

## 🚧 O QUE FALTA FAZER (Cliente pediu Pixel Perfect)

> **📋 IMPORTANTE:** Ver também `LANDING-NOVAS-DEMANDAS.md` para detalhes completos das novas demandas!

### 0. **➕ NOVO INPUT: Company URL** (PRIORIDADE MÁXIMA) ⭐

**Cliente pediu:** Adicionar 4º input OBRIGATÓRIO entre Company e Solution

**Sequência NOVA (4 inputs):**

1. Company ("I am a sales rep at")
2. **Company URL** ("Enter your company's website") ⭐ NOVO - OBRIGATÓRIO
3. Solution ("I am selling solutions for")
4. Research Target ("I want to conduct research on")

**Status:** ❌ NÃO IMPLEMENTADO

**O que fazer:**

- [ ] Adicionar input de URL entre Company e Solution
- [ ] Validação de URL (regex ou Browser API)
- [ ] Atualizar progressão (1→2→3→4 ao invés de 1→2→3)
- [ ] Atualizar `canEnableInput()`, `allInputsValid`, `validateInputs()`
- [ ] Adicionar aos ícones progressivos
- [ ] Salvar `companyUrl` em localStorage e backend
- [ ] Atualizar schema para incluir `companyUrl`
- [ ] Atualizar testes

**Detalhes completos:** Ver `LANDING-NOVAS-DEMANDAS.md`

---

### 1. **🎨 Design Pixel Perfect** (PRIORIDADE ALTA)

#### Logo WebApp (Trocar)

**Atual:**

```jsx
<div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
  <span className="text-white font-bold text-sm">W</span>
</div>
```

**Problema:** Logo placeholder com letra "W"  
**Solução:** Trocar por logo real do WebApp

**Arquivos disponíveis em `/public/images/`:**

- `logo-dark.png`
- `logo-light.png`

**Onde trocar:**

- [ ] `app/page.js` linha 73-78 (Header da landing)
- [ ] `components/CreateWorkspaceScreen.jsx` linha 84-88 (Header do create workspace)

---

#### Remover Animações (Palavra Rotativa)

**Atual:**

```jsx
const words = ["Duplicate", "Triplicate", "Multiple"];
// Rotaciona a cada 2000ms
<span className="text-black">{currentWord}</span>;
```

**Problema:** Cliente não quer animação de palavras  
**Solução:** Definir texto fixo

**Onde:**

- [ ] `components/landing/HeroSection.jsx` linhas 15-81
- [ ] Remover `useEffect` de rotação
- [ ] Definir palavra fixa no título

---

#### Inputs - Design Correto

**Cliente quer:** Design específico (precisa do Figma/design)

**Atual:**

```jsx
className =
  "w-full px-6 py-4 pr-16 text-lg border border-gray-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-blue-500";
```

**Perguntas para cliente:**

- Quais cores exatas? (hex)
- Qual tamanho de fonte?
- Qual border-radius?
- Qual espaçamento interno (padding)?
- Qual sombra (shadow)?
- Ícones à direita ou à esquerda?
- Tamanho dos ícones?

**Onde:**

- [ ] `components/landing/HeroSection.jsx` linhas 307-368 (inputs)

---

#### Outros Ajustes de Design

- [ ] **Espaçamentos entre seções** - Verificar padding/margin
- [ ] **Tamanhos de fonte** - Comparar com Figma
- [ ] **Line-height** dos textos
- [ ] **Cores exatas** (hex) vs atuais
- [ ] **Alinhamentos** precisos
- [ ] **Responsividade** em breakpoints específicos

---

#### 🏷️ Nome do Produto (Trocar "WebApp")

**Cliente disse:**

> "web app" will be changed to the actual name of the web app

**Onde trocar:**

- [ ] `app/page.js` (linha 88)
- [ ] `components/CreateWorkspaceScreen.jsx` (linha 88)
- [ ] `app/layout.js` (meta tags)

**Status:** ⏳ Aguardando nome real do cliente

---

#### 📸 Marketing Content

**Cliente disse:**

> "likely to also add some screenshots or marketing content below these boxes"

**O que adicionar:** (abaixo dos botões CTA)

- Screenshots do dashboard
- Vídeo demo
- Stats/social proof (+4x meetings, -70% time saved)
- Testimonials

**Status:** ⏳ Aguardando assets do cliente

---

### 2. **🐛 Bug Clerk Redirect** (CRÍTICO - Cliente reportou)

**Problema relatado no WEEK-1-20-22.md:**

```markdown
- [ ] **🐛 Bug Clerk Redirect**
  - Investigar redirect após signup/login
  - Corrigir fluxo de autenticação completo
```

**Sintomas possíveis:**

- User faz sign up mas não redireciona para dashboard
- Query param `?onboarding=true` se perde
- localStorage não é lido corretamente
- User fica em loop de redirect

**Onde investigar:**

1. [ ] `app/page.js` - Header com botões de sign up/login
2. [ ] `components/landing/HeroSection.jsx` linha 169 - Redirect manual
3. [ ] `contexts/DashboardProviders.jsx` - Auto-create hook
4. [ ] Configurações do Clerk (fora do código)

**Testes necessários:**

- [ ] Novo usuário: landing → sign up → dashboard (com onboarding)
- [ ] Usuário existente: landing → login → dashboard
- [ ] Logout → login novamente
- [ ] Redirect com query params preservados

---

### 3. **📋 Lista de Features & Condicionais - Componente HeroSection**

#### Features Implementadas:

1. ⚠️ **Inputs progressivos (PRECISA ATUALIZAR para 4)**

   **ATUAL (3 inputs):**

   - Company (sempre habilitado)
   - Solution (habilita após company válido)
   - Research (habilita após solution válido)

   **NOVO PEDIDO (4 inputs):**

   - Company (sempre habilitado)
   - **Company URL** (habilita após company válido) ⭐ ADICIONAR
   - Solution (habilita após URL válido)
   - Research (habilita após solution válido)

2. ✅ **2 Botões CTA (ambos funcionais)**

   - "Connect CRM" (linha 384-400)
   - "Upload CSV" (linha 402-418)
   - **Comportamento:** Ambos executam `handleAction()` → mesmo fluxo

3. ✅ **Validação progressiva**

   - Mínimo 3 caracteres por input
   - Checkmarks verdes nos campos validados
   - Seta verde clicável no último input

4. ✅ **Estados de Loading**
   - Spinner nos inputs durante `creating`
   - Spinner nos botões durante `creating`
   - Todos inputs disabled durante envio

#### Condicionais Principais:

**1. Modo de Operação:**

```jsx
mode = "landing" | "create-workspace";
```

- `landing`: Salva em localStorage → Redireciona para sign up
- `create-workspace`: Chama `onCreateWorkspace()` callback

**2. Usuário Logado (Landing Mode):**

```jsx
if (isSignedIn && user) {
  // Redireciona direto para dashboard
  localStorage.setItem("onboarding_context", ...)
  window.location.href = "/dashboard?onboarding=true"
} else {
  // Redireciona para sign up
  window.location.href = "/sign-up?redirect=/dashboard&onboarding=true"
}
```

**3. Habilitação de Inputs:**

**ATUAL (3 inputs):**

```jsx
canEnableInput("company") === true; // Sempre
canEnableInput("solution") === inputStates.company.isValid;
canEnableInput("research") === company.isValid && solution.isValid;
```

**NOVA (4 inputs) - A IMPLEMENTAR:**

```jsx
canEnableInput("company") === true; // Sempre
canEnableInput("companyUrl") === inputStates.company.isValid; // ⭐ NOVO
canEnableInput("solution") === inputStates.companyUrl.isValid; // ⭐ MUDOU
canEnableInput("research") === solution.isValid && companyUrl.isValid; // ⭐ MUDOU
```

**4. Ícones Progressivos:**

```jsx
// Input desabilitado
if (!isEnabled) → Bolinha cinza

// Input válido (não último)
if (isValid && !isLastInput) → Checkmark verde

// Último input válido + todos válidos
if (isValid && isLastInput && allInputsValid) → Seta verde CLICÁVEL

// Input com conteúdo mas não válido
if (focused || hasContent) → Bolinha azul
```

---

### 4. **📝 Sobre os 2 Botões (Connect CRM & Upload CSV)**

**Status Atual:**

- ✅ Ambos estão **implementados e funcionais**
- ✅ Ambos executam o mesmo fluxo (salvar contexto + redirect)
- ✅ Estão reportados no código (linhas 384-418)

**O que NÃO está feito (e não será feito agora):**

- 🚧 **Funcionalidade específica de Connect CRM** (Week 3)
- 🚧 **Funcionalidade específica de Upload CSV** (Week 3)

**Comportamento esperado para Week 1 (V0.1):**

- Ambos botões servem como **CTAs visuais** para completar onboarding
- Apenas salvam contexto e redirecionam para sign up
- Funcionalidades específicas virão em Week 3

**Está reportado?**

- ✅ Sim, nos docs:
  - `onboarding.md` menciona "Connect CRM" e "Upload CSV" como CTAs
  - `WEEK-1-TESTING.md` descreve fluxo com ambos botões
  - Código fonte tem comentários claros

---

## 🧪 O QUE JÁ ESTÁ TESTADO

### Cenários de Teste Documentados (WEEK-1-TESTING.md):

✅ **Cenário 1:** Landing → Sign Up → Auto-Create

- Preencher inputs → CTA → localStorage → sign up → auto-create workspace

✅ **Cenário 2:** Query Params → Pre-fill

- URL com params → inputs preenchidos automaticamente

✅ **Cenário 3:** Workspace Duplicado → Modal

- Client-side: Modal com 3 opções
- Server-side: Erro 400 com suggestion

✅ **Cenário 4:** CMS Workspace (Sem Onboarding)

- Workspace sem metadata → type: "cms" → sem pipeline

### O que NÃO foi testado ainda:

- ⏳ **Clerk redirect completo** (bug reportado)
- ⏳ **Design pixel perfect** (aguardando Figma/specs)

---

## 📊 RESUMO DO QUE FALTA

### Segunda, 20/10 (3-4h) - HOJE

**PRIORIDADE 0: Adicionar Company URL Input** ⭐ NOVO

1. [ ] **Adicionar 4º input obrigatório de Company URL**
   - [ ] Adicionar estado `companyUrl` ao componente
   - [ ] Criar validação de URL (regex)
   - [ ] Adicionar input no JSX (após Company, antes de Solution)
   - [ ] Atualizar progressão de inputs (1→2→3→4)
   - [ ] Atualizar `canEnableInput()`, `allInputsValid`, `validateInputs()`
   - [ ] Normalizar URL para salvar (remover https://, www, etc)
   - [ ] Atualizar schema do workspace (`onboarding.companyUrl`)
   - [ ] Atualizar `DashboardProviders.jsx` para salvar URL
   - [ ] Testar fluxo completo com 4 inputs

**PRIORIDADE 1: Design Pixel Perfect**

1. [ ] Trocar logo "W" por logo real (`logo-dark.png` ou `logo-light.png`)
2. [ ] Remover animação de palavra rotativa (definir texto fixo)
3. [ ] **Nome do produto:** Trocar "WebApp" por nome real (aguardando cliente)
4. [ ] Ajustar inputs conforme design do cliente:
   - [ ] **PRECISA:** Figma/mockup/specs do cliente
   - [ ] Cores exatas (hex)
   - [ ] Fontes e tamanhos
   - [ ] Espaçamentos
   - [ ] Border-radius
   - [ ] Sombras
5. [ ] Ajustar espaçamentos entre seções
6. [ ] Ajustar tamanhos de fonte e line-height
7. [ ] Verificar cores exatas (comparar com Figma)

**PRIORIDADE 2: Bug Clerk Redirect** 🐛

1. [ ] Reproduzir bug (testar fluxo completo)
2. [ ] Investigar redirect após signup
3. [ ] Verificar preservação de query params
4. [ ] Testar cenários: novo user, user existente, logout/login
5. [ ] Corrigir se necessário

---

## 🎯 PERGUNTAS PARA O CLIENTE

### Input de Company URL (URGENTE):

1. **Validação de URL:** Aceita com/sem "https://"? (ex: "tesla.com" ou "https://tesla.com")
2. **Formato:** Quer apenas domínio ou URL completa? (ex: "tesla.com" vs "https://www.tesla.com/solar")
3. **Normalização:** Salvar sempre limpo (sem https, sem www)?

### Nome do Produto (URGENTE):

1. **Qual é o nome real que substituirá "WebApp"?**
2. Tem logo final ou continua com os arquivos atuais?

### Design:

1. **Tem Figma/mockup disponível?** (essencial para pixel perfect)
2. **Logo:** Qual usar? `logo-dark.png` ou `logo-light.png`?
3. **Título:** Qual texto fixo no lugar da animação? (sugestão: "Multiple Selling")
4. **Inputs:** Quais as especificações exatas?
   - Cores (hex)
   - Fontes (family, size, weight)
   - Espaçamentos (padding)
   - Border (width, radius, color)
   - Shadow (spread, blur, color)
   - Ícones (tamanho, posição)

### Marketing Content:

1. **Screenshots:** Tem imagens do dashboard para adicionar?
2. **Vídeo demo:** Tem vídeo pronto?
3. **Stats:** Confirma números (+4x meetings, -70% time, +300% response)?

### Funcional:

1. **Bug Clerk:** Qual o comportamento esperado após sign up?
2. **Botões CTA:** "Connect CRM" e "Upload CSV" devem ter visual diferente?

---

## 📂 Arquivos que Precisam ser Modificados

### Para adicionar Company URL (PRIORIDADE MÁXIMA):

- `components/landing/HeroSection.jsx` (adicionar input + validação + progressão)
- `contexts/DashboardProviders.jsx` (salvar `companyUrl` no onboarding context)
- `schemas/index.js` (adicionar `companyUrl` ao WorkspaceSchema.onboarding)

### Para trocar logo:

- `app/page.js` (linha 73-78)
- `components/CreateWorkspaceScreen.jsx` (linha 84-88)

### Para remover animação:

- `components/landing/HeroSection.jsx` (linhas 15-81)

### Para trocar nome do produto:

- `app/page.js` (linha 88)
- `components/CreateWorkspaceScreen.jsx` (linha 88)
- `app/layout.js` (meta tags)

### Para adicionar marketing content:

- `components/landing/HeroSection.jsx` (adicionar seção após CTAs)
- Ou criar: `components/landing/MarketingSection.jsx` (novo componente)

### Para ajustar inputs (pixel perfect):

- `components/landing/HeroSection.jsx` (linhas 307-368)

### Para investigar bug Clerk:

- `app/page.js` (Header com Clerk buttons)
- `components/landing/HeroSection.jsx` (linha 169 - redirect)
- `contexts/DashboardProviders.jsx` (auto-create hook)

---

## 💡 Notas Técnicas

### Validação de URL (Company URL):

**Opção recomendada:**

```jsx
// Validação permissiva + normalização
const isValidUrl = (url) => {
  // Aceita: tesla.com, www.tesla.com, https://tesla.com
  return /^(https?:\/\/)?([\w\-]+\.)+[\w\-]+/.test(url);
};

const normalizeUrl = (url) => {
  // Salva sempre limpo: "tesla.com"
  return url
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "")
    .toLowerCase();
};
```

### Logo Disponível:

```jsx
// Substituir em 2 arquivos:
<div className="w-8 h-8 bg-blue-600...">
  <span>W</span>
</div>

// Por:
<Image
  src="/images/logo-dark.png"
  alt="WebApp"
  width={32}
  height={32}
/>
```

### Animação para Remover:

```jsx
// REMOVER:
const words = ["Duplicate", "Triplicate", "Multiple"];
const [currentWord, setCurrentWord] = useState(words[0]);
useEffect(() => { ... }, []);

// SUBSTITUIR POR:
<h1>Smarter Research. Faster Outreach. Multiple Selling</h1>
```

### Estrutura do 4º Input (Company URL):

```jsx
{
  /* Input 2: Company URL (após Company, antes de Solution) */
}
<div className="max-w-2xl mx-auto relative">
  <input
    type="url"
    placeholder="Enter your company's website (e.g., tesla.com)"
    value={userContext.companyUrl}
    onChange={(e) => handleInputChange("companyUrl", e.target.value)}
    onFocus={() => handleInputFocus("companyUrl")}
    onBlur={() => handleInputBlur("companyUrl")}
    disabled={!canEnableInput("companyUrl") || creating}
    className={`w-full px-6 py-4 pr-16 text-lg border rounded-xl shadow-sm...`}
  />
  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
    {renderInputIcon("companyUrl", false)}
  </div>
</div>;
```

---

## ✅ Checklist Final (Week 1 V0.1)

### Landing Page:

- [ ] **Input de Company URL adicionado** ⭐ NOVO CRÍTICO
- [ ] **Nome do produto trocado** (substituir "WebApp")
- [ ] Logo correto
- [ ] Sem animações (texto fixo)
- [ ] Inputs pixel perfect
- [ ] Espaçamentos corretos
- [ ] Fontes e cores exatas
- [ ] Responsividade OK
- [ ] Marketing content (screenshots, vídeo, stats) - opcional/após assets

### Onboarding Flow:

- ✅ Query params funcionando
- ✅ localStorage funcionando
- ✅ Auto-create funcionando
- ✅ Pipeline funcionando
- [ ] **Clerk redirect SEM bugs** 🐛

### Componentes:

- ✅ HeroSection com UX progressivo
- ✅ CreateWorkspaceScreen
- ✅ WorkspaceDuplicateModal
- ✅ DashboardProviders com auto-create

### Documentação:

- ✅ onboarding.md
- ✅ WEEK-1-TESTING.md
- ✅ UX-PROGRESSIVE-INPUTS.md
- ✅ **LANDING-ONBOARDING-STATUS.md** (este arquivo)
- ✅ **LANDING-NOVAS-DEMANDAS.md** (novas demandas do cliente - 20/10)

---

## 🚀 PRÓXIMOS PASSOS IMEDIATOS

### 1. **Adicionar Company URL** (pode fazer agora - 2-3h)

- Não depende do cliente
- Implementação técnica clara
- Ver `LANDING-NOVAS-DEMANDAS.md` para código completo

### 2. **Aguardar Cliente** (antes de prosseguir)

- Nome real do produto
- Specs de design (Figma)
- Marketing assets (screenshots, vídeos)

### 3. **Corrigir Bug Clerk** (testar e investigar)

- Reproduzir o problema
- Verificar fluxo de redirect
- Garantir query params preservados

---

**🎉 Com o 4º input (Company URL), teremos contexto mais rico para pesquisas AI e maior accuracy!**

**Próximos passos:**

1. Implementar Company URL input (HOJE)
2. Aguardar nome do produto e specs do cliente
3. Corrigir bug Clerk (se confirmado)
