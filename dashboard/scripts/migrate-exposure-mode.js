#!/usr/bin/env node
import { config } from "dotenv";
import { MongoClient } from "mongodb";

// Carregar env
const envPath = process.env.NODE_ENV === "production" ? ".env" : ".env.local";
config({ path: envPath });

const uri =
  process.env.MONGODB_URI || "mongodb://localhost:27017/dashboard-engine";
const client = new MongoClient(uri);

async function migrateExposureMode() {
  try {
    console.log("🚀 Migração: exposureMode para Sections");
    await client.connect();
    const db = client.db();

    const sections = db.collection("sections");

    // Definir defaults apenas onde os campos não existem
    const result = await sections.updateMany(
      {
        $or: [
          { exposureMode: { $exists: false } },
          { exposureSelection: { $exists: false } },
        ],
      },
      {
        $set: {
          exposureMode: "all",
          exposureSelection: "random",
        },
      }
    );

    console.log(
      `✅ Atualizadas ${result.modifiedCount} sections com defaults de exposure`
    );

    // Opcional: garantir índice útil para consulta pública (já existe em optimize-indexes.js)
    // await sections.createIndex({ workspaceId: 1, "publicAccess.isPublic": 1 });

    console.log("🎉 Migração concluída");
  } catch (error) {
    console.error("❌ Erro na migração de exposureMode:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Executa se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateExposureMode();
}

export { migrateExposureMode };
