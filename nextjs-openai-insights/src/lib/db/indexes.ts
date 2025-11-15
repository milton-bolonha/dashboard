import { getMongoClient } from "./mongodb";

/**
 * Create all MongoDB indexes for optimal query performance
 */
export async function createIndexes(): Promise<void> {
  try {
    const client = await getMongoClient();
    const db = client.db();

    // Workspaces collection indexes
    const workspacesCollection = db.collection("workspaces");
    await workspacesCollection.createIndex({ sessionId: 1 }, { unique: true });
    await workspacesCollection.createIndex({ userId: 1 }); // For future Clerk integration

    // Dashboards collection indexes
    const dashboardsCollection = db.collection("dashboards");
    await dashboardsCollection.createIndex({ companyId: 1 });
    await dashboardsCollection.createIndex({ id: 1 }, { unique: true });
    await dashboardsCollection.createIndex({ companyId: 1, isActive: 1 }); // Compound for active dashboard lookup

    // Tiles collection indexes (if stored separately)
    const tilesCollection = db.collection("tiles");
    await tilesCollection.createIndex({ dashboardId: 1 });
    await tilesCollection.createIndex({ dashboardId: 1, orderIndex: 1 }); // Compound for ordered queries

    // Contacts collection indexes (if stored separately)
    const contactsCollection = db.collection("contacts");
    await contactsCollection.createIndex({ dashboardId: 1 });

    // Notes collection indexes (if stored separately)
    const notesCollection = db.collection("notes");
    await notesCollection.createIndex({ dashboardId: 1 });

    // Usage counters collection indexes
    const usageCountersCollection = db.collection("usageCounters");
    await usageCountersCollection.createIndex(
      { sessionId: 1, date: 1 },
      { unique: true }
    ); // Compound unique for daily tracking
    await usageCountersCollection.createIndex({ userId: 1, date: 1 }); // For future Clerk integration

    // Templates collection indexes
    const templatesCollection = db.collection("templates");
    await templatesCollection.createIndex({ id: 1 }, { unique: true });
    await templatesCollection.createIndex({ userId: 1 }); // For future Clerk integration

    console.log("[MongoDB] ✅ Indexes criados com sucesso");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[MongoDB] ❌ Erro ao criar índices:", errorMessage);
    throw error;
  }
}

/**
 * Initialize indexes (call on app startup or migration)
 */
export async function initializeIndexes(): Promise<void> {
  try {
    await createIndexes();
  } catch (error) {
    // Log but don't fail if indexes already exist
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("already exists") || errorMessage.includes("E11000")) {
      console.log("[MongoDB] ℹ️ Índices já existem, pulando criação");
    } else {
      throw error;
    }
  }
}

