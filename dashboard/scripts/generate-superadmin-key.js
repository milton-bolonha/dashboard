import { randomBytes } from "crypto";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

// Configurar dotenv para carregar as variáveis de ambiente
dotenv.config({ path: "./.env.local" });

// Função para gerar chaves seguras
function generateKey(prefix, bytes) {
  const key = randomBytes(bytes).toString("hex");
  return `${prefix}-${key}`;
}

async function main() {
  const rl = readline.createInterface({ input, output });

  console.log(
    "\n\x1b[1m\x1b[34m--- Configuração de Super Administrador ---\x1b[0m"
  );
  console.log(
    "\n\x1b[33mEste script irá gerar uma chave de uso único para promover um usuário a Super Admin.\x1b[0m"
  );
  console.log(
    "Você precisará do \x1b[1mUser ID\x1b[0m do Clerk para o usuário que deseja promover."
  );
  console.log(
    "Você pode encontrá-lo na URL ao visualizar um usuário no Clerk Dashboard:"
  );
  console.log(
    "Ex: \x1b[4m\x1b[36mhttps://dashboard.clerk.com/apps/.../users/\x1b[1muser_2abcd...\x1b[0m\n"
  );

  const userId = await rl.question(
    "\x1b[1mPor favor, insira o User ID do Clerk: \x1b[0m"
  );

  if (!userId || !userId.startsWith("user_")) {
    console.error(
      "\n\x1b[31m❌ User ID inválido. Deve começar com 'user_'.\x1b[0m"
    );
    rl.close();
    return;
  }

  rl.close();

  // 1. Gerar ambas as chaves
  const superAdminKey = generateKey("ds-sa-key", 16);
  const encryptionKey = generateKey("clerk-enc-key", 32);
  const hashedKey = await bcrypt.hash(superAdminKey, 10);

  const client = new MongoClient(process.env.MONGODB_URI, {});

  try {
    // 2. Salvar o hash da chave de super admin no DB
    await client.connect();
    const db = client.db();
    const collection = db.collection("_internal_setup");
    await collection.deleteMany({ type: "SUPER_ADMIN_SETUP_KEY" });
    await collection.insertOne({
      type: "SUPER_ADMIN_SETUP_KEY",
      hash: hashedKey,
      intendedUserId: userId, // VINCULAR CHAVE AO USUÁRIO
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // Expira em 10 minutos
    });

    // 3. Exibir instruções claras e completas no console
    console.log(
      "\n\x1b[1m\x1b[32m✅ Chaves geradas com sucesso para o usuário:\x1b[0m",
      `\x1b[35m${userId}\x1b[0m`
    );
    console.log(
      "\n\x1b[1mPasso 1: Adicione a seguinte chave ao seu arquivo `dashboard/.env.local`\x1b[0m"
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
