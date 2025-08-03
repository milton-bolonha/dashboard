#!/usr/bin/env node
import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { MongoClient, ObjectId } from "mongodb";

// --- CONFIGURAÇÃO ---
// Cole o ID do workspace que precisa ser corrigido aqui
const WORKSPACE_ID_TO_FIX = "688020a70c9414d5a6ce5fe4";
// --------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, "../.env.local");

console.log("🔧 Carregando .env.local de:", envPath);
config({ path: envPath });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("❌ MONGODB_URI não encontrado. Verifique seu .env.local");
  process.exit(1);
}

const client = new MongoClient(uri);

async function fixMissingNetlifyDeployment() {
  try {
    console.log("🚀 Iniciando script de reparo de deploy...");
    await client.connect();
    console.log("✅ Conectado ao MongoDB.");

    const db = client.db();
    const workspacesCollection = db.collection("workspaces");
    const deploymentsCollection = db.collection("deployments");

    const workspaceOid = new ObjectId(WORKSPACE_ID_TO_FIX);

    console.log(`🔍 Buscando workspace com ID: ${WORKSPACE_ID_TO_FIX}`);
    const workspace = await workspacesCollection.findOne({ _id: workspaceOid });

    if (!workspace) {
      console.error("❌ Workspace não encontrado.");
      return;
    }

    if (workspace.netlifyDeployment) {
      console.log(
        "✅ O workspace já possui o objeto 'netlifyDeployment'. Nada a fazer."
      );
      return;
    }

    console.log(
      "⚠️ Objeto 'netlifyDeployment' não encontrado no workspace. Buscando no histórico..."
    );

    const lastSuccessfulDeploy = await deploymentsCollection.findOne(
      {
        workspaceId: WORKSPACE_ID_TO_FIX,
        status: "concluido",
        repoUrl: { $exists: true },
        siteUrl: { $exists: true },
      },
      { sort: { createdAt: -1 } }
    );

    if (!lastSuccessfulDeploy) {
      console.error(
        "❌ Nenhum deploy bem-sucedido com dados de URL encontrado no histórico."
      );
      return;
    }

    console.log(
      "✅ Último deploy bem-sucedido encontrado:",
      lastSuccessfulDeploy._id
    );

    const netlifyDeploymentData = {
      siteId: lastSuccessfulDeploy.siteId || null, // Adicionar se disponível
      siteName: lastSuccessfulDeploy.siteUrl.split("//")[1].split(".")[0],
      siteUrl: lastSuccessfulDeploy.siteUrl,
      repoUrl: lastSuccessfulDeploy.repoUrl,
      createdAt: lastSuccessfulDeploy.createdAt,
    };

    console.log(
      "📝 Preparando para atualizar o workspace com os seguintes dados:",
      netlifyDeploymentData
    );

    const result = await workspacesCollection.updateOne(
      { _id: workspaceOid },
      {
        $set: {
          netlifyDeployment: netlifyDeploymentData,
          updatedAt: new Date(),
        },
      }
    );

    if (result.modifiedCount > 0) {
      console.log(
        "🎉 Sucesso! O workspace foi atualizado com os dados do último deploy."
      );
    } else {
      console.error(
        "❌ A atualização falhou. Nenhum documento foi modificado."
      );
    }
  } catch (error) {
    console.error("🔥 Erro catastrófico durante o script:", error);
  } finally {
    await client.close();
    console.log("🔌 Conexão com o MongoDB fechada.");
  }
}

fixMissingNetlifyDeployment();
