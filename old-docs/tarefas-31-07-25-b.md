# 🎯 Tarefas para Lançamento do Sistema de Deploy - 31/07/25

**Objetivo:** Lançar uma versão funcional e robusta do sistema de deploy, permitindo que o usuário publique seu site escolhendo entre um template padrão ou um repositório customizado.

---

## Fase 0: Estabilização e Teste da Base (CURTO PRAZO - ESSENCIAL)

_Esta fase garante que nossos alicerces são sólidos antes de construir a nova arquitetura._

### ☐ **Tarefa 1: Testar e Finalizar o `gatsby-landing`**

- **Descrição:** O `gatsby-landing` é a base do nosso primeiro template. Precisamos garantir que ele funciona perfeitamente de forma isolada, consumindo dados de uma API pública do DashMaster.
- **Pré-requisito CRÍTICO:** O endpoint `/api/public/content` **DEVE** estar funcional e acessível publicamente (via API Key) para que o Gatsby consiga buscar os dados durante o build.
- **Passos:**
  1.  Configurar um `.env` no `gatsby-landing` para apontar para a API pública.
  2.  Rodar `npm install` e `gatsby develop` localmente.
  3.  Validar se todas as páginas (`HomePage`, `CustomPage`, `CityPage`) são renderizadas corretamente com os dados da API.
  4.  Corrigir qualquer bug ou dependência quebrada.
- **Resultado Esperado:** Um projeto `gatsby-landing` 100% funcional e pronto para se tornar o `dashmaster-gatsby-template`.

### ☐ **Tarefa 2: Resolver Dívida Técnica (Deploys Fantasmas)**

- **Descrição:** Como discutido, temos deploys no banco de dados que nunca serão finalizados. Precisamos de um mecanismo de cleanup.
- **Passos:**
  1.  Criar um script `cleanup-stale-deploys.js` (pode ser executado manualmente no início).
  2.  A lógica deve encontrar `deployments` com status `iniciado` ou `progresso` há mais de 1 hora.
  3.  O script deve atualizar o status desses deploys para `falhou` com o motivo `timeout`.
- **Resultado Esperado:** Banco de dados limpo e consistência no status dos deploys.

---

## Fase 0.5: Segurança e Robustez (Pré-Lançamento)

_Garantindo que o sistema seja seguro e confiável desde o primeiro dia._

### ☐ **Tarefa 1: Implementar Rate Limiting e Sanitização de Inputs**

- **Descrição:** Proteger nossos endpoints públicos contra abuso e ataques.
- **Passos:**
  1.  Adicionar `rate limiting` no endpoint que dispara o deploy e no webhook que recebe o status.
  2.  Garantir que todos os inputs do usuário (nome do site, URL do repositório) sejam devidamente sanitizados para evitar injeção de scripts ou outros ataques.
- **Resultado Esperado:** APIs mais seguras e resilientes.

### ☐ **Tarefa 2: Robustecer o Receptor de Webhooks**

- **Descrição:** O sistema de webhooks é central. Ele precisa ser à prova de falhas.
- **Passos:**
  1.  Implementar uma validação de assinatura para garantir que os webhooks vêm de fato do GitHub.
  2.  Adicionar lógica de `retry` ou um sistema de fila (como BullMQ) para processar webhooks, caso nosso endpoint esteja temporariamente offline.
  3.  Logar cada webhook recebido para facilitar o debugging.
- **Resultado Esperado:** Comunicação confiável entre o GitHub e nosso backend.

---

## Fase 1: MVP do Deploy com GitHub Actions (PRIORIDADE MÁXIMA - CORE DO LANÇAMENTO)

_Esta é a implementação central da nova arquitetura que será lançada._

### ☐ **Tarefa 1: Criar o Repositório Template**

- **Descrição:** Transformar o `gatsby-landing` (já testado) no repositório `dashmaster-gatsby-template`.
- **Passos:**
  1.  Criar um novo repositório público no GitHub: `milton-bolonha/dashmaster-gatsby-template`.
  2.  Copiar o código do `gatsby-landing` para este novo repositório.
  3.  Remover qualquer configuração específica do ambiente de desenvolvimento.
  4.  Adicionar um `README.md` explicando a estrutura e como ele funciona.

### ☐ **Tarefa 2: Desenvolver a GitHub Action (`deploy.yml`)**

- **Descrição:** Criar o arquivo de workflow que será a alma do nosso processo de deploy. Ele viverá dentro do repositório de cada usuário.
- **Lógica da Action:**

  ```yaml
  name: Deploy DashMaster.PRO Site to Netlify

  on:
    workflow_dispatch:
      inputs:
        workspace_id:
          description: "DashMaster.PRO Workspace ID"
          required: true
        site_name:
          description: "Netlify Site Name"
          required: true
        template_repo:
          description: "Template Repository URL"
          required: true
          default: "https://github.com/milton-bolonha/dashmaster-gatsby-template"
        save_source_code:
          description: "Save template source code to repository"
          required: false
          default: "false"
        save_content_backup:
          description: "Save content as static files backup"
          required: false
          default: "true"

  jobs:
    build-and-deploy:
      runs-on: ubuntu-latest
      timeout-minutes: 15 # Adicionado para evitar execuções infinitas
      steps:
        - name: Checkout Repository
          uses: actions/checkout@v4

        - name: Clone Template for Build
          run: |
            # Clona o template em diretório temporário para build
            git clone ${{ github.event.inputs.template_repo }} /tmp/template
            cp -r /tmp/template/* .
            # Remove .git do template para não conflitar
            rm -rf .git

        - name: Setup Node.js
          uses: actions/setup-node@v4
          with:
            node-version: "20"
            cache: "npm"

        - name: Install Dependencies
          run: npm ci

        - name: Send Starting Status
          run: >
            curl -X POST -H "Authorization: Bearer ${{ secrets.WEBHOOK_SECRET }}" -H "Content-Type: application/json"
            -d '{"status": "iniciado", "run_id": "${{ github.run_id }}", "step": "setup", "message": "Iniciando o processo de deploy..."}'
            "${{ secrets.WEBHOOK_URL }}"

        - name: Build Gatsby Site
          run: |
            curl -X POST -H "Authorization: Bearer ${{ secrets.WEBHOOK_SECRET }}" -H "Content-Type: application/json" -d '{"status": "progresso", "run_id": "${{ github.run_id }}", "step": "build", "message": "Construindo o site Gatsby..."}' "${{ secrets.WEBHOOK_URL }}"
            npm run build
          env:
            # A Action precisa consumir esta API para buildar o site
            GATSBY_API_URL: https://dashmaster.pro/api/public/content
            GATSBY_API_KEY: ${{ secrets.GATSBY_API_KEY }}
            GATSBY_SITE_URL: https://${{ github.event.inputs.site_name }}.netlify.app
            NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
            NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}

        - name: Prepare Repository Structure
          run: |
            # Cria estrutura do repositório do usuário
            mkdir -p website
            mkdir -p content

            # Move arquivos estáticos buildados para website/
            cp -r public/* website/

            # Se solicitado, salva backup do conteúdo como arquivos estáticos
            if [ "${{ github.event.inputs.save_content_backup }}" = "true" ]; then
              # Aqui podemos fazer download da API e salvar em content/
              echo "Salvando backup do conteúdo..."
              # curl com GATSBY_API_KEY para baixar conteúdo e salvar em content/
            fi

            # Se solicitado, salva código fonte (OPCIONAL - padrão é false)
            if [ "${{ github.event.inputs.save_source_code }}" = "true" ]; then
              mkdir -p source
              cp -r src/ source/
              cp -r gatsby-*.js package.json source/
              cp -r .github/ source/
            fi

            # Remove arquivos temporários de build
            rm -rf node_modules public src gatsby-*.js package*.json

            # Cria README explicativo
            cat > README.md << EOF
            # Site gerado pelo DashMaster.PRO

            Este repositório contém:
            - \`website/\` - Arquivos estáticos do site (deploy no Netlify)
            - \`content/\` - Backup do conteúdo (opcional)
            - \`source/\` - Código fonte do template (opcional)

            Site: https://${{ github.event.inputs.site_name }}.netlify.app
            EOF

        - name: Deploy to Netlify
          uses: nwtgck/actions-netlify@v2
          with:
            publish-dir: "./website" # Deploy só dos arquivos estáticos
            production-branch: main
          env:
            NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
            NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}

        - name: Send Success Status
          if: success()
          run: >
            curl -X POST -H "Authorization: Bearer ${{ secrets.WEBHOOK_SECRET }}" -H "Content-Type: application/json"
            -d '{"status": "concluido", "run_id": "${{ github.run_id }}", "message": "Deploy finalizado com sucesso! 🎉"}'
            "${{ secrets.WEBHOOK_URL }}"

        - name: Send Failure Status
          if: failure()
          run: >
            curl -X POST -H "Authorization: Bearer ${{ secrets.WEBHOOK_SECRET }}" -H "Content-Type: application/json"
            -d '{"status": "falhou", "run_id": "${{ github.run_id }}", "message": "Ocorreu um erro durante o deploy. Verifique os logs da Action para mais detalhes."}'
            "${{ secrets.WEBHOOK_URL }}"

        - name: Commit Repository Structure
          run: |
            git config --local user.email "action@github.com"
            git config --local user.name "GitHub Action"
            git add .
            git commit -m "Deploy: Site estático gerado pelo DashMaster.PRO" || exit 0
            git push
  ```

### ☐ **Tarefa 3: Redesenhar a UI de Deploy no Dashboard**

- **Descrição:** A interface atual precisa ser adaptada para a nova lógica de templates e estrutura de repositório.
- **Decisão de Nomenclatura:** Manter flexibilidade - pode ser "Deploy", "Sites", "Temas", "Apps" ou dividir funcionalidades. A UI deve ser clara independente do nome.
- **Passos:**

  1. **Renomear no Sidebar:** Definir nome final (Deploy, Sites, Temas, Apps) que reflete melhor a nova capacidade.
  2. **Criar Nova Página de "Novo Site/Deploy":**
     - Um campo de "Nome do Site" (usado para Netlify e nome do repo, **tem que checar se já está em uso**).
     - Uma seção de "Escolha do Template" com duas opções:
       - **(o) Template Padrão (DashMaster Business)**: Descrição, imagem de preview.
       - **(o) Repositório Customizado**: Um campo de input para o usuário colar a URL de um repositório Git.
     - **Seção "Opções Avançadas" (colapsável):**
       - ☐ **Salvar código fonte no repositório** (padrão: false)
       - ☐ **Salvar backup do conteúdo como arquivos** (padrão: true)
       - Campo para personalizar estrutura de pastas (avançado)
     - Um campo para o Token do GitHub (com escopo `repo`, `workflow`) **já temos isso, mas vai melhorar agora a UI toda**.
     - Um campo para o Token da Netlify - melhorar UX atual.
  3. **Exibir Status:** A página principal listará os sites criados. O status será atualizado em tempo real, ouvindo os eventos que o backend recebe dos webhooks (via WebSockets ou Server-Sent Events).
  4. **Desafios de UI a resolver:**

  - Como mostrar a estrutura do repositório de forma clara?
  - Como explicar a diferença entre "só arquivos estáticos" vs "com código fonte"?
  - Como fazer o preview do template antes de escolher?
  - Como mostrar o progresso da GitHub Action em tempo real? (Agora com webhooks!)
  - Como gerenciar múltiplos sites por workspace?

  A ideia é bem simples:

No GitHub Action: Nomeie os steps de forma clara
No Backend: Crie uma função que consulta a API do GitHub
No Frontend: Mostre uma barra de progresso que atualiza a cada X segundos

O GitHub já faz o trabalho pesado de trackear os steps - você só precisa "traduzir" isso para uma interface amigável.
🚀 Criando seu site...

[████████░░░░] 65% - Construindo páginas...

✅ Template baixado
✅ Conteúdo IA integrado  
✅ Dependências instaladas
🔄 Construindo site Gatsby...
⏳ Deploy para Netlify
⏳ Configurando domínio

Tempo estimado: 2 minutos - Como gerenciar múltiplos sites por workspace?

### ☐ **Tarefa 4: Refatorar o Backend (`DeploymentOrchestrator`)**

- **Descrição:** Mudar o foco do orquestrador. Em vez de gerar arquivos, ele vai orquestrar a API do GitHub e configurar a estrutura correta.
- **Novo Deck de `netlify-deploy`:**
  1. `validateRequest`: Valida tokens e permissões.
  2. `createOrFindRepository`: Cria um novo repositório no GitHub do usuário (ex: `milton-bolonha/meu-novo-site`).
  3. `setupRepositoryStructure`: **CORRIGIDO**
     - **NÃO clona código por padrão** - só prepara estrutura vazia
     - Cria pastas: `website/` (vazia), `content/` (opcional)
     - Se `save_source_code: true`, prepara também `source/`
     - Adiciona README.md explicativo
  4. `createOrUpdateSecrets`: Injeta `GATSBY_API_KEY`, `NETLIFY_AUTH_TOKEN`, etc., nos secrets do novo repositório.
  5. `addGitHubWorkflow`: Adiciona o arquivo `.github/workflows/deploy.yml` ao repositório.
  6. `createNetlifySite`: Cria o site na Netlify (configurado para deploy da pasta `website/`).
  7. `triggerWorkflow`: Faz a chamada de API `workflow_dispatch` para a Action no repositório do usuário.
  8. ~~`monitorWorkflowRun`~~ **SUBSTITUÍDO POR WEBHOOKS!** O backend agora espera passivamente pelos status.

---

## Fase 2: Lançamento e Próximos Passos (PÓS-MVP)

_Funcionalidades que virão após o lançamento do MVP para transformar o produto na "Fábrica de Sites com IA"._

### ☐ **Tarefa 1: Implementar Command Palette (Ctrl+K)**

- **Descrição:** Adicionar a interface de comandos rápidos para navegação e ações principais.
- **Comandos Iniciais:** "ir para sites", "criar novo site", "ver documentação".

### ☐ **Tarefa 2: Implementar `brand.json` e Personalização IA**

- **Descrição:** Adicionar a etapa de "Personalização" no wizard de criação de site.
- **Passos:**
  1.  Criar um formulário para o usuário definir o `brand.json` (cores, negócio, tom de voz).
  2.  Criar o `ContentPersonalizer` que usa IA para ler os arquivos do template e adaptá-los com base no `brand.json` antes do primeiro commit.

---

**Conclusão:** Ao completar a **Fase 0** e **Fase 1**, teremos um sistema de deploy robusto, flexível e pronto para ser lançado. A **Fase 2** nos colocará no caminho da visão maior que traçamos.
