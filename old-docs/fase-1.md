# Plano de Ação - Fase 1: Fundação Essencial

**Objetivo:** Lançar a vitrine pública do produto e construir a espinha dorsal de segurança e consistência de dados do sistema, garantindo que o produto principal seja robusto e confiável.

---

## Tarefas Principais

### 1. Finalizar a Landing Page Dinâmica (Gatsby)

**Descrição Técnica:** Criar a ponte entre os dados da plataforma e a landing page, permitindo que ela exiba conteúdo público dinamicamente. Esta é a principal vitrine do produto.

**Passos de Implementação:**
- Conforme detalhado em `landing-plan.md`.

### 2. Implementar o `Access Engine` (Motor de Controle de Acesso)

**Descrição Técnica:** Centralizar toda a lógica de permissões em um único motor reutilizável. Isso elimina a duplicação de código, simplifica a manutenção e se torna a única fonte da verdade para o controle de acesso.

**Passos de Implementação:**

1.  **Criação do Arquivo:**
    - Criar o arquivo `dashboard/lib/access-engine.js`.

2.  **Definição da Classe Principal:**
    - Definir e exportar uma classe `AccessEngine`.
    - O construtor receberá o `user` (do Clerk) e o `workspace` atual.

3.  **Matriz de Permissões:**
    - Dentro do arquivo, criar um objeto `permissionMatrix` que mapeia permissões a um array de `roles` permitidos (ex: `'sections.create': ['owner', 'admin']`).

4.  **Lógica Principal:**
    - Implementar o método `can(permissionString)` (ex: `can('sections.create')`).
    - Este método irá consultar a `permissionMatrix` com base no `role` do usuário no `workspace` para retornar `true` or `false`.

5.  **Integração com a API (Middleware):**
    - Criar um middleware de API que será usado para proteger as rotas.
    - O middleware irá instanciar o `AccessEngine` e usar o método `can()`.
    - Se a permissão for negada, ele retornará um erro `403 Forbidden`.

6.  **Integração com o Frontend (Hook):**
    - Criar um hook `useAccess` em `dashboard/hooks/useAccess.js`.
    - O hook usará os contextos de `user` e `workspace` para fornecer a mesma função `can()` aos componentes React, permitindo ocultar/mostrar elementos da UI de forma reativa.

### 3. Padronizar Serialização de Dados da API

**Descrição Técnica:** Garantir que todos os dados enviados do backend para o frontend através da API tenham um formato JSON consistente e padronizado, evitando a necessidade de tratamento de tipos de dados do MongoDB no cliente.

**Passos de Implementação:**

1.  **Criação do Helper:**
    - Criar o arquivo `dashboard/lib/serialization.js`.

2.  **Implementação da Função:**
    - Criar e exportar uma função `serialize(data)`.
    - A função deve verificar se `data` é um objeto ou um array de objetos.
    - Para cada objeto, ela irá:
        - Converter o campo `_id` (do tipo `ObjectId`) para um novo campo `id` (do tipo `string`).
        - Converter campos de `Date` para o formato `ISOString`.
        - Remover o campo `_id` original para evitar redundância.

3.  **Aplicação nas Rotas da API:**
    - Em cada arquivo de rota da API (ex: `dashboard/app/api/sections/route.js`), importar a função `serialize`.
    - Antes de retornar a resposta com `NextResponse.json()`, passar os dados pela função `serialize()`.

---

## ✅ Critérios de Sucesso para a Fase 1

- A landing page em Gatsby exibe dinamicamente os dados públicos de um usuário.
- Todas as rotas da API que exigem autenticação estão protegidas pelo novo `Access Engine`.
- Os componentes da UI (botões, menus, etc.) são dinamicamente exibidos ou ocultados com base nas permissões do usuário, via hook `useAccess`.
- Todas as respostas da API que retornam dados do banco de dados estão padronizadas, contendo um campo `id` como string e datas em formato ISO.
