# 🌐 Web Development MCP Servers

## 🎯 Overview

MCP (Model Context Protocol) servers específicos para desenvolvimento web que integram diretamente com ferramentas essenciais.

## 📊 Project Management

### Linear Integration
```json
{
  "Linear": {
    "command": "npx",
    "args": ["-y", "mcp-remote", "https://mcp.linear.app/sse"]
  }
}
```

**Funcionalidades:**
- ✅ Listar issues do projeto
- ✅ Criar novas issues
- ✅ Atualizar status de issues
- ✅ Conectar código com tarefas

**Prompts Úteis:**
```
"List all issues related to this project"
"Create a new issue for this bug I found"
"Update the status of issue #123 to in progress"
```

## 🎨 Design Integration

### Figma MCP Server
```json
{
  "Figma": {
    "url": "http://127.0.0.1:3845/sse"
  }
}
```

**Setup Required:**
1. Install Figma Dev Mode MCP Server
2. Configure local server (port 3845)
3. Authenticate with Figma account

**Funcionalidades:**
- ✅ Access design files directly in Cursor
- ✅ Extract design tokens and measurements
- ✅ Generate code from Figma components
- ✅ Sync design system updates

**Prompts Úteis:**
```
"Show me the designs from the current Figma selection"
"Generate React components from this Figma design"
"Extract color palette from this design file"
```

## 🌐 Browser Tools

### Browser MCP Server
```json
{
  "BrowserTools": {
    "command": "npx",
    "args": ["-y", "@browsertools/mcp-server"]
  }
}
```

**Setup:** https://browsertools.agentdesk.ai/installation

**Funcionalidades:**
- ✅ Monitor console logs
- ✅ Track network requests
- ✅ Inspect DOM elements
- ✅ Performance monitoring
- ✅ Error tracking

**Prompts Úteis:**
```
"Check the console logs for any errors"
"Monitor network requests during this user flow"
"Inspect the performance of this page load"
```

## 🔧 Setup Instructions

### 1. Add to MCP Settings
1. Open Cursor Settings
2. Go to MCP Servers
3. Add server configuration
4. Reload server if needed

### 2. Authenticate
Most servers require authentication:
- Follow browser prompts
- Enter API keys when requested
- Grant necessary permissions

### 3. Verify Installation
Check MCP settings to see available tools for each server.

## 💡 Usage Patterns

### Tight Feedback Loop
```
1. Check Linear issue → 2. Update Figma design → 3. Generate code → 4. Test in browser → 5. Deploy
```

### Debugging Workflow
```
1. Monitor browser console → 2. Check network requests → 3. Inspect database queries → 4. Update issue status
```

### Design-to-Code Workflow
```
1. Access Figma designs → 2. Extract components → 3. Generate React code → 4. Test responsiveness → 5. Deploy
```
