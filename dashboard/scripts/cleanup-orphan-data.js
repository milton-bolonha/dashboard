#!/usr/bin/env node

/**
 * 🧹 SCRIPT DE LIMPEZA DE DADOS ÓRFÃOS
 *
 * Remove permanentemente dados antigos sem userId do MongoDB.
 * ⚠️ ATENÇÃO: Este script é DESTRUTIVO e irá DELETAR dados!
 *
 * Recursos:
 * - ✅ Remove dados órfãos (sem userId)
 * - ✅ Relatório detalhado das operações
 * - ✅ Confirmação manual obrigatória
 * - ✅ Auto-destruição após sucesso
 * - ✅ Logs de auditoria
 *
 * Uso: node scripts/cleanup-orphan-data.js
 */

import { MongoClient } from "mongodb";
import { readFileSync, unlinkSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configurações
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/dashboard-engine";
const LOG_FILE = join(__dirname, "cleanup-log.txt");

// Cores para console
const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  reset: "\x1b[0m",
};

function log(message, color = "white") {
  const timestamp = new Date().toISOString();
  const coloredMessage = `${colors[color]}${message}${colors.reset}`;
  console.log(`[${timestamp}] ${coloredMessage}`);
}

function logError(message) {
  log(`❌ ERRO: ${message}`, "red");
}

function logSuccess(message) {
  log(`✅ SUCESSO: ${message}`, "green");
}

function logWarning(message) {
  log(`⚠️ AVISO: ${message}`, "yellow");
}

function logInfo(message) {
  log(`ℹ️ INFO: ${message}`, "blue");
}

async function askConfirmation(question) {
  const readline = await import("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      `${colors.yellow}${question} (sim/não): ${colors.reset}`,
      (answer) => {
        rl.close();
        resolve(
          answer.toLowerCase() === "sim" ||
            answer.toLowerCase() === "s" ||
            answer.toLowerCase() === "yes" ||
            answer.toLowerCase() === "y"
        );
      }
    );
  });
}

async function connectToDatabase() {
  try {
    logInfo("Conectando ao MongoDB...");
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db();
    logSuccess("Conectado ao banco de dados!");
    return { client, db };
  } catch (error) {
    logError(`Falha ao conectar no banco: ${error.message}`);
    process.exit(1);
  }
}

async function scanOrphanData(db) {
  logInfo("🔍 Escaneando dados órfãos (sem userId)...");

  const results = {
    contentTypes: [],
    sections: [],
    items: [],
    users: [], // Usuários sem clerkId
    billing: [], // Dados de billing órfãos
  };

  try {
    // 1. Content Types órfãos
    results.contentTypes = await db
      .collection("contentTypes")
      .find({ userId: { $exists: false } })
      .toArray();

    // 2. Sections órfãs
    results.sections = await db
      .collection("sections")
      .find({ userId: { $exists: false } })
      .toArray();

    // 3. Items órfãos
    try {
      results.items = await db
        .collection("items")
        .find({ userId: { $exists: false } })
        .toArray();
    } catch (error) {
      logWarning("Collection 'items' não existe ainda");
    }

    // 4. Usuários órfãos (sem clerkId)
    try {
      results.users = await db
        .collection("users")
        .find({ clerkId: { $exists: false } })
        .toArray();
    } catch (error) {
      logWarning("Collection 'users' não existe ainda");
    }

    // 5. Dados de billing órfãos
    try {
      results.billing = await db
        .collection("billing_transactions")
        .find({ userId: { $exists: false } })
        .toArray();
    } catch (error) {
      logWarning("Collection 'billing_transactions' não existe ainda");
    }
  } catch (error) {
    logError(`Erro ao escanear dados: ${error.message}`);
    throw error;
  }

  return results;
}

function generateReport(orphanData) {
  log("\n" + "=".repeat(60), "cyan");
  log("📊 RELATÓRIO DE DADOS ÓRFÃOS", "cyan");
  log("=".repeat(60), "cyan");

  const total = Object.values(orphanData).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  if (total === 0) {
    logSuccess("🎉 Nenhum dado órfão encontrado! Banco está limpo.");
    return false;
  }

  logWarning(`⚠️ TOTAL DE REGISTROS ÓRFÃOS: ${total}`);
  log("");

  // Detalhamento por collection
  Object.entries(orphanData).forEach(([collection, data]) => {
    if (data.length > 0) {
      log(`📁 ${collection.toUpperCase()}: ${data.length} registros`, "yellow");

      // Mostrar alguns exemplos
      data.slice(0, 3).forEach((item, index) => {
        const name = item.name || item.title || item.email || item._id;
        log(`   ${index + 1}. ${name}`, "white");
      });

      if (data.length > 3) {
        log(`   ... e mais ${data.length - 3} registros`, "white");
      }
      log("");
    }
  });

  logError("⚠️ ATENÇÃO: Estes dados serão PERMANENTEMENTE DELETADOS!");
  logError("⚠️ Esta operação NÃO PODE ser desfeita!");

  return true;
}

async function cleanupData(db, orphanData) {
  logInfo("🧹 Iniciando limpeza de dados órfãos...");

  const results = {
    contentTypes: 0,
    sections: 0,
    items: 0,
    users: 0,
    billing: 0,
  };

  try {
    // 1. Limpar Content Types
    if (orphanData.contentTypes.length > 0) {
      const result = await db
        .collection("contentTypes")
        .deleteMany({ userId: { $exists: false } });
      results.contentTypes = result.deletedCount;
      logSuccess(`Removidos ${result.deletedCount} content types órfãos`);
    }

    // 2. Limpar Sections
    if (orphanData.sections.length > 0) {
      const result = await db
        .collection("sections")
        .deleteMany({ userId: { $exists: false } });
      results.sections = result.deletedCount;
      logSuccess(`Removidas ${result.deletedCount} sections órfãs`);
    }

    // 3. Limpar Items
    if (orphanData.items.length > 0) {
      const result = await db
        .collection("items")
        .deleteMany({ userId: { $exists: false } });
      results.items = result.deletedCount;
      logSuccess(`Removidos ${result.deletedCount} items órfãos`);
    }

    // 4. Limpar Users órfãos
    if (orphanData.users.length > 0) {
      const result = await db
        .collection("users")
        .deleteMany({ clerkId: { $exists: false } });
      results.users = result.deletedCount;
      logSuccess(`Removidos ${result.deletedCount} usuários órfãos`);
    }

    // 5. Limpar Billing órfão
    if (orphanData.billing.length > 0) {
      const result = await db
        .collection("billing_transactions")
        .deleteMany({ userId: { $exists: false } });
      results.billing = result.deletedCount;
      logSuccess(
        `Removidos ${result.deletedCount} registros de billing órfãos`
      );
    }
  } catch (error) {
    logError(`Erro durante limpeza: ${error.message}`);
    throw error;
  }

  return results;
}

function generateCleanupSummary(results) {
  log("\n" + "=".repeat(60), "green");
  log("🎯 RESUMO DA LIMPEZA CONCLUÍDA", "green");
  log("=".repeat(60), "green");

  const total = Object.values(results).reduce((sum, count) => sum + count, 0);

  if (total === 0) {
    logInfo("Nenhum registro foi removido (já estava limpo)");
  } else {
    logSuccess(`✨ Total de registros removidos: ${total}`);
    log("");

    Object.entries(results).forEach(([collection, count]) => {
      if (count > 0) {
        logSuccess(`📁 ${collection}: ${count} registros removidos`);
      }
    });
  }

  log("");
  logSuccess("🧹 Limpeza concluída com sucesso!");
  logSuccess("💾 Banco de dados agora está livre de dados órfãos!");
}

async function selfDestruct() {
  logWarning("🚨 Iniciando auto-destruição do script...");

  try {
    // Aguardar 3 segundos para mostrar mensagem
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Deletar o próprio arquivo
    unlinkSync(__filename);
    logSuccess("💥 Script auto-destruído com sucesso!");
    logInfo("O arquivo foi permanentemente removido do sistema.");
  } catch (error) {
    logError(`Falha na auto-destruição: ${error.message}`);
    logWarning("⚠️ Você deve deletar manualmente o arquivo do script!");
  }
}

async function main() {
  log("\n" + "🧹 INICIANDO LIMPEZA DE DADOS ÓRFÃOS 🧹".padStart(40), "cyan");
  log("=".repeat(60), "cyan");

  logWarning("⚠️ ESTE SCRIPT IRÁ DELETAR DADOS PERMANENTEMENTE!");
  logWarning("⚠️ CERTIFIQUE-SE DE TER BACKUP DO SEU BANCO!");

  // Confirmação inicial
  const confirmStart = await askConfirmation(
    "Deseja continuar com o escaneamento?"
  );
  if (!confirmStart) {
    logInfo("❌ Operação cancelada pelo usuário.");
    process.exit(0);
  }

  // Conectar ao banco
  const { client, db } = await connectToDatabase();

  try {
    // Escanear dados órfãos
    const orphanData = await scanOrphanData(db);

    // Gerar relatório
    const hasOrphans = generateReport(orphanData);

    if (!hasOrphans) {
      logSuccess("🎉 Banco já está limpo! Nada para fazer.");
      await client.close();

      // Auto-destruir mesmo sem limpeza
      const confirmDestruct = await askConfirmation(
        "Deseja auto-destruir o script mesmo assim?"
      );
      if (confirmDestruct) {
        await selfDestruct();
      }

      process.exit(0);
    }

    // Confirmação final
    log("");
    const confirmCleanup = await askConfirmation(
      "🚨 TEM CERTEZA que deseja DELETAR todos estes dados?"
    );
    if (!confirmCleanup) {
      logInfo("❌ Limpeza cancelada pelo usuário.");
      await client.close();
      process.exit(0);
    }

    // Última confirmação
    const finalConfirm = await askConfirmation(
      "🚨 ÚLTIMA CHANCE: Confirma a DELEÇÃO PERMANENTE?"
    );
    if (!finalConfirm) {
      logInfo("❌ Operação cancelada na confirmação final.");
      await client.close();
      process.exit(0);
    }

    // Executar limpeza
    const results = await cleanupData(db, orphanData);

    // Mostrar resumo
    generateCleanupSummary(results);

    // Fechar conexão
    await client.close();
    logInfo("🔌 Desconectado do banco de dados.");

    // Auto-destruição
    log("");
    const confirmAutoDestruct = await askConfirmation(
      "🚨 Deseja auto-destruir este script agora?"
    );
    if (confirmAutoDestruct) {
      await selfDestruct();
    } else {
      logWarning("⚠️ Script mantido. Lembre-se de deletá-lo manualmente!");
    }

    logSuccess("🎉 Processo de limpeza concluído!");
  } catch (error) {
    logError(`Erro fatal: ${error.message}`);
    await client.close();
    process.exit(1);
  }
}

// Executar apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logError(`Erro não tratado: ${error.message}`);
    process.exit(1);
  });
}
