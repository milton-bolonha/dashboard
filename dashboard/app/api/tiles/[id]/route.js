import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ObjectId } from "mongodb";

export const runtime = "edge";

export async function PUT(request, { params }) {
  const body = await request.json().catch(() => ({}));
  const _id = new ObjectId(params.id);
  const update = { ...body, updatedAt: new Date() };
  await db.updateOne("tiles", { _id }, { $set: update });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request, { params }) {
  const _id = new ObjectId(params.id);
  await db.deleteOne("tiles", { _id });
  return NextResponse.json({ ok: true });
}
