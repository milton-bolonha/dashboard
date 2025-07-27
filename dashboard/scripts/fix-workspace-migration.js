const { MongoClient, ObjectId } = require("mongodb");

async function fixWorkspaceMigration() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("🔗 Conectado ao MongoDB");

    const db = client.db();

    // Workspace ID correto (WindowCaulkingTO)
    const targetWorkspaceId = "688020a70c9414d5a6ce5fe4";
    const userId = "user_2zZNqqf3OlYsi0AB7KbyyqqpzpB";

    console.log(`🚑 CORRIGINDO MIGRAÇÃO para workspace: ${targetWorkspaceId}`);

    // 1. Migrar Content Types órfãos (sem workspaceId)
    const contentTypesResult = await db.collection("contentTypes").updateMany(
      {
        workspaceId: { $exists: false }, // Sem workspaceId
      },
      {
        $set: {
          workspaceId: new ObjectId(targetWorkspaceId),
        },
      }
    );

    console.log(
      `✅ Content Types migrados: ${contentTypesResult.modifiedCount}`
    );

    // 2. Migrar Sections órfãs (sem workspaceId)
    const sectionsResult = await db.collection("sections").updateMany(
      {
        workspaceId: { $exists: false }, // Sem workspaceId
      },
      {
        $set: {
          workspaceId: new ObjectId(targetWorkspaceId),
        },
      }
    );

    console.log(`✅ Sections migradas: ${sectionsResult.modifiedCount}`);

    // 3. Migrar Items órfãos (sem workspaceId)
    const itemsResult = await db.collection("items").updateMany(
      {
        workspaceId: { $exists: false }, // Sem workspaceId
      },
      {
        $set: {
          workspaceId: new ObjectId(targetWorkspaceId),
        },
      }
    );

    console.log(`✅ Items migrados: ${itemsResult.modifiedCount}`);

    // 4. Verificar se os dados estão no workspace correto
    const contentTypesCount = await db
      .collection("contentTypes")
      .countDocuments({
        workspaceId: new ObjectId(targetWorkspaceId),
      });

    const sectionsCount = await db.collection("sections").countDocuments({
      workspaceId: new ObjectId(targetWorkspaceId),
    });

    const itemsCount = await db.collection("items").countDocuments({
      workspaceId: new ObjectId(targetWorkspaceId),
    });

    console.log(`📊 RESUMO FINAL:`);
    console.log(`   Content Types no workspace: ${contentTypesCount}`);
    console.log(`   Sections no workspace: ${sectionsCount}`);
    console.log(`   Items no workspace: ${itemsCount}`);

    console.log("✅ Migração corrigida com sucesso!");
  } catch (error) {
    console.error("❌ Erro na migração:", error);
  } finally {
    await client.close();
    console.log("🔌 Desconectado do MongoDB");
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  fixWorkspaceMigration();
}

module.exports = { fixWorkspaceMigration };
