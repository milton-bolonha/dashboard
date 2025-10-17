# Plano de Ação - Fase 2: Resiliência e Performance

**Objetivo:** Aumentar a robustez e a velocidade do sistema, garantindo que operações críticas sejam processadas de forma confiável em segundo plano e que a experiência do usuário no dashboard seja a mais rápida possível.

---

## Tarefas Principais

### 1. Integrar `deckEngine` para Webhooks do Stripe

**Descrição Técnica:** Refatorar o processamento de webhooks do Stripe para usar o `deckEngine`. Isso move a lógica de negócios para um sistema de filas resiliente, capaz de lidar com falhas e retentativas, tornando o processo de atualização de planos e assinaturas muito mais confiável.

**Passos de Implementação:**

1.  **Definição do Deck:**
    - Criar um arquivo `dashboard/decks/billing.js` (ou similar).
    - Nele, definir um **Deck** chamado `stripe-webhook`.

2.  **Criação das Cartas (Cards):**
    - No mesmo arquivo ou em helpers, criar funções puras para cada etapa do processo. Cada função será uma **Carta**:
        - `parseEvent(context)`: Valida e extrai o payload do evento.
        - `findUser(context)`: Encontra o usuário no DB com base no `customerId` do Stripe.
        - `updateUserPlan(context)`: Atualiza os metadados do usuário no Clerk e/ou no DB local.
        - `logTransaction(context)`: Salva um registro da transação no DB para auditoria.

3.  **Refatoração da Função Serverless:**
    - Editar a função Netlify/Vercel que atualmente recebe o webhook do Stripe.
    - Remover toda a lógica de negócios de dentro dela.
    - A função agora terá apenas 3 responsabilidades:
        1.  Receber a requisição.
        2.  Verificar a assinatura do webhook para segurança.
        3.  Chamar `deckEngine.playMatch('stripe-webhook', eventPayload)` para entregar a tarefa ao motor.

### 2. Implementar Cache de Servidor com Redis

**Descrição Técnica:** Introduzir uma camada de cache no servidor para armazenar dados frequentemente acessados, como permissões de usuário e configurações. Isso reduz drasticamente a latência da UI e a carga no banco de dados.

**Passos de Implementação:**

1.  **Setup do Redis:**
    - Criar uma conta no Upstash (recomendado por ser serverless e ter um plano gratuito generoso).
    - Adicionar a URL de conexão do Redis às variáveis de ambiente do projeto (`UPSTASH_REDIS_URL`).

2.  **Criação do Helper de Cache:**
    - Criar o arquivo `dashboard/lib/cache.js`.
    - Usar a biblioteca `ioredis` ou `@upstash/redis` para se conectar ao Redis.
    - Exportar funções simples como `cache.get(key)`, `cache.set(key, value, ttl)`, e `cache.del(key)`.

3.  **Cache de Permissões:**
    - Modificar o `AccessEngine` da Fase 1.
    - No método `can()`, antes de calcular as permissões, tentar buscar o resultado do cache usando uma chave única (ex: `user:${userId}:permissions`).
    - Se o resultado estiver no cache, retorná-lo imediatamente.
    - Se não, calcular as permissões, salvá-las no cache com um TTL (Time-To-Live, ex: 300 segundos) e então retorná-las.

4.  **Cache de Dados do Menu:**
    - Identificar a API que busca os dados para o menu lateral (lista de `Sections`).
    - Aplicar a mesma lógica de cache a essa rota da API, usando uma chave como `user:${userId}:menu`.
    - Quando uma `Section` for criada ou renomeada, usar `cache.del()` para invalidar o cache e forçar uma atualização.

---

## ✅ Critérios de Sucesso para a Fase 2

- Todos os webhooks do Stripe são processados com sucesso pelo `deckEngine`.
- As permissões de usuário são carregadas instantaneamente após o primeiro login, melhorando a responsividade do dashboard.
- O menu lateral carrega sem exibir o spinner em navegações subsequentes, a menos que os dados tenham sido alterados.