# 📦 Large Codebase Decision Tree

## 🎯 When to Use Each Tool

| Scenario | Files | Complexity | Best Tool | Rationale |
|----------|-------|------------|-----------|-----------|
| Fix typo/small bug | 1 | Low | **Tab** | Quick, precise, stay in flow |
| Add validation | 1 | Medium | **Cmd K** | Focused edit with context |
| New API endpoint | 2-3 | Medium | **Cmd K** | Scoped functionality |
| New feature module | 5+ | High | **Chat** | Broad context needed |
| Cross-package refactor | 10+ | High | **Chat** | Complex dependencies |
| Debug cross-module | Variable | High | **Chat** | Trace multiple layers |

## 🚀 Workflows for Large Codebases

### 🔍 Exploration Workflow
```
1. Chat: "Help me understand how [feature] works"
2. @Folders → Include relevant modules
3. @Git → Check recent changes  
4. @Past Chats → Reference previous explorations
5. Build mental model before changes
```

### 📋 Planning Workflow
```
1. Ask Mode: Create detailed plan
2. Include @Past Chats context
3. Ask clarifying questions (max 3)
4. Search codebase for patterns
5. Validate approach before implementing
```

## 🚨 Context Window Management

### Optimization Strategies
- **Fresh chats**: New chat for each major task
- **Focused context**: Only relevant files/folders
- **Iterative approach**: Build understanding progressively
- **Strategic @-symbols**: Most specific symbol possible

### When to Start Fresh Chat
- Switching feature/module
- Context window getting full
- Change in task scope
- After logical milestone
