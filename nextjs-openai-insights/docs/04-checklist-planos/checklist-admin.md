# 📋 Checklist Admin - O que falta, testes e próximos passos

> 📊 **Status atual**: Veja [`../01-arquitetura/status-implementacao.md`](../01-arquitetura/status-implementacao.md) para o status real das implementações.

## ✅ O que já está funcionando

- ✅ Dashboard switcher (trocar entre dashboards)
- ✅ Criar blank dashboard
- ✅ Deletar dashboard
- ✅ Background color isolado por dashboard
- ✅ Notes isolados por dashboard
- ✅ Contacts isolados por dashboard
- ✅ Tiles isolados por dashboard
- ✅ Empty states diferenciados (generating vs empty)
- ✅ Add Prompt em blank dashboard
- ✅ Ordenação de tiles (novos aparecem primeiro)
- ✅ Drag & drop de tiles
- ✅ Dashboard count badge no sidebar
- ✅ Template editing (editable templates)
- ✅ Rate limiting server-side
- ✅ AI response language enforcement (English)
- ✅ contrastMode persistente (tokens salvos no dashboard)
- ✅ Dropdowns fecham ao clicar fora

## ❌ O que está FALTANDO

### 🔴 ALTA PRIORIDADE

#### 1. ~~**contrastMode Persistente**~~ ✅ CONCLUÍDO

- **Status**: ✅ Implementado
- **Onde**: `AdminContainer.tsx` e `AdminSidebarAde.tsx`
- **Solução**: Tokens de aparência são calculados uma vez e salvos no dashboard
- **Resultado**: Contraste persiste após F5, valores salvos são reutilizados

#### 2. ~~**Fechar Dropdowns ao Clicar Fora**~~ ✅ CONCLUÍDO

- **Status**: ✅ Implementado e melhorado
- **Onde**: `AdminHeaderAde.tsx`
- **Solução**: `useEffect` com listener usando capture phase
- **Resultado**: Dropdowns fecham corretamente ao clicar fora

#### 3. **Files & Assets Panel**

- **Status**: Apenas placeholder (`FilesPlaceholderAde`)
- **Ação**: Implementar funcionalidade real de upload/visualização de arquivos

#### 4. **Profile e Settings no Sidebar**

- **Status**: Botões existem mas não têm funcionalidade
- **Ação**: Implementar modais/páginas para Profile e Settings (após Clerk)

### 🟡 MÉDIA PRIORIDADE (Não será feito)

#### ~~Breadcrumb no Header~~ ❌ REMOVIDO

- **Status**: Não será implementado

#### ~~Dark Mode Toggle~~ ❌ REMOVIDO

- **Status**: Não será implementado

#### 5. **Botões Login/SignUp não funcionam**

- **Status**: UI pronta mas Clerk não integrado
- **Ação**: Integrar autenticação Clerk (ver `plano-finalizar-14-11.md` FASE 2)

### 🟢 BAIXA PRIORIDADE (Não será feito agora)

#### Export/Share Dashboard

- **Status**: Não existe
- **Ação**: Permitir exportar/compartilhar dashboard (futuro)

#### Dashboard Templates Preview

- **Status**: Templates não têm preview visual
- **Ação**: Mostrar preview dos tiles antes de aplicar template (futuro)

## 🧪 Próximos Testes

### Teste 1: contrastMode Persistência

```
1. Criar novo dashboard
2. Trocar cor de fundo para uma escura
3. Verificar se badge do dashboard count tem bom contraste
4. Dar F5
5. Verificar se contraste do badge foi mantido
6. Trocar para outro dashboard e voltar
7. Verificar se contraste foi mantido
```

**Resultado esperado**: Badge sempre tem contraste adequado, mesmo após F5

### Teste 2: Isolamento de Dados

```
1. Criar Dashboard A com tiles/notes/contacts
2. Criar Dashboard B vazio
3. Adicionar tile em Dashboard B
4. Verificar que Dashboard A não foi afetado
5. Adicionar note em Dashboard B
6. Verificar que Dashboard A não foi afetado
7. Adicionar contact em Dashboard B
8. Verificar que Dashboard A não foi afetado
```

**Resultado esperado**: Cada dashboard mantém seus dados isolados

### Teste 3: Background Color Isolado

```
1. Criar Dashboard A
2. Mudar cor de fundo para vermelho
3. Criar Dashboard B (blank)
4. Verificar que cor padrão foi aplicada (não vermelho)
5. Mudar Dashboard B para azul
6. Voltar para Dashboard A
7. Verificar que vermelho foi mantido
```

**Resultado esperado**: Cada dashboard mantém sua cor isolada

### Teste 4: Empty States

```
1. Criar blank dashboard novo
2. Verificar que mostra "Add Prompt" (não "Generating insights...")
3. Criar workspace novo na home
4. Verificar que mostra "Generating insights..." enquanto gera
5. Após gerar, verificar que tiles aparecem
```

**Resultado esperado**: Estados vazios corretos em cada situação

### Teste 5: Ordenação de Tiles

```
1. Criar tile 1
2. Criar tile 2
3. Criar tile 3
4. Verificar que ordem é: 3, 2, 1 (mais recente primeiro)
5. Fazer drag & drop para reordenar
6. Dar F5
7. Verificar que ordem foi mantida
```

**Resultado esperado**: Novos tiles aparecem primeiro, drag & drop persiste

### Teste 6: Template Editing

```
1. Abrir Templates modal
2. Criar template customizado
3. Editar prompts do template
4. Salvar template
5. Aplicar template em novo dashboard
6. Verificar que prompts editados foram aplicados
```

**Resultado esperado**: Templates editados funcionam corretamente

### Teste 7: Rate Limiting

```
1. Fazer múltiplas requisições rápidas
2. Verificar que rate limit é aplicado
3. Verificar mensagem de erro apropriada
4. Aguardar período de reset
5. Verificar que requisições voltam a funcionar
```

**Resultado esperado**: Rate limiting funciona corretamente

## 📝 Próximos Passos (Ordem de Implementação)

### FASE 1: Correções Críticas (1-2h)

1. ~~**Implementar contrastMode persistente**~~ ✅ CONCLUÍDO

   - ✅ Tokens calculados uma vez e salvos no dashboard
   - ✅ Valores salvos são reutilizados ao invés de recalcular
   - ✅ Contraste persiste após F5

2. **Fechar dropdowns ao clicar fora** 🔴 PRÓXIMO
   - Adicionar `useEffect` com listener em `AdminHeaderAde.tsx`
   - Fechar `showDashboards` e `showTemplates` ao clicar fora
   - **Tempo estimado**: 30min

### FASE 2: Funcionalidades Faltantes (2-3h)

3. **Profile e Settings**

   - Criar `ProfileModal.tsx`
   - Criar `SettingsModal.tsx`
   - Conectar aos botões do sidebar

4. **Files & Assets Panel**
   - Criar API para upload de arquivos
   - Implementar `FilesPanelAde.tsx` (substituir placeholder)
   - Adicionar preview de imagens/PDFs

### FASE 3: Melhorias UX (1-2h)

5. **Breadcrumb no Header**

   - Mostrar nome da company no header
   - Adicionar navegação breadcrumb

6. **Dark Mode Toggle**
   - Adicionar toggle no header
   - Persistir preferência

### FASE 4: Integração Auth (Fase 3 do roadmap)

7. **Clerk Integration**
   - Integrar Clerk para autenticação
   - Conectar botões Login/SignUp
   - Gerenciar sessões autenticadas

## 🔍 Arquivos que Precisam de Atenção

### `src/containers/admin/AdminContainer.tsx`

- Adicionar lógica de `contrastMode`
- Salvar/carregar `contrastMode` do dashboard

### `src/components/admin/ade/AdminHeaderAde.tsx`

- Adicionar listener para fechar dropdowns
- Adicionar breadcrumb
- Adicionar dark mode toggle

### `src/components/admin/ade/AdminSidebarAde.tsx`

- Usar `contrastMode` do dashboard para badge
- Conectar Profile e Settings

### `src/lib/storage/dashboards-store.ts`

- Garantir que `contrastMode` é salvo/carregado

### `src/containers/admin/ade/FilesPlaceholderAde.tsx`

- Substituir por implementação real

## 📊 Métricas de Sucesso

- ✅ `contrastMode` persiste após F5
- ✅ Badge sempre tem contraste adequado
- ✅ Dropdowns fecham ao clicar fora
- ✅ Profile e Settings funcionam
- ✅ Files & Assets funcionam
- ✅ Breadcrumb mostra contexto atual
- ✅ Dark mode funciona e persiste

## 🐛 Bugs Conhecidos

1. **Badge perde contraste após F5** → Resolver com `contrastMode` persistente
2. **Dropdowns não fecham** → Adicionar listener de click fora
3. **Login/SignUp não funcionam** → Integrar Clerk (Fase 3)

## 📚 Documentação Relacionada

- `prompt-fluxo.md` - Estrutura completa do sistema
- `ORQUESTRACAO_PROBLEMAS.md` - Problemas de orquestração resolvidos
- `SOLUCAO_SIMPLIFICADA.md` - Solução implementada
