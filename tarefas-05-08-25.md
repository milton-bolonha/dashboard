# 🎯 Tarefas do Dia - 05/08/25

**Objetivo:** Diagnosticar e corrigir as falhas críticas de deploy relacionadas à conexão com o banco de dados e erros no script da GitHub Action.

---

## 🔥 **PROBLEMAS CRÍTICOS IDENTIFICADOS**

### ❌ **PROBLEMA #1: Falha de Conexão com MongoDB (BLOQUEADOR CRÍTICO)**

- **Sintoma:** Logs da Netlify mostram `MongoServerSelectionError: Server selection timed out after 30000 ms`.
- **Impacto:** A API não consegue se conectar ao banco de dados, causando falha em cascata em todas as operações, incluindo o webhook.
- **Causa Provável:**
  1. Variável de ambiente `MONGODB_URI` incorreta na Netlify.
  2. IP da Netlify não está liberado no IP Access List do MongoDB Atlas.

### ❌ **PROBLEMA #2: Webhook Não Encontra o Deploy ID**

- **Sintoma:** Action log mostra `{"error":"Deployment não encontrado"}`.
- **Impacto:** O dashboard não é notificado sobre o progresso do deploy.
- **Causa Raiz Confirmada:** Inconsistência na forma como o ID do deploy é salvo versus como ele é buscado. O sistema salva o ID no campo `_id` do documento, mas o webhook o procura em um campo chamado `deploymentId` (que não existe).

### ❌ **PROBLEMA #3: Erro de "Arquivo ou Diretório Não Encontrado" na GitHub Action**

- **Sintoma:** Action log mostra `mv: target './website/': No such file or directory`.
- **Impacto:** A Action falha e o deploy não é concluído.
- **Causa Raíz Confirmada:** O script de deploy tenta mover os arquivos buildados para a pasta `./website/` antes de criar essa pasta.

---

## 🎯 **TAREFAS PRIORITÁRIAS PARA HOJE**

### ✅ **TAREFA #1: Corrigir Busca do Webhook (Implementado)**

- **Ação:** Alterar a query no endpoint do webhook (`/api/deploy/webhook`) para buscar o deploy pelo campo `_id` em vez do campo inexistente `deploymentId`.
- **Status:** **CONCLUÍDO**.

### ✅ **TAREFA #2: Corrigir Script da GitHub Action (Implementado)**

- **Ação:** Adicionar o comando `mkdir -p website content` no workflow gerado pelo `deploy-orchestrator.js` para garantir que os diretórios de destino existam antes de mover os arquivos.
- **Status:** **CONCLUÍDO**.

### 🟡 **TAREFA #3: Investigar Conexão com MongoDB (Ação do Usuário Necessária)**

- **Ação:** Verificar as configurações na Netlify e no MongoDB Atlas.
- **Status:** **PENDENTE - AGUARDANDO VERIFICAÇÃO DO USUÁRIO**.
- **Instruções para o Usuário:**
  1. **No MongoDB Atlas:**
     - Vá para "Network Access".
     - Adicione uma entrada de "IP Access List" com o valor `0.0.0.0/0` (Allow Access From Anywhere). Isso é necessário porque os IPs da Netlify são dinâmicos.
  2. **Na Netlify:**
     - Vá para as configurações do seu site > "Build & deploy" > "Environment".
     - Verifique se a variável de ambiente `MONGODB_URI` está presente e se o valor está 100% correto, incluindo usuário, senha e nome do banco de dados.
