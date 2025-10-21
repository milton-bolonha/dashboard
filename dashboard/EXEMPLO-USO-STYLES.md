# 💡 Como Usar os Estilos do HeroSection

## 🎯 QUICK START

### Para usar o estilo TRANSPARENT (novo):

1. Abra `app/page.js`
2. Encontre a linha:

```jsx
<HeroSectionShared mode="landing" />
```

3. Adicione `styleMode="transparent"`:

```jsx
<HeroSectionShared mode="landing" styleMode="transparent" />
```

4. Salve e veja a mágica! ✨

---

## 📝 EXEMPLOS

### Estilo 1: DEFAULT (atual)

```jsx
// app/page.js
<HeroSectionShared mode="landing" styleMode="default" />
```

**Visual:**

- Inputs com borda e fundo
- Placeholder dentro do input
- Shadow ao focar
- Estilo clássico

---

### Estilo 2: TRANSPARENT (novo)

```jsx
// app/page.js
<HeroSectionShared mode="landing" styleMode="transparent" />
```

**Visual:**

- Inputs transparentes
- **Placeholder embaixo** (texto pequeno)
- Borda inferior apenas
- Estilo minimalista

---

## ⌨️ FUNCIONALIDADE ENTER

**Funciona em AMBOS os estilos!**

**Como testar:**

1. Preencha "Company": "Tesla" + **Enter** ↵
2. Auto-foca no "URL": "tesla.com" + **Enter** ↵
3. Auto-foca no "Solution": "Solar" + **Enter** ↵
4. Auto-foca no "Research": "Residential" + **Enter** ↵
5. **Submit automático!** 🚀

---

## 🎨 TROCAR DE ESTILO

### Landing Page (`app/page.js`):

**Linha ~49:**

```jsx
<HeroSectionShared mode="landing" styleMode="transparent" />
```

Ou:

```jsx
<HeroSectionShared mode="landing" styleMode="default" />
```

---

### Create Workspace (`components/CreateWorkspaceScreen.jsx`):

**Linha ~104:**

```jsx
<HeroSection
  mode="create-workspace"
  onCreateWorkspace={handleCreateWorkspace}
  styleMode="transparent" // ⭐ Adicionar aqui
/>
```

---

## 🔘 NOVO: Botão de Ajuda "?"

**Adicionado automaticamente!**

- Aparece ao lado dos botões Login/Signup
- Circular, branco, com "?"
- Hover effect

**Arquivos atualizados:**

- `app/page.js` (Header)
- `components/CreateWorkspaceScreen.jsx` (Header)

---

## 🧪 TESTAR AGORA

### Teste 1: Estilo Default

```bash
# 1. Certifique-se que está usando styleMode="default"
# 2. npm run dev
# 3. Acesse localhost:3000
# 4. Veja inputs com borda e fundo ✅
```

### Teste 2: Estilo Transparent

```bash
# 1. Mude para styleMode="transparent"
# 2. Reload página
# 3. Veja inputs transparentes ✅
# 4. Veja placeholder EMBAIXO ✅
```

### Teste 3: Enter Navigation

```bash
# 1. Digite "Tesla" no primeiro input
# 2. Pressione Enter ↵
# 3. Cursor vai pro próximo input automaticamente ✅
# 4. Continue com Enter em cada input ✅
# 5. No último, Enter faz submit! ✅
```

---

## 💻 CÓDIGO COMPLETO

### Estilo Transparent na Landing:

```jsx
// app/page.js
import HeroSectionShared from "@/components/landing/HeroSection";

export default function LandingPage() {
  return (
    <div className="fixed inset-0 bg-white flex flex-col">
      <Header isSignedIn={isSignedIn} />
      <main className="flex-1 overflow-auto">
        {/* ⭐ Usar estilo transparent */}
        <HeroSectionShared mode="landing" styleMode="transparent" />
      </main>
      <Footer />
    </div>
  );
}
```

---

### Estilo Default na Landing:

```jsx
// app/page.js
<HeroSectionShared mode="landing" styleMode="default" />
// ou simplesmente (default é o padrão):
<HeroSectionShared mode="landing" />
```

---

## 🎯 RECOMENDAÇÕES

### Quando usar DEFAULT:

- ✅ Formulários tradicionais
- ✅ Quando precisa de mais contraste visual
- ✅ Acessibilidade requer bordas claras
- ✅ Design clássico/corporativo

### Quando usar TRANSPARENT:

- ✅ Landing pages minimalistas
- ✅ Designs modernos/clean
- ✅ Quando quer destacar o conteúdo
- ✅ Estética "less is more"

---

## 🎨 CUSTOMIZAR MAIS

### Criar Estilo 3 (exemplo):

1. Adicione em `getInputClasses()`:

```jsx
if (styleMode === "floating") {
  return "w-full px-6 py-4 border-2 border-blue-500...";
}
```

2. Use:

```jsx
<HeroSection mode="landing" styleMode="floating" />
```

---

## 📊 CHECKLIST DE USO

Antes de fazer commit:

- [ ] Testei estilo default?
- [ ] Testei estilo transparent?
- [ ] Enter funciona em ambos?
- [ ] Botão "?" aparece no header?
- [ ] Placeholder aparece embaixo (transparent)?
- [ ] Mobile funciona bem?

---

## 🚀 DEPLOY

**Não esqueça:**

1. Escolher qual estilo usar em produção
2. Testar em mobile e desktop
3. Verificar acessibilidade
4. Confirmar que Enter funciona
5. Validar todas as interações

---

**🎉 Divirta-se com os novos estilos!**
