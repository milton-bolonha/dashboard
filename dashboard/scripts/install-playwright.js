#!/usr/bin/env node

/**
 * Script para instalar Playwright e dependências
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🎭 Instalando Playwright para testes E2E...\n");

try {
  // Verificar se já está instalado
  const packageJsonPath = path.join(__dirname, "..", "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

  if (packageJson.devDependencies?.["@playwright/test"]) {
    console.log("✅ @playwright/test já está instalado");
  } else {
    console.log("📦 Instalando @playwright/test...");
    execSync("npm install -D @playwright/test", {
      stdio: "inherit",
      cwd: path.join(__dirname, ".."),
    });
  }

  console.log("\n🌐 Instalando browsers do Playwright...");
  execSync("npx playwright install chromium", {
    stdio: "inherit",
    cwd: path.join(__dirname, ".."),
  });

  console.log("\n✅ Playwright instalado com sucesso!");
  console.log("\n📝 Próximos passos:");
  console.log("   1. Certifique-se que o servidor está rodando: npm run dev");
  console.log("   2. Execute o teste: npm run test:e2e");
  console.log("   3. Ou teste com browser visível: npm run test:e2e:headed");
} catch (error) {
  console.error("❌ Erro ao instalar Playwright:", error.message);
  process.exit(1);
}
