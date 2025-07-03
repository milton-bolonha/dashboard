import { randomBytes } from "crypto";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

// Configurar dotenv para carregar as variáveis de ambiente
dotenv.config({ path: "./.env.local" });

// Função para gerar uma chave segura
function generateKey() {
  const prefix = "ds-sa-key"; // dash-superadmin-key
  const key = randomBytes(24).toString("hex");
  return `${prefix}-${key}`;
}

async function main() {
  const superAdminKey = generateKey();
  const hashedKey = await bcrypt.hash(superAdminKey, 10);

  const client = new MongoClient(process.env.MONGODB_URI, {});

  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection("_internal_setup");

    // Garantir que só exista um documento de setup
    await collection.deleteMany({});

    // Inserir o hash da nova chave
    await collection.insertOne({
      type: "SUPER_ADMIN_SETUP_KEY",
      hash: hashedKey,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // Expira em 10 minutos
    });

    console.log("🔑 Chave de Super Admin gerada com sucesso!");
    console.log("==================================================");
    console.log("Esta chave é de USO ÚNICO e EXPIRA EM 10 MINUTOS.");
    console.log("Use-a no modal 'Ativar Chave de Acesso' no seu dashboard.");
    console.log("\nSua chave é:");
    console.log(`\x1b[32m%s\x1b[0m`, superAdminKey); // Verde
    console.log("==================================================");
  } catch (error) {
    console.error("❌ Erro ao gerar a chave de super admin:", error);
  } finally {
    await client.close();
  }
}

main();
