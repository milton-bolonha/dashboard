import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { readWorkspace, updateWorkspace, getCurrentSession } from "@/lib/cookies-store";
import { getAuth } from "@/lib/auth/get-auth";
import { generateContactOutreach } from "@/lib/ai/contact-outreach";
import { syncWorkspaceContactsToMongo } from "@/lib/storage/mongodb-store";

export async function GET() {
  const workspace = await readWorkspace();
  if (!workspace) {
    return NextResponse.json({ error: "Workspace cache expired" }, { status: 404 });
  }
  return NextResponse.json({ contacts: workspace.company.contacts });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const jobTitle = typeof body?.jobTitle === "string" ? body.jobTitle.trim() : "";
  const linkedinUrl =
    typeof body?.linkedinUrl === "string" ? body.linkedinUrl.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const workspace = await readWorkspace();
  if (!workspace) {
    return NextResponse.json(
      { error: "Workspace cache expired" },
      { status: 404 },
    );
  }

  const contactId = `contact_${randomUUID()}`;
  const baseContact = {
    id: contactId,
    name,
    jobTitle,
    linkedinUrl,
    createdAt: now,
  };

  let outreach = undefined;

  try {
    outreach = await generateContactOutreach({
      contact: baseContact,
      company: workspace.company,
      tiles: workspace.company.tiles ?? [],
      notes: workspace.company.notes ?? [],
      model: workspace.company.tiles?.[0]?.model,
    });
  } catch (error) {
    console.error("[api/workspace/contacts] Failed generating outreach", error);
  }

  try {
    const updated = await updateWorkspace((workspace) => {
      const nextContacts = [
        { ...baseContact, outreach },
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

    const created =
      updated.company.contacts.find((contact) => contact.id === contactId) ??
      baseContact;

    // Dual-write: Sync contacts to MongoDB if available (non-blocking)
    try {
      const { userId } = await getAuth();
      const { sessionId } = await getCurrentSession();
      if (sessionId && userId) {
        await syncWorkspaceContactsToMongo(sessionId, userId, updated.company.contacts);
        console.log("[API] /api/workspace/contacts - ✅ Contacts também sincronizados no MongoDB");
      }
    } catch (mongoError) {
      const errorMessage = mongoError instanceof Error ? mongoError.message : String(mongoError);
      console.warn("[API] /api/workspace/contacts - ⚠️ Falha ao sincronizar no MongoDB (não crítico):", errorMessage);
    }

    return NextResponse.json({
      success: true,
      contact: created,
      contacts: updated.company.contacts,
    });
  } catch {
    return NextResponse.json({ error: "Workspace cache expired" }, { status: 404 });
  }
}

