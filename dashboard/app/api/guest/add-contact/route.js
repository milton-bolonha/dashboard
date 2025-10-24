/**
 * Add Contact API
 * POST: Adicionar novo contato ao guest workspace
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import Joi from "joi";
import sanitizeHtml from "sanitize-html";
import { generateContactOutreachOnServer } from "@/lib/contact-outreach-generator";

const addContactSchema = Joi.object({
  contactName: Joi.string().max(100).trim().required(),
  jobTitle: Joi.string().max(100).trim().required(),
  linkedinUrl: Joi.string().max(200).trim().allow(null, ""),
  companyName: Joi.string().max(100).required(),
}).strict();

export async function POST(req) {
  try {
    console.log("📥 POST /api/guest/add-contact - Iniciando...");
    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_id")?.value;

    if (!guestId) {
      return NextResponse.json(
        { error: "No guest session found" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { error, value } = addContactSchema.validate(body);
    if (error) {
      return NextResponse.json(
        { error: error.details[0].message },
        { status: 400 }
      );
    }

    const sanitized = {
      contactName: sanitizeHtml(value.contactName),
      jobTitle: sanitizeHtml(value.jobTitle),
      linkedinUrl: sanitizeHtml(value.linkedinUrl || ""),
    };

    const guestWorkspace = await db.findOne("guest_workspaces", {
      guest_id: guestId,
    });
    if (!guestWorkspace) {
      return NextResponse.json(
        { error: "Guest workspace not found" },
        { status: 404 }
      );
    }

    const companyIndex = guestWorkspace.workspace_data.companies.findIndex(
      (c) => c.name === value.companyName
    );

    if (companyIndex === -1) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const newContact = {
      id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: sanitized.contactName,
      title: sanitized.jobTitle,
      linkedin: sanitized.linkedinUrl,
      createdAt: new Date().toISOString(),
      outreachTiles: null,
    };

    // Generate outreach tiles
    console.log(`🚀 Gerando tiles de outreach para: ${value.contactName}`);
    const company = guestWorkspace.workspace_data.companies[companyIndex];
    const outreachTiles = await generateContactOutreachOnServer(
      newContact,
      company,
      guestWorkspace.context
    );
    newContact.outreachTiles = outreachTiles;
    console.log("✅ Tiles de outreach gerados.");

    guestWorkspace.workspace_data.companies[companyIndex].contacts.push(
      newContact
    );

    await db.updateOne(
      "guest_workspaces",
      { guest_id: guestId },
      {
        $set: {
          "workspace_data.companies": guestWorkspace.workspace_data.companies,
          updatedAt: new Date(),
        },
      }
    );

    console.log(
      `✅ Contato "${newContact.name}" adicionado com tiles à company "${company.name}"!`
    );

    return NextResponse.json({ success: true, contact: newContact });
  } catch (error) {
    console.error("❌ Erro ao adicionar contact:", error);
    return NextResponse.json(
      { error: "Failed to add contact" },
      { status: 500 }
    );
  }
}
