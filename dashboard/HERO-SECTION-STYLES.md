# 🎨 HeroSection - Sistema de Estilos

**Data:** 20/10/2025  
**Status:** 100% Implementado

---

## 📋 RESUMO DAS MUDANÇAS

### 1. **Header - Botões Atualizados** ✅

**Mudanças:**

- ✅ Botões mais arredondados (`rounded-full` ao invés de `rounded-lg`)
- ✅ Menor altura (`py-1.5` ao invés de `py-2`)
- ✅ Novo botão circular "?" adicionado

**Arquivos:**

- `app/page.js` (Header da landing)
- `components/CreateWorkspaceScreen.jsx` (Header do create workspace)

---

### 2. **Sistema de Estilos no HeroSection** ✅

**Nova prop `styleMode`:**

- `"default"` - Estilo original (inputs com borda e fundo)
- `"transparent"` - Estilo novo (inputs transparentes com placeholder embaixo)

---

## 🎨 ESTILO 1: DEFAULT (Padrão)

### Como usar:

```jsx
<HeroSection mode="landing" styleMode="default" />
// ou simplesmente (default é o padrão)
<HeroSection mode="landing" />
```

### Características:

- ✅ Inputs com borda arredondada (`rounded-xl`)
- ✅ Fundo branco nos inputs habilitados
- ✅ Fundo cinza nos inputs desabilitados
- ✅ Placeholder dentro do input (desaparece ao digitar)
- ✅ Shadow e focus ring azul
- ✅ Ícones centralizados verticalmente

**Visual:**

```
┌─────────────────────────────────────┐
│  I am a sales rep at               🔘│
└─────────────────────────────────────┘
     Input com borda e fundo
```

---

## 🎨 ESTILO 2: TRANSPARENT

### Como usar:

```jsx
<HeroSection mode="landing" styleMode="transparent" />
```

### Características:

- ✅ Inputs transparentes (sem fundo)
- ✅ Apenas borda inferior (`border-b-2`)
- ✅ **Placeholder no rodapé** (texto pequeno embaixo)
- ✅ Placeholder só aparece quando input está habilitado
- ✅ Placeholder some quando form é enviado (`creating`)
- ✅ Texto preto quando preenchido
- ✅ Texto cinza quando vazio
- ✅ Ícones posicionados no topo

**Visual:**

```
  Tesla                                  ✅
  ──────────────────────────────────────
  I am a sales rep at
     ↑
  Placeholder no rodapé (pequeno)
```

**Fluxo:**

1. Input desabilitado → Sem placeholder visível
2. Input habilitado → Placeholder aparece embaixo
3. Usuário digita → Texto fica preto, placeholder continua
4. Submit → Placeholder some (creating = true)

---

## ⌨️ FUNCIONALIDADE ENTER

### Como funciona:

**Pressionar Enter:**

1. Se tem próximo input habilitado → Foca no próximo
2. Se é o último input e todos válidos → Faz submit

**Sequência:**

1. **Company** + Enter → Foca **URL**
2. **URL** + Enter → Foca **Solution**
3. **Solution** + Enter → Foca **Research**
4. **Research** + Enter (se todos válidos) → **Submit!** 🚀

**Código:**

```jsx
onKeyDown={(e) => handleKeyDown("company", e)}
```

**Lógica:**

- Previne comportamento padrão do Enter
- Usa `name` attribute para identificar próximo input
- Só foca se próximo input estiver habilitado (`canEnableInput`)
- No último input, faz submit automático

---

## 🛠️ IMPLEMENTAÇÃO TÉCNICA

### Props do HeroSection:

```jsx
/**
 * @param {string} mode - "landing" ou "create-workspace"
 * @param {Function} onCreateWorkspace - Callback (modo create-workspace)
 * @param {string} styleMode - "default" ou "transparent"
 */
<HeroSection
  mode="landing"
  styleMode="transparent" // ⭐ NOVO
/>
```

### Helpers Criados:

**1. `getInputClasses(inputName)`**

```jsx
// Retorna classes CSS baseado no styleMode
if (styleMode === "transparent") {
  // Estilo transparente com borda inferior
} else {
  // Estilo padrão com borda e fundo
}
```

**2. `getPlaceholderText(inputName)`**

```jsx
// Retorna texto do placeholder para cada campo
const placeholders = {
  company: "I am a sales rep at",
  companyUrl: "Enter your company's website (e.g., tesla.com)",
  solution: "I am selling solutions for",
  research: "I want to conduct research on",
};
```

**3. `handleKeyDown(field, e)`**

```jsx
// Gerencia Enter para próximo input
if (e.key === "Enter") {
  // Foca próximo ou faz submit
}
```

---

## 📂 ESTRUTURA DOS INPUTS (Transparent)

```jsx
<div className="max-w-2xl mx-auto">
  {/* Input Container */}
  <div className="relative">
    <input
      type="text"
      name="company"
      placeholder={styleMode === "default" ? "..." : ""} // Sem placeholder se transparent
      className={getInputClasses("company")} // Classes dinâmicas
      onKeyDown={(e) => handleKeyDown("company", e)} // Enter handler
    />
    <div className="absolute right-4 top-3">
      {" "}
      {/* Ícone no topo */}
      {renderInputIcon("company", false)}
    </div>
  </div>

  {/* Placeholder no Rodapé (apenas transparent) */}
  {styleMode === "transparent" && !creating && (
    <div className="mt-2 px-6 text-sm text-gray-400">I am a sales rep at</div>
  )}
</div>
```

---

## 🧪 COMO TESTAR

### Testar Estilo Default:

1. Acesse: `http://localhost:3000/`
2. Inputs aparecem com borda e fundo
3. Placeholder dentro do input
4. Enter vai para próximo input ✅
5. Último input + Enter = Submit ✅

### Testar Estilo Transparent:

1. Modificar `app/page.js`:

```jsx
<HeroSectionShared mode="landing" styleMode="transparent" />
```

2. Reload página
3. Inputs transparentes com borda inferior
4. **Placeholder aparece embaixo** (texto pequeno)
5. Digite "Tesla" → Texto preto, placeholder continua embaixo
6. Enter vai para próximo input ✅
7. Submit → Placeholder some ✅

---

## 🎯 USO RECOMENDADO

### Landing Page Principal:

```jsx
// Estilo padrão (atual)
<HeroSection mode="landing" styleMode="default" />
```

### Variante Minimalista:

```jsx
// Estilo transparente (clean)
<HeroSection mode="landing" styleMode="transparent" />
```

### Create Workspace Screen:

```jsx
// Pode usar qualquer estilo
<HeroSection
  mode="create-workspace"
  styleMode="transparent" // Ou "default"
  onCreateWorkspace={handleCreate}
/>
```

---

## 🎨 CSS CLASSES (Transparent)

### Input habilitado com conteúdo:

```css
border-0 border-b-2 border-b-black
bg-transparent
text-black
```

### Input habilitado vazio:

```css
border-0 border-b-2 border-b-gray-300
bg-transparent
text-gray-400
```

### Input desabilitado:

```css
border-0 border-b-2 border-b-gray-200
bg-transparent
text-gray-300
cursor-not-allowed
```

### Placeholder rodapé:

```css
mt-2 px-6
text-sm text-gray-400
transition-opacity duration-300
```

---

## ✅ CHECKLIST

### Header:

- [x] Botões com `rounded-full`
- [x] Padding vertical reduzido (`py-1.5`)
- [x] Botão "?" circular adicionado
- [x] Espaçamento ajustado (`space-x-3`)

### Sistema de Estilos:

- [x] Prop `styleMode` adicionada
- [x] Helper `getInputClasses()` criado
- [x] Helper `getPlaceholderText()` criado
- [x] Estilo "default" funcionando
- [x] Estilo "transparent" funcionando

### Estilo Transparent:

- [x] Inputs transparentes (sem fundo)
- [x] Borda inferior apenas
- [x] Placeholder no rodapé (texto pequeno)
- [x] Placeholder some quando `creating`
- [x] Placeholder só aparece quando habilitado
- [x] Ícones posicionados no topo

### Enter Handler:

- [x] Função `handleKeyDown()` criada
- [x] Enter vai para próximo input
- [x] Enter no último = submit (se válido)
- [x] Atributo `name` em todos inputs
- [x] Sequência: company → URL → solution → research

---

## 📊 COMPARAÇÃO

| Feature          | Default               | Transparent           |
| ---------------- | --------------------- | --------------------- |
| Borda            | `rounded-xl` completa | `border-b-2` inferior |
| Fundo            | Branco/Cinza          | Transparente          |
| Placeholder      | Dentro do input       | Embaixo do input      |
| Placeholder size | Normal                | Pequeno (`text-sm`)   |
| Ícone posição    | Centro vertical       | Topo (`top-3`)        |
| Focus ring       | Azul (`ring-2`)       | Sem ring              |
| Shadow           | Sim                   | Não                   |
| Clean/Minimal    | ★★★☆☆                 | ★★★★★                 |

---

## 🚀 PRÓXIMOS PASSOS (Opcional)

### Melhorias Futuras:

- [ ] Adicionar transição suave ao trocar styleMode
- [ ] Criar terceiro estilo (ex: "floating" com labels)
- [ ] Adicionar animação no placeholder (fade/slide)
- [ ] Tornar styleMode selecionável via query param (`?style=transparent`)
- [ ] Adicionar preview dos dois estilos lado a lado

### Animações Sugeridas:

```jsx
// Placeholder fade in/out
className="transition-opacity duration-300"
style={{ opacity: creating ? 0 : 1 }}

// Input transform ao focar
className="transition-transform duration-200"
style={{ transform: focused ? 'scale(1.02)' : 'scale(1)' }}
```

---

## 📝 NOTAS TÉCNICAS

### Por que placeholder no rodapé?

- Melhor acessibilidade (sempre visível)
- Mais espaço para conteúdo
- Visual mais limpo
- Estilo moderno/minimalista

### Por que Enter para próximo?

- Melhor UX (fluxo rápido)
- Reduz uso do mouse
- Familiar (como formulários web)
- Acelera preenchimento

### Por que atributo `name`?

- Seletor confiável (`querySelector`)
- Semanticamente correto
- Facilita debugging
- Compatível com forms HTML

---

## 🎉 CONCLUSÃO

Sistema de estilos implementado com sucesso!

**2 Estilos Disponíveis:**

- ✅ **Default** - Clássico, com bordas e fundos
- ✅ **Transparent** - Minimalista, com placeholder embaixo

**+ Funcionalidade Enter** - Navegação rápida entre inputs! ⌨️

**+ Botões Header** - Arredondados com botão "?" de ajuda! 🔘

---

**Implementado por:** goshDev  
**Data:** 20/10/2025  
**Status:** ✅ 100% Completo
