import { MongoClient } from "mongodb";

const uri =
  process.env.MONGODB_URI || "mongodb://localhost:27017/dashboard-engine";
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

let client;
let clientPromise;

// Para Netlify Functions (AWS Lambda), usar variável global para reutilizar conexão
// Isso é seguro porque cada container Lambda mantém o estado entre invocações
if (!global._mongoClientPromise) {
  client = new MongoClient(uri, options);
  global._mongoClientPromise = client.connect();
  console.log("🔌 Nova conexão MongoDB criada");
}
clientPromise = global._mongoClientPromise;

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

  async findOneAndUpdate(collection, filter, update, options = {}) {
    const coll = await getCollection(collection);
    // Adicionar updatedAt automaticamente se for update com $set
    if (update.$set && !update.$set.updatedAt) {
      update.$set.updatedAt = new Date();
    }
    const result = await coll.findOneAndUpdate(filter, update, options);
    return result;
  },

  async bulkWrite(collection, operations, options = {}) {
    const coll = await getCollection(collection);
    const result = await coll.bulkWrite(operations, options);
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
