import { NextResponse } from "next/server";

import { cookieModeEnabled } from "@/lib/config/features";
import {
  deleteContact,
  listContacts,
  updateContact,
} from "@/lib/cookie-workspace-store";

export async function PUT(request, { params }) {
  if (!cookieModeEnabled) {
    return NextResponse.json(
      { error: "Cookie-based workspace mode is disabled." },
      { status: 404 }
    );
  }

  const { contactId } = await params;

  try {
    const body = await request.json();
    const updated = await updateContact(contactId, {
      name: body?.name,
      jobTitle: body?.jobTitle,
      linkedinUrl: body?.linkedinUrl,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Contact not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, contact: updated });
  } catch (error) {
    console.error("[cookie/contacts] PUT error", error);
    return NextResponse.json(
      { success: false, error: "Failed to update contact" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  if (!cookieModeEnabled) {
    return NextResponse.json(
      { error: "Cookie-based workspace mode is disabled." },
      { status: 404 }
    );
  }

  const { contactId } = await params;

  try {
    await deleteContact(contactId);
    return NextResponse.json({ success: true, contacts: await listContacts() });
  } catch (error) {
    console.error("[cookie/contacts] DELETE error", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete contact" },
      { status: 500 }
    );
  }
}

