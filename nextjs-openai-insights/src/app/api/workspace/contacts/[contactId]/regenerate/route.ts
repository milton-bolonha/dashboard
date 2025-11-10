import { NextResponse } from "next/server";

import { readWorkspace, updateWorkspace } from "@/lib/cookies-store";
import { generateContactOutreach } from "@/lib/ai/contact-outreach";
import type { Contact } from "@/lib/types";

type RouteContext = { params: Promise<{ contactId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { contactId } = await context.params;

  const workspace = await readWorkspace();
  if (!workspace) {
    return NextResponse.json(
      { error: "Workspace cache expired" },
      { status: 404 },
    );
  }

  const contact =
    workspace.company.contacts.find((item) => item.id === contactId) ?? null;
  if (!contact) {
    return NextResponse.json(
      { error: "Contact not found" },
      { status: 404 },
    );
  }

  let generatedOutreach: Contact["outreach"] = undefined;

  try {
    generatedOutreach = await generateContactOutreach({
      contact,
      company: workspace.company,
      tiles: workspace.company.tiles ?? [],
      notes: workspace.company.notes ?? [],
      model: workspace.company.tiles?.[0]?.model,
    });
  } catch (error) {
    console.error(
      "[api/workspace/contacts/regenerate] Failed to generate outreach",
      {
        contactId,
        error,
      },
    );
    return NextResponse.json(
      { error: "Failed to regenerate contact outreach" },
      { status: 502 },
    );
  }

  try {
    const updatedWorkspace = await updateWorkspace((snapshot) => {
      const contacts = snapshot.company.contacts;
      const index = contacts.findIndex((item) => item.id === contactId);
      if (index === -1) {
        return snapshot;
      }

      const updatedContact: Contact = {
        ...contacts[index],
        outreach: generatedOutreach,
      };

      const nextContacts = [...contacts];
      nextContacts[index] = updatedContact;

      return {
        ...snapshot,
        company: {
          ...snapshot.company,
          contacts: nextContacts,
        },
      };
    });

    const refreshedContact =
      updatedWorkspace.company.contacts.find((item) => item.id === contactId) ??
      contact;

    return NextResponse.json({
      success: true,
      contact: refreshedContact,
    });
  } catch (error) {
    console.error(
      "[api/workspace/contacts/regenerate] Failed to update workspace",
      {
        contactId,
        error,
      },
    );
    return NextResponse.json(
      { error: "Workspace cache expired" },
      { status: 404 },
    );
  }
}


