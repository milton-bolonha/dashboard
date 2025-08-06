# 📖 Guia de Desenvolvimento e Padrões de Arquitetura - DashMaster.PRO

**Última Atualização:** 02 de Agosto de 2025

**Propósito:** Este documento é a nossa **fonte única da verdade** para as regras de arquitetura, padrões de código e soluções para problemas comuns. Ele deve ser consultado antes de iniciar novas features para garantir consistência, segurança e performance.

---

## 🏛️ I. Padrões de Arquitetura Fundamentais

### **Regra de Ouro #1: Autenticação Centralizada**

- **Descrição:** **TODA** rota de API no backend que necessita de autenticação **DEVE** usar o helper centralizado `getCurrentAuth()` de `lib/auth.js`.
- **Justificativa:** O uso direto de funções do Clerk (`getAuth`) se provou inconsistente. Nossa função centralizada contém a lógica de fallback para JWT, garantindo que a identidade do usuário seja obtida de forma confiável em todos os ambientes.
- **Referência:** `docs/dashboard/DEBUGGING-GUIDE.md` (Problemas 1, 9, 11).

### **Regra de Ouro #2: Acesso a Dados via `lib/db.js`**

- **Descrição:** Todo o acesso ao banco de dados (operações CRUD) deve ser feito através do nosso helper `db` exportado de `lib/db.js`.
- **Justificativa:** Centraliza o gerenciamento da conexão com o MongoDB (connection pooling), o que é vital para a performance em ambientes serverless e evita o esgotamento de conexões.
- **Referência:** `docs/seguranca-performance.md` (Tópico 2.4).

### **Regra de Ouro #3: Nunca Confie no Frontend para Permissões**

- **Descrição:** O frontend **NUNCA** deve conter lógica de permissão. Ele apenas reage ao que o backend (via API e, futuramente, o `Access Engine`) permite ou nega. `privateMetadata` do Clerk, por exemplo, não é acessível no cliente.
- **Justificativa:** É a base da nossa segurança. As decisões de acesso devem ser tomadas no servidor, que é um ambiente controlado. A UI apenas renderiza o resultado.
- **Implementação:** Foi criada a rota segura `/api/auth/check-role` para que o frontend possa verificar a role de um usuário sem acessar dados sensíveis.
- **Referência:** `docs/dashboard/DEBUGGING-GUIDE.md` (Problema 11), `docs/seguranca-performance.md` (Tópico 2.6).

### **Regra de Ouro #4: A GitHub Action é um Ambiente Isolado**

- **Descrição:** Uma GitHub Action executa em um servidor limpo e isolado do GitHub. Ela **NÃO** tem acesso às variáveis de ambiente, ao contexto ou ao estado do nosso backend.
- **Justificativa:** Entender este isolamento previne erros de comunicação. Qualquer informação que a Action precise (como URLs de webhook, chaves de API ou IDs de deploy) **DEVE** ser passada explicitamente do nosso backend para a Action através de `inputs` no `workflow_dispatch`.
  - **Referência:** Correção do erro `Could not resolve host: undefined` no fluxo de deploy em 02/08/25.

### **Regra de Ouro #5: A API é a Única Fonte da Verdade**

- **Descrição:** **TODA** a lógica de formatação, processamento e preparação de dados para o frontend **DEVE** residir no backend (API). Os templates (Gatsby, etc.) devem ser o mais "burros" possível, focando apenas em renderizar os dados que recebem, já prontos para uso.
- **Justificativa:** Centralizar a lógica de dados na API garante consistência, segurança e manutenibilidade. Evita a duplicação de código em múltiplos frontends e garante que a fonte da verdade seja única e controlada.
- **Referência:** `docs/dashboard/DEBUGGING-GUIDE.md` (Problema 14: URLs de Imagem Quebradas).

### **Regra de Ouro #6: TemplateGenerator é a Fonte dos Templates**

- **Descrição:** **NUNCA** tente ler arquivos físicos de template. **SEMPRE** use a classe `TemplateGenerator` para gerar conteúdo dinamicamente.
- **Justificativa:** Arquivos físicos não existem no ambiente de produção (Netlify) e o plugin Next.js os remove após o build. A geração dinâmica garante que os templates estejam sempre disponíveis.
- **Implementação:** Use `TemplateGenerator` em `dashboard/lib/deployment/template-generator.js` para gerar workflows, configurações e código fonte.
- **Referência:** Correção do erro `ENOENT: no such file or directory` no sistema de deploy em 05/08/25.

### **Regra de Ouro #7: Preserve Repositórios Git em GitHub Actions**

- **Descrição:** **NUNCA** remova o `.git` de um repositório do usuário em uma GitHub Action, mesmo que você clone um template por cima.
- **Justificativa:** O repositório git do usuário é necessário para o commit final. Remover `.git` quebra o `git config --local` e `git push`.
- **Implementação:** Clone templates para `/tmp/template` e copie arquivos, mas preserve o `.git` original.
- **Referência:** Correção do erro `fatal: --local can only be used inside a git repository` no deploy em 05/08/25.

---

## 🐞 II. Guia de Depuração e Erros Comuns

### **Problema #1: Inconsistência de Tipos no MongoDB (`String` vs. `ObjectId`)**

- **Sintomas:** Queries ao banco de dados (`db.find`, `db.findOne`) retornam `null` ou um array vazio, mesmo quando os dados parecem corretos no banco.
- **Causa Raiz:** Comparar um campo que é `String` (ex: vindo de uma URL ou de outra coleção) com um campo que é `ObjectId` no banco de dados.
- **Solução Definitiva:** Sempre garanta que os tipos coincidam. Se estiver buscando por um `_id` ou um campo de referência (`workspaceId`, `sectionId`), converta a `String` para um `ObjectId` antes de passar para a query.

```javascript
import { ObjectId } from "mongodb";

// CORRETO:
const id = new ObjectId(stringIdFromApi);
await db.findOne("items", { _id: id });

// INCORRETO:
// await db.findOne("items", { _id: stringIdFromApi });
```

- **Referência:** `docs/dashboard/DEBUGGING-GUIDE.md` (Problema 7), e a depuração da API pública em 02/08/25.

### **Problema #2: Falhas de Build no Middleware por Regex Complexo**

- **Sintomas:** Erro `Error: Invalid path: /...` durante o build, originado do `middleware.js`.
- **Causa Raiz:** O `createRouteMatcher` do Clerk não suporta regex avançado (como negative lookaheads).
- **Solução Definitiva:** Use uma abordagem "segura por padrão". Proteja tudo e defina uma lista simples de rotas públicas, em vez de tentar excluir rotas de uma regra geral.
- **Referência:** `docs/dashboard/DEBUGGING-GUIDE.md` (Problema 2).

### **Problema #3: Funções de Busca (ex: `listKeys`) Quebrando com Filtros Vazios**

- **Sintomas:** Erro `500 Internal Server Error` ao listar recursos em páginas de admin.
- **Causa Raiz:** A função de busca tenta construir uma query com filtros que são `undefined` ou `null`.
- **Solução Definitiva:** Construa o objeto `query` dinamicamente, apenas adicionando as chaves se os filtros correspondentes forem válidos.
- **Referência:** `docs/dashboard/DEBUGGING-GUIDE.md` (Problema 8).

### **Problema #4: Erro ENOENT - Template não encontrado**

- **Sintomas:** `ENOENT: no such file or directory, open '/var/task/dashboard/templates/github-workflows/deploy.yml'`
- **Causa Raiz:** Tentativa de ler arquivo físico de template que não existe no ambiente de produção (Netlify).
- **Solução Definitiva:** Use `TemplateGenerator` para gerar conteúdo dinamicamente em vez de ler arquivos físicos.
- **Referência:** Correção do sistema de deploy em 05/08/25.

### **Problema #5: Erro Git --local em GitHub Actions**

- **Sintomas:** `fatal: --local can only be used inside a git repository`
- **Causa Raiz:** `rm -rf .git` remove o repositório git do usuário, quebrando comandos git subsequentes.
- **Solução Definitiva:** Preserve o `.git` original do repositório do usuário ao clonar templates.
- **Referência:** Correção do sistema de deploy em 05/08/25.

---

## ⚡ III. Performance e Otimização

### **1. Indexação de Queries**

- **Status:** Prática contínua.
- **Ação:** Sempre que uma nova query for criada, especialmente para filtrar dados por `workspaceId`, `userId`, `status`, ou outros campos usados em filtros, adicione um índice correspondente no MongoDB para garantir buscas rápidas.
- **Referência:** `docs/seguranca-performance.md` (Tópico 2.1).

### **2. Cache de Dados na API Pública**

- **Status:** Implementado (básico), com recomendação de melhoria.
- **Padrão:** Endpoints públicos que retornam dados que não mudam a todo segundo devem ter uma camada de cache.
- **Solução Ideal (Futuro):** Usar **Upstash Redis** para um cache serverless compartilhado e de alta performance.
- **Referência:** `docs/seguranca-performance.md` (Tópico 2.2).

### **3. Serialização de JSON Padronizada**

- **Status:** Prática recomendada.
- **Ação:** Considerar a criação de um helper `lib/serialization.js` para padronizar a conversão de objetos do MongoDB para o frontend, garantindo que `_id` se torne `id` (string) e que datas sejam formatadas como ISO strings.
- **Referência:** `docs/seguranca-performance.md` (Tópico 2.3).

---

## 🔍 IV. Checklist de Code Review (Pré-Merge)

**Propósito:** Uma verificação rápida para garantir que os novos Pull Requests sigam nossos padrões estabelecidos, evitando a reintrodução de bugs conhecidos.

### **Arquitetura e Segurança**

- [ ] **Autenticação Centralizada:** A rota de API usa `getCurrentAuth()` de `lib/auth.js` (e não `getAuth()` direto)?
- [ ] **Sem Lógica no Frontend:** A verificação de permissões (ex: `isSuperAdmin`) é feita via chamada de API (ex: `/api/auth/check-role`) e não tentando acessar `privateMetadata` no cliente?
- [ ] **Comunicação com Actions:** Se o backend dispara uma GitHub Action, ele está passando toda a configuração necessária (URLs, segredos) via `inputs`?

### **Banco de Dados e Prevenção de Bugs**

- [ ] **Tipos de Dados Corretos:** IDs (`_id`, `workspaceId`, etc.) estão sendo convertidos para `ObjectId` antes das queries no DB?
- [ ] **Buscas Robustas:** As funções de busca constroem a `query` dinamicamente para lidar com filtros nulos/undefined?
- [ ] **Indexação:** Se a PR introduz uma nova forma de filtrar dados, um índice correspondente foi considerado/adicionado?

---

_Este documento será a base para nossas futuras interações. Ao me pedir para desenvolver algo, você pode se referir a ele dizendo "lembre-se do nosso Guia de Desenvolvimento"._
