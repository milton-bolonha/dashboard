# 🚀 Como Configurar o Primeiro Super Administrador

Este documento explica o processo seguro e de uso único para configurar o primeiro usuário com permissões de Super Administrador no sistema.

## Visão Geral

O processo foi centralizado em um único comando para simplificar o setup. Ele irá gerar **duas** chaves necessárias:

1.  **Chave de Criptografia (`CLERK_ENCRYPTION_KEY`):** Uma chave permanente que deve ser adicionada ao seu arquivo `.env.local` para garantir a segurança da comunicação do Clerk.
2.  **Chave de Super Admin:** Uma chave temporária e de uso único para promover seu usuário.

---

## Passo a Passo

### Passo 1: Gerar as Chaves de Configuração

1.  **Abra o terminal na pasta raiz do projeto** (`dash/`).

2.  Execute o seguinte comando:

    ```bash
    npm run dash:superadmin
    ```

3.  O terminal exibirá um guia passo a passo. Primeiro, ele pedirá o **User ID** do usuário do Clerk que você deseja promover.

    - **Como encontrar o User ID:** Vá para o seu [Clerk Dashboard](https://dashboard.clerk.com/), navegue até a seção "Users", clique no usuário desejado e copie o ID da URL. Ele se parecerá com `user_2abc...`.

4.  Após inserir o User ID, o terminal exibirá as chaves. Siga as instruções cuidadosamente.

    **Exemplo da Saída do Terminal:**

    ```
    --- Configuração de Super Administrador ---

    Este script irá gerar uma chave de uso único para promover um usuário a Super Admin.
    Você precisará do User ID do Clerk para o usuário que deseja promover.
    Você pode encontrá-lo na URL ao visualizar um usuário no Clerk Dashboard:
    Ex: https://dashboard.clerk.com/apps/.../users/user_2abcd...

    Por favor, insira o User ID do Clerk: user_2zABC...

    ✅ Chaves geradas com sucesso para o usuário: user_2zABC...

    Passo 1: Adicione a seguinte chave ao seu arquivo `dashboard/.env.local`
    --------------------------------------------------------------------
    CLERK_ENCRYPTION_KEY=
    clerk-enc-key-e5a3... (exemplo)
    --------------------------------------------------------------------

    Passo 2: Guarde esta chave de uso único. Você precisará dela no navegador.
    A chave é válida apenas para o usuário informado e expira em 10 minutos.
    --------------------------------------------------------------------
    Chave de Super Admin:
    ds-sa-key-f9b1... (exemplo)
    --------------------------------------------------------------------

    Passo 3: Siga as próximas etapas
      1. Se o servidor estiver rodando, reinicie-o (`npm run dash:dev`).
      2. Faça login com o seu usuário.
      3. Visite a URL: http://localhost:3000/dashboard/access/permissions
      4. Clique em 'Ativar Chave de Acesso' e cole a chave do Passo 2.

    --------------------------------------------------------------------
    ```

### Passo 2: Configurar o Ambiente e Ativar a Chave

1.  **Copie a `CLERK_ENCRYPTION_KEY`** exibida no terminal e adicione-a ao seu arquivo `dashboard/.env.local`.

2.  **Copie a `Chave de Super Admin`** temporária.

3.  **Reinicie o servidor de desenvolvimento** (`npm run dash:dev`) para que a nova variável de ambiente seja carregada.

4.  Com o servidor rodando, **siga as instruções do Passo 3** exibidas no terminal: faça login com o usuário que você especificou, visite a URL fornecida e use a chave no modal para se promover a super admin. A chave não funcionará para nenhum outro usuário.

### Conclusão do Processo

Após a ativação, seu usuário terá a role `superadmin`, a chave temporária será destruída, e você terá acesso a todas as áreas administrativas do dashboard. O processo de setup estará completo.
