import { db } from "@/lib/db";

export async function appendLog(doc) {
  return db.insertOne("prompt_logs", {
    ...doc,
    ts: doc.ts || new Date().toISOString(),
  });
}

export async function listLogs(
  jobId,
  { level, cursor = null, limit = 100 } = {}
) {
  const query = { jobId, ...(level ? { level } : {}) };
  const options = { sort: { ts: -1 }, limit };
  return db.find("prompt_logs", query, options);
}
