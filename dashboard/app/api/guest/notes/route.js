/**
 * Guest Notes API
 * GET: Lista notas de uma company
 * POST: Cria nova nota
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import Joi from "joi";
import sanitizeHtml from "sanitize-html";

const createNoteSchema = Joi.object({
  companyId: Joi.string().required(),
  title: Joi.string().max(200).trim().required(),
  content: Joi.string().max(10000).trim().allow(""),
}).strict();

/**
 * GET /api/guest/notes?companyId=xxx
 * Lista notas de uma company específica
 */
export async function GET(req) {
  try {
    console.log("📥 GET /api/guest/notes - Iniciando...");

    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_id")?.value;

    if (!guestId) {
      return NextResponse.json({ error: "No guest session" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Buscar guest workspace
    const guestWorkspace = await db.findOne("guest_workspaces", {
      guest_id: guestId,
    });

    if (!guestWorkspace) {
      return NextResponse.json(
        { error: "Guest workspace not found" },
        { status: 404 }
      );
    }

    // Buscar company específica
    const company = guestWorkspace.workspace_data.companies.find(
      (c) => c.name === companyId || c.id === companyId
    );

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Retornar notas da company
    const notes = company.notes || [];

    console.log(`✅ ${notes.length} notas encontradas para ${company.name}`);

    return NextResponse.json({
      success: true,
      notes,
      company: {
        id: company.name,
        name: company.name,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao buscar notas:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/guest/notes
 * Cria nova nota para uma company
 */
export async function POST(req) {
  try {
    console.log("📥 POST /api/guest/notes - Iniciando...");

    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_id")?.value;

    if (!guestId) {
      return NextResponse.json({ error: "No guest session" }, { status: 401 });
    }

    const body = await req.json();
    console.log("📦 Body:", JSON.stringify(body, null, 2));

    // Validar input
    const { error, value } = createNoteSchema.validate(body);
    if (error) {
      return NextResponse.json(
        { error: error.details[0].message },
        { status: 400 }
      );
    }

    // Sanitizar inputs
    const sanitized = {
      companyId: sanitizeHtml(value.companyId, { allowedTags: [] }),
      title: sanitizeHtml(value.title, { allowedTags: [] }),
      content: sanitizeHtml(value.content, {
        allowedTags: [
          "p",
          "br",
          "strong",
          "em",
          "ul",
          "ol",
          "li",
          "h1",
          "h2",
          "h3",
        ],
        allowedAttributes: {},
      }),
    };

    // Buscar guest workspace
    const guestWorkspace = await db.findOne("guest_workspaces", {
      guest_id: guestId,
    });

    if (!guestWorkspace) {
      return NextResponse.json(
        { error: "Guest workspace not found" },
        { status: 404 }
      );
    }

    // Buscar company específica
    const companyIndex = guestWorkspace.workspace_data.companies.findIndex(
      (c) => c.name === sanitized.companyId || c.id === sanitized.companyId
    );

    if (companyIndex === -1) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Criar nova nota
    const newNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: sanitized.title,
      content: sanitized.content,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Adicionar nota à company
    await db.updateOne(
      "guest_workspaces",
      { guest_id: guestId },
      {
        $push: { [`workspace_data.companies.${companyIndex}.notes`]: newNote },
        $set: {
          "usage.last_activity": new Date(),
        },
      }
    );

    console.log(`✅ Nota criada: ${newNote.title} para ${sanitized.companyId}`);

    return NextResponse.json({
      success: true,
      note: newNote,
    });
  } catch (error) {
    console.error("❌ Erro ao criar nota:", error);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    );
  }
}
