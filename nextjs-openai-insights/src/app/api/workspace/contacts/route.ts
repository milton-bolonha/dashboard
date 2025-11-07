import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { readWorkspace, updateWorkspace } from "@/lib/cookies-store";

export async function GET() {
  const workspace = await readWorkspace();
  return NextResponse.json({ contacts: workspace.company.contacts });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const jobTitle = typeof body?.jobTitle === "string" ? body.jobTitle.trim() : "";
  const linkedinUrl =
    typeof body?.linkedinUrl === "string" ? body.linkedinUrl.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  const now = new Date().toISOString();

  const updated = await updateWorkspace((workspace) => {
    const nextContacts = [
      {
        id: `contact_${randomUUID()}`,
        name,
        jobTitle,
        linkedinUrl,
        createdAt: now,
      },
      ...workspace.company.contacts,
    ].slice(0, 20);

    return {
      ...workspace,
      company: {
        ...workspace.company,
        contacts: nextContacts,
      },
    };
  });

  return NextResponse.json({ success: true, contacts: updated.company.contacts });
}

