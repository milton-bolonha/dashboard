import { MongoClient } from "mongodb";

export default async function handler() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    return new Response(
      JSON.stringify({ ok: false, error: "MONGODB_URI not set" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 15000,
    tls: true,
  });

  try {
    await client.connect();
    const admin = client.db().admin();
    const info = await admin.command({ hello: 1 });

    return new Response(
      JSON.stringify(
        {
          ok: true,
          writablePrimary: info.writablePrimary ?? null,
          hosts: info.hosts ?? null,
        },
        null,
        2
      ),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify(
        {
          ok: false,
          name: error.name,
          message: error.message,
        },
        null,
        2
      ),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } finally {
    await client.close().catch(() => {});
  }
}
