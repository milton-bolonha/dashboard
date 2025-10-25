const { MongoClient } = require("mongodb");

async function addGuestLimits() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("🔗 Conectado ao MongoDB");

    const db = client.db();

    // Buscar todos os guest workspaces sem limits/usage
    const workspacesWithoutLimits = await db
      .collection("guest_workspaces")
      .find({
        $or: [
          { limits: { $exists: false } },
          { usage: { $exists: false } },
        ],
      })
      .toArray();

    console.log(
      `📊 Encontrados ${workspacesWithoutLimits.length} workspaces sem limits/usage`
    );

    // Atualizar cada workspace
    for (const workspace of workspacesWithoutLimits) {
      const companiesCount = workspace.workspace_data?.companies?.length || 1;

      await db.collection("guest_workspaces").updateOne(
        { _id: workspace._id },
        {
          $set: {
            limits: {
              max_companies: 3,
              max_tiles_per_company: 10,
              max_templates: 5,
            },
            usage: {
              companies_count: companiesCount,
              companies_remaining: 3 - companiesCount,
              total_tiles_generated: 0,
              templates_created: 0,
              last_activity: new Date(),
            },
          },
        }
      );

      console.log(`✅ Workspace ${workspace.guest_id} atualizado`);
    }

    console.log("✅ Migração concluída com sucesso!");
  } catch (error) {
    console.error("❌ Erro na migração:", error);
  } finally {
    await client.close();
    console.log("🔌 Desconectado do MongoDB");
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  addGuestLimits();
}

module.exports = { addGuestLimits };

