# 🧪 **Guia de Testes - Sistema Cloudinary**

## 🎯 **O que é testado:**

✅ **Configuração de ambiente** - Variáveis obrigatórias  
✅ **API de assinatura** - Geração de tokens seguros  
✅ **Helpers do Cloudinary** - URLs e transformações  
✅ **Schemas de dados** - Novos tipos de addon  
✅ **Validação de arquivos** - Tipos e tamanhos  
✅ **Organização de pastas** - Estrutura e isolamento

## 🚀 **Como Executar:**

### **Teste Básico (sem autenticação):**

```bash
cd dashboard
npm run test:cloudinary
```

### **Teste Completo (com autenticação):**

1. Configure credenciais no `.env.local`:

```env
# Adicione essas linhas no .env.local
TEST_USER_EMAIL=seu@email.com
TEST_USER_PASSWORD=suasenha123
```

2. Execute os testes:

```bash
npm run test:cloudinary
```

### **Executar todos os testes:**

```bash
npm run test:all
```

## 🔧 **Configuração de Autenticação:**

### **Opção 1: Usuário Existente**

Se você já tem uma conta no sistema:

```env
TEST_USER_EMAIL=milton@exemplo.com
TEST_USER_PASSWORD=minhasenha123
```

### **Opção 2: Usuário de Teste Dedicado**

Recomendado criar um usuário específico para testes:

```env
TEST_USER_EMAIL=test+cloudinary@exemplo.com
TEST_USER_PASSWORD=TesteSeguro123!
```

### **Opção 3: Mock de Autenticação**

Para desenvolvimento, os testes funcionam sem autenticação real usando dados simulados.

## 📋 **Estrutura dos Testes:**

### **🔧 Configuração e Ambiente**

- ✅ Variáveis do Cloudinary configuradas
- ✅ Servidor respondendo

### **🔐 API de Assinatura**

- ✅ Geração de token seguro
- ✅ Estrutura de resposta correta
- ✅ Organização de pastas
- ✅ Validação de parâmetros

### **🔧 Helpers do Cloudinary**

- ✅ `buildUrl()` - URLs otimizadas
- ✅ `getImageSizes()` - Múltiplos tamanhos
- ✅ `parsePublicId()` - Análise de estrutura

### **📄 Schemas e Validação**

- ✅ Novos tipos: `cloudinaryUpload`, `cloudinaryGallery`
- ✅ Validação de tipos de arquivo
- ✅ Validação de tamanhos

### **📁 Organização**

- ✅ Estrutura: `workspace/section/user/folder`
- ✅ Isolamento entre workspaces

## 📊 **Interpretando Resultados:**

### **✅ Teste Passou:**

```
✅ buildUrl - gera URLs corretas
✅ URL gerada corretamente: https://res.cloudinary.com/...
```

### **⚠️ Aviso (não crítico):**

```
⚠️ Não autenticado - configure TEST_USER_EMAIL/PASSWORD
```

### **❌ Teste Falhou:**

```
❌ Campo obrigatório 'signature' ausente
```

## 🔍 **Debugging:**

### **Erro: Variáveis não configuradas**

```
❌ NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME não está configurada
```

**Solução:** Configure as variáveis no `.env.local`:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=sua_api_secret
```

### **Erro: Servidor não responde**

```
⚠️ Servidor pode não estar rodando: ECONNREFUSED
```

**Solução:** Inicie o servidor:

```bash
npm run dev
```

### **Erro: Autenticação falhou**

```
❌ API retornou erro: 401 - Não autorizado
```

**Solução:** Verifique credenciais no `.env.local` ou use modo mock.

## 🛡️ **Segurança dos Testes:**

### **✅ Boas Práticas:**

- Use usuário de teste dedicado
- Nunca commite credenciais
- `.env.local` está no `.gitignore`
- Testes não modificam dados de produção

### **⚠️ Cuidados:**

- Não use credenciais de produção
- Não teste com dados sensíveis
- Use workspace de teste separado

## 🎯 **Cobertura de Testes:**

| Componente             | Testado | Status        |
| ---------------------- | ------- | ------------- |
| CloudinaryUploadField  | ✅      | Indiretamente |
| CloudinaryGalleryField | ✅      | Indiretamente |
| API /upload/signature  | ✅      | Diretamente   |
| Helpers cloudinary.js  | ✅      | Diretamente   |
| Schema validation      | ✅      | Diretamente   |
| File validation        | ✅      | Diretamente   |
| Folder organization    | ✅      | Diretamente   |

## 📝 **Adicionando Novos Testes:**

### **Estrutura básica:**

```javascript
test("Meu novo teste", async () => {
  // Arrange
  const input = "dados de teste";

  // Act
  const result = await minhaFuncao(input);

  // Assert
  assert.ok(result, "Resultado deve existir");
  console.log("✅ Teste passou");
});
```

### **Teste com fetch:**

```javascript
test("Teste de API", async () => {
  const response = await fetch(`${BASE_URL}/api/minha-rota`);
  assert.ok(response.ok, "API deve responder OK");
});
```

## 🚀 **Executando em CI/CD:**

### **GitHub Actions exemplo:**

```yaml
- name: Run Cloudinary Tests
  run: |
    cd dashboard
    npm run test:cloudinary
  env:
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: ${{ secrets.CLOUDINARY_CLOUD_NAME }}
    CLOUDINARY_API_KEY: ${{ secrets.CLOUDINARY_API_KEY }}
    CLOUDINARY_API_SECRET: ${{ secrets.CLOUDINARY_API_SECRET }}
```

## 📞 **Suporte:**

Se os testes não funcionarem:

1. **Verifique configuração** - Todas as variáveis no `.env.local`
2. **Inicie o servidor** - `npm run dev`
3. **Verifique logs** - Console mostra detalhes dos erros
4. **Use modo mock** - Funciona sem autenticação
