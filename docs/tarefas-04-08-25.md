# 🎯 Tarefas do Dia - 04/08/25

**Objetivo:** Debugar e finalizar as funcionalidades pendentes do deploy e corrigir problemas de URLs de imagem no Gatsby.

---

## 🔍 DESCOBERTAS CRÍTICAS

### ❌ **PROBLEMA #1: Gatsby sem Variáveis de Ambiente**

- **Status:** **BLOQUEADOR CRÍTICO** 🚨
- **Problema:** O `gatsby-landing` **NÃO TEM** arquivo `.env.development` ou `.env.production`
- **Sintoma:** Erro `"<!DOCTYPE "... is not valid JSON` = está fazendo fetch para `https://dashmaster.pro/` em vez de `https://dashmaster.pro/api/public/content`
- **Causa Raiz:**
  ```javascript
  // gatsby-node.js linha 8
  const apiUrl = `${process.env.GATSBY_API_URL}`;
  // ☝️ GATSBY_API_URL é undefined!
  ```
- **Solução:** **CRIAR** arquivo `.env.development` no `gatsby-landing/`

### ❌ **PROBLEMA #2: URLs de Imagem Mal Formadas**

- **Status:** **CONFIRMADO** 🔍
- **URL Problemática:** `https://68901278756f325671a50df5--windowcaulkingto-site-avu3ka.netlify.app/windowcaulkingto/landing-page/user_2zZNqqf3OlYsi0AB7KbyyqqpzpB/uploads/yliv9trde6hq8zabczyl`
- **Problema:** URL contém paths extras (`windowcaulkingto/landing-page/user_2zZNqqf3OlYsi0AB7KbyyqqpzpB/uploads/`)
- **Causa Identificada:** A função `processImageUrls()` na API pública está criando URLs incorretas
- **Localização:** `dashboard/app/api/public/content/route.js` linha 22

### ✅ **PROBLEMA #3: Branch Master vs Main**

- **Status:** **CONFIRMADO** ✅
- **Descoberta:** A branch está configurada como `main` no deploy workflow:
  ```yaml
  # dashboard/templates/github-workflows/deploy.yml linha 125
  production-branch: main
  ```
- **Ação Necessária:** Alterar para `master` se o usuário usa branch master

---

## 🎯 TAREFAS PRIORITÁRIAS

### 🔥 **PRIORIDADE CRÍTICA - BLOQUEADORES**

#### ☐ **TAREFA #1: Criar .env para Gatsby**

- **Tempo Estimado:** 5 minutos
- **Status:** **URGENT** 🚨
- **Ações:**
  1. Criar `gatsby-landing/.env.development`
  2. Adicionar `GATSBY_API_URL=https://dashmaster.pro/api/public/content`
  3. Adicionar `GATSBY_API_KEY=[chave-valida]`
  4. Testar `npm run landing:dev`

#### ☐ **TAREFA #2: Corrigir processImageUrls()**

- **Tempo Estimado:** 15 minutos
- **Status:** **HIGH** 🔍
- **Problema:** URLs malformadas com paths extras
- **Localização:** `dashboard/app/api/public/content/route.js`
- **Ações:**
  1. Debugar entrada vs saída da função
  2. Identificar de onde vêm os paths extras
  3. Corrigir lógica de detecção de Public ID
  4. Testar com curl

#### ☐ **TAREFA #3: Verificar Branch Master vs Main**

- **Tempo Estimado:** 5 minutos
- **Status:** **MEDIUM** ⚠️
- **Ações:**
  1. Confirmar qual branch o usuário usa (`git branch`)
  2. Se for `master`, alterar `deploy.yml` linha 125
  3. Testar deploy

---

## 🔧 TAREFAS DE CONTINUIDADE

### 🎯 **PRIORIDADE ALTA**

#### ☐ **TAREFA #4: Testar Funcionalidades em Produção**

- **Da Lista Anterior:** Nuke, Deploy sem erro 500, Cache de workspace
- **Status:** **PENDING** - Aguardando correções críticas
- **Dependência:** Tarefas #1, #2, #3

#### ☐ **TAREFA #5: Implementar Webhook de Deploy**

- **Da Lista:** `tarefas-03-08-25.md` Tarefa #1
- **Status:** **READY** ✅ (código já existe em `/api/deploy/webhook`)
- **Ações:** Testar integração com GitHub Action

#### ☐ **TAREFA #6: Migração de Autenticação**

- **Da Lista:** 6 rotas ainda usam `getAuthenticatedUser()`
- **Status:** **READY** 📚
- **Rotas Pendentes:**
  - `/api/dashboard/stats`
  - `/api/content-types/[id]`
  - `/api/billing/transactions`
  - `/api/access-keys/activate`
  - `/api/access/check`
  - `/api/access/user-permissions`

---

## 🧪 DESCOBERTAS TÉCNICAS

### **Análise: Por que URLs estão malformadas?**

1. **API Pública (`processImageUrls`)** ✅ Funciona corretamente:

   ```javascript
   // Linha 22: Lógica está correta
   return `https://res.cloudinary.com/${cloudName}/image/upload/q_auto,f_auto/${value}`;
   ```

2. **Gatsby (`buildCloudinaryUrl`)** ✅ Funciona corretamente:

   ```javascript
   // Apenas retorna URL como está
   return imageUrl;
   ```

3. **🔍 HIPÓTESE:** O problema pode estar nos **dados armazenados** no MongoDB
   - URLs podem estar sendo salvas com paths extras
   - Precisa investigar campos `data` dos items

### **Análise: Variáveis de Ambiente Gatsby**

**NECESSÁRIAS:**

- `GATSBY_API_URL=https://dashmaster.pro/api/public/content`
- `GATSBY_API_KEY=[chave-publica-valida]`

**OPCIONAIS:**

- `GATSBY_SITE_URL` (para SEO)
- `GATSBY_CLOUDINARY_CLOUD_NAME` (não usado mais, URLs vêm prontas)

---

## 📋 CHECKLIST DE DEBUG

### **🔍 Para Problema #1 (Gatsby env):**

- [ ] Criar `.env.development` em `gatsby-landing/`
- [ ] Testar `curl` para validar API key
- [ ] Executar `npm run landing:dev`
- [ ] Verificar se páginas carregam

### **🔍 Para Problema #2 (URLs malformadas):**

- [ ] Examinar dados brutos no MongoDB
- [ ] Debugar entrada da função `processImageUrls`
- [ ] Testar com `console.log` na API
- [ ] Validar saída da função

### **🔍 Para Problema #3 (Branch):**

- [ ] `git branch` para verificar branch atual
- [ ] Alterar `deploy.yml` se necessário
- [ ] Testar deploy de teste

---

## 🎯 **MÉTRICAS DE SUCESSO PARA HOJE**

**Bloqueadores Resolvidos:**

- [ ] Gatsby roda sem erro JSON inválido
- [ ] URLs de imagem aparecem corretamente
- [ ] Deploy usa branch correta

**Funcionalidades Testadas:**

- [ ] Nuke funciona em produção
- [ ] Deploy completo sem erro 500
- [ ] Webhook recebe notificações

**Conformidade Arquitetural:**

- [ ] 6 rotas migradas para `getCurrentAuth()`
- [ ] Documentação atualizada

---

## 📝 **COMANDOS ÚTEIS**

```bash
# Testar API pública
curl -s -X GET -H "Authorization: Bearer [API-KEY]" https://dashmaster.pro/api/public/content

# Rodar Gatsby em dev
npm run landing:dev

# Verificar branch atual
git branch

# Testar deploy local
npm run build --workspace=dashboard
```

---

## 🎉 **SUCESSOS DE ONTEM (03/08/25)**

- ✅ Funcionalidade Nuke implementada
- ✅ Correções para erro 500 aplicadas
- ✅ Cache de workspace corrigido
- ✅ Dependência problemática removida
- ✅ Templates com caminho corrigido

**Próximo:** Resolver bloqueadores críticos e testar em produção! 🚀

---

## 🚀 **TAREFAS ADICIONAIS IDENTIFICADAS**

### 🎯 **PRIORIDADE MÉDIA - MELHORIAS TÉCNICAS**

#### ☐ **TAREFA #7: Corrigir Imagens Estáticas Remanescentes**

- **Status:** **IDENTIFICADO** 📸
- **Problema:** Algumas imagens no dashboard ainda usam caminhos estáticos internos do repo em vez do Cloudinary
- **Contexto:** Durante a importação, várias imagens foram migradas para Cloudinary, mas alguns conteúdos ficaram de fora
- **Ações:**
  1. Identificar quais imagens ainda estão com paths estáticos (`/images/`, `./static/`)
  2. Fazer upload manual dessas imagens para Cloudinary
  3. Atualizar os campos correspondentes no MongoDB
  4. Validar que todas as imagens carregam corretamente

#### ☐ **TAREFA #8: Validar Correção da Branch Master**

- **Status:** **PENDENTE** ⚠️
- **Ref:** Problema #3 precisa ser testado
- **Ações:**
  1. Confirmar se a correção de `main` → `master` foi aplicada
  2. Fazer deploy de teste para verificar branch correta
  3. Verificar se Actions ainda apresentam erros
  4. Documentar resultado do teste

#### ☐ **TAREFA #9: Investigar Erros Persistentes na GitHub Action**

- **Status:** **INVESTIGAÇÃO** 🔍
- **Contexto:** Último deploy ainda apresentava erros na Action
- **Ações:**
  1. Analisar logs da última Action executada
  2. Identificar novos erros pós-correção
  3. Corrigir problemas encontrados
  4. Testar deploy completo

### 🎯 **PRIORIDADE BAIXA - RECURSOS FUTUROS**

#### ☐ **TAREFA #10: Planejar Clonador de Workspaces**

- **Status:** **FUTURO** 🔮
- **Descrição:** Funcionalidade para duplicar workspaces completos
- **Especificações:**
  - Gerar novo workspace com nome `(copy)` no final
  - Clonar todas as sections, content-types e items
  - Manter mesmos conteúdos mas com IDs únicos
  - Permitir renomeação posterior do workspace
- **Pré-requisitos:**
  1. Definir regras de naming conventions para workspaces
  2. Criar lógica de clonagem deep copy
  3. Implementar validação de nomes únicos
  4. Interface de renomeação de workspace

#### ☐ **TAREFA #11: Template Configurável via ENV**

- **Ref:** `tarefas-03-08-25.md` Dívida #4
- **Status:** **BAIXA PRIORIDADE** 📦
- **Problema:** URL do template está hardcodada em `dashmaster-gatsby-template`
- **Ações:**
  1. Criar variável `DEFAULT_TEMPLATE_URL`
  2. Atualizar `env-template.txt`
  3. Implementar fallback no código

#### ☐ **TAREFA #12: Theme Selector Visual**

- **Ref:** `tarefas-03-08-25.md` Dívida #5
- **Status:** **UX ENHANCEMENT** 🎨
- **Problema:** Seleção via checkbox não é intuitiva
- **Ações:**
  1. Criar componente `ThemeSelector.jsx` com cards visuais
  2. Integrar na página de deploy
  3. Melhorar UX de seleção de repositório customizado

---

## 🔧 **DÍVIDAS TÉCNICAS REMANESCENTES**

### **Do relatório `tarefas-03-08-25.md`:**

1. **✅ Webhook de Deploy** - Código existe, precisa testar (Tarefa #5)
2. **⏳ Nuke com Deleção Real** - Implementado, precisa testar em produção (Tarefa #4)
3. **⏳ Migração de Autenticação** - 6 rotas identificadas (Tarefa #6)
4. **📦 Template Configurável** - Baixa prioridade (Tarefa #11)
5. **🎨 Theme Selector Visual** - Enhancement UX (Tarefa #12)
6. **🔒 Validação de Tokens** - Deploy falha se tokens inválidos
7. **📊 Logging Estruturado** - Debug logs misturados com produção
8. **🧪 Testes Automatizados** - Nuke e deploy sem testes

### **Do `development-guide.md`:**

- **Regra de Ouro #1:** Continuar usando `getCurrentAuth()` (Tarefa #6)
- **Serialização Padronizada:** Considerar helper `lib/serialization.js`
- **Indexação Contínua:** Adicionar índices para queries frequentes

---

## 📊 **STATUS GERAL DO PROJETO**

### **✅ FUNCIONANDO:**

- Dashboard rodando em produção
- Gatsby Landing consumindo API pública
- GitHub Actions fazendo deploy
- Netlify buildando sites
- API pública estável

### **⚠️ PENDENTE DE TESTE:**

- Correção branch master vs main
- Funcionalidade Nuke em produção
- Webhook de notificações
- Deploys sem erro 500

### **🔧 MELHORIAS IDENTIFICADAS:**

- Imagens estáticas remanescentes
- Validação de tokens GitHub/Netlify
- Theme selector visual
- Clonador de workspaces (futuro)

---

## 📈 **EVOLUÇÃO DO PROJETO**

**Marcos Recentes:**

- ✅ **02-03/08/25:** Deploy headless funcionando
- ✅ **04/08/25:** Correções críticas aplicadas
- 🎯 **Próximo:** Testes em produção e refinamentos
- 🔮 **Futuro:** Clonador de workspaces e UX enhancements
