# Bug Report: Onboarding Flow - Modal e Renderização de Tiles

## Data: 02/11/2025

## Resumo Executivo

Durante o desenvolvimento do fluxo de onboarding do guest user, múltiplos bugs críticos foram identificados relacionados à renderização de tiles, modal de loading, e deduplicação de dados. Este documento detalha os problemas encontrados, frustrações do usuário, soluções implementadas e o que ainda precisa ser corrigido.

---

## Frustrações do Usuário

### 1. Modal Reaparecendo Constantemente

**Problema**: O modal de loading aparecia a cada novo tile gerado, mesmo após o usuário fechá-lo manualmente.

**Impacto**:

- UX extremamente frustrante
- Usuário não conseguia interagir com a interface
- Modal bloqueava a tela repetidamente

**Descrição do Usuário**:

> "de novo, a cada novo prompt finalizado e card gerado, não sei se é rerenderização ou se é o q.. mas o modal fica aparecendo sendo iniciado a cada novo um desses"

### 2. Workflow Lento e Não Fluido

**Problema**: Tiles não apareciam sem dar F5 (refresh), deixando a experiência não fluida.

**Impacto**:

- Usuário precisava dar refresh manual para ver tiles gerados
- Percepção de sistema lento/pesado
- Confusão sobre o que estava acontecendo

**Descrição do Usuário**:

> "o workflow todo parece devagar, não fluido...e eu tenho q dar f5, fica uns carregando, outros carregados"

### 3. Duplicação de Tiles

**Problema**: Tiles duplicados apareciam, especialmente "CEO Sales Email" repetido múltiplas vezes.

**Impacto**:

- Interface confusa
- Dados incorretos exibidos
- Dificuldade em identificar qual tile era o correto

**Descrição do Usuário**:

> "os 3 ultimos cards dos 9 são ceo sales email, repetido 3 vezes só q apenas no titulo, ai o conteudo ta de prompts diferentes.. uau.. quanta coisa fora do lugar!!!! mas no fim tenho os 9 com dois ceo sales email iguals, são duplicatas desnecessárias."

### 4. Tiles Faltando ou com Conteúdo Incorreto

**Problema**: Primeiros tiles do template não apareciam, e alguns tiles tinham títulos de um prompt mas conteúdo de outro.

**Impacto**:

- Dados inconsistentes
- Experiência quebrada
- Confiança do usuário comprometida

**Descrição do Usuário**:

> "os primeiros tile cards q são os primeiros prompts não estão lá tipo what they do.. não lembro, mas talvez estivessem lá antes do refresh f5"

---

## Problemas Técnicos Identificados

### 1. Estado do Modal Não Persistia

**Causa Raiz**:

- `showLoadingModal` era resetado a cada atualização de progresso
- Não havia rastreamento se o usuário fechou o modal manualmente
- Múltiplos `useEffect` tentavam controlar o modal simultaneamente

**Localização**: `dashboard/containers/AdminDashboardContainer.jsx`

### 2. Renderização Não Reativa

**Causa Raiz**:

- Tiles salvos no workspace não atualizavam o estado do componente
- Falta de sincronização entre SSE events e estado local
- `setSelectedCompany` não era chamado após salvar tiles

**Localização**:

- `dashboard/containers/AdminDashboardContainer.jsx` (listener SSE)
- `dashboard/app/api/guest/tiles/route.js` (salvamento)

### 3. Deduplicação Inadequada

**Causa Raiz**:

- Múltiplas passadas de deduplicação com lógicas diferentes
- Tiles sendo adicionados ao invés de substituídos no banco
- Falta de verificação antes de salvar no workspace

**Localização**:

- `dashboard/containers/AdminDashboardContainer.jsx` (deduplicação frontend)
- `dashboard/app/api/guest/tiles/route.js` (deduplicação backend)

### 4. Variável Duplicada (Erro de Compilação)

**Causa Raiz**:

- `tilesByOrderIndex` declarada duas vezes no mesmo escopo
- Primeira deduplicação e segunda deduplicação usando mesmo nome

**Erro**:

```
Module parse failed: Identifier 'tilesByOrderIndex' has already been declared (851:22)
```

**Localização**: `dashboard/containers/AdminDashboardContainer.jsx` linha 989 e 1062

---

## Soluções Implementadas

### 1. Controle de Estado do Modal

**Solução**:

- ✅ Adicionado `userClosedModalRef` para rastrear se usuário fechou modal manualmente
- ✅ `shouldShowLoadingModalEarly` agora verifica `!userClosedModalRef.current`
- ✅ Modal só aparece na primeira vez (quando há `job_id` e não foi fechado)
- ✅ Quando todos os tiles são gerados, marca `userClosedModalRef.current = true` permanentemente

**Código**:

```javascript
// ⭐ BUG FIX: Rastrear se usuário fechou o modal manualmente
const userClosedModalRef = useRef(false);

const handleAcceptLoadingModal = async () => {
  setShowLoadingModal(false);
  userClosedModalRef.current = true; // Marcar que usuário fechou manualmente
};

const shouldShowLoadingModalEarly =
  jobIdFromUrl &&
  !userClosedModalRef.current && // ⭐ CRÍTICO: Nunca mostrar se usuário fechou
  showLoadingModal &&
  (generatingTiles || ...);
```

### 2. Renderização Reativa

**Solução**:

- ✅ `setSelectedCompany` é chamado imediatamente após receber tile via SSE
- ✅ Salvamento no workspace é assíncrono (não bloqueia renderização)
- ✅ Uso de `setTimeout` para não bloquear ciclo de renderização

**Código**:

```javascript
setSelectedCompany(updatedCompany);
selectedCompanyRef.current = updatedCompany;

// Salvamento assíncrono
setTimeout(() => {
  fetch(`/api/guest/tiles?guest_id=${guestIdFromUrl}`, {
    method: "POST",
    // ...
  });
}, 0);
```

### 3. Deduplicação Melhorada

**Solução**:

- ✅ Deduplicação inicial usando `Map` por `orderIndex`
- ✅ Deduplicação final após substituição/adição
- ✅ API verifica duplicatas antes de salvar e substitui ao invés de duplicar
- ✅ Validação de conteúdo antes de processar tiles

**Código**:

```javascript
// Deduplicação inicial
const tilesByOrderIndex = new Map();
currentTiles.forEach((t) => {
  const existing = tilesByOrderIndex.get(t.orderIndex);
  // Lógica de priorização...
});

// Deduplicação final
const finalTilesByOrderIndex = new Map();
updatedTiles.forEach((t) => {
  // Lógica de priorização...
});
```

### 4. Correção de Erro de Compilação

**Solução**:

- ✅ Renomeada segunda declaração de `tilesByOrderIndex` para `finalTilesByOrderIndex`
- ✅ Escopo claro para cada etapa de deduplicação

**Código**:

```javascript
// Primeira deduplicação
const tilesByOrderIndex = new Map();
// ...

// Segunda deduplicação (renomeada)
const finalTilesByOrderIndex = new Map();
// ...
```

---

## O Que Está Funcionando Corretamente

### ✅ Fluxo de Criação de Workspace

- Workspace é criado automaticamente quando job é iniciado
- Template é corretamente associado ao workspace
- `tiles_to_generate` é dinamicamente determinado pelo template

### ✅ SSE Events

- Conexão SSE estabelecida corretamente
- Eventos `job:status` e `job:result-completed` chegam corretamente
- Progresso é atualizado em tempo real

### ✅ Salvamento no Workspace

- Tiles são salvos no workspace após serem gerados
- Após F5, tiles persistem corretamente
- API de salvamento funciona corretamente

### ✅ Template e Tiles

- Template `template_1` tem 8 tiles corretamente definidos
- Títulos dos tiles são corretos (não mais "Insight 1, 2, 3...")
- Conteúdo é gerado corretamente pela IA

---

## Problemas Pendentes

### 🔴 Alto Prioridade

1. **Modal ainda pode reaparecer em casos edge**

   - **Status**: Investigando
   - **Próximos passos**: Adicionar mais verificações no `useEffect` que monitora progresso

2. **Tiles podem não aparecer imediatamente após salvamento**

   - **Status**: Parcialmente resolvido
   - **Próximos passos**: Melhorar sincronização entre salvamento e atualização de estado

3. **Duplicação pode ocorrer em race conditions**
   - **Status**: Melhorado mas não totalmente resolvido
   - **Próximos passos**: Implementar lock/debounce para salvamento

### 🟡 Média Prioridade

1. **Erro SSE Controller já fechado**

   - **Status**: Erro conhecido mas não crítico
   - **Próximos passos**: Adicionar verificação de estado antes de fechar controller

2. **Workflow ainda não totalmente fluido**
   - **Status**: Melhorado mas pode ser otimizado
   - **Próximos passos**: Revisar todas as operações assíncronas

---

## Arquitetura e Decisões Técnicas

### Decisão: `useRef` para Estado Persistente

**Motivo**: `useRef` não causa re-renderização, ideal para rastrear se usuário fechou modal.

**Trade-off**: Mais difícil de debugar, mas necessário para performance.

### Decisão: Deduplicação em Múltiplas Camadas

**Motivo**: Prevenir duplicação tanto no frontend quanto no backend.

**Trade-off**: Mais código, mas maior garantia de dados consistentes.

### Decisão: Salvamento Assíncrono

**Motivo**: Não bloquear renderização enquanto salva.

**Trade-off**: Possível race condition, mas UX melhor.

---

## Testes Recomendados

1. ✅ Testar fechar modal e verificar que não reaparece
2. ✅ Testar geração de 8 tiles e verificar que todos aparecem
3. ✅ Testar dar F5 após geração e verificar persistência
4. ✅ Testar múltiplas gerações rápidas e verificar sem duplicação
5. ⏳ Testar race conditions (múltiplos tiles chegando simultaneamente)
6. ⏳ Testar timeout de SSE e reconexão

---

## Conclusão

Muitos problemas foram identificados e corrigidos, mas alguns ainda persistem ou podem ocorrer em casos edge. O sistema está funcional mas precisa de mais testes e refinamentos para garantir uma experiência totalmente fluida.

**Status Geral**: 🟡 Funcional com melhorias necessárias

**Próximos Passos**:

1. Corrigir erro de compilação (variável duplicada) ✅
2. Testar extensivamente fluxo completo
3. Adicionar mais logs para debugging
4. Implementar métricas de performance
5. Revisar todos os casos edge

---

## Logs de Erro Relevantes

```
Module parse failed: Identifier 'tilesByOrderIndex' has already been declared (851:22)
```

```
[SSE Route] ⚠️ Erro ao fechar controller: TypeError: Invalid state: Controller is already closed
```

---

**Documento criado em**: 02/11/2025
**Última atualização**: 02/11/2025
