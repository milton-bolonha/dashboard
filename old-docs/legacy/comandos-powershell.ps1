# =====================================
# 🚀 COMANDOS POWERSHELL - DASHBOARD
# =====================================

Write-Host "🎯 Comandos para o Dashboard Engine" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📦 1. INICIAR DASHBOARD:" -ForegroundColor Green
Write-Host "npm run dev" -ForegroundColor Yellow
Write-Host ""

Write-Host "🎣 2. INICIAR SERVIDOR WEBHOOK:" -ForegroundColor Green
Write-Host "node test-webhook-server.js" -ForegroundColor Yellow
Write-Host ""

Write-Host "👂 3. INICIAR STRIPE LISTENER:" -ForegroundColor Green
Write-Host "stripe listen --forward-to localhost:4242/webhook" -ForegroundColor Yellow
Write-Host ""

Write-Host "🧪 4. TESTAR WEBHOOKS:" -ForegroundColor Green
Write-Host "stripe trigger checkout.session.completed" -ForegroundColor Yellow
Write-Host "stripe trigger invoice.paid" -ForegroundColor Yellow
Write-Host "stripe trigger customer.subscription.deleted" -ForegroundColor Yellow
Write-Host ""

Write-Host "🔍 5. TESTAR API DIRETAMENTE:" -ForegroundColor Green
Write-Host "curl http://localhost:3000/api/billing/verify-user" -ForegroundColor Yellow
Write-Host ""

Write-Host "📊 6. VERIFICAR PORTAS OCUPADAS:" -ForegroundColor Green
Write-Host "netstat -an | findstr :3000" -ForegroundColor Yellow
Write-Host "netstat -an | findstr :4242" -ForegroundColor Yellow
Write-Host ""

Write-Host "🛑 7. MATAR PROCESSOS SE NECESSÁRIO:" -ForegroundColor Green
Write-Host "Get-Process -Name node | Stop-Process -Force" -ForegroundColor Yellow
Write-Host ""

Write-Host "📝 8. EDITAR CONFIGURAÇÃO:" -ForegroundColor Green
Write-Host "notepad .env.local" -ForegroundColor Yellow
Write-Host ""

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "💡 Dica: Execute cada comando em um terminal separado!" -ForegroundColor White
Write-Host "======================================" -ForegroundColor Cyan

# Função helper para executar tudo automaticamente
function Start-Dashboard {
    Write-Host "🚀 Iniciando Dashboard Engine..." -ForegroundColor Green
    
    # Verificar se .env.local existe
    if (!(Test-Path ".env.local")) {
        Write-Host "⚠️ Arquivo .env.local não encontrado!" -ForegroundColor Red
        Write-Host "📝 Execute: copy env-template.txt .env.local" -ForegroundColor Yellow
        Write-Host "📝 Depois edite o arquivo com suas chaves" -ForegroundColor Yellow
        return
    }
    
    Write-Host "✅ Configuração encontrada" -ForegroundColor Green
    Write-Host "🚀 Iniciando serviços..." -ForegroundColor Blue
    
    # Iniciar dashboard
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
    
    # Aguardar um pouco
    Start-Sleep -Seconds 3
    
    # Iniciar webhook server
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "node test-webhook-server.js"
    
    Write-Host "✅ Serviços iniciados!" -ForegroundColor Green
    Write-Host "🌐 Dashboard: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "🎣 Webhook: http://localhost:4242/webhook" -ForegroundColor Cyan
}

# Função para testar webhooks
function Test-Webhooks {
    Write-Host "🧪 Testando webhooks..." -ForegroundColor Green
    
    Write-Host "1️⃣ Checkout completado..." -ForegroundColor Blue
    stripe trigger checkout.session.completed
    
    Start-Sleep -Seconds 2
    
    Write-Host "2️⃣ Invoice paga..." -ForegroundColor Blue
    stripe trigger invoice.paid
    
    Write-Host "✅ Testes concluídos!" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔧 FUNÇÕES DISPONÍVEIS:" -ForegroundColor Magenta
Write-Host "Start-Dashboard  # Inicia tudo automaticamente" -ForegroundColor White
Write-Host "Test-Webhooks    # Executa testes de webhook" -ForegroundColor White 