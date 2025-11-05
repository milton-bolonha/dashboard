/**
 * Add Contact API
 * POST: Adicionar novo contato ao guest workspace
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getJob } from "@/lib/db/prompt-jobs";
import Joi from "joi";
import sanitizeHtml from "sanitize-html";
import crypto from "crypto";
import { generateContactOutreachOnServer } from "@/lib/contact-outreach-generator";
import { withMongoErrorHandler } from "@/lib/withMongoErrorHandler";
import { withMongoConnectionHandler } from "@/lib/withMongoConnectionHandler";

const addContactSchema = Joi.object({
  jobId: Joi.string().required(),
  guestId: Joi.string().required(),
  token: Joi.string().required(),
  companyId: Joi.string().required(),
  entityKey: Joi.string().optional(),
  contactName: Joi.string().max(100).trim().required(),
  jobTitle: Joi.string().max(100).trim().required(),
  linkedinUrl: Joi.string().max(200).trim().allow(null, ""),
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

const findEntityIndex = (entities, companyId) =>
  entities.findIndex(
    (entity) =>
      entity.id === companyId ||
      entity.name === companyId ||
      entity.title === companyId
  );

const addContactHandler = async (req) => {
  try {
    console.log("📥 POST /api/guest/add-contact - Iniciando...");

    const body = await req.json();
    const { error, value } = addContactSchema.validate(body);
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
      contactName,
      jobTitle,
      linkedinUrl,
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

    const companyIndex = findEntityIndex(entities, companyId);
    if (companyIndex === -1) {
      return NextResponse.json({ error: "Entity not found" }, { status: 404 });
    }

    const company = entities[companyIndex];

    const sanitizedContact = {
      name: sanitizeHtml(contactName),
      title: sanitizeHtml(jobTitle),
      linkedin: sanitizeHtml(linkedinUrl || ""),
    };

    const contact = {
      id: `contact_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      ...sanitizedContact,
      createdAt: new Date().toISOString(),
      outreachTiles: null,
    };

    const context = {
      businessGoals: company.tiles
        ?.find((tile) => tile.title?.toLowerCase().includes("goal"))
        ?.excerpt?.slice(0, 200),
      challenges: company.tiles
        ?.find((tile) => tile.title?.toLowerCase().includes("challenge"))
        ?.excerpt?.slice(0, 200),
      revenueModel: company.tiles
        ?.find((tile) => tile.title?.toLowerCase().includes("revenue"))
        ?.excerpt?.slice(0, 200),
      noteCount: Array.isArray(company.notes) ? company.notes.length : 0,
      fileCount: Array.isArray(company.files) ? company.files.length : 0,
    };

    try {
      const outreachTiles = await generateContactOutreachOnServer(
        contact,
        company,
        context
      );
      contact.outreachTiles = outreachTiles;
    } catch (generationError) {
      console.error("⚠️ Erro ao gerar outreach tiles:", generationError);
    }

    const contacts = Array.isArray(company.contacts)
      ? [...company.contacts]
      : [];
    contacts.push(contact);

    entities[companyIndex] = {
      ...company,
      contacts,
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

    console.log(
      `✅ Contato "${contact.name}" adicionado para entidade ${companyId}`
    );

    return NextResponse.json({ success: true, contact });
  } catch (error) {
    console.error("❌ Erro ao adicionar contact:", error);
    return NextResponse.json(
      { error: "Failed to add contact" },
      { status: 500 }
    );
  }
};

export const POST = withMongoConnectionHandler(
  withMongoErrorHandler(addContactHandler, {
    message: "Failed to add contact",
  }),
  {
    label: "guest-add-contact:post",
    stage: "guest-add-contact",
  }
);
