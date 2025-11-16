# 🔒 Segurança do Test Dashboard

## ⚠️ IMPORTANTE: Apenas para Desenvolvimento/Teste

Este dashboard de testes **NÃO deve ser usado em produção**. Ele foi projetado especificamente para desenvolvimento e testes locais.

---

## 🛡️ Proteções de Segurança Implementadas

### 1. **Sanitização Automática de Dados Sensíveis**

O sistema **automaticamente redata** (remove/oculta) dados sensíveis antes de salvar nos logs:

#### Headers Sensíveis (são substituídos por `[REDACTED]`):
- `Authorization`
- `Cookie`
- `X-API-Key`
- `X-Auth-Token`
- `Stripe-Signature`
- Qualquer header contendo `api-key`, `token`, `secret`, `auth`

#### Campos Sensíveis no Body (são substituídos por `[REDACTED]`):
- `password`
- `apiKey` / `api_key`
- `openai_api_key`
- `stripe_secret_key`
- `token` / `access_token` / `refresh_token`
- `credit_card` / `card_number` / `cvv`
- `ssn` / `social_security_number`
- Qualquer campo contendo `password`, `key`, `token`, `secret`

#### Parâmetros Sensíveis na URL (são substituídos por `[REDACTED]`):
- `?token=...`
- `?key=...`
- `?api_key=...`
- `?secret=...`
- `?password=...`
- `?auth=...`

### 2. **Endpoints Sensíveis Não Capturam Body**

Os seguintes endpoints **NÃO capturam o body** da requisição:
- `/api/webhooks/*` (webhooks Stripe, etc)
- `/api/auth/*` (autenticação)
- `/api/login`
- `/api/signup`

Apenas metadata (URL, método, status) é capturado.

### 3. **Logging Desabilitado por Padrão em Produção**

O logging só funciona quando:
- `NODE_ENV === "development"` **E**
- `NEXT_PUBLIC_ENABLE_TEST_LOGGING=true` **OU**
- `localStorage.setItem('insights_test_logging_enabled', 'true')`

Em produção (`NODE_ENV === "production"`), o logging é **automaticamente desabilitado**.

---

## 📊 O Que É Capturado (e o que NÃO é)

### ✅ O Que É Capturado (Sanitizado):

1. **URLs** (sem parâmetros sensíveis)
   - ✅ `/api/generate`
   - ✅ `/api/workspace/tiles`
   - ❌ `?token=abc123` → `?token=[REDACTED]`

2. **Métodos HTTP**
   - ✅ `GET`, `POST`, `PUT`, `DELETE`

3. **Status Codes**
   - ✅ `200`, `400`, `500`, etc.

4. **Duração das Requisições**
   - ✅ Tempo de resposta em milissegundos

5. **Body Sanitizado** (apenas endpoints não-sensíveis)
   - ✅ Campos não-sensíveis são preservados
   - ❌ Campos sensíveis são substituídos por `[REDACTED]`

### ❌ O Que NÃO É Capturado:

1. **Headers Sensíveis**
   - ❌ `Authorization: Bearer token123` → `Authorization: [REDACTED]`

2. **Body de Endpoints Sensíveis**
   - ❌ Webhooks (`/api/webhooks/*`)
   - ❌ Autenticação (`/api/auth/*`)

3. **Dados de Usuários Autenticados**
   - ❌ IDs de usuário são redatados se aparecerem em campos sensíveis
   - ❌ Emails são preservados apenas se não estiverem em campos sensíveis

---

## 🔐 Quando Você Vira Usuário (Membro)

### O Que Acontece:

1. **Dados são salvos no MongoDB** ✅
   - Workspaces, dashboards, tiles, contatos, notas
   - Todos associados ao seu `userId` (Clerk)

2. **Logs Continuam Sanitizados** ✅
   - Mesmo após autenticação, dados sensíveis continuam sendo redatados
   - Headers de autenticação são automaticamente removidos

3. **Isolamento de Dados** ✅
   - Cada usuário só vê seus próprios dados
   - Logs não expõem dados de outros usuários

### ⚠️ Importante:

- **Em produção**, o dashboard de testes **NÃO deve estar acessível**
- O logging deve ser **desabilitado** em produção
- Dados sensíveis **nunca** são salvos nos logs, mesmo em desenvolvimento

---

## 🚀 Como Usar com Segurança

### Para Desenvolvimento Local:

1. **Habilitar logging** (opcional):
   ```javascript
   localStorage.setItem('insights_test_logging_enabled', 'true')
   ```

2. **Acessar o dashboard**:
   ```
   http://localhost:3000/test-dashboard
   ```

3. **Ver aviso de segurança**:
   - Um banner amarelo aparece no topo avisando que é apenas para desenvolvimento

### Para Produção:

1. **NÃO habilitar** o dashboard de testes
2. **Garantir** que `NODE_ENV=production`
3. **Não definir** `NEXT_PUBLIC_ENABLE_TEST_LOGGING=true`

---

## 📝 Exemplo de Payload Sanitizado

### Antes (Request Original):
```json
{
  "salesRepCompany": "Minha Empresa",
  "targetCompany": "Empresa Alvo",
  "apiKey": "sk-1234567890abcdef",
  "password": "senha123"
}
```

### Depois (Salvo no Log):
```json
{
  "salesRepCompany": "Minha Empresa",
  "targetCompany": "Empresa Alvo",
  "apiKey": "[REDACTED]",
  "password": "[REDACTED]"
}
```

---

## ✅ Checklist de Segurança

- [x] Headers sensíveis são redatados
- [x] Campos sensíveis no body são redatados
- [x] Parâmetros sensíveis na URL são redatados
- [x] Body de webhooks não é capturado
- [x] Body de autenticação não é capturado
- [x] Logging desabilitado por padrão em produção
- [x] Aviso de segurança exibido no dashboard
- [x] Dados isolados por usuário (quando autenticado)

---

## 🆘 Em Caso de Dúvida

Se você encontrar algum dado sensível nos logs que não deveria estar lá:

1. **Reporte imediatamente**
2. **Não compartilhe** os logs
3. **Desabilite** o logging até o problema ser resolvido

---

**Última atualização:** 2025-01-14

