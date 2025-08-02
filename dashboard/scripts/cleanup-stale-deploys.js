#!/usr/bin/env node

/**
 * 🧹 SCRIPT DE LIMPEZA DE DEPLOYS FANTASMAS
 *
 * Remove deployments que ficaram travados em estados intermediários
 * há mais de 1 hora, conforme especificado nas tarefas de lançamento.
 *
 * Estados considerados "fantasmas":
 * - "iniciado" há mais de 1 hora
 * - "progresso" há mais de 1 hora
 *
 * Uso: node scripts/cleanup-stale-deploys.js
 */

import { MongoClient } from "mongodb";
import { readFileSync } from "fs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Carregar variáveis de ambiente do .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Configurações
const MONGODB_URI = process.env.MONGODB_URI;
const STALE_TIMEOUT = 60 * 60 * 1000; // 1 hora em milliseconds

// Cores para console
const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  reset: "\x1b[0m",
};

function log(message, color = "reset") {
  const timestamp = new Date().toISOString();
  const coloredMessage = `${colors[color]}${message}${colors.reset}`;
  console.log(`[${timestamp}] ${coloredMessage}`);
}

async function connectToDatabase() {
  try {
    log("🔌 Conectando ao MongoDB...", "blue");
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db();
    log("✅ Conectado com sucesso!", "green");
    return { client, db };
  } catch (error) {
    log(`❌ Erro ao conectar: ${error.message}`, "red");
    process.exit(1);
  }
}

async function findStaleDeployments(db) {
  log("🔍 Buscando deployments fantasmas...", "cyan");

  const oneHourAgo = new Date(Date.now() - STALE_TIMEOUT);

  try {
    const staleDeployments = await db
      .collection("deployments")
      .find({
        $and: [
          {
            status: { $in: ["iniciado", "progresso"] },
          },
          {
            createdAt: { $lt: oneHourAgo },
          },
        ],
      })
      .toArray();

    log(
      `📊 Encontrados ${staleDeployments.length} deployments fantasmas`,
      "yellow"
    );

    if (staleDeployments.length > 0) {
      log("\n📋 Detalhes dos deployments fantasmas:", "cyan");
      staleDeployments.forEach((deploy, index) => {
        const age = Math.round(
          (Date.now() - deploy.createdAt.getTime()) / (1000 * 60)
        );
        log(
          `  ${index + 1}. ID: ${deploy._id} | Status: ${
            deploy.status
          } | Idade: ${age} min`,
          "yellow"
        );
      });
    }

    return staleDeployments;
  } catch (error) {
    log(`❌ Erro ao buscar deployments: ${error.message}`, "red");
    throw error;
  }
}

async function cleanupStaleDeployments(db, staleDeployments) {
  if (staleDeployments.length === 0) {
    log("✨ Nenhum deployment fantasma encontrado!", "green");
    return 0;
  }

  log("🧹 Limpando deployments fantasmas...", "cyan");

  try {
    const staleIds = staleDeployments.map((d) => d._id);

    const result = await db.collection("deployments").updateMany(
      { _id: { $in: staleIds } },
      {
        $set: {
          status: "falhou",
          error: "timeout",
          message:
            "Deploy cancelado automaticamente por timeout (>1h sem progresso)",
          updatedAt: new Date(),
        },
      }
    );

    log(
      `✅ ${result.modifiedCount} deployments marcados como falhados`,
      "green"
    );
    return result.modifiedCount;
  } catch (error) {
    log(`❌ Erro ao limpar deployments: ${error.message}`, "red");
    throw error;
  }
}

async function generateReport(cleanedCount) {
  log("\n" + "=".repeat(50), "cyan");
  log("📋 RELATÓRIO DE LIMPEZA", "cyan");
  log("=".repeat(50), "cyan");
  log(`Deployments fantasmas encontrados e limpos: ${cleanedCount}`, "green");
  log(`Motivo da limpeza: timeout (>1h sem progresso)`, "yellow");
  log(`Status final: falhou`, "yellow");
  log(`Data da execução: ${new Date().toISOString()}`, "blue");
  log("=".repeat(50), "cyan");
}

async function main() {
  log("\n🧹 INICIANDO LIMPEZA DE DEPLOYS FANTASMAS 🧹", "cyan");
  log("=".repeat(60), "cyan");

  // Conectar ao banco
  const { client, db } = await connectToDatabase();

  try {
    // Buscar deployments fantasmas
    const staleDeployments = await findStaleDeployments(db);

    // Limpar deployments fantasmas
    const cleanedCount = await cleanupStaleDeployments(db, staleDeployments);

    // Gerar relatório
    await generateReport(cleanedCount);

    // Fechar conexão
    await client.close();
    log("🔌 Desconectado do banco de dados", "blue");

    log("\n🎉 Limpeza concluída com sucesso!", "green");
  } catch (error) {
    log(`❌ Erro durante execução: ${error.message}`, "red");
    await client.close();
    process.exit(1);
  }
}

// Executar se chamado diretamente
const scriptPath = fileURLToPath(import.meta.url);
const isDirectRun = scriptPath === path.resolve(process.argv[1]);

if (isDirectRun) {
  main().catch(console.error);
}

export { main as cleanupStaleDeployments };
