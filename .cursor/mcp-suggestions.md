# 🔌 MCP Server Suggestions

## Para GENERIC Projects

### Database Integration
Se você usa banco de dados:

```json
{
  "postgres": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/mydb"]
  }
}
```

### File System Operations
Para manipulação avançada de arquivos:

```json
{
  "filesystem": {
    "command": "npx", 
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/dir"]
  }
}
```

### Web Search & Research
Para pesquisas durante desenvolvimento:

```json
{
  "web-search": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-web-search"]
  }
}
```



## Como Instalar
1. Copie a configuração JSON
2. Adicione em Settings > MCP Servers
3. Ou use deeplinks quando disponíveis

## Deeplink Format
`cursor://anysphere.cursor-deeplink/mcp/install?name=SERVER_NAME&config=BASE64_CONFIG`

## Verificar Instalação
- Settings > MCP Servers
- Verifique se aparecem na lista de tools do Chat
