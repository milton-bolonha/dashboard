import { MongoClient } from "mongodb";

const uri =
  process.env.MONGODB_URI || "mongodb://localhost:27017/dashboard-engine";

function sanitizeMongoUri(value) {
  if (!value) return "<empty>";
  return value.replace(/\/\/([^@]+)@/, "//***:***@");
}

const sanitizedUri = sanitizeMongoUri(uri);
const options = {
  serverSelectionTimeoutMS: 10000, // 10 segundos - mais rápido para Netlify
  connectTimeoutMS: 10000, // 10 segundos
  socketTimeoutMS: 45000, // 45 segundos - dentro do limite do Netlify (50s)
  maxPoolSize: 10, // Pool maior para serverless
  retryWrites: true,
  retryReads: true,
  heartbeatFrequencyMS: 10000,
  maxIdleTimeMS: 30000,
  // Configurações de rede otimizadas para Netlify
  maxConnecting: 2,
  // Desabilitar minPoolSize em serverless
  directConnection: false,
};

const MAX_CONNECT_RETRIES = parseInt(
  process.env.MONGODB_CONNECT_RETRIES ?? "3",
  10
);
const CONNECT_BACKOFF_BASE_MS = parseInt(
  process.env.MONGODB_CONNECT_BACKOFF_MS ?? "250",
  10
);
const CIRCUIT_BREAKER_TIMEOUT_MS = parseInt(
  process.env.MONGODB_CIRCUIT_BREAKER_TIMEOUT_MS ?? "15000",
  10
);

export const DEFAULT_MONGODB_BATCH_SIZE = parseInt(
  process.env.MONGODB_BATCH_SIZE ?? "50",
  10
);

const globalStateKey = Symbol.for("dashboard.mongoConnectionState");

const mongoState = (global[globalStateKey] ??= {
  client: null,
  clientPromise: null,
  failureCount: 0,
  circuitOpenUntil: 0,
  closing: false,
  lastConnectedAt: null,
});

function isCircuitOpen() {
  if (!mongoState.circuitOpenUntil) return false;
  return Date.now() < mongoState.circuitOpenUntil;
}

function openCircuit(error) {
  mongoState.circuitOpenUntil = Date.now() + CIRCUIT_BREAKER_TIMEOUT_MS;
  console.warn(
    "[MongoDB] ⚠️ Circuit breaker aberto",
    JSON.stringify({
      until: new Date(mongoState.circuitOpenUntil).toISOString(),
      reason: error?.message,
    })
  );
}

async function createMongoClient() {
  let attempt = 0;
  let delayMs = CONNECT_BACKOFF_BASE_MS;

  while (attempt < MAX_CONNECT_RETRIES) {
    attempt += 1;
    const attemptLabel = `${attempt}/${MAX_CONNECT_RETRIES}`;
    try {
      console.log(
        "[MongoDB] 🔄 Iniciando tentativa de conexão",
        JSON.stringify({ attempt: attemptLabel, uri: sanitizedUri })
      );

      const startedAt = Date.now();
      const newClient = new MongoClient(uri, options);
      await newClient.connect();

      mongoState.failureCount = 0;
      mongoState.lastConnectedAt = Date.now();

      newClient.on("close", () => {
        console.warn(
          "[MongoDB] ⚠️ Conexão encerrada",
          JSON.stringify({ when: new Date().toISOString() })
        );
        mongoState.client = null;
        mongoState.clientPromise = null;
      });

      newClient.on("error", (clientError) => {
        console.error(
          "[MongoDB] ❌ Erro emitido pelo cliente",
          JSON.stringify({ message: clientError?.message })
        );
      });

      console.log(
        "[MongoDB] ✅ Conexão estabelecida",
        JSON.stringify({
          attempt: attemptLabel,
          durationMs: Date.now() - startedAt,
        })
      );

      return newClient;
    } catch (error) {
      console.error(
        "[MongoDB] ❌ Falha na tentativa de conexão",
        JSON.stringify({ attempt: attemptLabel, message: error?.message })
      );

      if (attempt >= MAX_CONNECT_RETRIES) {
        openCircuit(error);
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
      delayMs = Math.min(delayMs * 2, 10000);
    }
  }

  throw new Error("MongoDB connection attempts exhausted");
}

async function getMongoClientInternal() {
  if (mongoState.client) {
    return mongoState.client;
  }

  if (mongoState.clientPromise) {
    return mongoState.clientPromise;
  }

  if (isCircuitOpen()) {
    const error = new Error("MongoDB circuit breaker aberto");
    error.code = "MONGODB_CIRCUIT_OPEN";
    throw error;
  }

  mongoState.clientPromise = createMongoClient()
    .then((connectedClient) => {
      mongoState.client = connectedClient;
      mongoState.clientPromise = null;
      mongoState.circuitOpenUntil = 0;
      return connectedClient;
    })
    .catch((error) => {
      mongoState.clientPromise = null;
      mongoState.client = null;
      mongoState.failureCount += 1;
      openCircuit(error);
      throw error;
    });

  return mongoState.clientPromise;
}

export async function closeMongoClient(reason = "manual-close") {
  if (!mongoState.client || mongoState.closing) {
    return;
  }

  try {
    mongoState.closing = true;
    await mongoState.client.close();
    console.log(
      "[MongoDB] 🔌 Conexão encerrada manualmente",
      JSON.stringify({ reason })
    );
  } catch (error) {
    console.error(
      "[MongoDB] ❌ Falha ao encerrar conexão",
      JSON.stringify({ message: error?.message })
    );
  } finally {
    mongoState.closing = false;
    mongoState.client = null;
    mongoState.clientPromise = null;
  }
}

async function invalidateMongoConnection(error) {
  console.warn(
    "[MongoDB] ⚠️ Invalidando conexão atual",
    JSON.stringify({ message: error?.message })
  );
  await closeMongoClient("invalidate-on-error");
}

export function getMongoClient(options = {}) {
  return getMongoClientInternal(options);
}

const clientPromise = {
  then: (onFulfilled, onRejected) =>
    getMongoClient().then(onFulfilled, onRejected),
  catch: (onRejected) => getMongoClient().catch(onRejected),
  finally: (onFinally) => getMongoClient().finally(onFinally),
};

export default clientPromise;

// Wrapper com retry automático para operações MongoDB
export async function withRetry(operation, options = {}) {
  const normalizedOptions =
    typeof options === "number" ? { maxRetries: options } : options;

  const { maxRetries = 3, onRetry } = normalizedOptions;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.error(
        `❌ MongoDB operation failed (attempt ${attempt}/${maxRetries}):`,
        error.message
      );

      if (attempt === maxRetries) {
        throw error;
      }

      // Aguardar antes de tentar novamente (backoff exponencial)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(`⏳ Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));

      if (typeof onRetry === "function") {
        onRetry({ attempt, delay, error });
      }
    }
  }
}

/**
 * Helper para acessar collections
 * @param {string} collectionName
 * @returns {Promise<Collection>}
 */
export async function getCollection(collectionName) {
  const client = await getMongoClient();
  const db = client.db();
  return db.collection(collectionName);
}

function logMongoMetrics(payload) {
  const {
    operation,
    stage = "general",
    durationMs,
    documents = null,
    ordered,
    metadata = {},
  } = payload;

  console.log(
    "[MongoDB Metrics]",
    JSON.stringify({
      operation,
      stage,
      durationMs,
      documents,
      ordered,
      ...metadata,
      timestamp: new Date().toISOString(),
    })
  );
}

/**
 * Wrapper de conveniência para garantir conexão ativa com o MongoDB.
 * Mantém compatibilidade com o pipeline SSE/polling descrito em docs/relatorio-cards.md.
 */
export async function withMongoConnection(operation, options = {}) {
  const {
    label = "MongoDB operation",
    stage: declaredStage = "general",
    retries = 1,
    closeAfter = false,
    resetOnFailure = true,
    onError,
    metadata = {},
  } = options;

  const startedAt = Date.now();
  const { stage = declaredStage, ...metadataWithoutStage } = {
    ...metadata,
  };

  const runner = async () => {
    const client = await getMongoClient();
    return operation({ client, db: client.db() });
  };

  try {
    if (retries > 1) {
      return await withRetry(runner, {
        maxRetries: retries,
        onRetry: ({ attempt, error }) => {
          logMongoMetrics({
            operation: `${label}:retry`,
            stage,
            durationMs: Date.now() - startedAt,
            metadata: {
              attempt,
              error: error?.message,
              ...metadataWithoutStage,
            },
          });
        },
      });
    }

    return await runner();
  } catch (error) {
    console.error(
      "[MongoDB] ❌ Erro durante operação",
      JSON.stringify({ label, stage, message: error?.message })
    );

    if (resetOnFailure !== false) {
      await invalidateMongoConnection(error);
    }

    if (typeof onError === "function") {
      onError(error);
    }

    throw error;
  } finally {
    logMongoMetrics({
      operation: label,
      stage,
      durationMs: Date.now() - startedAt,
      metadata: metadataWithoutStage,
    });

    if (closeAfter) {
      await closeMongoClient(`${label}::closeAfter`);
    }
  }
}

/**
 * Aplica bulkWrite com logging estruturado + métricas.
 * Inclui orientação sobre ordered vs unordered, reforçando boas práticas divulgadas nos vídeos de bulk write.
 */
export async function bulkWriteWithMetrics(
  collection,
  operations,
  options = {},
  metadata = {}
) {
  const startedAt = Date.now();
  const coll = await getCollection(collection);
  const result = await coll.bulkWrite(operations, options);

  const { stage = "general", ...metadataWithoutStage } = metadata ?? {};

  logMongoMetrics({
    operation: "bulkWrite",
    stage,
    durationMs: Date.now() - startedAt,
    documents: operations.length,
    ordered: options?.ordered !== false,
    metadata: metadataWithoutStage,
  });

  return result;
}

/**
 * Helper para upsert em lote com controle de ordered/unordered.
 */
export async function bulkUpsert(collection, items, keyFields, options = {}) {
  if (!Array.isArray(items) || items.length === 0) {
    return { insertedCount: 0, modifiedCount: 0, upsertedCount: 0 };
  }

  if (!Array.isArray(keyFields) || keyFields.length === 0) {
    throw new Error("bulkUpsert requer keyFields para construir os filtros");
  }

  const { stage, metadata = {}, ...bulkOptions } = options;

  const operations = items.map((item) => ({
    updateOne: {
      filter: Object.fromEntries(
        keyFields.map((field) => [field, item[field]])
      ),
      update: {
        $set: { ...item, updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() },
      },
      upsert: true,
    },
  }));

  return await bulkWriteWithMetrics(collection, operations, bulkOptions, {
    stage,
    ...metadata,
  });
}

/**
 * Helper para operações CRUD
 */
export const db = {
  async find(collection, filter = {}, options = {}) {
    const coll = await getCollection(collection);
    return await coll.find(filter, options).toArray();
  },

  async findOne(collection, filter) {
    const coll = await getCollection(collection);
    return await coll.findOne(filter);
  },

  async insertOne(collection, doc) {
    const coll = await getCollection(collection);
    const result = await coll.insertOne({
      ...doc,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return result;
  },

  async insertMany(collection, docs) {
    const coll = await getCollection(collection);
    const docsWithTimestamps = docs.map((doc) => ({
      ...doc,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    const result = await coll.insertMany(docsWithTimestamps);
    return result;
  },

  async updateOne(collection, filter, update) {
    const coll = await getCollection(collection);
    // CORREÇÃO: O `update` já deve conter o operador $set.
    // Esta função não deve adicionar um $set próprio.
    // O chamador é responsável por formatar o update corretamente.
    // Apenas adicionamos o updatedAt para consistência, se for um update com $set.
    if (update.$set && !update.$set.updatedAt) {
      update.$set.updatedAt = new Date();
    }
    const result = await coll.updateOne(filter, update);
    return result;
  },

  async updateMany(collection, filter, update) {
    const coll = await getCollection(collection);
    const result = await coll.updateMany(filter, {
      $set: {
        ...update,
        updatedAt: new Date(),
      },
    });
    return result;
  },

  async findOneAndUpdate(collection, filter, update, options = {}) {
    const coll = await getCollection(collection);
    // Adicionar updatedAt automaticamente se for update com $set
    if (update.$set && !update.$set.updatedAt) {
      update.$set.updatedAt = new Date();
    }
    const result = await coll.findOneAndUpdate(filter, update, options);
    return result;
  },

  async bulkWrite(collection, operations, options = {}, metadata = {}) {
    return await bulkWriteWithMetrics(
      collection,
      operations,
      options,
      metadata
    );
  },

  async deleteMany(collection, filter) {
    const coll = await getCollection(collection);
    const result = await coll.deleteMany(filter);
    return result;
  },

  async deleteOne(collection, filter) {
    const coll = await getCollection(collection);
    const result = await coll.deleteOne(filter);
    return result;
  },

  async count(collection, filter = {}) {
    const coll = await getCollection(collection);
    return await coll.countDocuments(filter);
  },

  async distinct(collection, field, filter = {}) {
    const coll = await getCollection(collection);
    return await coll.distinct(field, filter);
  },
};
