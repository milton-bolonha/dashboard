# 🤖 AI Workspace Commands

## Comandos Básicos

### Health Check
`@ai health-check` - Verifica saúde geral do projeto
- Analisa performance, errors, dependencies
- Gera relatório com métricas importantes
- Sugere otimizações baseadas na análise

### Visual Audit
`@ai visual-audit` - Análise visual completa
- Captura screenshots automáticos
- Detecta componentes e layout
- Analisa acessibilidade visual
- Gera relatório com insights

### Test Generation
`@ai test-generate` - Gera testes automaticamente
- Analisa código existente
- Cria testes unitários e de integração
- Sugere cenários de teste adicionais
- Configura framework de teste se necessário

## Comandos Avançados

### TDD Cycle
`@ai tdd-cycle [feature]` - Ciclo completo TDD
- Gera testes para nova feature
- Implementa código mínimo para passar
- Refatora mantendo testes verdes
- Documenta processo

### Performance Audit
`@ai performance` - Análise de performance
- Mede métricas Core Web Vitals
- Identifica gargalos
- Sugere otimizações específicas
- Monitora melhorias

### Security Scan
`@ai security` - Scan de segurança básico
- Verifica dependências vulneráveis
- Analisa configurações de segurança
- Sugere melhorias de segurança
- Gera relatório de conformidade

## Comandos por Stack

### Next.js
- `@ai next-audit` - Auditoria específica Next.js
- `@ai next-optimize` - Otimizações Next.js
- `@ai next-deploy` - Checklist de deploy

### React
- `@ai react-audit` - Auditoria React
- `@ai component-analyze` - Análise de componentes
- `@ai hooks-optimize` - Otimização de hooks

### Node API
- `@ai api-audit` - Auditoria de API
- `@ai endpoints-test` - Testes de endpoints
- `@ai api-docs` - Geração de documentação

## Dicas de Uso

### Context Sharing
Use `@project-context` para compartilhar contexto do projeto:
- Informações sobre arquitetura atual
- Padrões e convenções estabelecidas
- Dependências e configurações

### Iterative Development
Combine comandos para workflow iterativo:
1. `@ai health-check` - Estado atual
2. `@ai test-generate` - Cobertura de testes
3. `@ai tdd-cycle new-feature` - Nova funcionalidade
4. `@ai visual-audit` - Validação visual
5. `@ai performance` - Verificação final
