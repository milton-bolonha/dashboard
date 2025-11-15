import { MongoClient, type Db, type Collection, type MongoClientOptions } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/dashboard-engine";

function sanitizeMongoUri(value: string): string {
  if (!value) return "<empty>";
  return value.replace(/\/\/([^@]+)@/, "//***:***@");
}

const sanitizedUri = sanitizeMongoUri(uri);
const options: MongoClientOptions = {
  serverSelectionTimeoutMS: 10000, // 10 segundos - mais rápido para serverless
  connectTimeoutMS: 10000, // 10 segundos
  socketTimeoutMS: 45000, // 45 segundos - dentro do limite do Netlify (50s)
  maxPoolSize: 10, // Pool maior para serverless
  retryWrites: true,
  retryReads: true,
  heartbeatFrequencyMS: 10000,
  maxIdleTimeMS: 30000,
  // Configurações de rede otimizadas para serverless
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

const globalStateKey = Symbol.for("nextjs-openai-insights.mongoConnectionState");

interface MongoConnectionState {
  client: MongoClient | null;
  clientPromise: Promise<MongoClient> | null;
  failureCount: number;
  circuitOpenUntil: number;
  closing: boolean;
  lastConnectedAt: number | null;
}

const mongoState = (globalThis[globalStateKey as never] ??= {
  client: null,
  clientPromise: null,
  failureCount: 0,
  circuitOpenUntil: 0,
  closing: false,
  lastConnectedAt: null,
}) as MongoConnectionState;

function isCircuitOpen(): boolean {
  if (!mongoState.circuitOpenUntil) return false;
  return Date.now() < mongoState.circuitOpenUntil;
}

function openCircuit(error: Error): void {
  mongoState.circuitOpenUntil = Date.now() + CIRCUIT_BREAKER_TIMEOUT_MS;
  console.warn(
    "[MongoDB] ⚠️ Circuit breaker aberto",
    JSON.stringify({
      until: new Date(mongoState.circuitOpenUntil).toISOString(),
      reason: error?.message,
    })
  );
}

async function createMongoClient(): Promise<MongoClient> {
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

      newClient.on("error", (clientError: Error) => {
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(
        "[MongoDB] ❌ Falha na tentativa de conexão",
        JSON.stringify({ attempt: attemptLabel, message: errorMessage })
      );

      if (attempt >= MAX_CONNECT_RETRIES) {
        openCircuit(error instanceof Error ? error : new Error(errorMessage));
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
      delayMs = Math.min(delayMs * 2, 10000);
    }
  }

  throw new Error("MongoDB connection attempts exhausted");
}

async function getMongoClientInternal(): Promise<MongoClient> {
  if (mongoState.client) {
    return mongoState.client;
  }

  if (mongoState.clientPromise) {
    return mongoState.clientPromise;
  }

  if (isCircuitOpen()) {
    const error = new Error("MongoDB circuit breaker aberto") as Error & { code?: string };
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
      openCircuit(error instanceof Error ? error : new Error(String(error)));
      throw error;
    });

  return mongoState.clientPromise;
}

export async function closeMongoClient(reason = "manual-close"): Promise<void> {
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      "[MongoDB] ❌ Falha ao encerrar conexão",
      JSON.stringify({ message: errorMessage })
    );
  } finally {
    mongoState.closing = false;
    mongoState.client = null;
    mongoState.clientPromise = null;
  }
}

async function invalidateMongoConnection(error: Error): Promise<void> {
  console.warn(
    "[MongoDB] ⚠️ Invalidando conexão atual",
    JSON.stringify({ message: error?.message })
  );
  await closeMongoClient("invalidate-on-error");
}

export function getMongoClient(): Promise<MongoClient> {
  return getMongoClientInternal();
}

const clientPromise = {
  then: <TResult1 = MongoClient, TResult2 = never>(
    onFulfilled?: ((value: MongoClient) => TResult1 | PromiseLike<TResult1>) | null,
    onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> => {
    return getMongoClient().then(onFulfilled, onRejected);
  },
  catch: <TResult = never>(
    onRejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null
  ): Promise<MongoClient | TResult> => {
    return getMongoClient().catch(onRejected);
  },
  finally: (onFinally?: (() => void) | null): Promise<MongoClient> => {
    return getMongoClient().finally(onFinally);
  },
};

export default clientPromise;

interface RetryOptions {
  maxRetries?: number;
  onRetry?: (info: { attempt: number; delay: number; error: Error }) => void;
}

// Wrapper com retry automático para operações MongoDB
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions | number = {}
): Promise<T> {
  const normalizedOptions: RetryOptions =
    typeof options === "number" ? { maxRetries: options } : options;

  const { maxRetries = 3, onRetry } = normalizedOptions;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      console.error(
        `❌ MongoDB operation failed (attempt ${attempt}/${maxRetries}):`,
        errorObj.message
      );

      if (attempt === maxRetries) {
        throw error;
      }

      // Aguardar antes de tentar novamente (backoff exponencial)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(`⏳ Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));

      if (typeof onRetry === "function") {
        onRetry({ attempt, delay, error: errorObj });
      }
    }
  }

  throw new Error("MongoDB retry attempts exhausted");
}

/**
 * Helper para acessar collections
 */
export async function getCollection<T = unknown>(collectionName: string): Promise<Collection<T>> {
  const client = await getMongoClient();
  const db = client.db();
  return db.collection<T>(collectionName);
}

interface MongoMetricsPayload {
  operation: string;
  stage?: string;
  durationMs: number;
  documents?: number | null;
  ordered?: boolean;
  metadata?: Record<string, unknown>;
}

function logMongoMetrics(payload: MongoMetricsPayload): void {
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

interface WithMongoConnectionOptions {
  label?: string;
  stage?: string;
  retries?: number;
  closeAfter?: boolean;
  resetOnFailure?: boolean;
  onError?: (error: Error) => void;
  metadata?: Record<string, unknown>;
}

/**
 * Wrapper de conveniência para garantir conexão ativa com o MongoDB.
 */
export async function withMongoConnection<T>(
  operation: (context: { client: MongoClient; db: Db }) => Promise<T>,
  options: WithMongoConnectionOptions = {}
): Promise<T> {
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

  const runner = async (): Promise<T> => {
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
    const errorObj = error instanceof Error ? error : new Error(String(error));
    console.error(
      "[MongoDB] ❌ Erro durante operação",
      JSON.stringify({ label, stage, message: errorObj.message })
    );

    if (resetOnFailure !== false) {
      await invalidateMongoConnection(errorObj);
    }

    if (typeof onError === "function") {
      onError(errorObj);
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

import type { BulkWriteOptions, BulkWriteResult, AnyBulkWriteOperation } from "mongodb";

/**
 * Aplica bulkWrite com logging estruturado + métricas.
 */
export async function bulkWriteWithMetrics<T>(
  collection: string,
  operations: AnyBulkWriteOperation<T>[],
  options: BulkWriteOptions = {},
  metadata: Record<string, unknown> = {}
): Promise<BulkWriteResult> {
  const startedAt = Date.now();
  const coll = await getCollection<T>(collection);
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
export async function bulkUpsert<T extends Record<string, unknown>>(
  collection: string,
  items: T[],
  keyFields: (keyof T)[],
  options: BulkWriteOptions & { stage?: string; metadata?: Record<string, unknown> } = {}
): Promise<BulkWriteResult> {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      insertedCount: 0,
      modifiedCount: 0,
      upsertedCount: 0,
      deletedCount: 0,
      matchedCount: 0,
      upsertedIds: {},
      insertedIds: {},
    } as BulkWriteResult;
  }

  if (!Array.isArray(keyFields) || keyFields.length === 0) {
    throw new Error("bulkUpsert requer keyFields para construir os filtros");
  }

  const { stage, metadata = {}, ...bulkOptions } = options;

  const operations: AnyBulkWriteOperation<T>[] = items.map((item) => ({
    updateOne: {
      filter: Object.fromEntries(
        keyFields.map((field) => [field, item[field]])
      ) as Partial<T>,
      update: {
        $set: { ...item, updatedAt: new Date() } as T,
        $setOnInsert: { createdAt: new Date() } as Partial<T>,
      },
      upsert: true,
    },
  }));

  return await bulkWriteWithMetrics(collection, operations, bulkOptions, {
    stage,
    ...metadata,
  });
}

import type { Filter, UpdateFilter, FindOptions, UpdateOptions } from "mongodb";

/**
 * Helper para operações CRUD tipadas
 */
export const db = {
  async find<T>(
    collection: string,
    filter: Filter<T> = {},
    options: FindOptions<T> = {}
  ): Promise<T[]> {
    const coll = await getCollection<T>(collection);
    return await coll.find(filter, options).toArray();
  },

  async findOne<T>(
    collection: string,
    filter: Filter<T>
  ): Promise<T | null> {
    const coll = await getCollection<T>(collection);
    return await coll.findOne(filter);
  },

  async insertOne<T extends { createdAt?: Date; updatedAt?: Date }>(
    collection: string,
    doc: Omit<T, "createdAt" | "updatedAt">
  ) {
    const coll = await getCollection<T>(collection);
    const result = await coll.insertOne({
      ...doc,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as T);
    return result;
  },

  async insertMany<T extends { createdAt?: Date; updatedAt?: Date }>(
    collection: string,
    docs: Array<Omit<T, "createdAt" | "updatedAt">>
  ) {
    const coll = await getCollection<T>(collection);
    const docsWithTimestamps = docs.map((doc) => ({
      ...doc,
      createdAt: new Date(),
      updatedAt: new Date(),
    })) as T[];
    const result = await coll.insertMany(docsWithTimestamps);
    return result;
  },

  async updateOne<T>(
    collection: string,
    filter: Filter<T>,
    update: UpdateFilter<T>
  ) {
    const coll = await getCollection<T>(collection);
    // Adicionar updatedAt automaticamente se for update com $set
    if (update.$set && typeof update.$set === "object" && !("updatedAt" in update.$set)) {
      (update.$set as Record<string, unknown>).updatedAt = new Date();
    }
    const result = await coll.updateOne(filter, update);
    return result;
  },

  async updateMany<T>(
    collection: string,
    filter: Filter<T>,
    update: UpdateFilter<T>
  ) {
    const coll = await getCollection<T>(collection);
    const updateWithTimestamp: UpdateFilter<T> = {
      $set: {
        ...(update.$set as Record<string, unknown>),
        updatedAt: new Date(),
      } as Partial<T>,
    } as UpdateFilter<T>;
    const result = await coll.updateMany(filter, updateWithTimestamp);
    return result;
  },

  async findOneAndUpdate<T>(
    collection: string,
    filter: Filter<T>,
    update: UpdateFilter<T>,
    options: UpdateOptions<T> = {}
  ) {
    const coll = await getCollection<T>(collection);
    // Adicionar updatedAt automaticamente se for update com $set
    if (update.$set && typeof update.$set === "object" && !("updatedAt" in update.$set)) {
      (update.$set as Record<string, unknown>).updatedAt = new Date();
    }
    const result = await coll.findOneAndUpdate(filter, update, options);
    return result;
  },

  async bulkWrite<T>(
    collection: string,
    operations: AnyBulkWriteOperation<T>[],
    options: BulkWriteOptions = {},
    metadata: Record<string, unknown> = {}
  ) {
    return await bulkWriteWithMetrics(collection, operations, options, metadata);
  },

  async deleteMany<T>(collection: string, filter: Filter<T>) {
    const coll = await getCollection<T>(collection);
    const result = await coll.deleteMany(filter);
    return result;
  },

  async deleteOne<T>(collection: string, filter: Filter<T>) {
    const coll = await getCollection<T>(collection);
    const result = await coll.deleteOne(filter);
    return result;
  },

  async count<T>(collection: string, filter: Filter<T> = {}): Promise<number> {
    const coll = await getCollection<T>(collection);
    return await coll.countDocuments(filter);
  },

  async distinct<T>(
    collection: string,
    field: string,
    filter: Filter<T> = {}
  ): Promise<unknown[]> {
    const coll = await getCollection<T>(collection);
    return await coll.distinct(field, filter);
  },
};

