import { randomBytes } from "crypto";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

// Configurar dotenv para carregar as variáveis de ambiente
dotenv.config({ path: "./.env.local" });

// Função para gerar chaves seguras
function generateKey(prefix, bytes) {
  const key = randomBytes(bytes).toString("hex");
  return `${prefix}-${key}`;
}

async function main() {
  // 1. Gerar ambas as chaves
  const superAdminKey = generateKey("ds-sa-key", 24);
  const encryptionKey = generateKey("clerk-enc-key", 32);
  const hashedKey = await bcrypt.hash(superAdminKey, 10);

  const client = new MongoClient(process.env.MONGODB_URI, {});

  try {
    // 2. Salvar o hash da chave de super admin no DB
    await client.connect();
    const db = client.db();
    const collection = db.collection("_internal_setup");
    await collection.deleteMany({});
    await collection.insertOne({
      type: "SUPER_ADMIN_SETUP_KEY",
      hash: hashedKey,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // Expira em 10 minutos
    });

    // 3. Exibir instruções claras e completas no console
    console.log(
      "\n\x1b[1m\x1b[34m--- Configuração de Super Administrador ---\x1b[0m"
    );
    console.log(
      "\n\x1b[1mPasso 1: Adicione as seguintes chaves ao seu arquivo `dashboard/.env.local`\x1b[0m"
    );
    console.log(
      "--------------------------------------------------------------------"
    );
    console.log("\x1b[33mCLERK_ENCRYPTION_KEY\x1b[0m=");
    console.log(`\x1b[32m${encryptionKey}\x1b[0m`);
    console.log(
      "--------------------------------------------------------------------"
    );

    console.log(
      "\n\x1b[1mPasso 2: Guarde esta chave de uso único. Você precisará dela no navegador.\x1b[0m"
    );
    console.log(
      "--------------------------------------------------------------------"
    );
    console.log("\x1b[33mChave de Super Admin (expira em 10 minutos):\x1b[0m");
    console.log(`\x1b[32m${superAdminKey}\x1b[0m`);
    console.log(
      "--------------------------------------------------------------------"
    );

    console.log("\n\x1b[1mPasso 3: Siga as próximas etapas\x1b[0m");
    console.log(
      "  1. Se o servidor estiver rodando, reinicie-o (`npm run dash:dev`)."
    );
    console.log("  2. Faça login com o seu usuário.");
    console.log(
      "  3. Visite a URL: \x1b[4m\x1b[36mhttp://localhost:3000/dashboard/access/permissions\x1b[0m"
    );
    console.log(
      "  4. Clique em 'Ativar Chave de Acesso' e cole a chave do Passo 2."
    );
    console.log(
      "\n\x1b[1m\x1b[34m--------------------------------------------------------------------\x1b[0m\n"
    );
  } catch (error) {
    console.error(
      "\n\x1b[31m❌ Erro ao gerar as chaves de configuração:\x1b[0m",
      error
    );
  } finally {
    await client.close();
  }
}

main();
