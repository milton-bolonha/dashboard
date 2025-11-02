import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";

export async function DELETE(_request, { params }) {
  const { jobId, itemId } = params;
  await db.deleteOne("prompt_results", { jobId, _id: new ObjectId(itemId) });
  return NextResponse.json({ ok: true });
}
