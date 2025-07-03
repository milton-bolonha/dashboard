# 🚀 Como Configurar o Primeiro Super Administrador

Este documento explica o processo seguro e de uso único para configurar o primeiro usuário com permissões de Super Administrador no sistema.

## Visão Geral

Para evitar a necessidade de armazenar e-mails de administradores ou chaves permanentes no código ou em arquivos de ambiente, o sistema utiliza um mecanismo de **Chave de Ativação Única e Expirável**.

O processo consiste em três etapas:

1.  Gerar uma chave secreta via linha de comando.
2.  Iniciar a aplicação.
3.  Usar a chave na interface do dashboard para promover o seu usuário.

---

## Passo a Passo

### Passo 1: Gerar a Chave de Super Admin

1.  **Abra o terminal na pasta raiz do projeto** (`dash/`).

2.  Execute o seguinte comando:

    ```bash
    npm run dash:superadmin
    ```

3.  O terminal exibirá uma mensagem de sucesso e sua chave única. **Copie esta chave.**

    ```
    🔑 Chave de Super Admin gerada com sucesso!
    ==================================================
    Esta chave é de USO ÚNICO e EXPIRA EM 10 MINUTOS.
    Use-a no modal 'Ativar Chave de Acesso' no seu dashboard.

    Sua chave é:
    ds-sa-key-a1b2c3d4e5f6...
    ==================================================
    ```

    > **Importante:** A chave é válida por apenas **10 minutos**. Se você demorar mais do que isso, precisará gerar uma nova chave repetindo este passo.

### Passo 2: Iniciar a Aplicação

1.  No mesmo terminal (na pasta raiz), inicie o servidor de desenvolvimento:
    ```bash
    npm run dash:dev
    ```
2.  Isso iniciará o dashboard em `http://localhost:3000`.

### Passo 3: Ativar a Chave na Interface

1.  Abra seu navegador e acesse a aplicação. Faça login com o usuário que você deseja promover a Super Administrador.

2.  Navegue diretamente para a seguinte página:
    [http://localhost:3000/dashboard/access/permissions](http://localhost:3000/dashboard/access/permissions)

3.  No canto superior direito da página, você encontrará um botão com um ícone de chave: **"Ativar Chave de Acesso"**.

4.  Clique neste botão. Um modal será exibido.

5.  **Cole a chave** que você copiou do terminal no campo de texto e clique em "Ativar Chave".

### Conclusão do Processo

Após a ativação, o sistema irá:

- Verificar a validade da chave.
- Atribuir a role `superadmin` ao seu usuário logado.
- **Destruir a chave permanentemente.** Ela não poderá ser usada novamente.
- Recarregar a página.

Após o recarregamento, você verá a seção "Access Control" no menu lateral do dashboard, concedendo acesso às telas de gerenciamento de Planos e Chaves de Acesso. O processo está completo.
