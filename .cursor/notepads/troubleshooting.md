# 🔧 Troubleshooting Guide

## Problemas Comuns

### Projeto não detectado corretamente
**Sintoma**: AI Workspace detecta tipo errado
**Solução**:
1. Verificar se package.json existe e tem dependências corretas
2. Executar `npm run ai:setup --force` para forçar nova detecção
3. Verificar se arquivos de configuração estão presentes

### Portas não detectadas
**Sintoma**: Nenhuma porta ativa encontrada
**Solução**:
1. Iniciar servidor de desenvolvimento
2. Verificar se servidor está rodando na porta esperada
3. Executar `npm run ai:health` para nova verificação

### Cursor rules não funcionam
**Sintoma**: Rules não são aplicadas nos prompts
**Solução**:
1. Verificar se arquivos estão em `.cursor/rules/`
2. Recarregar Cursor IDE
3. Verificar configurações do Cursor em Settings

## Debug por Stack

### Next.js
```bash
# Verificar configuração
cat next.config.js

# Verificar build
npm run build

# Verificar tipo de router
ls app/ || ls pages/
```

### React
```bash
# Verificar dependências React
npm list react react-dom

# Verificar scripts
npm run start --dry-run

# Verificar bundler
cat package.json | grep -E "(vite|webpack)"
```

### Node API
```bash
# Verificar servidor
curl http://localhost:3000/health

# Verificar logs
npm run start 2>&1 | grep -i error

# Verificar dependências
npm list express fastify koa
```

## Logs e Debugging

### Habilitar logs detalhados
```bash
DEBUG=ai-workspace:* npm run ai:health
```

### Verificar outputs
```bash
# Screenshots
ls -la outputs/screenshots/

# Relatórios
ls -la outputs/reports/

# Logs
tail -f outputs/logs/ai-workspace.log
```

### Limpar cache
```bash
# Limpar outputs antigos
npm run ai:clean

# Forçar nova detecção
rm -rf .ai-workspace/config/
npm run ai:setup
```

## Problemas de Performance

### Screenshots lentos
- Verificar se Puppeteer está atualizado
- Usar headless mode
- Reduzir viewport se necessário

### Detecção lenta
- Verificar tamanho do projeto
- Excluir node_modules da análise
- Usar .aiignore para arquivos grandes

### Muitos logs
- Ajustar nível de log em ai.config.js
- Configurar rotação de logs
- Limpar logs antigos regularmente

## Suporte

### Coleta de informações
Antes de reportar issues, colete:

```bash
# Informações do sistema
node --version
npm --version

# Informações do projeto
cat package.json | head -20

# Logs do AI Workspace
cat outputs/logs/latest.log | tail -50

# Configuração atual
cat .ai-workspace/config/local.json
```

### Repositório de Issues
- GitHub: https://github.com/ai-dev-workspace/core/issues
- Use template de issue apropriado
- Inclua informações de sistema e logs
- Descreva passos para reproduzir
