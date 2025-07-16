import { config } from "dotenv";
import { MongoClient } from "mongodb";

// Configurar variáveis de ambiente
const envPath = process.env.NODE_ENV === "production" ? ".env" : ".env.local";
config({ path: envPath });

// Configuração do MongoDB
const uri =
  process.env.MONGODB_URI || "mongodb://localhost:27017/dashboard-engine";
const client = new MongoClient(uri);

async function optimizeIndexes() {
  try {
    console.log("🔌 Conectando ao MongoDB...");
    await client.connect();
    console.log("✅ Conectado!");

    const db = client.db();

    console.log("\n🔧 Otimizando índices para melhor performance...");

    // 1. Índices para Sections
    console.log("\n📋 Sections:");

    // Índice composto para workspace + slug (único por workspace)
    await db
      .collection("sections")
      .createIndex(
        { workspaceId: 1, slug: 1 },
        { unique: true, name: "workspace_slug_unique" }
      );
    console.log("  ✅ workspaceId + slug (único por workspace)");

    // Índice para performance de busca por workspace
    await db
      .collection("sections")
      .createIndex(
        { workspaceId: 1, "publicAccess.isPublic": 1 },
        { name: "workspace_public_access" }
      );
    console.log("  ✅ workspaceId + publicAccess.isPublic");

    // Índice para busca pública por slug
    await db
      .collection("sections")
      .createIndex(
        { slug: 1, "publicAccess.isPublic": 1 },
        { name: "slug_public_access" }
      );
    console.log("  ✅ slug + publicAccess.isPublic");

    // Índice para userId + workspaceId
    await db
      .collection("sections")
      .createIndex({ userId: 1, workspaceId: 1 }, { name: "user_workspace" });
    console.log("  ✅ userId + workspaceId");

    // 2. Índices para Content Types
    console.log("\n📝 Content Types:");

    await db
      .collection("contentTypes")
      .createIndex(
        { workspaceId: 1, slug: 1 },
        { unique: true, name: "contenttype_workspace_slug_unique" }
      );
    console.log("  ✅ workspaceId + slug (único por workspace)");

    await db
      .collection("contentTypes")
      .createIndex(
        { userId: 1, workspaceId: 1 },
        { name: "contenttype_user_workspace" }
      );
    console.log("  ✅ userId + workspaceId");

    // 3. Índices para Items
    console.log("\n📦 Items:");

    await db
      .collection("items")
      .createIndex(
        { workspaceId: 1, sectionId: 1 },
        { name: "item_workspace_section" }
      );
    console.log("  ✅ workspaceId + sectionId");

    await db
      .collection("items")
      .createIndex(
        { userId: 1, workspaceId: 1 },
        { name: "item_user_workspace" }
      );
    console.log("  ✅ userId + workspaceId");

    // Índice composto para slug único por usuário e section
    await db
      .collection("items")
      .createIndex(
        { userId: 1, sectionId: 1, slug: 1 },
        { unique: true, name: "item_user_section_slug_unique" }
      );
    console.log("  ✅ userId + sectionId + slug (único)");

    // 4. Índices para Workspaces
    console.log("\n🏢 Workspaces:");

    await db
      .collection("workspaces")
      .createIndex(
        { slug: 1 },
        { unique: true, name: "workspace_slug_unique" }
      );
    console.log("  ✅ slug (único global)");

    await db
      .collection("workspaces")
      .createIndex({ ownerId: 1 }, { name: "workspace_owner" });
    console.log("  ✅ ownerId");

    await db
      .collection("workspaces")
      .createIndex({ "members.userId": 1 }, { name: "workspace_members" });
    console.log("  ✅ members.userId");

    // 5. Índices para Access Keys
    console.log("\n🔑 Access Keys:");

    await db
      .collection("access_keys")
      .createIndex(
        { code: 1 },
        { unique: true, name: "access_key_code_unique" }
      );
    console.log("  ✅ code (único)");

    await db
      .collection("access_keys")
      .createIndex(
        { isActive: 1, validUntil: 1 },
        { name: "access_key_active_valid" }
      );
    console.log("  ✅ isActive + validUntil");

    // 6. Índices para API Keys
    console.log("\n🔐 API Keys:");

    await db
      .collection("api_keys")
      .createIndex({ key: 1 }, { unique: true, name: "api_key_unique" });
    console.log("  ✅ key (único)");

    await db
      .collection("api_keys")
      .createIndex(
        { workspaceId: 1, isActive: 1 },
        { name: "api_key_workspace_active" }
      );
    console.log("  ✅ workspaceId + isActive");

    // 7. Índices para Logs (se existirem)
    console.log("\n📊 Logs:");

    try {
      await db
        .collection("access_logs")
        .createIndex({ timestamp: -1 }, { name: "access_logs_timestamp" });
      console.log("  ✅ access_logs timestamp");

      await db
        .collection("access_logs")
        .createIndex(
          { workspaceId: 1, timestamp: -1 },
          { name: "access_logs_workspace_time" }
        );
      console.log("  ✅ access_logs workspace + timestamp");
    } catch (error) {
      console.log("  ⚠️ Collection access_logs não existe ainda");
    }

    console.log("\n🎉 Índices otimizados com sucesso!");
    console.log("\n📈 Benefícios esperados:");
    console.log("  • Queries mais rápidas por workspace");
    console.log("  • Busca eficiente de sections públicas");
    console.log("  • Validação rápida de slugs únicos");
    console.log("  • Performance melhorada em APIs públicas");
  } catch (error) {
    console.error("❌ Erro ao otimizar índices:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("\n🔌 Conexão fechada");
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  optimizeIndexes();
}

export { optimizeIndexes };
