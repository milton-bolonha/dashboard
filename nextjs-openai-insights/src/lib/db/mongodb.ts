import { MongoClient, type Db, type Collection, type MongoClientOptions, type Document } from "mongodb";

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

// Type-safe global state access for Next.js serverless compatibility
const globalState = globalThis as typeof globalThis & {
  [key: symbol]: MongoConnectionState | undefined;
};

const getMongoState = (): MongoConnectionState => {
  if (!globalState[globalStateKey]) {
    globalState[globalStateKey] = {
      client: null,
      clientPromise: null,
      failureCount: 0,
      circuitOpenUntil: 0,
      closing: false,
      lastConnectedAt: null,
    };
  }
  return globalState[globalStateKey]!;
};

const mongoState = getMongoState();

function isCircuitOpen(): boolean {
  const state = getMongoState();
  if (!state.circuitOpenUntil) return false;
  return Date.now() < state.circuitOpenUntil;
}

function openCircuit(error: Error): void {
  const state = getMongoState();
  state.circuitOpenUntil = Date.now() + CIRCUIT_BREAKER_TIMEOUT_MS;
  console.warn(
    "[MongoDB] ⚠️ Circuit breaker aberto",
    JSON.stringify({
      until: new Date(state.circuitOpenUntil).toISOString(),
      reason: error?.message,
      failureCount: state.failureCount,
    })
  );
}

async function createMongoClient(): Promise<MongoClient> {
  let attempt = 0;
  let delayMs = CONNECT_BACKOFF_BASE_MS;
  let lastError: Error | null = null;

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
      
      // Connect with timeout handling
      await Promise.race([
        newClient.connect(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Connection timeout")),
            options.connectTimeoutMS
          )
        ),
      ]);

      const state = getMongoState();
      state.failureCount = 0;
      state.lastConnectedAt = Date.now();

      // Set up event handlers for connection lifecycle
      newClient.on("close", () => {
        console.warn(
          "[MongoDB] ⚠️ Conexão encerrada",
          JSON.stringify({ when: new Date().toISOString() })
        );
        const state = getMongoState();
        if (state.client === newClient) {
          state.client = null;
          state.clientPromise = null;
        }
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
      const errorObj = error instanceof Error ? error : new Error(String(error));
      lastError = errorObj;
      const errorMessage = errorObj.message;
      
      console.error(
        "[MongoDB] ❌ Falha na tentativa de conexão",
        JSON.stringify({ attempt: attemptLabel, message: errorMessage })
      );

      if (attempt >= MAX_CONNECT_RETRIES) {
        openCircuit(errorObj);
        throw errorObj;
      }

      // Exponential backoff with jitter
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      delayMs = Math.min(delayMs * 2, 10000);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error("MongoDB connection attempts exhausted");
}

async function getMongoClientInternal(): Promise<MongoClient> {
  const state = getMongoState();
  
  // Return existing client if available and connected
  if (state.client) {
    try {
      // Ping to verify connection is still alive
      await state.client.db().admin().ping();
      return state.client;
    } catch {
      // Connection is dead, clear it
      state.client = null;
      state.clientPromise = null;
    }
  }

  // Return existing promise if connection is in progress
  if (state.clientPromise) {
    return state.clientPromise;
  }

  // Check circuit breaker
  if (isCircuitOpen()) {
    const error = new Error("MongoDB circuit breaker aberto") as Error & { code?: string };
    error.code = "MONGODB_CIRCUIT_OPEN";
    throw error;
  }

  // Create new connection
  state.clientPromise = createMongoClient()
    .then((connectedClient) => {
      const currentState = getMongoState();
      currentState.client = connectedClient;
      currentState.clientPromise = null;
      currentState.circuitOpenUntil = 0;
      currentState.failureCount = 0;
      return connectedClient;
    })
    .catch((error) => {
      const currentState = getMongoState();
      currentState.clientPromise = null;
      currentState.client = null;
      currentState.failureCount += 1;
      openCircuit(error instanceof Error ? error : new Error(String(error)));
      throw error;
    });

  return state.clientPromise;
}

export async function closeMongoClient(reason = "manual-close"): Promise<void> {
  const state = getMongoState();
  
  if (!state.client || state.closing) {
    return;
  }

  try {
    state.closing = true;
    await state.client.close();
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
    const finalState = getMongoState();
    finalState.closing = false;
    finalState.client = null;
    finalState.clientPromise = null;
  }
}

async function invalidateMongoConnection(error: Error): Promise<void> {
  const state = getMongoState();
  console.warn(
    "[MongoDB] ⚠️ Invalidando conexão atual",
    JSON.stringify({ 
      message: error?.message,
      failureCount: state.failureCount,
    })
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
 * Best practice: Use Document constraint for MongoDB compatibility
 */
export async function getCollection<T extends Document = Document>(
  collectionName: string
): Promise<Collection<T>> {
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
export async function bulkWriteWithMetrics<T extends Document>(
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
export async function bulkUpsert<T extends Document>(
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
 * Best practice: All types must extend Document for MongoDB compatibility
 */
export const db = {
  async find<T extends Document>(
    collection: string,
    filter: Filter<T> = {},
    options: FindOptions<T> = {}
  ): Promise<T[]> {
    const coll = await getCollection<T>(collection);
    return await coll.find(filter, options).toArray();
  },

  async findOne<T extends Document>(
    collection: string,
    filter: Filter<T>
  ): Promise<T | null> {
    const coll = await getCollection<T>(collection);
    return await coll.findOne(filter);
  },

  async insertOne<T extends Document & { createdAt?: Date; updatedAt?: Date }>(
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

  async insertMany<T extends Document & { createdAt?: Date; updatedAt?: Date }>(
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

  async updateOne<T extends Document>(
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

  async updateMany<T extends Document>(
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

  async findOneAndUpdate<T extends Document>(
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

  async bulkWrite<T extends Document>(
    collection: string,
    operations: AnyBulkWriteOperation<T>[],
    options: BulkWriteOptions = {},
    metadata: Record<string, unknown> = {}
  ) {
    return await bulkWriteWithMetrics(collection, operations, options, metadata);
  },

  async deleteMany<T extends Document>(collection: string, filter: Filter<T>) {
    const coll = await getCollection<T>(collection);
    const result = await coll.deleteMany(filter);
    return result;
  },

  async deleteOne<T extends Document>(collection: string, filter: Filter<T>) {
    const coll = await getCollection<T>(collection);
    const result = await coll.deleteOne(filter);
    return result;
  },

  async count<T extends Document>(collection: string, filter: Filter<T> = {}): Promise<number> {
    const coll = await getCollection<T>(collection);
    return await coll.countDocuments(filter);
  },

  async distinct<T extends Document>(
    collection: string,
    field: string,
    filter: Filter<T> = {}
  ): Promise<unknown[]> {
    const coll = await getCollection<T>(collection);
    return await coll.distinct(field, filter);
  },
};

