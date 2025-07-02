#!/usr/bin/env node

/**
 * Script para rodar todos os testes do sistema de controle de acesso
 *
 * Uso:
 * npm run test
 * npm run test access-engine
 * npm run test access-keys
 */

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cores para output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runTest(testFile) {
  return new Promise((resolve, reject) => {
    log(`\n🧪 Executando ${testFile}...`, "cyan");

    const testPath = path.join(__dirname, `${testFile}.test.js`);
    const child = spawn("node", [testPath], { stdio: "inherit" });

    child.on("close", (code) => {
      if (code === 0) {
        log(`✅ ${testFile} - Todos os testes passaram!`, "green");
        resolve();
      } else {
        log(`❌ ${testFile} - Alguns testes falharam!`, "red");
        reject(new Error(`Tests failed for ${testFile}`));
      }
    });

    child.on("error", (err) => {
      log(`💥 Erro ao executar ${testFile}: ${err.message}`, "red");
      reject(err);
    });
  });
}

async function runAllTests() {
  const testSuites = ["access-engine", "access-keys"];

  log(
    "🚀 Iniciando suite de testes do Sistema de Controle de Acesso",
    "bright"
  );
  log("═".repeat(60), "blue");

  let passed = 0;
  let failed = 0;

  for (const testSuite of testSuites) {
    try {
      await runTest(testSuite);
      passed++;
    } catch (error) {
      failed++;
    }
  }

  log("\n" + "═".repeat(60), "blue");
  log("📊 Resumo dos Testes:", "bright");
  log(`✅ Passaram: ${passed}`, passed > 0 ? "green" : "reset");
  log(`❌ Falharam: ${failed}`, failed > 0 ? "red" : "reset");
  log(`📈 Total: ${passed + failed}`, "cyan");

  if (failed === 0) {
    log(
      "\n🎉 Todos os testes passaram! Sistema funcionando corretamente.",
      "green"
    );
  } else {
    log("\n⚠️  Alguns testes falharam. Verifique os logs acima.", "yellow");
    process.exit(1);
  }
}

// Verificar argumentos da linha de comando
const args = process.argv.slice(2);

if (args.length === 0) {
  // Rodar todos os testes
  runAllTests().catch(console.error);
} else {
  // Rodar teste específico
  const testName = args[0];
  runTest(testName).catch(() => process.exit(1));
}

// Handlers para exit graceful
process.on("SIGINT", () => {
  log("\n\n⏹️  Testes interrompidos pelo usuário", "yellow");
  process.exit(0);
});

process.on("SIGTERM", () => {
  log("\n\n⏹️  Testes finalizados", "yellow");
  process.exit(0);
});
