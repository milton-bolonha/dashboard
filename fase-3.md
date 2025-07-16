# Plano de Ação - Fase 3: API Pública e Monetização

**Objetivo:** Ativar as funcionalidades voltadas para desenvolvedores externos, permitindo o uso da API de forma segura e controlada, e estabelecendo as bases para a monetização do produto.

---

## Tarefas Principais

### 1. Ativar o Gerenciamento de API Keys

**Descrição Técnica:** Implementar a lógica de backend para validar chaves de API e controlar o acesso aos recursos públicos, incluindo um sistema de limitação de requisições (rate limiting) para prevenir abusos.

**Passos de Implementação:**

1.  **Middleware de Autenticação da API Pública:**
    - Criar um novo middleware específico para as rotas em `/api/public/*`.
    - O middleware irá ler o header `x-api-key` da requisição.

2.  **Validação da Chave:**
    - O middleware buscará a chave no banco de dados para verificar se ela existe e está ativa.
    - Se a chave for inválida ou não existir, a requisição será bloqueada com um erro `401 Unauthorized`.

3.  **Implementação do Rate Limiting:**
    - Após a validação da chave, o middleware usará o helper de cache (Redis) para implementar o rate limiting.
    - Para cada requisição, ele irá incrementar um contador associado à chave (ex: `apikey:${apiKey}:requests`).
    - Se o contador exceder o limite definido para aquela chave (ex: 100 requisições por minuto), a requisição será bloqueada com um erro `429 Too Many Requests`.

### 2. Implementar Cache na API Pública

**Descrição Técnica:** Adicionar uma camada de cache às respostas da API pública para garantir alta performance e escalabilidade, mesmo sob alta carga de requisições.

**Passos de Implementação:**

1.  **Integração com as Rotas Públicas:**
    - Nas rotas da API pública (ex: `/api/public/sections/{slug}/items`), usar o helper `lib/cache.js`.
    - Antes de fazer a busca no banco de dados, tentar buscar a resposta do cache usando uma chave pública (ex: `public:section:${slug}:items`).
    - Se encontrar no cache, retornar a resposta imediatamente.
    - Se não, buscar no banco de dados, salvar o resultado no cache com um TTL apropriado (ex: 60 segundos) e então retornar.

2.  **Estratégia de Invalidação de Cache:**
    - Nas rotas que **modificam** dados (CRUD de `Items` e `Sections` no dashboard), implementar a lógica de invalidação.
    - Por exemplo, ao criar, atualizar ou deletar um `Item` em uma `Section`, o sistema deve explicitamente deletar a chave de cache correspondente (`cache.del('public:section:${slug}:items')`). Isso garante que a próxima requisição pública buscará os dados atualizados.

### 3. (Opcional, mas recomendado) UI para Monitor de Tarefas

**Descrição Técnica:** Criar uma interface no dashboard para que os usuários possam visualizar o status das operações executadas em segundo plano pelo `deckEngine`, aumentando a transparência e o controle.

**Passos de Implementação:**

1.  **Criação da Rota da API:**
    - Criar um novo endpoint, por exemplo, `/api/system/matches`.
    - Esta rota será protegida pelo `Access Engine` e permitirá que administradores do workspace visualizem as tarefas.
    - A rota chamará uma função do `deckEngine` para listar o histórico de "partidas" (matches) recentes.

2.  **Desenvolvimento da Página no Frontend:**
    - Criar uma nova página em `/dashboard/system/monitor`.
    - A página fará uma requisição para a nova rota da API para buscar os dados.

3.  **Criação do Componente de Tabela:**
    - Exibir os dados em uma tabela, mostrando informações como: Nome da Tarefa (Deck), Status (`completed`, `failed`), Horário de Início e Fim.
    - Para cada partida que falhou (`failed`), adicionar um botão "Tentar Novamente".

4.  **Implementação da Ação de Retry:**
    - O botão "Tentar Novamente" chamará outra rota da API (ex: `/api/system/matches/retry`).
    - Essa rota usará o `deckEngine` para reiniciar a partida que falhou, usando o mesmo `payload` inicial que foi salvo.

---

## ✅ Critérios de Sucesso para a Fase 3

- Os endpoints da API pública estão protegidos e só podem ser acessados com uma chave de API válida.
- O sistema de rate limiting está funcional, prevenindo abuso da API.
- As respostas da API pública são servidas rapidamente através do cache, e os dados são atualizados quando modificados no dashboard.
- (Opcional) Os usuários podem visualizar um histórico de suas tarefas em segundo plano e tentar novamente as que falharam.