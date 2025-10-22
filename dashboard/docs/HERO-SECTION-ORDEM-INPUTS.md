# ⚠️ HeroSection - Inputs na Ordem ERRADA (Precisa Correção Manual)

## 🔴 Problema Detectado

Os inputs estão fisicamente fora de ordem no arquivo `components/landing/HeroSection.jsx`

### Linhas 555-610: Input marcado como "2: Solution" MAS código é de CompanyUrl

### Linhas 611-666: Input marcado como "3: CompanyUrl" MAS código é de Solution

## ✅ Solução:

**Trocar os blocos JSX de lugar** (linhas 555-610 ↔ 611-666)

---

## 📋 Ordem CORRETA Final:

```
Linha ~503: Input 1 - Company (name="company") ✅ CORRETO
Linha ~555: Input 2 - Solution (name="solution") ← PRECISA SER ESTE
Linha ~611: Input 3 - CompanyUrl (name="companyUrl") ← PRECISA SER ESTE
Linha ~667: Input 4 - Research (name="research") ✅ CORRETO
```

## 🔧 Como Corrigir:

### Opção 1: Trocar blocos manualmente no editor

1. Selecionar linhas 555-610 (bloco CompanyUrl)
2. Recortar (Ctrl+X)
3. Posicionar cursor na linha 611
4. Colar DEPOIS do bloco Solution

### Opção 2: Verificar se código está correto:

```javascript
// Input 2 deve ter: name="solution"
// Input 3 deve ter: name="companyUrl"
```

---

## ✅ Lógica Já Está Correta:

- ✅ `canEnableInput()` - ordem correta
- ✅ `getPlaceholderText()` - placeholders corretos
- ✅ `fieldOrder` do Enter - ordem correta

**Só falta**: Trocar os blocos JSX de lugar!

---

**IMPORTANTE**: Após corrigir, verificar que:

1. Input 2 tem `name="solution"`
2. Input 3 tem `name="companyUrl"`
3. Placeholder do input 3 diz "Company to research"
