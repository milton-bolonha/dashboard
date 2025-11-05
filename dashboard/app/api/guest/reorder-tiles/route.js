/**
 * Guest Reorder Tiles API
 * POST: Salva a nova ordem dos tiles de uma entidade do workspace
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withMongoErrorHandler } from "@/lib/withMongoErrorHandler";
import { withMongoConnectionHandler } from "@/lib/withMongoConnectionHandler";
import { getJob } from "@/lib/db/prompt-jobs";
import Joi from "joi";
import crypto from "crypto";

const reorderTilesSchema = Joi.object({
  jobId: Joi.string().required(),
  guestId: Joi.string().required(),
  token: Joi.string().required(),
  companyId: Joi.string().required(),
  entityKey: Joi.string().optional(),
  tilesOrder: Joi.array()
    .items(Joi.string().trim().required())
    .min(1)
    .required(),
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

const reorderTilesHandler = async (req) => {
  try {
    console.log("📥 POST /api/guest/reorder-tiles - Iniciando...");

    const body = await req.json();
    console.log("📦 Body:", JSON.stringify(body, null, 2));

    const { error, value } = reorderTilesSchema.validate(body);
    if (error) {
      console.error("❌ Erro de validação:", error);
      return NextResponse.json(
        { error: error.details[0].message },
        { status: 400 }
      );
    }

    const { jobId, guestId, token, companyId } = value;
    const tilesOrder = Array.from(new Set(value.tilesOrder));

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
      value.entityKey
    );

    const entities = Array.isArray(guestWorkspace.workspace_data?.[entityKey])
      ? [...guestWorkspace.workspace_data[entityKey]]
      : [];

    const companyIndex = entities.findIndex(
      (entity) => entity.id === companyId
    );
    const company = companyIndex >= 0 ? entities[companyIndex] : null;

    if (!company) {
      console.error(`❌ Entidade não encontrada:`, {
        searchedId: companyId,
        entityKey,
        workspaceKeys: Object.keys(guestWorkspace.workspace_data || {}),
      });
      return NextResponse.json(
        { error: `Entity not found for id "${companyId}"` },
        { status: 404 }
      );
    }

    const existingTiles = Array.isArray(company.tiles) ? company.tiles : [];
    const reorderedTiles = [];

    for (const tileId of tilesOrder) {
      const tile = existingTiles.find((t) => t.id === tileId);
      if (tile) {
        reorderedTiles.push(tile);
      }
    }

    const orderSet = new Set(tilesOrder);
    for (const tile of existingTiles) {
      if (!orderSet.has(tile.id)) {
        reorderedTiles.push(tile);
      }
    }

    const normalizedTiles = reorderedTiles.map((tile, index) => ({
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

    console.log(`✅ Tiles reordered for entity ${companyId}`);

    return NextResponse.json({
      success: true,
      message: "Tiles order saved successfully",
      tilesOrder,
    });
  } catch (error) {
    throw error;
  }
};

export const POST = withMongoConnectionHandler(
  withMongoErrorHandler(reorderTilesHandler, {
    message: "Failed to reorder tiles",
  }),
  {
    label: "guest-tiles:reorder",
    stage: "guest-tiles",
  }
);
