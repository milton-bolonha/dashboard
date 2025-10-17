@echo off
echo 🎯 COMANDOS DE TESTE STRIPE
echo ========================
echo.
echo 1. Testar checkout completado (mais importante):
echo stripe trigger checkout.session.completed
echo.
echo 2. Testar pagamento de invoice:
echo stripe trigger invoice.paid
echo.
echo 3. Testar subscription cancelada:
echo stripe trigger customer.subscription.deleted
echo.
echo 4. Testar pagamento simples:
echo stripe trigger payment_intent.succeeded
echo.
echo 5. Ver todos os eventos disponíveis:
echo stripe trigger --help
echo.
echo ========================
echo 💡 Dica: Execute um comando por vez e observe os logs!
echo.
pause 