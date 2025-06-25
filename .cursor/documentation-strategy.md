# 📚 Documentation Strategy Guide

## 🌳 Documentation Decision Tree

```
Que informação você precisa?
├── Public frameworks/libraries
│   ├── Official docs needed? → @Docs (API refs, best practices)
│   └── Community knowledge? → @Web (tutorials, comparisons)
└── Internal company info
    ├── MCP integration available? → Use existing (Confluence, Drive)
    └── Custom needed? → Build MCP server (proprietary systems)
```

## ⚠️ Model Knowledge Cutoff Solutions

**Problem**: Models trained até data específica, missing recent updates

**Solutions**:
```javascript
// For React 19 (released after cutoff)
@Docs React → Current official documentation
@Web "React 19 new features 2024" → Recent community updates

// For Next.js 15 features
@Docs Next.js → Latest official patterns
@Web "Next.js 15 app router changes" → Community insights

// For internal systems
MCP Internal APIs → Company-specific implementations
```

## 💡 Mental Models por Tool

- **@Docs** → Como navegar documentação oficial (autoritativa, atual)
- **@Web** → Como pesquisar soluções na internet (múltiplas perspectivas)
- **MCP** → Como acessar documentação interna (company-specific)

## 🔍 Advanced @Web Search Patterns

### Recent Updates & Features
```
@Web "React 19 new features 2024"
@Web "Next.js 15 app router changes"
@Web "TypeScript 5.6 latest features"
```

### Error Resolution
```
@Web "[exact error message] solution"
@Web "React hydration error fix 2024"
@Web "Next.js build error [specific]"
```

### Performance & Optimization
```
@Web "React performance optimization 2024"
@Web "Next.js bundle size optimization"
@Web "Node.js memory leak debugging"
```

## 🎯 Validation Workflow

Always validate @Web information:
```
1. @Web → Find solution/approach
2. @Docs → Verify official recommendation
3. @Past Chats → Check similar implementations
4. Test → Validate in your context
```

## 🚀 Complete Documentation Workflows

### Research & Implementation
```
1. @Web → Research recent community solutions
2. @Docs → Validate against official recommendations
3. @Past Chats → Check previous similar work
4. MCP Internal → Review company patterns
5. Implement with complete context
```

### Living Documentation
```
1. Generate initial docs from code
2. Update docs as code changes (@Git monitoring)
3. Add insights from conversations (@Past Chats)
4. Validate with automated tests
5. Keep in sync with implementation
```
