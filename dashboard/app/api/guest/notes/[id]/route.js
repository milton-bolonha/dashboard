/**
 * Guest Notes API - Individual Note
 * PUT: Atualiza nota
 * DELETE: Deleta nota
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import Joi from "joi";
import sanitizeHtml from "sanitize-html";

const updateNoteSchema = Joi.object({
  title: Joi.string().max(200).trim().required(),
  content: Joi.string().max(10000).trim().allow(""),
}).strict();

/**
 * PUT /api/guest/notes/[id]
 * Atualiza uma nota específica
 */
export async function PUT(req, { params }) {
  try {
    const { id: noteId } = await params;
    console.log(`📥 PUT /api/guest/notes/${noteId} - Iniciando...`);

    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_id")?.value;

    if (!guestId) {
      return NextResponse.json({ error: "No guest session" }, { status: 401 });
    }

    const body = await req.json();

    // Validar input
    const { error, value } = updateNoteSchema.validate(body);
    if (error) {
      return NextResponse.json(
        { error: error.details[0].message },
        { status: 400 }
      );
    }

    // Sanitizar inputs
    const sanitized = {
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

    // Buscar e atualizar nota
    let noteFound = false;
    const companies = guestWorkspace.workspace_data.companies;

    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      if (company.notes) {
        const noteIndex = company.notes.findIndex((note) => note.id === noteId);
        if (noteIndex !== -1) {
          // Atualizar nota
          await db.updateOne(
            "guest_workspaces",
            { guest_id: guestId },
            {
              $set: {
                [`workspace_data.companies.${i}.notes.${noteIndex}.title`]:
                  sanitized.title,
                [`workspace_data.companies.${i}.notes.${noteIndex}.content`]:
                  sanitized.content,
                [`workspace_data.companies.${i}.notes.${noteIndex}.updatedAt`]:
                  new Date(),
                "usage.last_activity": new Date(),
              },
            }
          );
          noteFound = true;
          break;
        }
      }
    }

    if (!noteFound) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    console.log(`✅ Nota atualizada: ${noteId}`);

    return NextResponse.json({
      success: true,
      message: "Note updated successfully",
    });
  } catch (error) {
    console.error("❌ Erro ao atualizar nota:", error);
    return NextResponse.json(
      { error: "Failed to update note" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/guest/notes/[id]
 * Deleta uma nota específica
 */
export async function DELETE(req, { params }) {
  try {
    const { id: noteId } = await params;
    console.log(`📥 DELETE /api/guest/notes/${noteId} - Iniciando...`);

    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_id")?.value;

    if (!guestId) {
      return NextResponse.json({ error: "No guest session" }, { status: 401 });
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

    // Buscar e deletar nota
    let noteFound = false;
    const companies = guestWorkspace.workspace_data.companies;

    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      if (company.notes) {
        const noteIndex = company.notes.findIndex((note) => note.id === noteId);
        if (noteIndex !== -1) {
          // Deletar nota
          await db.updateOne(
            "guest_workspaces",
            { guest_id: guestId },
            {
              $unset: {
                [`workspace_data.companies.${i}.notes.${noteIndex}`]: 1,
              },
              $set: {
                "usage.last_activity": new Date(),
              },
            }
          );

          // Limpar array de notas (remover nulls)
          await db.updateOne(
            "guest_workspaces",
            { guest_id: guestId },
            {
              $pull: {
                [`workspace_data.companies.${i}.notes`]: null,
              },
            }
          );

          noteFound = true;
          break;
        }
      }
    }

    if (!noteFound) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    console.log(`✅ Nota deletada: ${noteId}`);

    return NextResponse.json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error) {
    console.error("❌ Erro ao deletar nota:", error);
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    );
  }
}
