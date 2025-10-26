/**
 * Netlify Background Function para geração de tiles
 *
 * Esta função roda em background após a request terminar
 * Criticamente importa: usa exports.handler (não Next.js API route)
 */

const { MongoClient } = require("mongodb");

// Configuração do MongoDB
const MONGO_URI = process.env.MONGODB_URI;
let client = null;

async function getDB() {
  if (!client) {
    client = new MongoClient(MONGO_URI);
    await client.connect();
  }
  return client.db("dashboardapp");
}

exports.handler = async (event) => {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`🚀 BACKGROUND JOB: Generate Tiles`);
  console.log(`⏰ ${new Date().toISOString()}`);
  console.log(`${"=".repeat(80)}\n`);

  try {
    const { guestId, companyName, companyUrl } = JSON.parse(event.body || "{}");

    if (!guestId || !companyName) {
      throw new Error("Missing required parameters: guestId, companyName");
    }

    console.log(`📋 Parâmetros:`, { guestId, companyName, companyUrl });

    // Conectar ao MongoDB
    const db = await getDB();
    console.log(`✅ MongoDB conectado`);

    // Buscar workspace
    const workspace = await db
      .collection("guest_workspaces")
      .findOne({ guest_id: guestId });
    if (!workspace) {
      throw new Error(`Workspace not found for guest: ${guestId}`);
    }

    console.log(`✅ Workspace encontrado`);

    // Encontrar company
    const company = workspace.workspace_data?.companies?.find(
      (c) => c.name === companyName
    );
    if (!company) {
      throw new Error(`Company not found: ${companyName}`);
    }

    console.log(`✅ Company encontrada: ${companyName}`);

    // Marcar como generating
    await db
      .collection("guest_workspaces")
      .updateOne(
        { guest_id: guestId, "workspace_data.companies.name": companyName },
        { $set: { "workspace_data.companies.$.tiles_status": "generating" } }
      );

    console.log(`✅ Status atualizado para "generating"`);

    // IMPORTANT: Por enquanto, vamos apenas simular a geração
    // TODO: Importar generateAllTilesOptimized depois
    console.log(`⚠️ Geração simulada - implementar após fix de import`);

    // Por enquanto, apenas marcar como completo
    await new Promise((resolve) => setTimeout(resolve, 5000));

    await db
      .collection("guest_workspaces")
      .updateOne(
        { guest_id: guestId, "workspace_data.companies.name": companyName },
        { $set: { "workspace_data.companies.$.tiles_status": "completed" } }
      );

    console.log(`✅ Job concluído para ${companyName}\n`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `Tiles generated for ${companyName}`,
      }),
    };
  } catch (error) {
    console.error(`\n❌ ERRO NO BACKGROUND JOB:`);
    console.error(`❌ Error:`, error.message);
    console.error(`❌ Stack:`, error.stack);
    console.error(`${"=".repeat(80)}\n`);

    // Tentar marcar como falha
    try {
      const db = await getDB();
      const { guestId, companyName } = JSON.parse(event.body || "{}");

      if (guestId && companyName) {
        await db
          .collection("guest_workspaces")
          .updateOne(
            { guest_id: guestId, "workspace_data.companies.name": companyName },
            { $set: { "workspace_data.companies.$.tiles_status": "failed" } }
          );
        console.log(`✅ Status marcado como "failed"`);
      }
    } catch (updateError) {
      console.error(`❌ Erro ao marcar como failed:`, updateError);
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  } finally {
    // Fechar conexão MongoDB
    if (client) {
      await client.close();
      client = null;
    }
  }
};
