import { db } from "../lib/db.js";

/**
 * Script para atualizar status em português para inglês
 *
 * Execução: node scripts/update-status.js
 */

async function updateItemStatus() {
  try {
    console.log("🔄 Iniciando atualização de status...");

    // Mapeamento PT → EN
    const statusMapping = {
      rascunho: "draft",
      publicado: "published",
      arquivado: "archived",
    };

    let totalUpdated = 0;

    for (const [ptStatus, enStatus] of Object.entries(statusMapping)) {
      console.log(`📝 Atualizando "${ptStatus}" → "${enStatus}"`);

      const result = await db.updateMany(
        "items",
        { status: ptStatus },
        { $set: { status: enStatus } }
      );

      console.log(
        `✅ ${result.modifiedCount} items atualizados de "${ptStatus}" para "${enStatus}"`
      );
      totalUpdated += result.modifiedCount;
    }

    // Verificar se restou algum status inválido
    const invalidItems = await db.find("items", {
      status: { $nin: ["draft", "published", "archived"] },
    });

    if (invalidItems.length > 0) {
      console.log(
        `⚠️  Encontrados ${invalidItems.length} items com status inválido:`
      );
      invalidItems.forEach((item) => {
        console.log(`   - ${item.title}: "${item.status}"`);
      });

      // Definir status padrão para inválidos
      const fixResult = await db.updateMany(
        "items",
        { status: { $nin: ["draft", "published", "archived"] } },
        { $set: { status: "draft" } }
      );

      console.log(
        `🔧 ${fixResult.modifiedCount} items com status inválido foram definidos como "draft"`
      );
      totalUpdated += fixResult.modifiedCount;
    }

    console.log(
      `\n🎉 Atualização concluída! Total: ${totalUpdated} items atualizados`
    );

    // Mostrar estatísticas finais
    const stats = await db.aggregate("items", [
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    console.log("\n📊 Status atuais no banco:");
    stats.forEach((stat) => {
      console.log(`   ${stat._id}: ${stat.count} items`);
    });
  } catch (error) {
    console.error("❌ Erro na atualização:", error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  updateItemStatus()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { updateItemStatus };
