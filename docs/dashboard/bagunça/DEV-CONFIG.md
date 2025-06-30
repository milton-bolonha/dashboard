# 🎯 Configuração de Desenvolvimento

## **Para Ativar o Sistema Realista:**

1. **Crie o arquivo `.env.local` no diretório `dashboard/`:**

```bash
# Configuração de desenvolvimento
DEV_USER_ID=user_seu_id_aqui

# Suas chaves do Clerk (se tiver)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

2. **Para obter seu User ID do Clerk:**

   - Acesse: https://dashboard.clerk.dev
   - Vá em **Users** → clique no seu usuário
   - Copie o **User ID** (formato: `user_xxxxxxxxx`)

3. **Reinicie o servidor:**

```bash
npm run dash:dev
```

## **🎭 O que Acontece em Dev Mode:**

- **✅ Usa seu usuário real do Clerk**
- **🎭 Simula plano "Zeus" ativo (limites altos)**
- **🔒 Mantém verificações de segurança**
- **📊 Dados realistas na página de usuários**

## **🔧 Sem configurar o DEV_USER_ID:**

O sistema ainda funcionará, mas usará fallbacks simples.

---

**Isso resolve os avisos do Clerk e os problemas de autenticação!** ✅
