/**
 * Guest Notes API - Individual Note
 * PUT: Atualiza nota
 * DELETE: Deleta nota
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getJob } from "@/lib/db/prompt-jobs";
import Joi from "joi";
import sanitizeHtml from "sanitize-html";
import crypto from "crypto";

const updateNoteSchema = Joi.object({
  jobId: Joi.string().required(),
  guestId: Joi.string().required(),
  token: Joi.string().required(),
  companyId: Joi.string().required(),
  entityKey: Joi.string().optional(),
  title: Joi.string().max(200).trim().required(),
  content: Joi.string().max(10000).allow("").trim(),
}).strict();

const deleteNoteSchema = Joi.object({
  jobId: Joi.string().required(),
  guestId: Joi.string().required(),
  token: Joi.string().required(),
  companyId: Joi.string().required(),
  entityKey: Joi.string().optional(),
}).strict();

const normalizeEntityKey = (themeSnapshot, providedKey) => {
  if (providedKey) return providedKey;
  if (!themeSnapshot) return "companies";
  const primaryEntity = themeSnapshot.entities?.find(
    (entity) => entity.isPrimary
  );
  if (!primaryEntity?.id) return "companies";
  const candidate = `${primaryEntity.id}s`;
  return candidate === "companys" ? "companies" : candidate;
};

const sanitizeNoteContent = (content) =>
  sanitizeHtml(content, {
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
  });

const findEntityIndex = (entities, companyId) =>
  entities.findIndex(
    (entity) =>
      entity.id === companyId ||
      entity.name === companyId ||
      entity.title === companyId
  );

export async function PUT(req, { params }) {
  try {
    const { id: noteId } = params;
    console.log(`📥 PUT /api/guest/notes/${noteId} - Iniciando...`);

    const body = await req.json();

    const { error, value } = updateNoteSchema.validate(body);
    if (error) {
      return NextResponse.json(
        { error: error.details[0].message },
        { status: 400 }
      );
    }

    const {
      jobId,
      guestId,
      token,
      companyId,
      entityKey: providedEntityKey,
      title,
      content,
    } = value;

    const job = await getJob(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    if (job.guestId !== guestId) {
      return NextResponse.json(
        { error: "Guest ID mismatch for this job" },
        { status: 403 }
      );
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    if (job.accessTokenHash !== tokenHash) {
      return NextResponse.json(
        { error: "Invalid access token for this job" },
        { status: 403 }
      );
    }

    const guestWorkspace = await db.findOne("guest_workspaces", {
      guest_id: guestId,
    });

    if (!guestWorkspace) {
      return NextResponse.json(
        { error: "Guest workspace not found" },
        { status: 404 }
      );
    }

    const entityKey = normalizeEntityKey(
      guestWorkspace.themeSnapshot,
      providedEntityKey
    );

    const entities = Array.isArray(guestWorkspace.workspace_data?.[entityKey])
      ? [...guestWorkspace.workspace_data[entityKey]]
      : [];

    const entityIndex = findEntityIndex(entities, companyId);
    if (entityIndex === -1) {
      return NextResponse.json({ error: "Entity not found" }, { status: 404 });
    }

    const entity = entities[entityIndex];
    const notes = Array.isArray(entity.notes) ? [...entity.notes] : [];
    const noteIndex = notes.findIndex((note) => note.id === noteId);

    if (noteIndex === -1) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    notes[noteIndex] = {
      ...notes[noteIndex],
      title: sanitizeHtml(title, { allowedTags: [] }),
      content: content ? sanitizeNoteContent(content) : "",
      updatedAt: new Date().toISOString(),
    };

    entities[entityIndex] = {
      ...entity,
      notes,
    };

    await db.updateOne(
      "guest_workspaces",
      { guest_id: guestId },
      {
        $set: {
          [`workspace_data.${entityKey}`]: entities,
          "usage.last_activity": new Date(),
          updatedAt: new Date(),
        },
      }
    );

    console.log(`✅ Nota atualizada: ${noteId}`);

    return NextResponse.json({
      success: true,
      note: notes[noteIndex],
    });
  } catch (error) {
    console.error("❌ Erro ao atualizar nota:", error);
    return NextResponse.json(
      { error: "Failed to update note" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id: noteId } = params;
    console.log(`📥 DELETE /api/guest/notes/${noteId} - Iniciando...`);

    let payload = {};
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        payload = await req.json();
      } catch (error) {
        console.warn("⚠️ Body JSON inválido em DELETE /guest/notes", error);
      }
    }

    const { searchParams } = new URL(req.url);
    const parsed = {
      jobId: payload.jobId || searchParams.get("job_id"),
      guestId: payload.guestId || searchParams.get("guest_id"),
      token: payload.token || searchParams.get("token"),
      companyId: payload.companyId || searchParams.get("company_id"),
      entityKey:
        payload.entityKey || searchParams.get("entity_key") || undefined,
    };

    const { error, value } = deleteNoteSchema.validate(parsed);
    if (error) {
      return NextResponse.json(
        { error: error.details[0].message },
        { status: 400 }
      );
    }

    const {
      jobId,
      guestId,
      token,
      companyId,
      entityKey: providedEntityKey,
    } = value;

    const job = await getJob(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    if (job.guestId !== guestId) {
      return NextResponse.json(
        { error: "Guest ID mismatch for this job" },
        { status: 403 }
      );
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    if (job.accessTokenHash !== tokenHash) {
      return NextResponse.json(
        { error: "Invalid access token for this job" },
        { status: 403 }
      );
    }

    const guestWorkspace = await db.findOne("guest_workspaces", {
      guest_id: guestId,
    });

    if (!guestWorkspace) {
      return NextResponse.json(
        { error: "Guest workspace not found" },
        { status: 404 }
      );
    }

    const entityKey = normalizeEntityKey(
      guestWorkspace.themeSnapshot,
      providedEntityKey
    );

    const entities = Array.isArray(guestWorkspace.workspace_data?.[entityKey])
      ? [...guestWorkspace.workspace_data[entityKey]]
      : [];

    const entityIndex = findEntityIndex(entities, companyId);
    if (entityIndex === -1) {
      return NextResponse.json({ error: "Entity not found" }, { status: 404 });
    }

    const entity = entities[entityIndex];
    const notes = Array.isArray(entity.notes) ? [...entity.notes] : [];
    const filteredNotes = notes.filter((note) => note.id !== noteId);

    if (filteredNotes.length === notes.length) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    entities[entityIndex] = {
      ...entity,
      notes: filteredNotes,
    };

    await db.updateOne(
      "guest_workspaces",
      { guest_id: guestId },
      {
        $set: {
          [`workspace_data.${entityKey}`]: entities,
          "usage.last_activity": new Date(),
          updatedAt: new Date(),
        },
      }
    );

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
