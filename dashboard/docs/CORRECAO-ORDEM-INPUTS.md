# 🔧 Correção: Ordem dos Inputs no HeroSection

## ❌ Ordem ATUAL (ERRADA):

```
1. Company     → "I am a sales rep at"
2. CompanyUrl  → "Enter your company's website" ← ERRADO!
3. Solution    → "I am selling solutions for" ← ERRADO!
4. Research    → "I want to conduct research on"
```

## ✅ Ordem CORRETA (conforme pedido):

```
1. Company     → "I am a sales rep at"
2. Solution    → "I am selling solutions for" ← 2º!
3. CompanyUrl  → "Company to research (website)" ← 3º!
4. Research    → "I want to conduct research on"
```

## 📝 Mudanças Necessárias:

### 1. Trocar blocos de JSX:

- Input Solution (linha 611) → mover para linha 555
- Input CompanyUrl (linha 555) → mover para linha 611

### 2. Atualizar placeholder:

```javascript
companyUrl: "Company to research (website, e.g., tesla.com)" ✅
```

### 3. Atualizar lógica de habilitação:

```javascript
company    → sempre habilitado (1º)
solution   → após company (2º)
companyUrl → após solution (3º) ← CORRIGIDO!
research   → após url e solution (4º)
```

### 4. Atualizar ordem do Enter:

```javascript
fieldOrder = ["company", "solution", "companyUrl", "research"] ✅
```

---

## ✅ Status das Correções:

- ✅ Placeholder corrigido
- ✅ canEnableInput() corrigido
- ✅ fieldOrder corrigido
- ⏳ JSX dos inputs precisa reordenar (manual)
