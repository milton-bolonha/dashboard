# **🎯 Cursor AI Setup - Padrões de Desenvolvimento Moderno**

Este diretório `.cursor/` contém toda a configuração personalizada baseada nos conceitos do livro **"Padrões de Desenvolvimento Moderno"** de Milton Bolonha.

---

## **📚 Fonte dos Conceitos**

Todos os padrões, regras e contextos aqui definidos são extraídos diretamente do livro, incluindo:

- **TE[i]As Framework** - Modelo mental para sistemas complexos
- **Cards/Decks/Pipelines** - Metáfora para organizar fluxos
- **Complexidade Cognitiva** - Princípios de código claro
- **Smart/Dumb Components** - Separação de responsabilidades
- **Document-First** - Planejamento antes do código
- **Workspace Patterns** - Organização npm workspace
- **Terceirização Inteligente** - Quando usar serviços externos

---

## **🗂️ Estrutura dos Arquivos**

```
.cursor/
├── README.md                     # Este arquivo
├── prompt_rules/                 # Regras aplicadas a todos os prompts
│   ├── milton-voice.mdc          # Tom e estilo de escrita do Milton
│   ├── teias-framework.mdc       # Framework TE[i]As
│   ├── code-clarity.mdc          # Princípios de complexidade cognitiva
│   ├── workspace-patterns.mdc    # Padrões npm workspace
│   └── cards-pipeline.mdc        # Metáfora cards/decks
├── context/                      # Contextos inteligentes
│   ├── mcp/                      # MCP Providers
│   │   └── book-concepts.ts      # Provider dinâmico baseado no livro
│   ├── architecture.mdc         # Padrões arquiteturais
│   ├── debugging-method.mdc      # Metodologia de debugging
│   ├── smart-dumb.mdc           # Padrão Smart/Dumb components
│   └── deployment.mdc           # Padrões de deploy e CI/CD
└── rules/                       # Regras de contexto
    ├── context_rules.md         # Regras de inclusão de contexto
    └── workspace_rules.md       # Regras específicas do workspace
```

---

## **🎨 Tom e Estilo**

O Cursor foi configurado para seguir o **"jeitinho"** do Milton:

- **Linguagem conversacional** ("falado conversado")
- **Conceitos claros** antes de implementação
- **Exemplos práticos** com código em português
- **Metáforas visuais** para explicar conceitos técnicos
- **Progressão natural** do simples ao complexo

---

## **🧠 Framework TE[i]As Integrado**

Toda análise de código será feita considerando:

- **T** - Topologia (estrutura e conexões)
- **E** - Estado (status atual de cada parte)
- **[i]** - Iterabilidade (o que pode ser repetido/testado)
- **A** - Agente (quem executa as ações)
- **s** - Subagente (funções auxiliares)

---

## **🎴 Metáfora Cards/Decks**

Para pipelines e fluxos:

- **Card** = Unidade mínima de processamento
- **Deck** = Sequência organizada de cards
- **Partida** = Execução do pipeline
- **Arena** = Ambiente de execução

---

## **📊 Complexidade Cognitiva**

Código será analisado quanto ao "custo mental":

- Máximo 10 pontos por função
- Preferir funções pequenas e específicas
- Extrair condições complexas
- Evitar aninhamento profundo

---

## **⚙️ Workspace Patterns**

Scripts organizados por workspace:

- `workspace:action` (ex: `dash:dev`, `ai:setup`)
- Configuração centralizada no root
- Dependencies compartilhadas quando possível

---

## **🚀 Como Usar**

1. **Abra qualquer arquivo** - As regras são aplicadas automaticamente
2. **Peça refatoração** - Será feita seguindo os padrões do livro
3. **Solicite arquitetura** - TE[i]As será aplicado naturalmente
4. **Code review** - Complexidade cognitiva será avaliada
5. **Debugging** - Metodologia sistemática será sugerida

---

## **📖 Referência Rápida**

- **Para arquitetura**: Pense em TE[i]As (T-E-[i]-A-s)
- **Para pipelines**: Use Cards → Deck → Partida
- **Para componentes**: Smart (lógica) vs Dumb (visual)
- **Para código**: Máx 10 pontos de complexidade cognitiva
- **Para debugging**: Investigação sistemática com evidências

---

_"Mapeie primeiro, programe depois"_ - Milton Bolonha
