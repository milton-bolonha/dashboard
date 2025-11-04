// scripts/test-mongo-connection.js
import { MongoClient } from "mongodb";

const uri =
  process.argv[2] ||
  process.env.MONGODB_URI ||
  "mongodb+srv://USUARIO:SENHA@HOST/?retryWrites=true&w=majority";

async function run() {
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 15000,
    tls: true,
  });

  try {
    console.log("🔌 Conectando...");
    await client.connect();
    const admin = client.db().admin();
    const { writablePrimary } = await admin.command({ hello: 1 });
    console.log("✅ Conectado! Primário:", writablePrimary);
  } catch (err) {
    console.error("❌ Falhou:", err);
  } finally {
    await client.close().catch(() => {});
  }
}

run();
