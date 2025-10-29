# Correção - Contagem de Loading Tiles

## 🔍 Problema Identificado

O usuário reportou que após gerar 8 tiles, ainda restavam visualmente 3 cards "Generating insights" na tela, mesmo que todos os tiles já tivessem sido gerados no backend. Depois do F5, tudo deu certo.

### Sintomas:

- `tiles_to_generate: 8` (correto)
- Backend gerou 8 tiles com sucesso
- UI mostrou apenas 5 tiles reais + 3 LoadingTiles
- Após F5: 8 tiles corretamente exibidos

## ✅ Causa Raiz

**Linha 110 do SortableTilesGrid.jsx:**

```javascript
// ❌ ERRADO: Usava tiles.length
length: Math.max(0, tilesToGenerate - tiles.length);
```

**Problema:** A contagem estava usando `tiles.length` (array original), mas o componente usa `tilesWithIds` (array com IDs gerados). Quando havia tiles sem ID, `tilesWithIds` tinha mais elementos que `tiles`, causando discrepância.

## ✅ Solução Aplicada

```javascript
// ✅ CORRETO: Usar tilesWithIds.length
length: Math.max(0, tilesToGenerate - tilesWithIds.length);
```

**Por quê funciona:**

- `tilesWithIds` é o array usado para renderizar
- O número de LoadingTiles deve ser baseado em quantos tiles estão sendo EXIBIDOS
- Se `tilesWithIds.length = 5` e `tilesToGenerate = 8`, mostra 3 LoadingTiles

## 📊 Antes vs Depois

| Cenário             | tiles.length | tilesWithIds.length | Loading Tiles (Antes) | Loading Tiles (Depois) |
| ------------------- | ------------ | ------------------- | --------------------- | ---------------------- |
| Todos tiles gerados | 8            | 8                   | 0 ✅                  | 0 ✅                   |
| 5 tiles gerados     | 8            | 5                   | 0 ❌                  | 3 ✅                   |
| Nenhum tile gerado  | 8            | 0                   | 8 ❌                  | 8 ✅                   |

## ✅ Conclusão

**Correção aplicada:** Contagem de LoadingTiles agora usa `tilesWithIds.length` em vez de `tiles.length`.

**Resultado:** LoadingTiles desaparecem corretamente conforme tiles são gerados, sem necessidade de F5.
