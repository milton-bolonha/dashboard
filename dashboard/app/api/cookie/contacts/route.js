import { NextResponse } from "next/server";

import { cookieModeEnabled } from "@/lib/config/features";
import {
  createContact,
  listContacts,
} from "@/lib/cookie-workspace-store";

export async function GET() {
  if (!cookieModeEnabled) {
    return NextResponse.json(
      { error: "Cookie-based workspace mode is disabled." },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, contacts: await listContacts() });
}

export async function POST(request) {
  if (!cookieModeEnabled) {
    return NextResponse.json(
      { error: "Cookie-based workspace mode is disabled." },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const name = body?.name?.trim();
    const jobTitle = body?.jobTitle?.trim();

    if (!name || !jobTitle) {
      return NextResponse.json(
        { success: false, error: "Name and job title are required" },
        { status: 400 }
      );
    }

    const contact = await createContact({
      name,
      jobTitle,
      linkedinUrl: body?.linkedinUrl?.trim() || "",
    });

    return NextResponse.json({ success: true, contact });
  } catch (error) {
    console.error("[cookie/contacts] POST error", error);
    return NextResponse.json(
      { success: false, error: "Failed to create contact" },
      { status: 500 }
    );
  }
}

