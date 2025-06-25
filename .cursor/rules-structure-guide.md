# 📋 Advanced Rules Structure

## 🏗️ **ORGANIZAÇÃO DE RULES**

Nossa estrutura organiza rules em categorias lógicas para melhor manutenção e aplicação:

### 📁 **Pasta Structure**

```
.cursor/rules/
├── core-rules/          # Comportamento do Cursor agent
├── global-rules/        # Rules sempre aplicadas
├── stack-rules/         # Rules específicas do stack
├── tool-rules/          # Rules para ferramentas
├── workflow-rules/      # Workflows e processos
└── project-rules/       # Rules específicas do projeto
```

### 🎯 **Tipos de Rules (Naming Convention)**

#### **Auto Rules** (rule-name-auto.mdc)
- **Quando usar**: Rules que se aplicam automaticamente a certos tipos de arquivo
- **Front matter**: `description: ""`, `globs: ["*.ts", "*.tsx"]`, `alwaysApply: false`
- **Exemplo**: `typescript-standards-auto.mdc`

#### **Agent Rules** (rule-name-agent.mdc)  
- **Quando usar**: Rules específicas que o agent decide quando aplicar
- **Front matter**: `description: "Detailed when to apply"`, `globs: ""`, `alwaysApply: false`
- **Exemplo**: `debugging-strategies-agent.mdc`

#### **Always Rules** (rule-name-always.mdc)
- **Quando usar**: Rules globais aplicadas a todo chat/comando
- **Front matter**: `description: ""`, `globs: ""`, `alwaysApply: true`
- **Exemplo**: `code-quality-always.mdc`

#### **Manual Rules** (rule-name-manual.mdc)
- **Quando usar**: Rules ativadas manualmente pelo usuário
- **Front matter**: `description: ""`, `globs: ""`, `alwaysApply: false`
- **Exemplo**: `complex-refactor-manual.mdc`

### 📝 **Template Padrão**

```mdc
---
description: "Detailed description of when and why to apply this rule"
globs: ["*.ts", "*.tsx"] OR ""
alwaysApply: true OR false
---

# Rule Title

## Critical Rules

- Actionable rule 1
- Actionable rule 2
- Actionable rule 3

## Examples

<example>
Valid usage example
</example>

<example type="invalid">
Invalid usage example
</example>
```

## 🎯 **Usage Guidelines**

### Para Criar Nova Rule
1. **Determine tipo**: Auto, Agent, Always, ou Manual
2. **Escolha pasta**: Baseado na categoria da rule
3. **Use naming convention**: `rule-name-{type}.mdc`
4. **Preencha template**: Description apropriada para o tipo
5. **Include examples**: Valid e invalid usage

### Para Organizar Rules Existentes
1. **Review function**: Que problema a rule resolve?
2. **Categorize**: Em qual pasta faz mais sentido?
3. **Rename if needed**: Para seguir naming convention
4. **Update description**: Especialmente para agent rules

### Para Manter Rules
1. **Regular review**: Quarterly review de todas as rules
2. **Update examples**: Baseado em patterns reais do projeto
3. **Consolidate**: Merge rules similares
4. **Deprecate**: Remove rules obsoletas

## 💡 **Best Practices**

### Description Writing
- **Auto rules**: Deixe description vazia
- **Agent rules**: Description detalhada sobre quando aplicar
- **Always rules**: Description vazia
- **Manual rules**: Description vazia

### Glob Patterns
- **Be specific**: `src/components/**/*.tsx` vs `**/*.tsx`
- **Multiple patterns**: `["*.ts", "*.tsx", "*.js", "*.jsx"]`
- **Exclude patterns**: Use .cursorignore para exclusions

### Rule Content
- **Actionable**: Focus em o que fazer, não teorias
- **Concise**: Agent context window é limitado
- **Examples**: Sempre include valid e invalid examples
- **Emojis allowed**: Para melhor AI comprehension

## 🔧 **Advanced Features**

### Rule Dependencies
- Reference outras rules quando necessário
- Use `@rule-name` para referenciar
- Avoid circular dependencies

### Rule Testing
- Test rules com different scenarios
- Monitor rule effectiveness
- Update based on usage patterns

### Rule Analytics
- Track qual rules são mais usadas
- Identify rules que nunca são aplicadas
- Optimize based on usage data
