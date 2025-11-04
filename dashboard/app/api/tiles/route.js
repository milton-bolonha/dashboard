import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");
  const query = jobId ? { jobId } : {};
  const items = await db.find("tiles", query, { sort: { orderIndex: 1 } });
  return NextResponse.json({ items });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const doc = { ...body, createdAt: new Date(), updatedAt: new Date() };
  const res = await db.insertOne("tiles", doc);
  return NextResponse.json(res, { status: 201 });
}
