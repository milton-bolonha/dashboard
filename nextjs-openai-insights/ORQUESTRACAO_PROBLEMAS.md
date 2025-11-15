# 🚨 Análise de Problemas na Orquestração

## Problemas Identificados

### 1. **Race Conditions Críticas**

#### Problema: `useEffect` roda toda vez que `workspace` muda
```typescript
useEffect(() => {
  const company = getOrCreateCompanyFromWorkspace(workspace); // ⚠️ Pode sobrescrever dados
  setCurrentCompany(company);
  // ...
}, [workspace]); // ⚠️ Dispara sempre que workspace muda
```

**Cenário de falha:**
1. Usuário cria tile → `updateDashboard` salva no storage
2. `setCurrentDashboard` atualiza estado React
3. `mutate()` atualiza workspace (se chamado)
4. `useEffect` dispara → `getOrCreateCompanyFromWorkspace` recarrega do workspace
5. **Tile recém-criado pode ser perdido se workspace não tiver sido atualizado**

#### Problema: Múltiplas atualizações simultâneas
```typescript
// handleCreateCustomPrompt
updateDashboard(...); // Salva no storage
const reloadedCompany = getCompanyById(...); // Reload
setCurrentCompany(reloadedCompany); // Atualiza estado
setCurrentDashboard({ ...reloadedDashboard }); // Atualiza estado
setTimeout(() => { // ⚠️ Outra atualização depois
  setCurrentDashboard({ ...finalDashboard });
}, 100);
```

**Cenário de falha:**
- Se `useEffect` rodar entre essas atualizações, pode sobrescrever com dados antigos

### 2. **Sincronização Bidirecional Problemática**

```
Workspace (servidor) 
    ↕️ (getOrCreateCompanyFromWorkspace)
Company/Dashboards (localStorage)
    ↕️ (updateDashboard, getCompanyById)
React State (currentCompany, currentDashboard)
    ↕️ (setCurrentCompany, setCurrentDashboard)
UI (useMemo tiles)
```

**Problemas:**
- Qual é a fonte de verdade? Todas ao mesmo tempo?
- Mudanças podem se propagar em círculo
- Não há ordem garantida de sincronização

### 3. **Múltiplas Fontes de Verdade**

1. **Workspace** (cookies/servidor) - pode estar desatualizado
2. **Company/Dashboards** (localStorage) - pode estar desatualizado
3. **React State** (`currentCompany`, `currentDashboard`) - pode estar desatualizado
4. **UI** (`useMemo` tiles) - depende do estado React

**Problema:** Cada fonte pode ter dados diferentes em momentos diferentes

### 4. **Sincronização Automática Indesejada**

```typescript
// getOrCreateCompanyFromWorkspace sempre sincroniza workspace → company
if (isDefaultDashboard) {
  activeDashboard.tiles = workspaceTiles; // ⚠️ Sobrescreve tiles do dashboard
}
```

**Problema:** 
- Se workspace tiver tiles antigos, pode sobrescrever tiles novos do dashboard
- Não há verificação de timestamp ou versão

### 5. **Falta de Proteção Contra Concorrência**

- Não há locks ou flags para prevenir atualizações simultâneas
- Não há debouncing para evitar múltiplas sincronizações rápidas
- Não há verificação de "última atualização" antes de sobrescrever

## Cenários de Falha Reais

### Cenário 1: Tile Criado e Perdido
1. Usuário cria tile em blank dashboard
2. `updateDashboard` salva no storage ✅
3. `setCurrentDashboard` atualiza estado ✅
4. `mutate()` atualiza workspace (se chamado) ⚠️
5. `useEffect` dispara → `getOrCreateCompanyFromWorkspace` roda
6. Como não é "Default Dashboard", não sincroniza ✅
7. **MAS:** Se houver qualquer outro trigger que chame `getOrCreateCompanyFromWorkspace`, pode sobrescrever

### Cenário 2: Dashboard Default Sumindo
1. Usuário tem 2 dashboards: "Default" e "Blank"
2. Cria tile no "Blank"
3. `updateDashboard` salva ✅
4. `getOrCreateCompanyFromWorkspace` roda (por algum motivo)
5. Se `activeDashboard` não for encontrado corretamente, pode criar novo ou perder existente

### Cenário 3: Tile Substituído ao Invés de Adicionado
1. Usuário cria tile 1 → salva no storage ✅
2. Estado React atualiza → tile 1 aparece ✅
3. Usuário cria tile 2 rapidamente
4. `currentDashboard.tiles` ainda tem tile 1 (estado desatualizado)
5. Adiciona tile 2 ao array com tile 1 ✅
6. **MAS:** Se `useEffect` rodar antes do reload, pode sobrescrever com array antigo

## Soluções Necessárias

### 1. **Single Source of Truth**
- **localStorage (Company/Dashboards)** deve ser a fonte primária
- Workspace deve ser apenas para backward compatibility
- React State deve ser derivado do localStorage

### 2. **Sincronização Unidirecional**
- Workspace → Company: Apenas na inicialização ou quando explicitamente necessário
- Company → React State: Sempre que localStorage muda
- React State → UI: Sempre (via useMemo)

### 3. **Proteção Contra Race Conditions**
- Usar refs para rastrear se sincronização está em progresso
- Debounce sincronizações automáticas
- Verificar timestamps antes de sobrescrever

### 4. **Atualizações Atômicas**
- Sempre ler do storage antes de escrever
- Usar transações (read → modify → write)
- Não confiar em estado React para operações críticas

### 5. **Logs e Debugging**
- Adicionar timestamps em todas as operações
- Logar todas as mudanças de estado
- Rastrear origem de cada atualização

