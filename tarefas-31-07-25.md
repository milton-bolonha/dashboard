# 🎯 Tarefas para Lançamento do Sistema de Deploy - 31/07/25 (Versão 2)

**Objetivo:** Validar o fluxo de deploy de ponta a ponta, desde a configuração local até a publicação de um site funcional na Netlify.

---

## ✅ Dívida Técnica Resolvida

### ☐ **Tarefa: Organizar Estrutura de Arquivos do Deploy**

- **Descrição:** A pasta `templates/`, contendo o workflow do GitHub Actions, estava na raiz do projeto, mas sua única referência era dentro do `dashboard`.
- **Status:** ✅ **CONCLUÍDO**
- **Ações Realizadas:**
  1. A pasta `templates/` foi movida para `dashboard/templates/`.
  2. O caminho de referência no `dashboard/lib/deployment/deploy-orchestrator.mjs` foi atualizado para o novo local.
- **Resultado Esperado:** Estrutura do projeto mais limpa e lógica, sem quebra de funcionalidades.

---

## 🚀 Próximos Passos: Validação de Ponta a Ponta

O plano agora é focado em garantir a estabilidade e o funcionamento do ambiente de desenvolvimento local para validar o novo sistema de deploy.

### ☐ **Tarefa 1: Validar o `gatsby-landing` Localmente**

- **Descrição:** Garantir que o template `gatsby-landing` funcione perfeitamente de forma isolada, consumindo os dados de uma API pública do DashMaster.PRO local.
- **Passos:**
  1.  Configurar um `.env.development` no `gatsby-landing` para apontar para a API local (`http://localhost:3000`).
  2.  Obter uma API Key pública da instância local do DashMaster.
  3.  Rodar `npm install` e `gatsby develop` no diretório `gatsby-landing`.
- **Resultado Esperado:** O site `gatsby-landing` deve rodar em `http://localhost:8000` e exibir todo o conteúdo cadastrado na instância local do DashMaster.

### ☐ **Tarefa 2: Criar o Repositório Template no GitHub**

- **Descrição:** Transformar o `gatsby-landing` (já validado) no repositório `dashmaster-gatsby-template` que será usado pela GitHub Action.
- **Pré-requisito:** A Tarefa 1 deve estar 100% concluída.
- **Passos:**
  1.  Criar um novo repositório **público** no GitHub: `milton-bolonha/dashmaster-gatsby-template`.
  2.  Copiar o código do `gatsby-landing` (sem `node_modules` ou `.env.*`) para este novo repositório.
  3.  Fazer o push do código para o GitHub.
- **Resultado Esperado:** Um repositório público contendo a versão mais estável e funcional do template.

### ☐ **Tarefa 3: Executar o Deploy de Ponta a Ponta**

- **Descrição:** Realizar o primeiro deploy utilizando a nova arquitetura para validar a integração de todos os componentes.
- **Pré-requisito:** As Tarefas 1 e 2 devem estar concluídas.
- **Passos:**
  1.  Acessar a página de "Deploy" no dashboard local.
  2.  Iniciar um novo deploy, fornecendo os tokens necessários do GitHub e da Netlify.
  3.  Monitorar o processo através dos logs do backend, da UI do dashboard e da página da GitHub Action no repositório recém-criado.
- **Resultado Esperado:** Um site funcional publicado na Netlify, criado e gerenciado pelo DashMaster.PRO.
