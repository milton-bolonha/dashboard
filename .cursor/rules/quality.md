# ✨ Code Quality Rules

## Linting & Formatting

### ESLint
- Configure regras adequadas para generic
- Use extends de configs populares
- Configure regras de acessibilidade se aplicável
- Rode linter no CI/CD

### Prettier
- Configure formatação consistente
- Use no editor com format on save
- Configure import ordering
- Mantenha config compartilhada no projeto

### Git Hooks
- Use husky para pre-commit hooks
- Rode linter antes de commits
- Configure conventional commits se aplicável
- Use lint-staged para arquivos staged apenas

## Testing

### Cobertura
- Mantenha cobertura acima de 80%
- Foque em lógica crítica de negócio
- Use mutation testing para validar qualidade
- Configure thresholds no CI

### Tipos de Teste
- Unit tests: funções e lógica isolada
- Integration tests: interação entre modules
- E2E tests: fluxos críticos do usuário
- Visual regression: se aplicável

## Documentation

### README
- Mantenha README atualizado
- Inclua instruções de setup
- Documente APIs principais
- Adicione badges de status

### Code Comments
- Comente o "por que", não o "o que"
- Use JSDoc para funções públicas
- Mantenha comentários atualizados
- Remova comentários obsoletos
