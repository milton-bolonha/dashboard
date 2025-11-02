import { db } from "@/lib/db";

export async function createJob(doc) {
  doc.createdAt = new Date();
  doc.updatedAt = new Date();
  return db.insertOne("prompt_jobs", doc);
}

export async function getJob(jobId) {
  return db.findOne("prompt_jobs", { jobId });
}

export async function updateJob(jobId, update) {
  update.updatedAt = new Date();
  return db.updateOne("prompt_jobs", { jobId }, { $set: update });
}
