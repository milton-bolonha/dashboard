# Plano de Implementação: Transferência de Propriedade de Workspace

**Última Atualização:** 02 de Agosto de 2025
**Solicitante:** @milton-bolonha
**Status:** Planejado

## 1. Objetivo

Implementar uma funcionalidade segura que permita ao atual proprietário de um workspace (`owner`) transferir a propriedade para outro usuário do sistema. A funcionalidade deve suportar a transferência tanto por e-mail (padrão) quanto por ID de usuário (helper de desenvolvimento/admin).

## 2. Análise da Arquitetura e Dados

Com base nos schemas em `dashboard/schemas/index.js` e nos guias de desenvolvimento, a arquitetura de dados é centralizada no `workspaceId`.

- **`workspaces`**: Contém o campo `ownerId` e um array `members` que define as roles.
- **`sections`**, **`items`**, **`content_types`**, etc.: Estão vinculados diretamente ao `workspaceId`.

**Conclusão da Análise:** A transferência **não** exige uma atualização em cascata em `sections`, `items`, etc. A lógica principal será focada em modificar o documento do `workspace` correspondente, atualizando o `ownerId` e o array `members`.

---

## 3. Plano de Implementação Detalhado

### Fase 1: Backend - A Rota da API de Transferência

Criaremos uma nova rota de API dedicada e segura para a operação.

**Endpoint:** `POST /api/workspaces/[id]/transfer`

**Request Body:**
O corpo da requisição aceitará `newOwnerId` ou `newOwnerEmail`. O `newOwnerId` terá prioridade.

```json
{
  "newOwnerId": "user_2zABC...", // Helper de Admin
  "newOwnerEmail": "email.do.novo.proprietario@example.com" // Padrão
}
```

**Lógica da Rota (`app/api/workspaces/[id]/transfer/route.js`):**

1.  **Autenticação (Regra de Ouro #1):**

    - A rota deve ser protegida usando o helper `withAuth`.
    - Obter o `userId` do requisitante usando `getCurrentAuth()`.

2.  **Autorização e Validação:**

    - Buscar o workspace no banco pelo `id` da URL (convertendo para `ObjectId`).
    - **Verificar Propriedade:** Confirmar se o `userId` do requisitante é igual ao `workspace.ownerId` atual. Se não for, retornar `403 Forbidden`.
    - **Identificar Novo Proprietário:**
      - **Se `newOwnerId` for fornecido (Prioridade):**
        - Usar `clerkClient.users.getUser(newOwnerId)` para validar se o usuário existe. Se não, retornar `404 Not Found`.
      - **Senão, se `newOwnerEmail` for fornecido:**
        - Usar `clerkClient.users.getUserList({ emailAddress: [newOwnerEmail] })` para buscar o usuário. Se não for encontrado, retornar `404 Not Found`.
      - Se nenhum dos campos for fornecido, retornar `400 Bad Request`.
    - Obter o `id` do novo proprietário (`newOwnerId`).
    - Proibir a auto-transferência (verificar se `newOwnerId` é o mesmo que o `ownerId` atual).

3.  **Operação no Banco de Dados (Regra de Ouro #2):**

    - A operação deve ser atômica.
    - Localizar o proprietário antigo no array `workspace.members` e mudar sua `role` de `'owner'` para `'admin'`.
    - Verificar se o novo proprietário já é um membro.
      - Se sim, encontrar o usuário no array `members` e mudar sua `role` para `'owner'`.
      - Se não, adicionar o novo proprietário ao array `members` com a `role: 'owner'`.
    - Atualizar o campo `ownerId` no nível raiz do documento do workspace para o `newOwnerId`.
    - Salvar o documento do workspace atualizado no banco de dados com `db.updateOne()`.

4.  **Resposta:**
    - Em caso de sucesso, retornar `200 OK` com o objeto do workspace atualizado.
    - Tratar todos os erros com respostas HTTP apropriadas e mensagens claras.

### Fase 2: Frontend - Interface de Usuário no Painel de Configurações

A funcionalidade será adicionada na página de configurações do workspace (`/dashboard/settings`).

1.  **Novo Componente:** `TransferOwnershipCard.jsx`

    - Será um "card" dentro da página de configurações, visível **apenas para o proprietário do workspace**.
    - Usar o hook `useWorkspace()` para obter os dados do workspace e comparar o `userId` logado com `workspace.ownerId`.

2.  **Fluxo de UI:**

    - Um campo de texto para inserir o e-mail ou o ID de usuário do novo proprietário.
    - Um botão "Transferir Propriedade", que fica desabilitado até que um valor seja inserido.
    - **Lógica de Detecção:** No `handleSubmit`, o componente verificará o formato do input. Se começar com `user_`, enviará no campo `newOwnerId`. Caso contrário, enviará como `newOwnerEmail`.

3.  **Modal de Confirmação:**
    - Exibir uma mensagem de aviso clara e inequívoca:
      > "Você está prestes a transferir a propriedade do workspace **[Nome do Workspace]** para **[email ou id do novo dono]**. Você perderá as permissões de proprietário e se tornará um administrador. Esta ação não pode ser desfeita. Para confirmar, digite o nome do workspace abaixo."
    - Incluir um campo de texto onde o usuário deve digitar o nome do workspace para habilitar o botão de confirmação final. Isso previne ações acidentais.
    - Ao confirmar, o frontend fará a chamada `POST` para a API criada na Fase 1.
    - Exibir feedback visual (loading/spinner) e tratar as respostas de sucesso ou erro (usando `sonner` para notificações).

---

## 5. Checklist de Segurança e Padrões (Pré-Merge)

- [ ] A API de transferência usa `getCurrentAuth()`?
- [ ] A API verifica estritamente se o requisitante é o `ownerId`?
- [ ] A API valida se o usuário de destino (por ID ou e-mail) existe antes de fazer a transferência?
- [ ] O frontend oculta a opção de transferir para não-proprietários?
- [ ] O modal de confirmação exige uma ação explícita do usuário (digitar o nome) para evitar acidentes?
- [ ] O acesso ao banco de dados é feito via `lib/db.js`?
- [ ] A API lida corretamente com os dois cenários de input (`newOwnerId` e `newOwnerEmail`)?
