import { NextResponse } from "next/server";

import { updateWorkspace } from "@/lib/cookies-store";

type RouteContext = { params: Promise<{ contactId: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const { contactId } = await context.params;

  const updated = await updateWorkspace((workspace) => {
    return {
      ...workspace,
      company: {
        ...workspace.company,
        contacts: workspace.company.contacts.filter((contact) => contact.id !== contactId),
      },
    };
  });

  return NextResponse.json({ success: true, contacts: updated.company.contacts });
}

