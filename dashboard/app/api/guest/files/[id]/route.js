/**
 * Guest Files API - Individual File
 * DELETE: Deleta arquivo
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getJob } from "@/lib/db/prompt-jobs";
import { deleteFile as deleteFromCloudinary } from "@/lib/cloudinary";
import Joi from "joi";
import crypto from "crypto";

const deleteFileSchema = Joi.object({
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

const findEntityIndex = (entities, companyId) =>
  entities.findIndex(
    (entity) =>
      entity.id === companyId ||
      entity.name === companyId ||
      entity.title === companyId
  );

export async function DELETE(req, { params }) {
  try {
    const fileId = params.id;
    console.log(`📥 DELETE /api/guest/files/${fileId} - Iniciando...`);

    let payload = {};
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        payload = await req.json();
      } catch (error) {
        console.warn("⚠️ Body JSON inválido em DELETE /guest/files", error);
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

    const { error, value } = deleteFileSchema.validate(parsed);
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
    const files = Array.isArray(entity.files) ? [...entity.files] : [];
    const fileIndex = files.findIndex((file) => file.id === fileId);

    if (fileIndex === -1) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const [file] = files.splice(fileIndex, 1);

    if (file?.cloudinaryId) {
      try {
        const cloudinaryResult = await deleteFromCloudinary(file.cloudinaryId);
        if (!cloudinaryResult.success) {
          console.warn(
            `⚠️ Falha ao remover do Cloudinary: ${file.cloudinaryId}`
          );
        }
      } catch (cloudinaryError) {
        console.warn(
          `⚠️ Erro ao remover do Cloudinary (${file.cloudinaryId}):`,
          cloudinaryError
        );
      }
    }

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

    console.log(`✅ Arquivo deletado: ${fileId}`);

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("❌ Erro ao deletar arquivo:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
