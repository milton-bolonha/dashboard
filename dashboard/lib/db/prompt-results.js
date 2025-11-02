import { db } from "@/lib/db";

export async function appendResult(doc) {
  doc.createdAt = new Date();
  return db.insertOne("prompt_results", doc);
}

export async function listResults(jobId, { cursor = null, limit = 50 } = {}) {
  const query = { jobId };
  const options = { sort: { createdAt: 1 }, limit };
  return db.find("prompt_results", query, options);
}
