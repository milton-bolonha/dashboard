# Módulos Avançados (Arquitetura V2)

O diretório `core/` contém um conjunto de módulos mais robustos e ricos em funcionalidades que representam a próxima evolução da arquitetura do Deck Engine. Eles são projetados para substituir as implementações mais simples integradas no `deck-engine.js` em cenários de produção.

---

### `DomainManager` (`domains/domain-manager.js`)

Um sistema de plugins/módulos para estender a funcionalidade do engine.

- **Propósito**: Permitir que novas funcionalidades (como autenticação, pagamentos, etc.) sejam "instaladas" no engine como `Domains`.
- **Capacidades**:
  - **Instalação de Domínios**: Carrega dinamicamente domínios, resolve suas dependências e os inicializa.
  - **Configuração Rica**: Os domínios podem definir suas próprias coleções de dados, ferramentas, `Decks` e `rotas` de API.
  - **Ciclo de Vida**: Cada domínio tem seu próprio ciclo de vida (`initialize`, `cleanup`).
  - **Registro de Rotas**: Integra-se com o `RouteManager` para expor automaticamente os endpoints de um domínio.

---

### `UnifiedLogger` (`logging/unified-logger.js`)

Um sistema de logging sofisticado e configurável.

- **Propósito**: Fornecer um sistema de logging centralizado e poderoso.
- **Capacidades**:
  - **Múltiplas Saídas**: Pode registrar logs simultaneamente no console, em arquivos de texto (`.log`) e em arquivos formatados (`.md`).
  - **Formatação Rica**: Usa cores no console e formatação Markdown para melhorar a legibilidade.
  - **Sanitização de Dados**: Remove automaticamente informações sensíveis (senhas, tokens) dos logs.
  - **Estrutura de Log**: Gera logs estruturados com ID, timestamp e nível.

---

### `PlatformAdapter` (`platform/platform-adapter.js`)

Um adaptador para garantir que o engine funcione em diferentes ambientes de nuvem.

- **Propósito**: Abstrair as diferenças entre as plataformas de implantação (Node.js, Vercel, Netlify, AWS Lambda, etc.).
- **Capacidades**:
  - **Detecção Automática**: Identifica em qual plataforma o código está sendo executado.
  - **Adaptação de Configuração**: Ajusta dinamicamente a configuração do engine (ex: limites de concorrência, timeouts) para respeitar as restrições do ambiente.
  - **Contexto de Execução**: Fornece um `executionContext` normalizado que abstrai as requisições e respostas HTTP.
  - **Monitoramento de Recursos**: Inclui ferramentas para medir o desempenho e o consumo de memória, alertando sobre possíveis violações dos limites da plataforma.

---

### `RouteManager` (`routing/route-manager.js`)

Um gerenciador de rotas de API completo.

- **Propósito**: Expor as funcionalidades do engine e dos domínios através de uma API HTTP.
- **Capacidades**:
  - **Tipos de Rota**: Classifica as rotas como `PUBLIC`, `PRIVATE` (requer autenticação) e `EXTERNAL`.
  - **Pipeline de Middleware**: Permite a execução de múltiplos middlewares antes do handler principal de uma rota.
  - **Configuração Detalhada**: Suporta configuração de `rate-limit`, `timeout` e outros parâmetros por rota.
  - **Descoberta e Validação**: Inclui métodos para encontrar rotas por padrão e validar suas configurações.
