import { MongoClient } from "mongodb";

const uri =
  process.env.MONGODB_URI || "mongodb://localhost:27017/dashboard-engine";
const options = {
  serverSelectionTimeoutMS: 60000, // 60 segundos - mais tempo para conectar
  connectTimeoutMS: 60000, // 60 segundos para conectar
  socketTimeoutMS: 120000, // 2 minutos para operações
  maxPoolSize: 3, // Pool menor para evitar sobrecarga
  retryWrites: true,
  retryReads: true,
  heartbeatFrequencyMS: 10000, // Heartbeat mais frequente
  maxIdleTimeMS: 30000, // Fechar conexões idle
  // Adicionar retry automático
  retryReads: true,
  retryWrites: true,
  // Configurações de rede mais robustas
  maxConnecting: 2, // Limitar conexões simultâneas
  minPoolSize: 1, // Manter pelo menos 1 conexão
};

let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  // Em development, use uma variável global para preservar a conexão
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // Em production, é melhor não usar variáveis globais
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

// Wrapper com retry automático para operações MongoDB
export async function withRetry(operation, maxRetries = 3) {
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
    }
  }
}

/**
 * Helper para acessar collections
 * @param {string} collectionName
 * @returns {Promise<Collection>}
 */
export async function getCollection(collectionName) {
  const client = await clientPromise;
  const db = client.db();
  return db.collection(collectionName);
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
