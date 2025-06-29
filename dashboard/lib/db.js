import { MongoClient } from "mongodb";

const uri =
  process.env.MONGODB_URI || "mongodb://localhost:27017/dashboard-engine";
const options = {};

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

  async updateOne(collection, filter, update) {
    const coll = await getCollection(collection);
    const result = await coll.updateOne(filter, {
      $set: {
        ...update,
        updatedAt: new Date(),
      },
    });
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
