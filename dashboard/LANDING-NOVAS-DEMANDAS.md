# 🎨 Landing Page - Novas Demandas do Cliente

**Data:** 20/10/2025  
**Status:** A implementar

---

## 📋 O QUE O CLIENTE PEDIU

### 1. **➕ NOVO INPUT: Company URL** (CRÍTICO)

**Onde:** Abaixo do input "Company" (entre Company e Solution)

**Descrição:**

- URL da empresa DO VENDEDOR (empresa onde o user trabalha)
- Exemplo: Se o user trabalha na "Tesla", o URL seria "tesla.com"
- **Serve para:** Pesquisa contextual mais precisa sobre a empresa do vendedor

**Status atual:**

- ❌ Campo NÃO existe
- ⚠️ Cliente quer mudar de **opcional → OBRIGATÓRIO** para ter mais accuracy

**Texto do placeholder sugerido:**

```
"Enter your company's website (e.g., tesla.com)"
```

---

### 2. **🔄 Progressão de Inputs ATUALIZADA**

**Sequência NOVA (4 inputs):**

1. **Company** (sempre habilitado)
   - "I am a sales rep at"
   - Exemplo: "Tesla"
2. **Company URL** (habilita após Company válido) ⭐ NOVO

   - "Enter your company's website"
   - Exemplo: "tesla.com"
   - **Validação:** URL válida (regex)
   - **Obrigatório:** SIM (para accuracy)

3. **Solution** (habilita após Company URL válido)

   - "I am selling solutions for"
   - Exemplo: "Solar panels"

4. **Research Target** (habilita após Solution válido)
   - "I want to conduct research on"
   - Exemplo: "Residential market"

---

### 3. **🏷️ Nome do Produto**

**Atual:** "WebApp" (placeholder)

**Cliente disse:**

> "web app" will be changed to the actual name of the web app

**⚠️ PERGUNTA PARA CLIENTE:**

- **Qual é o nome real do produto?**
- Onde trocar:
  - Logo/brand no header
  - Título da página (meta tags)
  - Textos de marketing

---

### 4. **📸 Marketing Content**

**Cliente disse:**

> "likely to also add some screenshots or marketing content below these boxes"

**Onde:** Abaixo dos inputs e botões CTA

**Sugestões de conteúdo:**

- Screenshots do dashboard
- Vídeo demo
- Logos de clientes (social proof)
- Stats de resultado ("+4x meetings", "70% time saved")
- Features preview
- Testimonials curtos

**Status:**

- ⏳ Aguardando assets do cliente (screenshots, vídeos)

---

### 5. **✅ Botões CRM/CSV (já está correto!)**

**Cliente confirmou:**

> "clicking on either of these buttons however will take them to the sign up page"

**Status atual:** ✅ JÁ IMPLEMENTADO

- Ambos botões levam para sign up
- Salvam contexto em localStorage
- Funcionando perfeitamente

---

## 🎯 IMPLEMENTAÇÃO NECESSÁRIA

### **Mudança 1: Adicionar Input de URL** (PRIORIDADE ALTA)

**Arquivo:** `components/landing/HeroSection.jsx`

**Mudanças:**

1. **Adicionar estado para URL:**

```jsx
const [userContext, setUserContext] = useState({
  company: "",
  companyUrl: "", // ⭐ NOVO
  solution: "",
  research: "",
});
```

2. **Adicionar estado de validação:**

```jsx
const [inputStates, setInputStates] = useState({
  company: { focused: false, hasContent: false, isValid: false },
  companyUrl: { focused: false, hasContent: false, isValid: false }, // ⭐ NOVO
  solution: { focused: false, hasContent: false, isValid: false },
  research: { focused: false, hasContent: false, isValid: false },
});
```

3. **Validação de URL:**

```jsx
// Regex para validar URL básica
const isValidUrl = (url) => {
  const urlPattern =
    /^(https?:\/\/)?([\w\-]+\.)+[\w\-]+(\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/i;
  return urlPattern.test(url);
};

// Atualizar handleInputChange
const handleInputChange = (field, value) => {
  setUserContext((prev) => ({
    ...prev,
    [field]: value,
  }));

  const MIN_CHARS = 3;
  let isValid = value.trim().length >= MIN_CHARS;

  // ⭐ NOVO: Validação especial para URL
  if (field === "companyUrl") {
    isValid = isValidUrl(value.trim());
  }

  setInputStates((prev) => ({
    ...prev,
    [field]: {
      ...prev[field],
      hasContent: value.trim().length > 0,
      isValid: isValid,
    },
  }));
};
```

4. **Atualizar progressão:**

```jsx
const canEnableInput = (inputName) => {
  if (inputName === "company") return true;
  if (inputName === "companyUrl") return inputStates.company.isValid; // ⭐ NOVO
  if (inputName === "solution") return inputStates.companyUrl.isValid; // ⭐ MUDOU
  if (inputName === "research")
    return inputStates.solution.isValid && inputStates.companyUrl.isValid; // ⭐ MUDOU
  return false;
};
```

5. **Adicionar input no JSX (após Company, antes de Solution):**

```jsx
{
  /* Input 2: Company URL (habilita após company válido) */
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
    className={`w-full px-6 py-4 pr-16 text-lg border rounded-xl shadow-sm outline-none transition-all duration-300 ${
      canEnableInput("companyUrl") && !creating
        ? "bg-white border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        : "bg-gray-50 border-gray-200 cursor-not-allowed text-gray-400"
    }`}
  />
  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
    {renderInputIcon("companyUrl", false)}
  </div>
</div>;
```

6. **Atualizar validação:**

```jsx
const validateInputs = () => {
  if (!userContext.company.trim()) {
    return "Please tell us which company you represent";
  }
  if (!userContext.companyUrl.trim()) {
    return "Please enter your company's website";
  }
  if (!isValidUrl(userContext.companyUrl.trim())) {
    return "Please enter a valid URL (e.g., tesla.com)";
  }
  if (!userContext.solution.trim()) {
    return "Please describe what you're selling";
  }
  if (!userContext.research.trim()) {
    return "Please tell us what you want to research";
  }
  return null;
};
```

7. **Atualizar allInputsValid:**

```jsx
const allInputsValid =
  inputStates.company.isValid &&
  inputStates.companyUrl.isValid && // ⭐ NOVO
  inputStates.solution.isValid &&
  inputStates.research.isValid;
```

---

### **Mudança 2: Marketing Content** (após assets do cliente)

**Arquivo:** `components/landing/HeroSection.jsx` ou criar `components/landing/MarketingSection.jsx`

**Estrutura sugerida:**

```jsx
{
  /* Após os botões CTA */
}
<div className="mt-16 space-y-12">
  {/* Screenshots */}
  <div className="max-w-4xl mx-auto">
    <h3 className="text-2xl font-bold text-center mb-8">See it in action</h3>
    <Image
      src="/images/dashboard-screenshot.png"
      alt="Dashboard preview"
      width={800}
      height={500}
      className="rounded-xl shadow-2xl"
    />
  </div>

  {/* Social Proof */}
  <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
    <div className="text-center">
      <div className="text-4xl font-bold text-blue-600">+4x</div>
      <div className="text-gray-600">More Meetings</div>
    </div>
    <div className="text-center">
      <div className="text-4xl font-bold text-blue-600">-70%</div>
      <div className="text-gray-600">Time Saved</div>
    </div>
    <div className="text-center">
      <div className="text-4xl font-bold text-blue-600">+300%</div>
      <div className="text-gray-600">Response Rate</div>
    </div>
  </div>

  {/* Video Demo */}
  <div className="max-w-4xl mx-auto">
    <h3 className="text-2xl font-bold text-center mb-8">Watch 2-minute demo</h3>
    <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center">
      {/* Placeholder para vídeo */}
      <PlayCircle className="w-20 h-20 text-blue-600" />
    </div>
  </div>
</div>;
```

---

### **Mudança 3: Nome do Produto** (aguardando cliente)

**Arquivos a modificar:**

- `app/page.js` (Header - linha 88)
- `components/CreateWorkspaceScreen.jsx` (Header - linha 88)
- `app/layout.js` (meta tags)
- Título da página (SEO)

**Exemplo de mudança:**

```jsx
// ANTES:
<span className="text-xl font-semibold text-black">WebApp</span>

// DEPOIS:
<span className="text-xl font-semibold text-black">{PRODUCT_NAME}</span>
```

---

## 📂 Arquivos a Modificar

### Prioridade 1 (Input URL):

- `components/landing/HeroSection.jsx` (adicionar input + validação)
- `contexts/DashboardProviders.jsx` (salvar companyUrl no contexto)
- `schemas/index.js` (adicionar companyUrl ao onboarding schema)

### Prioridade 2 (Marketing content - após assets):

- `components/landing/HeroSection.jsx` ou criar `MarketingSection.jsx`
- `/public/images/` (adicionar screenshots/vídeos)

### Prioridade 3 (Nome do produto - após cliente informar):

- `app/page.js`
- `components/CreateWorkspaceScreen.jsx`
- `app/layout.js`

---

## 🎯 PERGUNTAS URGENTES PARA O CLIENTE

1. **Nome do produto:** Qual o nome real que substituirá "WebApp"?
2. **Marketing assets:** Tem screenshots, vídeos, logos para adicionar?
3. **URL validation:** Aceita URLs com e sem "https://"? (ex: "tesla.com" ou "https://tesla.com")
4. **Company URL:** Quer apenas domínio ou URL completa? (ex: "tesla.com" vs "https://www.tesla.com/solar")

---

## ✅ Checklist de Implementação

### Input de Company URL:

- [ ] Adicionar estado `companyUrl`
- [ ] Adicionar validação de URL (regex)
- [ ] Criar input no JSX (após Company)
- [ ] Atualizar progressão de inputs
- [ ] Atualizar `canEnableInput()`
- [ ] Atualizar `allInputsValid`
- [ ] Atualizar `validateInputs()`
- [ ] Adicionar aos ícones progressivos
- [ ] Salvar em localStorage
- [ ] Enviar para backend (onboarding context)
- [ ] Atualizar testes

### Marketing Content:

- [ ] Receber assets do cliente
- [ ] Criar seção abaixo dos CTAs
- [ ] Adicionar screenshots
- [ ] Adicionar vídeo demo
- [ ] Adicionar stats/social proof
- [ ] Testar responsividade

### Nome do Produto:

- [ ] Receber nome oficial do cliente
- [ ] Atualizar header (2 arquivos)
- [ ] Atualizar meta tags
- [ ] Atualizar título da página
- [ ] Atualizar favicon (se necessário)

---

## 💡 Sugestões Técnicas

### Validação de URL (opções):

**Opção 1: Regex básica (mais permissiva)**

```jsx
const isValidUrl = (url) => {
  // Aceita: tesla.com, www.tesla.com, https://tesla.com
  return /^(https?:\/\/)?([\w\-]+\.)+[\w\-]+/.test(url);
};
```

**Opção 2: Validação estrita (apenas domínios)**

```jsx
const isValidUrl = (url) => {
  // Remove protocolo se existir
  const cleanUrl = url.replace(/^https?:\/\//, "");
  // Verifica formato domínio.com
  return /^[\w\-]+(\.[\w\-]+)+$/.test(cleanUrl);
};
```

**Opção 3: Browser API (mais robusta)**

```jsx
const isValidUrl = (url) => {
  try {
    // Adiciona protocolo se não tiver
    const urlWithProtocol = url.startsWith("http") ? url : `https://${url}`;
    new URL(urlWithProtocol);
    return true;
  } catch {
    return false;
  }
};
```

**Recomendação:** Usar Opção 2 (validação de domínio) + normalizar para salvar sempre sem protocolo.

---

### Helper para normalizar URL:

```jsx
const normalizeUrl = (url) => {
  // Remove protocolo, www, barra final
  return url
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "")
    .toLowerCase();
};

// Exemplo:
normalizeUrl("https://www.Tesla.com/"); // → "tesla.com"
```

---

## 📊 Impacto no Schema

### WorkspaceSchema (adicionar):

```javascript
onboarding: {
  salesRepAt: String,           // "Tesla"
  companyUrl: String,            // ⭐ NOVO: "tesla.com"
  sellingSolutionsFor: String,   // "Solar panels"
  researchTarget: String,        // "Residential market"
  source: String,                // "landing"
  // ...
}
```

---

## 🚀 Ordem de Implementação Sugerida

### HOJE (20/10):

1. ✅ Adicionar input de Company URL (2-3h)
2. ✅ Testar fluxo completo com 4 inputs
3. ✅ Atualizar docs e testes

### Aguardando Cliente:

- ⏳ Nome do produto (trocar "WebApp")
- ⏳ Marketing assets (screenshots, vídeos)
- ⏳ Design pixel perfect (Figma)

### Quando receber assets:

- 📸 Adicionar marketing content (1-2h)
- 🏷️ Trocar nome do produto (30min)

---

**🎉 Com o input de Company URL, teremos 4 inputs progressivos e contexto mais rico para pesquisas AI!**

**Próximos passos:**

1. Confirmar validação de URL com cliente
2. Implementar novo input
3. Aguardar nome real do produto e assets de marketing
