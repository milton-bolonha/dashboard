# 📊 Codebase Indexing Guide

## Status do Projeto
- **Tipo**: generic
- **Arquivos estimados**: 100-500
- **Limite Pro**: 50,000 files
- **Limite Business**: 250,000 files

## Otimizações Aplicadas

### .cursorignore
Configurado para ignorar:
- Dependencies (node_modules)
- Build outputs (dist, build, .next)
- Logs e temporários
- Arquivos grandes desnecessários

### Monitoramento
- Indexing é automático
- Status: Settings > Features > Codebase Indexing
- Retenção: 6 semanas após último uso

## Troubleshooting

### Performance Lenta
1. Verifique .cursorignore
2. Exclua arquivos grandes (media, data)
3. Use multi-root workspace para monorepos

### Respostas Imprecisas
1. Verifique se arquivos relevantes não estão ignorados
2. Re-index: Delete e reabra o projeto
3. Considere organizar código em módulos menores

## Comandos Úteis
```bash
# Verificar status
ai-workspace status

# Limpar e re-indexar
rm -rf .cursor/ && ai-workspace setup
```
