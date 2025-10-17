# 📋 Guia de Desenvolvimento: Sistema de Templates

## 🎯 **Visão Geral**

O sistema de templates do DashMaster.PRO usa a classe `TemplateGenerator` para gerar dinamicamente arquivos de configuração, workflows e código fonte. **NÃO** lemos arquivos físicos de template - tudo é gerado programaticamente.

## 🏗️ **Arquitetura**

### **TemplateGenerator Class**

- **Localização:** `dashboard/lib/deployment/template-generator.js`
- **Responsabilidade:** Gerar conteúdo de arquivos dinamicamente
- **Métodos principais:**
  - `generateGitHubWorkflow()` - Gera YAML do GitHub Action
  - `generateGatsbyConfig()` - Gera configuração do Gatsby
  - `generatePackageJson()` - Gera package.json
  - `generateNetlifyConfig()` - Gera netlify.toml

### **Deploy Orchestrator**

- **Localização:** `dashboard/lib/deployment/deploy-orchestrator.js`
- **Responsabilidade:** Orquestrar o processo de deploy
- **Uso do TemplateGenerator:**
  ```javascript
  const { TemplateGenerator } = await import("./template-generator.js");
  const templateGenerator = new TemplateGenerator(context.workspace);
  const workflowContent = templateGenerator.generateGitHubWorkflow();
  ```

## ⚠️ **PROBLEMAS COMUNS E SOLUÇÕES**

### **1. Erro ENOENT - Template não encontrado**

#### **❌ PROBLEMA:**

```
ENOENT: no such file or directory, open '/var/task/dashboard/templates/github-workflows/deploy.yml'
```

#### **🔍 CAUSA:**

- Tentativa de ler arquivo físico de template
- Arquivo não existe no ambiente de produção (Netlify)
- Plugin Next.js limpa arquivos após build

#### **✅ SOLUÇÃO:**

- **NUNCA** tentar ler arquivo físico de template
- **SEMPRE** usar `TemplateGenerator` para gerar conteúdo
- **EXEMPLO CORRETO:**

  ```javascript
  // ✅ CORRETO - Gerar dinamicamente
  const templateGenerator = new TemplateGenerator(context.workspace);
  const workflowContent = templateGenerator.generateGitHubWorkflow();

  // ❌ ERRADO - Tentar ler arquivo
  const fs = await import("fs");
  const content = fs.readFileSync("templates/deploy.yml", "utf8");
  ```

### **2. Erro Git --local**

#### **❌ PROBLEMA:**

```
fatal: --local can only be used inside a git repository
```

#### **🔍 CAUSA:**

- `rm -rf .git` remove o repositório git do usuário
- Depois tenta fazer `git commit` e `git push`

#### **✅ SOLUÇÃO:**

- **NUNCA** remover `.git` do repositório do usuário
- **EXEMPLO CORRETO:**
  ```yaml
  - name: Clone Template for Build
    run: |
      git clone ${{ github.event.inputs.template_repo }} /tmp/template
      cp -r /tmp/template/* .
      # NÃO remover .git - precisamos dele para o commit final!
  ```

## 🛠️ **COMO ADICIONAR NOVOS TEMPLATES**

### **1. Adicionar Método na TemplateGenerator**

```javascript
// Em dashboard/lib/deployment/template-generator.js
class TemplateGenerator {
  // ... métodos existentes ...

  generateNovoTemplate() {
    return `conteúdo do template aqui`;
  }
}
```

### **2. Usar no Deploy Orchestrator**

```javascript
// Em dashboard/lib/deployment/deploy-orchestrator.js
const templateGenerator = new TemplateGenerator(context.workspace);
const novoTemplateContent = templateGenerator.generateNovoTemplate();
```

## 📁 **ESTRUTURA DE ARQUIVOS**

### **Arquivos de Template (NÃO USAR)**

- `dashboard/templates/github-workflows/deploy.yml` - **DEPRECATED**
- Qualquer arquivo em `templates/` - **DEPRECATED**

### **Arquivos de Geração (USAR)**

- `dashboard/lib/deployment/template-generator.js` - **ATIVO**
- `dashboard/lib/deployment/deploy-orchestrator.js` - **ATIVO**

## 🔄 **FLUXO DE DEPLOY**

### **1. Início do Deploy**

```javascript
// deploy-orchestrator.js
const templateGenerator = new TemplateGenerator(context.workspace);
```

### **2. Geração do Workflow**

```javascript
const workflowContent = templateGenerator.generateGitHubWorkflow();
```

### **3. Criação do Repositório**

```javascript
await gitManager.createRepository(repoName, workflowContent);
```

### **4. Execução da GitHub Action**

- Action é criada no repositório do usuário
- Executa o workflow gerado dinamicamente
- Faz deploy no Netlify

## 🧹 **LIMPEZA DE ARQUIVOS**

### **Arquivos que DEVEM ser removidos no final:**

```bash
rm -rf node_modules 2>/dev/null || true
rm -rf public 2>/dev/null || true
rm -rf src 2>/dev/null || true
rm -f gatsby-*.js 2>/dev/null || true
rm -f package*.json 2>/dev/null || true
```

### **Arquivos que NÃO DEVEM ser removidos:**

```bash
# ❌ NUNCA fazer isso:
rm -rf .git  # Quebra o repositório
```

## 🎯 **BEST PRACTICES**

### **1. Sempre Gerar Dinamicamente**

- ✅ Use `TemplateGenerator`
- ❌ Não leia arquivos físicos

### **2. Preserve Repositório Git**

- ✅ Mantenha `.git` intacto
- ❌ Não remova `.git`

### **3. Trate Erros Graciosamente**

- ✅ Use `|| exit 0` em comandos opcionais
- ❌ Não quebre o workflow por erros não críticos

### **4. Logs Informativos**

- ✅ Adicione logs para debug
- ❌ Não deixe silencioso

## 🔍 **DEBUGGING**

### **Logs Úteis para Debug:**

```javascript
console.log(
  `[${context.deploymentId}] 🔍 Debug - Process.cwd(): ${process.cwd()}`
);
console.log(
  `[${context.deploymentId}] 🔍 Debug - Workspace: ${context.workspace.name}`
);
console.log(
  `[${context.deploymentId}] ✅ Template gerado usando TemplateGenerator`
);
```

### **Comandos de Verificação:**

```bash
# Verificar se é repositório git válido
if [ -d ".git" ]; then
  echo "✅ Repositório git válido"
else
  echo "❌ Não é repositório git"
fi
```

---

## 📚 **REFERÊNCIAS**

- **TemplateGenerator:** `dashboard/lib/deployment/template-generator.js`
- **Deploy Orchestrator:** `dashboard/lib/deployment/deploy-orchestrator.js`
- **Git Manager:** `dashboard/lib/deployment/git-manager.js`

---

**💡 LEMBRE-SE:** Sempre use `TemplateGenerator` para gerar conteúdo dinamicamente. Nunca tente ler arquivos físicos de template!
