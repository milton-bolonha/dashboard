/**
 * Guest Notes API
 * GET: Lista notas de uma entidade
 * POST: Cria nova nota
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withMongoErrorHandler } from "@/lib/withMongoErrorHandler";
import { withMongoConnectionHandler } from "@/lib/withMongoConnectionHandler";
import { getJob } from "@/lib/db/prompt-jobs";
import Joi from "joi";
import sanitizeHtml from "sanitize-html";
import crypto from "crypto";

const getNotesSchema = Joi.object({
  jobId: Joi.string().required(),
  guestId: Joi.string().required(),
  token: Joi.string().required(),
  companyId: Joi.string().required(),
  entityKey: Joi.string().optional(),
}).strict();

const createNoteSchema = Joi.object({
  jobId: Joi.string().required(),
  guestId: Joi.string().required(),
  token: Joi.string().required(),
  companyId: Joi.string().required(),
  entityKey: Joi.string().optional(),
  title: Joi.string().max(200).trim().required(),
  content: Joi.string().max(10000).allow("").trim(),
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

const listNotesHandler = async (req) => {
  try {
    console.log("📥 GET /api/guest/notes - Iniciando...");

    const { searchParams } = new URL(req.url);
    const payload = {
      jobId: searchParams.get("job_id"),
      guestId: searchParams.get("guest_id"),
      token: searchParams.get("token"),
      companyId: searchParams.get("company_id"),
      entityKey: searchParams.get("entity_key") || undefined,
    };

    const { error, value } = getNotesSchema.validate(payload);
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
      ? guestWorkspace.workspace_data[entityKey]
      : [];

    const entity =
      entities[findEntityIndex(entities, companyId)] ||
      entities.find((item) => item.id === companyId);

    if (!entity) {
      return NextResponse.json({ error: "Entity not found" }, { status: 404 });
    }

    const notes = Array.isArray(entity.notes) ? entity.notes : [];

    console.log(`✅ ${notes.length} notas encontradas para ${companyId}`);

    return NextResponse.json({
      success: true,
      notes,
      entity: {
        id: entity.id,
        name: entity.name || entity.title,
        entityKey,
      },
    });
  } catch (error) {
    throw error;
  }
};

export const GET = withMongoConnectionHandler(
  withMongoErrorHandler(listNotesHandler, {
    message: "Failed to fetch notes",
  }),
  {
    label: "guest-notes:get",
    stage: "guest-notes",
  }
);

const createNoteHandler = async (req) => {
  try {
    console.log("📥 POST /api/guest/notes - Iniciando...");

    const body = await req.json();
    console.log("📦 Body:", JSON.stringify(body, null, 2));

    const { error, value } = createNoteSchema.validate(body);
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

    const newNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      title: sanitizeHtml(value.title, { allowedTags: [] }),
      content: value.content ? sanitizeNoteContent(value.content) : "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const notes = Array.isArray(entity.notes) ? entity.notes : [];
    const updatedEntity = {
      ...entity,
      notes: [...notes, newNote],
    };

    entities[entityIndex] = updatedEntity;

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

    console.log(`✅ Nota criada: ${newNote.id} para entidade ${companyId}`);

    return NextResponse.json({
      success: true,
      note: newNote,
    });
  } catch (error) {
    throw error;
  }
};

export const POST = withMongoConnectionHandler(
  withMongoErrorHandler(createNoteHandler, {
    message: "Failed to create note",
  }),
  {
    label: "guest-notes:post",
    stage: "guest-notes",
  }
);
