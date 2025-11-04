/**
 * Guest Files API
 * GET: Lista arquivos de uma entidade
 * POST: Registra arquivo para uma entidade
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withMongoErrorHandler } from "@/lib/withMongoErrorHandler";
import { getJob } from "@/lib/db/prompt-jobs";
import Joi from "joi";
import crypto from "crypto";

const getFilesSchema = Joi.object({
  jobId: Joi.string().required(),
  guestId: Joi.string().required(),
  token: Joi.string().required(),
  companyId: Joi.string().required(),
  entityKey: Joi.string().optional(),
  category: Joi.string().optional(),
}).strict();

const fileSchema = Joi.object({
  jobId: Joi.string().required(),
  guestId: Joi.string().required(),
  token: Joi.string().required(),
  companyId: Joi.string().required(),
  entityKey: Joi.string().optional(),
  fileName: Joi.string().required().max(255),
  fileUrl: Joi.string().required().uri(),
  fileType: Joi.string().required().max(50),
  fileSize: Joi.number().required().min(0),
  category: Joi.string()
    .valid("documents", "images", "archives", "audio", "video")
    .default("documents"),
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

const filterFilesByCategory = (files, category) => {
  if (!category) return files;
  return files.filter((file) => (file.category || "documents") === category);
};

const listFilesHandler = async (req) => {
  try {
    console.log("📥 GET /api/guest/files - Iniciando...");

    const { searchParams } = new URL(req.url);
    const payload = {
      jobId: searchParams.get("job_id"),
      guestId: searchParams.get("guest_id"),
      token: searchParams.get("token"),
      companyId: searchParams.get("company_id"),
      entityKey: searchParams.get("entity_key") || undefined,
      category: searchParams.get("category") || undefined,
    };

    const { error, value } = getFilesSchema.validate(payload);
    if (error) {
      return NextResponse.json(
        { success: false, error: error.details[0].message },
        { status: 400 }
      );
    }

    const {
      jobId,
      guestId,
      token,
      companyId,
      entityKey: providedEntityKey,
      category,
    } = value;

    const job = await getJob(jobId);
    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }
    if (job.guestId !== guestId) {
      return NextResponse.json(
        { success: false, error: "Guest ID mismatch for this job" },
        { status: 403 }
      );
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    if (job.accessTokenHash !== tokenHash) {
      return NextResponse.json(
        { success: false, error: "Invalid access token for this job" },
        { status: 403 }
      );
    }

    const guestWorkspace = await db.findOne("guest_workspaces", {
      guest_id: guestId,
    });

    if (!guestWorkspace) {
      return NextResponse.json(
        { success: false, error: "Guest workspace not found" },
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
      return NextResponse.json(
        { success: false, error: "Entity not found" },
        { status: 404 }
      );
    }

    const files = Array.isArray(entity.files) ? entity.files : [];
    const filteredFiles = filterFilesByCategory(files, category);

    console.log(`📁 Arquivos encontrados para ${companyId}:`, files.length);

    return NextResponse.json({
      success: true,
      files: filteredFiles,
      message: "Files retrieved successfully",
    });
  } catch (error) {
    throw error;
  }
};

export const GET = withMongoErrorHandler(listFilesHandler, {
  message: "Failed to list files",
});

const createFileHandler = async (req) => {
  try {
    console.log("📥 POST /api/guest/files - Iniciando...");

    const body = await req.json();
    console.log("📦 Body:", JSON.stringify(body, null, 2));

    const { error, value } = fileSchema.validate(body);
    if (error) {
      return NextResponse.json(
        { success: false, error: error.details[0].message },
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
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }
    if (job.guestId !== guestId) {
      return NextResponse.json(
        { success: false, error: "Guest ID mismatch for this job" },
        { status: 403 }
      );
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    if (job.accessTokenHash !== tokenHash) {
      return NextResponse.json(
        { success: false, error: "Invalid access token for this job" },
        { status: 403 }
      );
    }

    const guestWorkspace = await db.findOne("guest_workspaces", {
      guest_id: guestId,
    });

    if (!guestWorkspace) {
      return NextResponse.json(
        { success: false, error: "Guest workspace not found" },
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
      return NextResponse.json(
        { success: false, error: "Entity not found" },
        { status: 404 }
      );
    }

    const entity = entities[entityIndex];
    const files = Array.isArray(entity.files) ? [...entity.files] : [];

    const newFile = {
      id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      fileName: value.fileName,
      fileUrl: value.fileUrl,
      fileType: value.fileType,
      fileSize: value.fileSize,
      category: value.category,
      uploadedAt: new Date().toISOString(),
    };

    files.push(newFile);

    entities[entityIndex] = {
      ...entity,
      files,
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
      `✅ Arquivo salvo para entidade ${companyId}:`,
      newFile.fileName
    );

    return NextResponse.json({
      success: true,
      file: newFile,
      message: "File saved successfully",
    });
  } catch (error) {
    throw error;
  }
};

export const POST = withMongoErrorHandler(createFileHandler, {
  message: "Failed to save file",
});
