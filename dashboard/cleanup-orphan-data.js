#!/usr/bin/env node

import { MongoClient } from "mongodb";
import { unlinkSync } from "fs";
import { fileURLToPath } from "url";
import { createInterface } from "readline";

const __filename = fileURLToPath(import.meta.url);
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/dashboard-engine";

const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
};

function log(message, color = "reset") {
  console.log(
    `${colors[color]}[${new Date().toISOString()}] ${message}${colors.reset}`
  );
}

async function askConfirmation(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  return new Promise((resolve) => {
    rl.question(
      `${colors.yellow}${question} (sim/não): ${colors.reset}`,
      (answer) => {
        rl.close();
        resolve(["sim", "s", "yes", "y"].includes(answer.toLowerCase()));
      }
    );
  });
}

async function main() {
  log("🧹 INICIANDO LIMPEZA DE DADOS ÓRFÃOS", "blue");
  log("⚠️ ESTE SCRIPT DELETA DADOS PERMANENTEMENTE!", "red");

  if (!(await askConfirmation("Deseja continuar?"))) {
    log("❌ Cancelado", "yellow");
    return;
  }

  let client;
  try {
    log("🔌 Conectando ao MongoDB...", "blue");
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db();
    log("✅ Conectado!", "green");

    log("🔍 Escaneando dados órfãos...", "blue");

    const orphans = {
      contentTypes: await db
        .collection("contentTypes")
        .find({ userId: { $exists: false } })
        .toArray(),
      sections: await db
        .collection("sections")
        .find({ userId: { $exists: false } })
        .toArray(),
      items: [],
      users: [],
    };

    try {
      orphans.items = await db
        .collection("items")
        .find({ userId: { $exists: false } })
        .toArray();
    } catch (e) {
      log("⚠️ Collection 'items' não existe", "yellow");
    }

    try {
      orphans.users = await db
        .collection("users")
        .find({ clerkId: { $exists: false } })
        .toArray();
    } catch (e) {
      log("⚠️ Collection 'users' não existe", "yellow");
    }

    const total = Object.values(orphans).reduce(
      (sum, arr) => sum + arr.length,
      0
    );

    if (total === 0) {
      log("🎉 Banco limpo! Nenhum órfão encontrado.", "green");
      await client.close();

      if (await askConfirmation("Auto-destruir script?")) {
        unlinkSync(__filename);
        log("💥 Script auto-destruído!", "green");
      }
      return;
    }

    log(`📊 ÓRFÃOS ENCONTRADOS: ${total} registros`, "yellow");
    log(`   Content Types: ${orphans.contentTypes.length}`, "yellow");
    log(`   Sections: ${orphans.sections.length}`, "yellow");
    log(`   Items: ${orphans.items.length}`, "yellow");
    log(`   Users: ${orphans.users.length}`, "yellow");

    if (!(await askConfirmation("🚨 CONFIRMA DELEÇÃO PERMANENTE?"))) {
      log("❌ Cancelado", "yellow");
      await client.close();
      return;
    }

    log("🧹 Limpando...", "blue");
    let deleted = 0;

    if (orphans.contentTypes.length > 0) {
      const result = await db
        .collection("contentTypes")
        .deleteMany({ userId: { $exists: false } });
      deleted += result.deletedCount;
      log(`✅ Content types: ${result.deletedCount} removidos`, "green");
    }

    if (orphans.sections.length > 0) {
      const result = await db
        .collection("sections")
        .deleteMany({ userId: { $exists: false } });
      deleted += result.deletedCount;
      log(`✅ Sections: ${result.deletedCount} removidas`, "green");
    }

    if (orphans.items.length > 0) {
      const result = await db
        .collection("items")
        .deleteMany({ userId: { $exists: false } });
      deleted += result.deletedCount;
      log(`✅ Items: ${result.deletedCount} removidos`, "green");
    }

    if (orphans.users.length > 0) {
      const result = await db
        .collection("users")
        .deleteMany({ clerkId: { $exists: false } });
      deleted += result.deletedCount;
      log(`✅ Users: ${result.deletedCount} removidos`, "green");
    }

    await client.close();
    log(`🎉 LIMPEZA CONCLUÍDA! ${deleted} registros removidos`, "green");

    if (await askConfirmation("🚨 Auto-destruir script?")) {
      setTimeout(() => {
        try {
          unlinkSync(__filename);
          log("💥 Script auto-destruído!", "green");
        } catch (e) {
          log("⚠️ Falha na auto-destruição: delete manualmente", "yellow");
        }
      }, 2000);
    }
  } catch (error) {
    log(`❌ ERRO: ${error.message}`, "red");
    if (client) await client.close();
    process.exit(1);
  }
}

main().catch(console.error);
