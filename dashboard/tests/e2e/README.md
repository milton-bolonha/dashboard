# 🧪 Testes E2E Automatizados com Playwright

Testes end-to-end automatizados que simulam um usuário real navegando no browser!

## 🚀 Como Usar

### 1. Instalar Playwright

```bash
cd dashboard
npm install -D @playwright/test
npx playwright install chromium
```

### 2. Executar Testes

```bash
# Teste completo (headless - sem abrir browser)
npm run test:e2e

# Teste com browser visível (headed)
npm run test:e2e:headed

# Teste com UI interativa (debug)
npm run test:e2e:ui

# Teste com debug step-by-step
npm run test:e2e:debug
```

## 📋 O que o teste faz:

1. ✅ Navega para `/` (home)
2. ✅ Reseta sessão guest (limpa dados anteriores)
3. ✅ Preenche formulário progressivo:
   - Company: "Acme Corp"
   - Company Website: "www.acmecorp.com"
   - Solution: "AI Sales Automation Tools"
   - Research Target: "Tesla"
   - Research Website: "www.tesla.com"
4. ✅ Submete formulário (pressiona Enter)
5. ✅ Espera redirecionar para `/admin` com `job_id`, `guest_id` e `token`
6. ✅ Verifica que nome da company apareceu (não "Preview Company")
7. ✅ Aguarda tiles aparecerem com conteúdo real do OpenAI (até 2 minutos)
8. ✅ Valida que tiles têm conteúdo real (não apenas loading)

## 🎯 Configuração

O Playwright está configurado em `playwright.config.ts`:

- **Base URL**: `http://localhost:3000`
- **Timeout**: 2 minutos por teste (OpenAI pode demorar)
- **Browser**: Chromium
- **Auto-start server**: Inicia `npm run dev` automaticamente

## 🔍 Debug

Se o teste falhar, você pode:

1. **Ver screenshots**: Automaticamente salvos em `test-results/`
2. **Ver trace**: Execute `npx playwright show-trace` após teste falhar
3. **Rodar com UI**: `npm run test:e2e:ui` para ver passo a passo
4. **Rodar headed**: `npm run test:e2e:headed` para ver browser abrindo

## 📝 Notas

- O teste espera até 2 minutos para tiles aparecerem (OpenAI pode demorar)
- Certifique-se que o servidor está rodando em `localhost:3000`
- O teste reseta a sessão guest antes de começar para garantir estado limpo
