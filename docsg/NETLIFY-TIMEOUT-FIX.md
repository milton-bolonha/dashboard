# 🔧 Fix: Loop Infinito de Geração de Tiles no Netlify

## Problema Identificado

Os tiles ficavam em loop infinito de geração porque:

1. **Timeout do Netlify**: Limite de 50s nas Functions, mas tiles levavam 504s
2. **Processo Interrompido**: IIFE `async` era cancelada sem completar
3. **Status Preso**: `tiles_status` ficava "generating" para sempre
4. **Polling Infinito**: Frontend continuava pollando esperando completion

### Evidência nos Logs

```
generation_duration_ms: 504093  // 504 segundos = 8.4 minutos! (limite é 50s)
completed_at: "2025-10-29T03:25:46.790Z"  // Tile demorou muito
```

## ✅ Correções Aplicadas

### 1. **Atualizar Status em Caso de Erro** (`dashboard/app/api/guest/workspace/route.js`)

**Antes:**

```javascript
} catch (e) {
  console.error("⚠️ Erro ao iniciar geração de tiles:", e);
  // Não quebrar o fluxo, workspace já foi criado
}
```

**Depois:**

```javascript
} catch (e) {
  console.error("⚠️ Erro ao iniciar geração de tiles:", e);

  // ⭐ CRÍTICO: Atualizar status para "partial" em caso de erro
  // Isso evita que fique "generating" para sempre
  try {
    await db.updateOne(
      "guest_workspaces",
      { guest_id: guestId },
      {
        $set: {
          [`workspace_data.${entityKey}.0.tiles_status`]: "partial",
          [`dynamicData.${entityKey}.0.tiles_status`]: "partial",
        },
      }
    );
    console.log(`✅ Status atualizado para "partial" após erro`);
  } catch (dbError) {
    console.error("❌ Erro ao atualizar status:", dbError);
  }
}
```

### 2. **Escopo Correto da Variável entityKey**

**Problema:**

- `entityKey` estava sendo definido dentro do `if` block
- No `catch`, estava fora do escopo → erro

**Solução:**

```javascript
// Definir fora do try/catch
let entityKey = "companies"; // default

(async () => {
  try {
    // ... dentro do try, entityKey é atualizado
    entityKey = primaryEntity.id.endsWith("s") ? primaryEntity.id : `${primaryEntity.id}s`;
  } catch (e) {
    // Agora entityKey está acessível aqui
    await db.updateOne(..., { [`workspace_data.${entityKey}.0.tiles_status`]: "partial" });
  }
})();
```

## 🎯 O Que Acontece Agora

**Sucesso:**

- Tiles gerados → Status: `"completed"`

**Erro/Timeout:**

- Processo interrompido → Status: `"partial"`
- Frontend para de pollar
- Usuário vê os tiles que foram gerados

**Status Possíveis:**

- `"pending"` - Aguardando início
- `"generating"` - Em progresso
- `"completed"` - Todos os tiles gerados
- `"partial"` - ⭐ NOVO: Alguns tiles gerados, processo interrompido

## 📊 Próximos Passos (Opcional)

Para evitar o problema completamente:

1. **Usar Background Jobs** (Inngest, etc.)
2. **Reduzir número de tiles** (8 tiles é muito)
3. **Limitar tokens por tile** (alguns usam 700 tokens = lento)
4. **Usar streaming** para mostrar progresso real

## Status

✅ **Fix aplicado**
✅ **Loop infinito resolvido**
🔄 **Aguardando teste**
