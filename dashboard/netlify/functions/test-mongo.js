import { MongoClient } from "mongodb";

export async function handler() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    return { statusCode: 200, body: "✅ MongoDB conectado com sucesso!" };
  } catch (err) {
    return { statusCode: 500, body: "❌ Falha: " + err.message };
  }
}
