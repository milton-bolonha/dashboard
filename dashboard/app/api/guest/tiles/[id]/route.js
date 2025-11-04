/**
 * Guest Tiles API
 * DELETE: Remove tile do banco de dados
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getJob } from "@/lib/db/prompt-jobs";
import crypto from "crypto";
import Joi from "joi";

const deleteTileSchema = Joi.object({
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

export async function DELETE(req, { params }) {
  try {
    console.log("📥 DELETE /api/guest/tiles/[id] - Iniciando...");

    const { searchParams } = new URL(req.url);
    let body = {};
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        body = await req.json();
      } catch (error) {
        console.warn("⚠️ Body JSON inválido em DELETE /guest/tiles", error);
      }
    }

    const payload = {
      jobId: body.jobId || searchParams.get("job_id"),
      guestId: body.guestId || searchParams.get("guest_id"),
      token: body.token || searchParams.get("token"),
      companyId: body.companyId || searchParams.get("company_id"),
      entityKey: body.entityKey || searchParams.get("entity_key"),
    };

    const { error, value } = deleteTileSchema.validate(payload);
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
    const tileId = params.id;

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

    const companyIndex = entities.findIndex(
      (entity) => entity.id === companyId
    );
    const company = companyIndex >= 0 ? entities[companyIndex] : null;

    if (!company) {
      console.error(`❌ Entidade não encontrada para delete:`, {
        searchedId: companyId,
        entityKey,
      });
      return NextResponse.json(
        { success: false, error: "Entity not found" },
        { status: 404 }
      );
    }

    const existingTiles = Array.isArray(company.tiles) ? company.tiles : [];
    const filteredTiles = existingTiles.filter((tile) => tile.id !== tileId);

    if (filteredTiles.length === existingTiles.length) {
      return NextResponse.json(
        { success: false, error: "Tile not found" },
        { status: 404 }
      );
    }

    const normalizedTiles = filteredTiles.map((tile, index) => ({
      ...tile,
      orderIndex: index,
    }));

    const updatedEntity = {
      ...company,
      tiles: normalizedTiles,
    };

    if (
      typeof updatedEntity.tiles_to_generate === "number" &&
      updatedEntity.tiles_to_generate > 0
    ) {
      updatedEntity.tiles_status =
        normalizedTiles.length >= updatedEntity.tiles_to_generate
          ? "completed"
          : normalizedTiles.length === 0
          ? "pending"
          : "partial";
    }

    entities[companyIndex] = updatedEntity;

    const updateData = {
      [`workspace_data.${entityKey}`]: entities,
      updatedAt: new Date(),
    };

    await db.updateOne(
      "guest_workspaces",
      { guest_id: guestId },
      {
        $set: updateData,
      }
    );

    console.log(`✅ Tile ${tileId} deletado da entidade ${companyId}`);

    return NextResponse.json({
      success: true,
      message: "Tile deleted successfully",
      remainingTiles: normalizedTiles.length,
    });
  } catch (error) {
    console.error("❌ Erro ao deletar tile:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete tile",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
