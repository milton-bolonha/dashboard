# 🧠 Context Management Guide

## 🎯 Tipos de Contexto

### Intent Context (O que você quer)
- **System prompts**: Instruções de alto nível
- **Task descriptions**: "Turn that button from blue to green"
- **Rules**: Padrões e convenções do projeto
- **Prescritivo**: Define o comportamento desejado

### State Context (O que existe)
- **Error messages**: Logs e stack traces
- **Code chunks**: Arquivos e funções relevantes
- **Images**: Screenshots e mockups
- **Console output**: Runtime behavior
- **Descritivo**: Descreve o estado atual

## 🔧 @-Symbols - Context Cirúrgico COMPLETO

### 📁 Core Context Symbols

#### @Files - Arquivos específicos
```
@package.json
@components/Button.tsx
@utils/validation.js
```
- **Uso**: Referenciar arquivos específicos do projeto
- **Features**: Preview automático, chunking para arquivos longos
- **Drag & Drop**: Arraste arquivos da sidebar para adicionar
- **Autocompletion**: Cursor autocompleta conforme você digita

#### @Folders - Diretórios completos
```
@utils/
@components/ui/
@src/services/
```
- **Uso**: Contexto amplo de múltiplos arquivos relacionados
- **Vantagem**: Visão completa de um módulo/feature
- **Desvantagem**: Pode incluir muito contexto irrelevante

#### @Code - Símbolos específicos
```
@LRUCachedFunction
@UserController.authenticate
@CONFIG.database.url
```
- **Uso**: Referenciar funções, classes, variáveis específicas
- **Code Preview**: Mostra preview do código antes de adicionar
- **Keyboard Shortcuts**: Cmd+Shift+L (Chat), Cmd+Shift+K (Edit)
- **Máxima precisão**: Ideal quando você sabe exatamente o que quer

### 📚 Knowledge & Documentation Symbols

#### @Docs - Documentação e guias
```
@README.md
@API_DOCS.md
@CONTRIBUTING.md
```
- **Uso**: Acessar documentação do projeto
- **Contexto**: Especificações, APIs, guias de desenvolvimento

#### @Web - Recursos externos
```
@https://docs.react.dev
@https://nextjs.org/docs
@MDN JavaScript
```
- **Uso**: Buscar informações na web aberta
- **Funcionalidade**: Cursor pode pesquisar documentação externa
- **Muito útil**: Para bibliotecas, frameworks, padrões

#### @Cursor Rules - Rules do projeto
```
@nextjs-patterns
@code-style
@testing-standards
```
- **Uso**: Referenciar rules específicas do projeto
- **Contexto**: Padrões, convenções, guidelines estabelecidas

#### @Notepads - Templates e anotações
```
@common-patterns
@troubleshooting-guide
@deployment-checklist
```
- **Uso**: Acessar templates salvos e anotações do projeto

### 🔄 History & Changes Symbols

#### @Git - Histórico e mudanças
```
@recent-commits
@git-diff
@branch-changes
```
- **Uso**: Acessar histórico do Git, diffs, mudanças recentes
- **Contexto**: Entender evolução do código, debugging

#### @Recent Changes - Mudanças recentes
```
@last-week-changes
@current-branch-diff
```
- **Uso**: Focar nas mudanças mais recentes do projeto

#### @Past Chats - Conversas anteriores
```
@debugging-session
@feature-implementation
```
- **Uso**: Referenciar conversas anteriores do Composer
- **Contexto**: Manter continuidade entre sessões de desenvolvimento

### 🔧 Development Tools Symbols

#### @Lint Errors - Erros de linting (Chat only)
```
@current-lint-errors
@typescript-errors
@eslint-warnings
```
- **Uso**: Focar em resolver erros específicos de linting
- **Disponível**: Apenas no Chat, não no Cmd K

#### @Definitions - Definições de símbolos (Cmd K only)
```
@function-definition
@class-definition
@interface-definition
```
- **Uso**: Buscar definições de símbolos específicos
- **Disponível**: Apenas no Cmd K, não no Chat

#### @Link - Links para código/documentação
```
@github-issue-123
@confluence-spec
```
- **Uso**: Criar links para recursos externos específicos

### 🎯 Quick Context Symbols

#### #Files - Adicionar sem referenciar
```
#package.json
#tsconfig.json
```
- **Uso**: Adicionar arquivos ao contexto sem referenciar explicitamente
- **Diferença**: Não cria referência explícita, apenas adiciona ao contexto

#### /Commands - Arquivos ativos
```
/open-files
/active-editor
```
- **Uso**: Adicionar arquivos abertos e ativos ao contexto
- **Automático**: Inclui arquivos que você está trabalhando atualmente

## 🎮 Navigation & Usage

### Keyboard Navigation
- **Arrow keys**: Navegar pela lista de sugestões
- **Enter**: Selecionar sugestão
- **Tab**: Autocompletar quando possível
- **Esc**: Fechar menu de sugestões

### Smart Filtering
- Cursor filtra automaticamente baseado no que você digita
- Sugestões são rankadas por relevância
- Categorias se expandem automaticamente quando relevantes

### Best Practices por Symbol
- **@Code**: Quando você sabe exatamente qual função/classe
- **@Files**: Para contexto completo de arquivo específico  
- **@Folders**: Para entender módulos/features completas
- **@Web**: Para buscar documentação oficial externa
- **@Git**: Para debugging baseado em mudanças recentes
- **@Past Chats**: Para manter continuidade entre sessões

## 🚨 Estados de Context Window

### ✅ Normal
Arquivo incluído completamente no contexto.

### 📝 Condensed
Arquivo muito grande - inclui apenas:
- Function signatures
- Class definitions
- Method headers
- Estrutura principal

### 📄 Significantly Condensed
Arquivo enorme - apenas nome do arquivo mostrado.

### ⚠️ Not Included
Arquivo muito grande para incluir, mesmo condensado.

## 💡 Dicas de Otimização

### Evitar Summarization
1. **Inicie nova conversa** para tarefas diferentes
2. **Use modelos** com context window maior
3. **Inclua menos contexto explícito** - deixe o agent decidir
4. **Switch para MAX mode** quando possível

### Context Strategy
1. **Start surgical**: Use @code para símbolos específicos
2. **Expand gradually**: Adicione @file se precisar de mais contexto
3. **Go broad**: Use @folder apenas quando necessário
4. **Let agent search**: Permita busca automática quando apropriado

## 🔄 Self-Gathering Context Pattern

### Debugging Dinâmico
```javascript
// Adicione prints estratégicos
console.log('🔍 Debug - user data:', userData);
console.log('🔍 Debug - validation result:', isValid);

// Execute e deixe o Agent analisar a saída
npm run dev
npm test
```

### Runtime Analysis
1. **Add debugging statements** nos pontos críticos
2. **Run code/tests** usando terminal
3. **Let Agent read output** e decidir próximos passos
4. **Iterate** baseado no comportamento real

## 🎯 Best Practices

### DO
✅ Be specific with @-symbols
✅ Start new conversations for new tasks  
✅ Use intent + state context together
✅ Let Agent gather context when uncertain
✅ Include runtime behavior when debugging

### DON'T
❌ Include massive files unnecessarily
❌ Continue long conversations indefinitely
❌ Provide only intent without state context
❌ Use @folder when @file would suffice
❌ Forget to check context window status
