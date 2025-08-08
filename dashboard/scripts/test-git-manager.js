#!/usr/bin/env node

/**
 * Script de teste para o GitManager com retry logic
 * Testa a conectividade com a API do GitHub
 */

import { GitManager } from "../lib/deployment/git-manager.js";

async function testGitManager() {
  console.log("🧪 Testando GitManager com retry logic...\n");

  // Token de teste (substitua por um token válido)
  const testToken = process.env.GITHUB_TEST_TOKEN;

  if (!testToken) {
    console.error("❌ GITHUB_TEST_TOKEN não encontrado no ambiente");
    console.log(
      "💡 Para testar, defina a variável: export GITHUB_TEST_TOKEN=ghp_..."
    );
    process.exit(1);
  }

  const gitManager = new GitManager(testToken);

  try {
    // Teste 1: Verificar autenticação
    console.log("1️⃣ Testando autenticação...");
    const owner = await gitManager.getOwner();
    console.log(`✅ Autenticado como: ${owner.login}\n`);

    // Teste 2: Testar requisição com retry
    console.log("2️⃣ Testando requisição com retry...");
    const userData = await gitManager.makeRequestWithRetry(() =>
      gitManager.octokit.rest.users.getAuthenticated()
    );
    console.log(`✅ Usuário obtido: ${userData.data.login}\n`);

    // Teste 3: Simular erro de conectividade
    console.log("3️⃣ Testando comportamento com erro simulado...");
    try {
      await gitManager.makeRequestWithRetry(
        () => {
          throw new Error(
            "Client network socket disconnected before secure TLS connection was established"
          );
        },
        2,
        1000
      );
    } catch (error) {
      console.log(`✅ Erro capturado corretamente: ${error.message}\n`);
    }

    console.log(
      "🎉 Todos os testes passaram! O GitManager está funcionando corretamente."
    );
  } catch (error) {
    console.error("❌ Erro durante o teste:", error.message);
    process.exit(1);
  }
}

// Executar o teste
testGitManager().catch(console.error);
