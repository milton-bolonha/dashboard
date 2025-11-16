# 🧪 Guia de Testes: Limites, Bloqueios e Fluxo de Cadastro

## 🚀 Início Rápido

### 1. Acesse a Página de Teste
Abra no navegador: **http://localhost:3000/test-limits**

Esta página permite testar tudo sem quebrar o app principal!

### 2. O que você pode testar:

#### ✅ Ver Status Atual
- Ver se você é GUEST ou MEMBER
- Ver uso atual de cada ação
- Ver limites configurados

#### ✅ Simular Limites
- Clique nos botões para simular limite máximo de cada ação
- Exemplo: "createWorkspace: 3/3 (MAX)" define o limite como atingido

#### ✅ Testar Ações
- Clique em cada ação para ver se é permitida ou bloqueada
- Quando bloqueada, deve aparecer modal de upgrade no app principal

#### ✅ Controles
- **Resetar Tudo**: Volta ao estado inicial
- **Tornar-se MEMBER**: Remove todos os limites (para testes)
- **Tornar-se GUEST**: Volta a ter limites
- **Simular Checkout Success**: Simula retorno do Stripe

---

## 📋 Testes Manuais Passo a Passo

### Teste 1: Bloqueio ao Criar Workspace

1. Acesse `/test-limits`
2. Clique em **"createWorkspace: 3/3 (MAX)"**
3. Vá para a home (`/`)
4. Tente criar um novo workspace
5. **Esperado**: Modal de upgrade aparece com mensagem de limite

### Teste 2: Bloqueio ao Fazer Chat

1. Acesse `/test-limits`
2. Clique em **"tileChat: 5/5 (MAX)"**
3. Vá para `/admin`
4. Tente fazer chat em qualquer tile
5. **Esperado**: Modal de upgrade aparece

### Teste 3: Verificar que Member Não Tem Limites

1. Acesse `/test-limits`
2. Clique em **"Tornar-se MEMBER"**
3. Verifique que todos os limites mostram "Infinity"
4. Tente fazer qualquer ação
5. **Esperado**: Tudo funciona sem bloqueios

### Teste 4: Simular Checkout Success

1. Acesse `/test-limits`
2. Clique em **"Simular Checkout Success"**
3. Recarregue a página (`F5`)
4. **Esperado**: Status muda para MEMBER automaticamente

---

## 🔧 Comandos Úteis (Console do Navegador)

### Ver Status Atual
```javascript
console.log('Membership:', localStorage.getItem('insights_membership_status'));
console.log('Usage:', JSON.parse(localStorage.getItem('insights_guest_usage_v1') || '{}'));
```

### Simular Limite Máximo
```javascript
// Simular createWorkspace no limite (3/3)
localStorage.setItem('insights_guest_usage_v1', JSON.stringify({
  version: 1,
  lastReset: Date.now(),
  counts: { createWorkspace: 3 }
}));
location.reload();
```

### Resetar Tudo
```javascript
localStorage.removeItem('insights_membership_status');
localStorage.removeItem('insights_guest_usage_v1');
location.reload();
```

### Tornar-se Member
```javascript
localStorage.setItem('insights_membership_status', 'member');
location.reload();
```

### Tornar-se Guest
```javascript
localStorage.setItem('insights_membership_status', 'guest');
location.reload();
```

---

## 🧪 Teste do Webhook Stripe

### Opção 1: Via cURL (Windows)

Crie arquivo `test-webhook.bat`:

```batch
@echo off
curl -X POST http://localhost:3000/api/webhooks/stripe ^
  -H "Content-Type: application/json" ^
  -H "stripe-signature: test-signature" ^
  -d "{\"type\":\"checkout.session.completed\",\"data\":{\"object\":{\"id\":\"cs_test_123\",\"customer_email\":\"test@example.com\",\"metadata\":{\"userId\":\"user_test_123\",\"sessionId\":\"session_test_123\"}}}}"
pause
```

Execute: `test-webhook.bat`

### Opção 2: Via Postman/Insomnia

- **Method**: POST
- **URL**: `http://localhost:3000/api/webhooks/stripe`
- **Headers**:
  - `Content-Type: application/json`
  - `stripe-signature: test-signature`
- **Body** (JSON):
```json
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_123",
      "customer_email": "test@example.com",
      "metadata": {
        "userId": "user_test_123",
        "sessionId": "session_test_123"
      }
    }
  }
}
```

### Verificar Migração no MongoDB

Após chamar o webhook, verifique os logs do servidor:
- Deve aparecer: `[Stripe Webhook] ✅ Migração concluída`
- Deve aparecer: `[Migration] ✅ Company migrada para userId user_test_123`

---

## ✅ Checklist de Testes

### Limites Guest
- [ ] `createWorkspace` bloqueia após 3 usos
- [ ] `tileChat` bloqueia após 5 usos
- [ ] `contactChat` bloqueia após 5 usos
- [ ] `regenerate` bloqueia após 5 usos
- [ ] `createContact` bloqueia após 5 usos
- [ ] Limites resetam após 24h (testar mudando `lastReset`)

### Bloqueios
- [ ] Modal de upgrade aparece quando limite é atingido
- [ ] Ação é bloqueada quando limite é atingido
- [ ] Mensagem de erro é exibida corretamente
- [ ] Botão "I already have the plan" funciona

### Fluxo de Cadastro
- [ ] Checkout abre quando clica em "Unlock unlimited access"
- [ ] Após `?checkout=success`, usuário vira member
- [ ] Webhook migra dados do localStorage para MongoDB
- [ ] Dados são associados ao `userId` corretamente

### Segurança
- [ ] Guest não salva no MongoDB (verificar logs)
- [ ] Member salva no MongoDB (verificar logs)
- [ ] Dados são isolados por `userId` no MongoDB

---

## 🐛 Troubleshooting

### App quebrou visualmente?
1. Limpe o cache do navegador (`Ctrl+Shift+Delete`)
2. Resetar localStorage (use botão na página de teste)
3. Recarregar página (`Ctrl+F5`)

### Servidor não inicia?
1. Verifique se porta 3000 está livre
2. Execute: `npm run dev` novamente
3. Verifique logs de erro no terminal

### Limites não funcionam?
1. Verifique se localStorage está habilitado
2. Verifique console do navegador para erros
3. Use a página `/test-limits` para debug

---

## 📝 Notas Importantes

- **Limites são resetados automaticamente após 24h**
- **Members não têm limites** (infinito)
- **Guests nunca salvam no MongoDB** (apenas localStorage)
- **Webhook só funciona com userId válido** (precisa Clerk na FASE 2)

---

## 🎯 Próximos Passos

1. Testar todos os cenários acima
2. Verificar logs do servidor durante testes
3. Testar webhook com dados reais do localStorage
4. Preparar para integração Clerk (FASE 2)

