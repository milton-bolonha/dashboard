/**
 * Add Contact API
 * POST: Adicionar novo contato ao guest workspace
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import Joi from "joi";
import sanitizeHtml from "sanitize-html";

const addContactSchema = Joi.object({
  contactName: Joi.string().max(100).trim().required(),
  jobTitle: Joi.string().max(100).trim().required(),
  linkedinUrl: Joi.string().max(200).trim().allow(null, ""),
}).strict();

export async function POST(req) {
  try {
    console.log("📥 POST /api/guest/add-contact - Iniciando...");

    // ⭐ Next.js 15: await cookies()
    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_id")?.value;

    if (!guestId) {
      return NextResponse.json(
        { error: "No guest session found" },
        { status: 401 }
      );
    }

    const body = await req.json();
    console.log("📦 Body:", JSON.stringify(body, null, 2));

    // Validar input
    const { error, value } = addContactSchema.validate(body);
    if (error) {
      return NextResponse.json(
        { error: error.details[0].message },
        { status: 400 }
      );
    }

    // Sanitizar inputs
    const sanitized = {
      contactName: sanitizeHtml(value.contactName, { allowedTags: [] }),
      jobTitle: sanitizeHtml(value.jobTitle, { allowedTags: [] }),
      linkedinUrl: value.linkedinUrl || null,
    };

    // Buscar workspace
    const workspace = await db.findOne("guest_workspaces", {
      guest_id: guestId,
    });
    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Adicionar novo contact
    const newContact = {
      name: sanitized.contactName,
      jobTitle: sanitized.jobTitle,
      linkedinUrl: sanitized.linkedinUrl,
      added_at: new Date(),
      insights: [], // Para futuras funcionalidades
      outreach: [], // Para futuras funcionalidades
    };

    await db.updateOne(
      "guest_workspaces",
      { guest_id: guestId },
      {
        $push: { "workspace_data.contacts": newContact },
        $set: {
          "usage.last_activity": new Date(),
        },
      }
    );

    console.log(
      `✅ Contact "${sanitized.contactName}" adicionado ao workspace!`
    );

    return NextResponse.json({
      success: true,
      contact: newContact,
    });
  } catch (error) {
    console.error("❌ Erro ao adicionar contact:", error);
    return NextResponse.json(
      { error: "Failed to add contact" },
      { status: 500 }
    );
  }
}
