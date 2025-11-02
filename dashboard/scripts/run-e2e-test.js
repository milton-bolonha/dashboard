#!/usr/bin/env node

/**
 * Script simples para executar teste E2E
 * Roda o servidor em background e executa os testes
 */

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Iniciando teste E2E automatizado...\n");

// Verificar se Playwright está instalado
const packageJsonPath = path.join(__dirname, "..", "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

if (!packageJson.devDependencies?.["@playwright/test"]) {
  console.error("❌ Playwright não está instalado!");
  console.log("   Execute: npm install -D @playwright/test");
  console.log("   Depois: npx playwright install chromium");
  process.exit(1);
}

// Verificar se servidor está rodando
const checkServer = async () => {
  try {
    const response = await fetch("http://localhost:3000");
    return response.ok;
  } catch {
    return false;
  }
};

// Executar teste
const runTest = () => {
  console.log("🧪 Executando testes E2E...\n");

  const testProcess = spawn("npx", ["playwright", "test", "--headed"], {
    stdio: "inherit",
    shell: true,
    cwd: path.join(__dirname, ".."),
  });

  testProcess.on("close", (code) => {
    if (code === 0) {
      console.log("\n✅ Testes concluídos com sucesso!");
    } else {
      console.log(`\n❌ Testes falharam com código ${code}`);
    }
    process.exit(code);
  });
};

// Verificar servidor antes de rodar
console.log(
  "🔍 Verificando se servidor está rodando em http://localhost:3000..."
);

// Importar fetch se disponível (Node 18+)
let fetch;
try {
  fetch = require("node-fetch");
} catch {
  // Tentar fetch global se Node 18+
  if (typeof globalThis.fetch === "function") {
    fetch = globalThis.fetch;
  } else {
    console.log("⚠️  Não foi possível verificar servidor automaticamente");
    console.log("   Certifique-se que está rodando: npm run dev");
    console.log("   Continuando com teste...\n");
    runTest();
    return;
  }
}

checkServer().then((isRunning) => {
  if (isRunning) {
    console.log("✅ Servidor detectado!\n");
    runTest();
  } else {
    console.log("⚠️  Servidor não detectado em http://localhost:3000");
    console.log("   O Playwright vai tentar iniciar automaticamente.");
    console.log("   Se falhar, execute manualmente: npm run dev\n");
    runTest();
  }
});
