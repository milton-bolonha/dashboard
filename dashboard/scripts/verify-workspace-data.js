import { config } from "dotenv";
import { MongoClient } from "mongodb";

// Configurar variáveis de ambiente
const envPath = process.env.NODE_ENV === "production" ? ".env" : ".env.local";
config({ path: envPath });

// Configuração do MongoDB
const uri =
  process.env.MONGODB_URI || "mongodb://localhost:27017/dashboard-engine";
const client = new MongoClient(uri);

async function verifyWorkspaceData() {
  try {
    console.log("🔌 Conectando ao MongoDB...");
    await client.connect();
    console.log("✅ Conectado!");

    const db = client.db();

    console.log("\n🔍 Verificando dados do workspace...");

    // 1. Verificar sections sem workspaceId
    console.log("\n📋 Verificando sections sem workspaceId...");
    const sectionsWithoutWorkspace = await db
      .collection("sections")
      .find({
        workspaceId: { $exists: false },
      })
      .toArray();

    console.log(
      `  Encontradas ${sectionsWithoutWorkspace.length} sections sem workspaceId`
    );

    if (sectionsWithoutWorkspace.length > 0) {
      console.log("  Sections afetadas:");
      sectionsWithoutWorkspace.forEach((section) => {
        console.log(
          `    - ${section.name} (${section._id}) - userId: ${section.userId}`
        );
      });
    }

    // 2. Verificar content types sem workspaceId
    console.log("\n📝 Verificando content types sem workspaceId...");
    const contentTypesWithoutWorkspace = await db
      .collection("contentTypes")
      .find({
        workspaceId: { $exists: false },
      })
      .toArray();

    console.log(
      `  Encontrados ${contentTypesWithoutWorkspace.length} content types sem workspaceId`
    );

    if (contentTypesWithoutWorkspace.length > 0) {
      console.log("  Content types afetados:");
      contentTypesWithoutWorkspace.forEach((ct) => {
        console.log(`    - ${ct.name} (${ct._id}) - userId: ${ct.userId}`);
      });
    }

    // 3. Verificar items sem workspaceId
    console.log("\n📦 Verificando items sem workspaceId...");
    const itemsWithoutWorkspace = await db
      .collection("items")
      .find({
        workspaceId: { $exists: false },
      })
      .toArray();

    console.log(
      `  Encontrados ${itemsWithoutWorkspace.length} items sem workspaceId`
    );

    // 4. Verificar slugs duplicados por workspace
    console.log("\n🔍 Verificando slugs duplicados por workspace...");

    const sectionsWithDuplicates = await db
      .collection("sections")
      .aggregate([
        {
          $group: {
            _id: { workspaceId: "$workspaceId", slug: "$slug" },
            count: { $sum: 1 },
            sections: { $push: { _id: "$_id", name: "$name" } },
          },
        },
        { $match: { count: { $gt: 1 } } },
      ])
      .toArray();

    console.log(
      `  Encontrados ${sectionsWithDuplicates.length} grupos de slugs duplicados`
    );

    if (sectionsWithDuplicates.length > 0) {
      console.log("  Conflitos de slug:");
      sectionsWithDuplicates.forEach((group) => {
        console.log(
          `    - Workspace: ${group._id.workspaceId}, Slug: ${group._id.slug}`
        );
        group.sections.forEach((section) => {
          console.log(`      * ${section.name} (${section._id})`);
        });
      });
    }

    // 5. Verificar workspaces órfãos (sem owner)
    console.log("\n🏢 Verificando workspaces órfãos...");
    const orphanWorkspaces = await db
      .collection("workspaces")
      .find({
        ownerId: { $exists: false },
      })
      .toArray();

    console.log(
      `  Encontrados ${orphanWorkspaces.length} workspaces sem owner`
    );

    // 6. Resumo geral
    console.log("\n📊 RESUMO GERAL:");
    console.log(
      `  • Sections sem workspaceId: ${sectionsWithoutWorkspace.length}`
    );
    console.log(
      `  • Content types sem workspaceId: ${contentTypesWithoutWorkspace.length}`
    );
    console.log(`  • Items sem workspaceId: ${itemsWithoutWorkspace.length}`);
    console.log(`  • Conflitos de slug: ${sectionsWithDuplicates.length}`);
    console.log(`  • Workspaces órfãos: ${orphanWorkspaces.length}`);

    const totalIssues =
      sectionsWithoutWorkspace.length +
      contentTypesWithoutWorkspace.length +
      itemsWithoutWorkspace.length +
      sectionsWithDuplicates.length +
      orphanWorkspaces.length;

    if (totalIssues === 0) {
      console.log("\n🎉 Todos os dados estão consistentes!");
    } else {
      console.log(`\n⚠️  Encontrados ${totalIssues} problemas de consistência`);
      console.log("\n💡 Recomendações:");

      if (sectionsWithoutWorkspace.length > 0) {
        console.log(
          "  • Execute o script de migração para associar sections a workspaces"
        );
      }

      if (sectionsWithDuplicates.length > 0) {
        console.log(
          "  • Renomeie slugs duplicados manualmente ou use script de correção"
        );
      }

      if (orphanWorkspaces.length > 0) {
        console.log(
          "  • Verifique workspaces sem owner e associe a usuários válidos"
        );
      }
    }
  } catch (error) {
    console.error("❌ Erro ao verificar dados:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("\n🔌 Conexão fechada");
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyWorkspaceData();
}

export { verifyWorkspaceData };
