# 🔧 Correção do Erro 502 - Netlify Deploy

## Problema Identificado

✅ **502 FIXADO!** O erro agora mudou para **MongoDB Connection Timeout**.

O erro `MongoServerSelectionError: Server selection timed out after 60000 ms` indica que o Netlify **não consegue se conectar ao MongoDB Atlas** devido a restrições de firewall/rede.

## Correções Aplicadas

### 1. ✅ Configuração do netlify.toml

- Corrigido o caminho de publish para `dashboard/.next`
- Atualizado comando de build para usar `npm install`
- Versão do Node.js `22.16.0`
- Removido configurações desnecessárias

### 2. ✅ Configuração do package.json

- Removido `"type": "module"` que causava conflitos com Next.js no Netlify

### 3. ✅ Removido arquivo duplicado

- Deletado `dashboard/netlify.toml` (desnecessário)

## Variáveis de Ambiente Necessárias no Netlify

Configure estas variáveis no painel do Netlify (Site Settings > Environment Variables):

### 🔐 Obrigatórias

```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/database
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_APP_URL=https://dashboardsalesapp.netlify.app
```

### 🔧 Opcionais (mas recomendadas)

```
INTERNAL_API_KEY=your_secure_key_here
ADMIN_EXPORT_KEY=your_admin_key_here
NEXT_TELEMETRY_DISABLED=1
```

## 🚨 SOLUÇÃO CRÍTICA: Permitir IPs do Netlify no MongoDB Atlas

O MongoDB Atlas está **bloqueando a conexão do Netlify**. Para resolver:

### Opção 1: Permitir todos os IPs (RÁPIDO - teste apenas)

No MongoDB Atlas: **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`)

### Opção 2: Permitir apenas IPs do Netlify (RECOMENDADO - produção)

1. Acesse https://www.netlify.com/blog/2016/11/30/webhooks-and-netlify/
2. Ou adicione manualmente: `54.243.31.176/29`, `52.2.143.0/24`, `3.5.140.0/22`

### Opção 3: Usar variável de ambiente correta

Verifique se `MONGODB_URI` no Netlify está com o formato correto:

```
mongodb+srv://user:password@cluster.ewvnyea.mongodb.net/database?retryWrites=true&w=majority
```

## Próximos Passos

1. ✅ **Configure as variáveis de ambiente** no painel do Netlify
2. 🔥 **Permita IPs do Netlify no MongoDB Atlas** (CRÍTICO)
3. 🔄 **Faça um novo deploy**
4. 🧪 **Teste a API** em `https://dashboardsalesapp.netlify.app/api/debug/502-check`

## Diagnóstico

Se o erro persistir, acesse:

- `https://dashboardsalesapp.netlify.app/api/debug/502-check` - Endpoint de diagnóstico
- Verifique os logs do Netlify para erros específicos

## Arquivos Modificados

- ✅ `netlify.toml` - Configuração simplificada
- ✅ `dashboard/package.json` - Removido type: module
- ✅ Removido `dashboard/netlify.toml` - Arquivo duplicado
- ✅ `NETLIFY-DEPLOY-FIX.md` - Documentação da solução

## Status

✅ **502 FIXADO!** Erro de configuração resolvido
🔥 **MongoDB Timeout** - Requer permitir IPs do Netlify no Atlas
⏳ Aguardando configuração do MongoDB Atlas
