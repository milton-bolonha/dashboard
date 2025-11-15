import { getMongoClient } from "./mongodb";

/**
 * Create all MongoDB indexes for optimal query performance
 * Best practice: Create indexes in background to avoid blocking operations
 */
export async function createIndexes(): Promise<void> {
  try {
    const client = await getMongoClient();
    const db = client.db();

    const indexPromises: Promise<string>[] = [];

    // Workspaces collection indexes
    const workspacesCollection = db.collection("workspaces");
    indexPromises.push(
      workspacesCollection.createIndex({ userId: 1, sessionId: 1 }, { unique: true }), // Compound unique for security isolation
      workspacesCollection.createIndex({ userId: 1, createdAt: -1 }) // For user workspace queries (recent first)
    );

    // Dashboards collection indexes
    const dashboardsCollection = db.collection("dashboards");
    indexPromises.push(
      dashboardsCollection.createIndex({ userId: 1, companyId: 1 }), // Compound for security isolation
      dashboardsCollection.createIndex({ userId: 1, id: 1 }, { unique: true }), // Compound unique for security
      dashboardsCollection.createIndex({ userId: 1, companyId: 1, isActive: 1 }) // Compound for active dashboard lookup (scoped by userId)
    );

    // Tiles collection indexes (if stored separately)
    const tilesCollection = db.collection("tiles");
    indexPromises.push(
      tilesCollection.createIndex({ dashboardId: 1 }),
      tilesCollection.createIndex({ dashboardId: 1, orderIndex: 1 }) // Compound for ordered queries
    );

    // Contacts collection indexes (if stored separately)
    const contactsCollection = db.collection("contacts");
    indexPromises.push(contactsCollection.createIndex({ dashboardId: 1 }));

    // Notes collection indexes (if stored separately)
    const notesCollection = db.collection("notes");
    indexPromises.push(notesCollection.createIndex({ dashboardId: 1 }));

    // Usage counters collection indexes
    const usageCountersCollection = db.collection("usageCounters");
    indexPromises.push(
      usageCountersCollection.createIndex(
        { sessionId: 1, date: 1 },
        { unique: true }
      ), // Compound unique for daily tracking
      usageCountersCollection.createIndex({ userId: 1, date: 1 }) // For future Clerk integration
    );

    // Templates collection indexes
    const templatesCollection = db.collection("templates");
    indexPromises.push(
      templatesCollection.createIndex({ id: 1 }, { unique: true }),
      templatesCollection.createIndex({ userId: 1 }) // For future Clerk integration
    );

    // Create all indexes in parallel for better performance
    await Promise.all(indexPromises);

    console.log("[MongoDB] ✅ Indexes criados com sucesso", {
      totalIndexes: indexPromises.length,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = (error as Error & { code?: number | string }).code;
    console.error("[MongoDB] ❌ Erro ao criar índices:", {
      message: errorMessage,
      code: errorCode,
    });
    throw error;
  }
}

/**
 * Initialize indexes (call on app startup or migration)
 * Best practice: Gracefully handle existing indexes
 */
export async function initializeIndexes(): Promise<void> {
  try {
    await createIndexes();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = (error as Error & { code?: number | string }).code;
    
    // MongoDB error codes for duplicate index:
    // - 85: IndexOptionsConflict
    // - E11000: Duplicate key error (sometimes used for indexes)
    const isIndexExistsError =
      errorMessage.includes("already exists") ||
      errorMessage.includes("IndexOptionsConflict") ||
      errorCode === 85 ||
      String(errorCode).includes("E11000");

    if (isIndexExistsError) {
      console.log("[MongoDB] ℹ️ Índices já existem, pulando criação");
      return;
    }

    // Re-throw other errors as they indicate real problems
    console.error("[MongoDB] ❌ Erro inesperado ao criar índices:", {
      message: errorMessage,
      code: errorCode,
    });
    throw error;
  }
}

