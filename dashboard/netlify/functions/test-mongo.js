import { MongoClient } from "mongodb";

export default async function handler() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    return new Response("MONGODB_URI not set", {
      status: 500,
      headers: { "content-type": "text/plain" },
    });
  }

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 15000,
    tls: true,
  });

  try {
    await client.connect();
    const admin = client.db().admin();
    const info = await admin.command({ hello: 1 });

    const body = JSON.stringify(
      {
        ok: true,
        writablePrimary: info?.writablePrimary ?? null,
        hosts: info?.hosts ?? [],
      },
      null,
      2
    );

    return new Response(body, {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    const body = JSON.stringify(
      {
        ok: false,
        name: error.name,
        message: error.message,
      },
      null,
      2
    );

    return new Response(body, {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  } finally {
    await client.close().catch(() => {});
  }
}
